import type { Scene,EngineEvent,Vec3 } from '../core/contracts';
import { topology,surfacePoint } from '../core/geometry';
import {ObjectMapping} from './protocol';
type Position={from:Vec3;to:Vec3;start:number;last:string};
// Retain a conservative millisecond allowance for timestamp quantization; a
// short round trip is not a claim of arbitrarily fine browser clock precision.
const SYNC_TIMESTAMP_ALLOWANCE=.001;
export class OutputAdapter {
 private mapping=new ObjectMapping();
 private recoveryPositions:Set<string>|null=null;
 onStatus:(text:string)=>void=()=>{};private ws:WebSocket|null=null;private session='';private prefix=crypto.randomUUID();private generation=0;private sequence=0;private positionSequence=0;private positions=new Map<string,Position>();private scene:Scene|null=null;private offset=0;private uncertainty=Infinity;private congested=0;private started=false;private lastHeartbeat=0;private timer=window.setInterval(()=>this.tick(),20);
 constructor(private audioNow:()=>number){}
 private syncSamples=0;private syncOutstanding:number|null=null;private syncTimeout:ReturnType<typeof setTimeout>|undefined;private bestSync={offset:0,uncertainty:Infinity};
 private syncMeasurements:{t0:number;t1:number;server:number;offset:number;roundTripHalfMs:number;uncertaintyMs:number}[]=[];
 get diagnostics(){return {connected:this.ws?.readyState===WebSocket.OPEN,session:this.session,uncertaintyMs:this.uncertainty*1000,clockSynchronization:this.syncMeasurements.map(sample=>({...sample})),objects:this.positions.size,buffered:this.ws?.bufferedAmount??0};}
 connect(){
  if(this.ws)this.disconnect();
  this.uncertainty=Infinity;this.offset=0;this.started=false;this.congested=0;this.recoveryPositions=null;this.syncSamples=0;this.syncOutstanding=null;this.syncMeasurements=[];this.bestSync={offset:0,uncertainty:Infinity};
  this.session=`${this.prefix}-idle-${++this.generation}`;const ws=this.ws=new WebSocket('ws://127.0.0.1:5418');this.onStatus('Connecting');
  const probe=()=>{
   this.syncOutstanding=performance.now()/1000;
   if(!this.send({type:'sync',t0:this.syncOutstanding}))return;
   this.syncTimeout=setTimeout(()=>{if(this.ws===ws){this.onStatus('Disconnected · clock synchronization timeout');ws.close(1000,'clock synchronization timeout');}},2000);
  };
  ws.onopen=()=>{if(this.ws===ws)probe();};
  ws.onmessage=e=>{
   if(this.ws!==ws)return;
   try{
    const m=JSON.parse(e.data);
    if(m.type==='sync'){
     if(this.syncOutstanding===null)return;
     const t1=performance.now()/1000;
     if(m.t0!==this.syncOutstanding||!Number.isFinite(m.server)||t1<m.t0)throw Error('Invalid clock synchronization reply');
     clearTimeout(this.syncTimeout);this.syncOutstanding=null;
     const roundTripHalf=(t1-m.t0)/2,uncertainty=roundTripHalf+SYNC_TIMESTAMP_ALLOWANCE,offset=m.server-(m.t0+t1)/2;
     this.syncMeasurements.push({t0:m.t0,t1,server:m.server,offset,roundTripHalfMs:roundTripHalf*1000,uncertaintyMs:uncertainty*1000});
     if(uncertainty<this.bestSync.uncertainty)this.bestSync={offset,uncertainty};
     if(++this.syncSamples<8){probe();return;}
     this.offset=this.bestSync.offset;this.uncertainty=this.bestSync.uncertainty;
     if(this.session)this.start();
     this.onStatus(`Connected · ±${(this.uncertainty*1000).toFixed(1)} ms`);
    }
    if(m.type==='error')this.onStatus(m.message);
   }catch(error){this.onStatus(String(error));ws.close(1000,'invalid bridge reply');}
  };
  ws.onclose=()=>{if(this.ws===ws){clearTimeout(this.syncTimeout);this.syncOutstanding=null;this.onStatus('Disconnected');this.ws=null;this.started=false;}};
  ws.onerror=()=>{if(this.ws===ws)this.onStatus('Bridge unavailable');};
 }
 disconnect(){clearTimeout(this.syncTimeout);this.syncOutstanding=null;this.send({type:'stop',session:this.session,sequence:++this.sequence,reason:'disconnect'});this.ws?.close();this.ws=null;this.started=false;this.onStatus('Disconnected');}
 private send(message:unknown){if(this.ws?.readyState!==WebSocket.OPEN)return false;if(this.ws.bufferedAmount>65536){this.disconnectCongested();return false;}this.ws.send(JSON.stringify({version:1,...message as Record<string,unknown>}));return true;}
 private disconnectCongested(){this.ws?.close(1000,'control backpressure');this.onStatus('Disconnected · control backpressure');}
 private start(){if(this.ws?.readyState!==WebSocket.OPEN||!this.session||!Number.isFinite(this.uncertainty))return;this.sequence=0;this.positionSequence=0;this.recoveryPositions=null;this.congested=0;this.send({type:'start',session:this.session,sequence:0});this.started=true;for(const p of this.positions.values())p.last='';this.tick();}
 setScene(scene:Scene,mode:'edit'|'load'|'clear'='edit'){const removed=[...this.positions.keys()].filter(id=>!scene.pieces.some(p=>p.id===id&&p.kind!=='generator'));if(mode==='edit'&&this.started&&removed.length)this.send({type:'cancel',session:this.session,sequence:++this.sequence,ids:[],nodeIds:removed});this.mapping.setNodes(scene.pieces.filter(p=>p.kind!=='generator').map(p=>p.id),mode!=='edit');const t=performance.now()/1000;for(const id of removed)this.positions.delete(id);
 for(const p of scene.pieces)if(p.kind!=='generator'){const to=topology.vertices[p.vertex],old=this.positions.get(p.id);if(!old)this.positions.set(p.id,{from:to,to,start:t,last:''});else if(old.to.some((v,i)=>v!==to[i])){old.from=this.position(old,t);old.to=to;old.start=t;old.last='';}if(this.positions.get(p.id)?.last==='')this.recoveryPositions?.add(p.id);}
 this.scene=scene;if(mode!=='edit'){if(this.started)this.send({type:'stop',session:this.session,sequence:++this.sequence,reason:mode});this.session=`${this.prefix}-idle-${++this.generation}`;this.started=false;this.start();}}
 private position(p:Position,t:number){return surfacePoint(p.from,p.to,Math.min(1,Math.max(0,(t-p.start)/.12)));}
 event(event:EngineEvent){if(event.type==='trigger'){const t=event.trigger;const session=`${this.prefix}-${t.session}-${this.generation}`;if(this.session!==session){if(this.started)this.send({type:'stop',session:this.session,sequence:++this.sequence,reason:'transport session'});this.session=session;this.started=false;this.start();}if(!this.started)return;if(!this.positions.has(t.nodeId))return;this.recoveryPositions?.add(t.nodeId);this.tick();const aNow=this.audioNow();this.send({type:'trigger',session:this.session,sequence:++this.sequence,triggerSequence:t.sequence,id:t.id,objectId:this.mapping.get(t.nodeId),nodeId:t.nodeId,generatorId:t.generatorId,onset:performance.now()/1000+(t.onset-aNow)+this.offset,sound:t.sound});}
  if(event.type==='cancel'&&this.started){this.send({type:'cancel',session:this.session,sequence:++this.sequence,ids:event.ids,nodeIds:event.nodeIds});for(const id of event.nodeIds){const p=this.positions.get(id);if(p){p.last='';this.recoveryPositions?.add(id);}}this.tick();}
  if(event.type==='reset'){if(this.started)this.send({type:'stop',session:this.session,sequence:++this.sequence,reason:event.reason});this.session=`${this.prefix}-idle-${++this.generation}`;this.started=false;this.start();}
 }
 private tick(){if(!this.started||this.ws?.readyState!==WebSocket.OPEN)return;const t=performance.now()/1000;
 if(this.ws.bufferedAmount>65536){if(!this.congested)this.congested=t;if(t-this.congested>.5)this.disconnectCongested();return;}
 if(this.congested&&!this.recoveryPositions)this.recoveryPositions=new Set(this.positions.keys());this.congested=0;
 if(t-this.lastHeartbeat>=.1){this.send({type:'heartbeat',session:this.session});this.lastHeartbeat=t;}
 for(const id of this.recoveryPositions??this.positions.keys()){
  const p=this.positions.get(id);if(!p){this.recoveryPositions?.delete(id);continue;}
  if(this.ws?.readyState!==WebSocket.OPEN)return;
  if(this.ws.bufferedAmount>65536){if(!this.congested)this.congested=t;return;}
  const v=this.position(p,t),key=v.join(',');if(!this.recoveryPositions&&key===p.last)continue;if(this.send({type:'position',session:this.session,sequence:++this.positionSequence,nodeId:id,objectId:this.mapping.get(id),position:v,sent:t+this.offset})){p.last=key;this.recoveryPositions?.delete(id);}
 }
 this.recoveryPositions=null;
 }
 dispose(){clearInterval(this.timer);this.disconnect();}
}
