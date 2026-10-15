import { type Scene,type Piece,type Generator,type Sound,type Trigger,type EngineEvent,LIMITS,emptyScene } from './contracts';
import { angle,topology } from './geometry';
export function delayBeats(theta:number,period:number,fraction:number,grid:number):number {
 const raw=fraction*period*theta/Math.PI;if(!grid)return raw;
 return Math.min(Math.floor(raw/grid+0.5+1e-10)*grid,(Math.ceil(period/grid)-1)*grid);
}
export function soundFor(p:Exclude<Piece,Generator>,s:Scene['settings']):Sound {
 if(p.kind==='beat')return {kind:'beat',sound:p.sound,duration:p.decay,level:p.level};
 const scale=s.scale==='major'?[0,2,4,5,7,9,11]:s.scale==='minor'?[0,2,3,5,7,8,10]:[0,2,4,7,9];
 const midi=12*(p.octave+1)+s.key+scale[p.degree%scale.length]+12*Math.floor(p.degree/scale.length);
 return {kind:'note',frequency:440*2**((midi-69)/12),timbre:p.timbre,duration:p.duration,level:p.level};
}
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
let nextSession=0;
export class Engine {
 scene:Scene=emptyScene();running=false;beat=0;session=`s${++nextSession}`;sequence=0;lateDrops=0;
 private time=0;private bpm=120;private started=false;private next=new Map<string,number>();private pending:Trigger[]=[];private events:EngineEvent[]=[];private tempo:{beat:number;bpm:number}|null=null;
 get pendingCount(){return this.pending.length;}
 get now(){return this.time;}
 constructor(scene:Scene=emptyScene()){this.scene=clone(scene);this.bpm=scene.settings.bpm;}
 private join(g:Generator,includeCurrent=false){const offset=g.phase*g.period;const k=Math.ceil((this.beat-offset+(includeCurrent?-1e-9:1e-9))/g.period);this.next.set(g.id,Math.max(0,k)*g.period+offset);}
 play(now:number){if(!Number.isFinite(now)||now<this.time-1e-8)throw Error('Clock must be finite and monotonic');if(this.running)return;this.time=now;this.running=true;for(const p of this.scene.pieces)if(p.kind==='generator'&&p.enabled)this.join(p,!this.started&&this.beat===0);this.started=true;}
 pause(now:number,reason='pause'){this.advance(now);this.running=false;this.cancel(()=>true,[],reason);this.events.push({type:'reset',session:this.session,reason});this.next.clear();}
 replace(scene:Scene,now:number,reason='load'){this.pause(now,reason);this.session=`s${++nextSession}`;this.sequence=0;this.started=false;this.beat=0;this.tempo=null;this.scene=clone(scene);this.bpm=scene.settings.bpm;this.time=now;this.events.push({type:'reset',session:this.session,reason});}
 update(scene:Scene,now:number){this.advance(now);const old=this.scene;const removed=old.pieces.filter(p=>!scene.pieces.some(q=>q.id===p.id&&q.kind===p.kind));
  const removedIds=removed.map(p=>p.id);this.cancel(t=>removedIds.includes(t.nodeId)||removedIds.includes(t.generatorId),removed.filter(p=>p.kind!=='generator').map(p=>p.id),'delete');
  this.scene=clone(scene);if(scene.settings.bpm!==old.settings.bpm){if(this.running)this.tempo={beat:Math.floor(this.beat+1e-9)+1,bpm:scene.settings.bpm};else {this.bpm=scene.settings.bpm;this.tempo=null;}}
  for(const p of old.pieces)if(p.kind==='generator'&&!scene.pieces.some(q=>q.id===p.id&&q.kind==='generator'&&q.enabled))this.next.delete(p.id);
  for(const p of scene.pieces)if(p.kind==='generator'&&p.enabled){const prev=old.pieces.find(q=>q.id===p.id);if(!prev||prev.kind!=='generator'||!prev.enabled||prev.period!==p.period||prev.phase!==p.phase){if(this.running)this.join(p);}}
 }
 private cancel(predicate:(t:Trigger)=>boolean,nodeIds:string[],reason:string){const ids=this.pending.filter(predicate).map(t=>t.id);this.pending=this.pending.filter(t=>!predicate(t));if(ids.length||nodeIds.length)this.events.push({type:'cancel',ids,nodeIds,reason});}
 advance(now:number){if(!Number.isFinite(now)||now<this.time-1e-8)throw Error('Clock must be finite and monotonic');if(!this.running){this.time=now;return;}
  if(now-this.time>0.1){this.running=false;this.lateDrops+=this.pending.length;this.pending=[];this.next.clear();this.events.push({type:'reset',session:this.session,reason:'interrupted clock'});this.time=now;return;}
  while(this.running){let boundary=Infinity;for(const b of this.next.values())boundary=Math.min(boundary,b);if(this.tempo)boundary=Math.min(boundary,this.tempo.beat);
   const seconds=(boundary-this.beat)*60/this.bpm;if(this.time+seconds>now+1e-9||!Number.isFinite(seconds))break;
   this.time+=Math.max(0,seconds);this.beat=boundary;
   if(this.tempo&&Math.abs(this.tempo.beat-boundary)<1e-8){this.bpm=this.tempo.bpm;this.tempo=null;}
   for(const g of this.scene.pieces)if(g.kind==='generator'&&g.enabled&&Math.abs((this.next.get(g.id)??Infinity)-boundary)<1e-8){this.emit(g,this.time);if(!this.running)break;this.next.set(g.id,boundary+g.period);}
  }
  if(!this.running){this.time=now;return;}this.beat+=(now-this.time)*this.bpm/60;this.time=now;
  const due=this.pending.filter(t=>t.onset<=now+1e-9).sort((a,b)=>a.onset-b.onset||a.sequence-b.sequence);this.pending=this.pending.filter(t=>t.onset>now+1e-9);
  for(const t of due){if(now-t.onset>0.02+1e-9){this.lateDrops++;this.events.push({type:'cancel',ids:[t.id],nodeIds:[],reason:'late onset dropped'});continue;}const p=this.scene.pieces.find(p=>p.id===t.nodeId);if(p)this.events.push({type:'onset',trigger:{...t,position:[...topology.vertices[p.vertex]]}});}
 }
 private emit(g:Generator,time:number){const periodSeconds=g.period*60/this.bpm;this.events.push({type:'emission',generatorId:g.id,time,periodSeconds,reach:g.reach});
  for(const p of this.scene.pieces)if(p.kind!=='generator'){const theta=angle(topology.vertices[g.vertex],topology.vertices[p.vertex]);if(theta>g.reach*Math.PI/180+1e-9)continue;
   const sequence=++this.sequence,t:Trigger={session:this.session,sequence,id:`${this.session}-${sequence}`,generatorId:g.id,nodeId:p.id,emission:time,beat:this.beat,onset:time+delayBeats(theta,g.period,this.scene.settings.travel,this.scene.settings.quantization)*60/this.bpm,angle:theta,sound:soundFor(p,this.scene.settings),position:[...topology.vertices[p.vertex]]};
   if(this.pending.length>=LIMITS.pending){this.running=false;this.pending=[];this.next.clear();this.events.push({type:'reset',session:this.session,reason:'pending limit exceeded'});return;}
   this.pending.push(t);this.events.push({type:'trigger',trigger:t});
  }
 }
 drain():EngineEvent[]{const events=this.events;this.events=[];return events;}
 snapshot(){return {running:this.running,beat:this.beat,time:this.time,session:this.session,pending:this.pendingCount,sequence:this.sequence,lateDrops:this.lateDrops};}
}
