import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { chromium } from '@playwright/test';

// Diagnostic only: this does not replace the application receiver or qualify
// musical fixtures. An active, silent real AudioContext owns control execution.
const destination=path.resolve('evidence/step-09/receiver-clock-probe');
fs.mkdirSync(destination,{recursive:true});
const url='http://127.0.0.1:5421/BongoPlanet/receiver-clock-probe/';
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const percentile=(values:number[],p:number)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]??0;
const wallPair=()=>{const before=performance.now(),wallMs=Date.now(),after=performance.now();return {before,after,wallMs,offsetMs:wallMs-(before+after)/2,uncertaintyMs:1+(after-before)/2};};

const processor=String.raw`
class ReceiverProbe extends AudioWorkletProcessor {
  constructor(){super();this.commands=[];this.pending=[];this.voices=new Map();this.epoch='';this.offset=0;this.lastHeartbeat=0;this.tick=0;this.sequence=0;this.port.onmessage=({data:c})=>{this.commands.push(c);this.port.postMessage({type:'port-ingress',command:c.type,id:c.id,epoch:c.epoch,wallMs:Date.now(),frame:currentFrame,commandQueue:this.commands.length});};}
  emit(row){this.port.postMessage({...row,epoch:this.epoch});}
  process(_inputs,outputs){
    const output=outputs[0][0],frame=currentFrame,wallMs=Date.now();output.fill(0);
    if(++this.tick%16===0)this.emit({type:'clock',frame,sampleRate,quantum:output.length,wallMs,pending:this.pending.length,activeVoices:this.voices.size});
    for(const c of this.commands.splice(0)){
      if(c.type==='clock-map'){this.offset=c.offsetMs;this.emit({type:'mapped',offsetMs:this.offset,frame,wallMs});continue;}
      if(c.type==='start'){this.pending=[];this.voices.clear();this.epoch=c.epoch;this.lastHeartbeat=wallMs;this.sequence=0;this.emit({type:'started',frame,wallMs,pending:0,activeVoices:0});continue;}
      if(c.epoch!==this.epoch||!this.epoch){this.emit({type:'stale-reject',command:c.type,id:c.id,frame,wallMs});continue;}
      if(c.type==='heartbeat'){this.lastHeartbeat=wallMs;continue;}
      if(c.type==='stop'){this.pending=[];this.voices.clear();this.emit({type:'stopped',frame,wallMs,pending:0,activeVoices:0});this.epoch='';continue;}
      if(c.type==='cancel'){this.pending=this.pending.filter(p=>!c.ids.includes(p.id));for(const id of c.ids)this.voices.delete(id);this.emit({type:'cancelled',ids:c.ids,frame,wallMs,pending:this.pending.length,activeVoices:this.voices.size});continue;}
      if(c.type==='trigger'){
        if(c.sequence<=this.sequence||this.pending.length>=512){this.emit({type:'rejected',id:c.id,reason:'sequence/capacity',frame,wallMs});continue;}
        this.sequence=c.sequence;
        const targetFrame=Math.ceil((c.deadlineWallMs-this.offset)*sampleRate/1000);
        this.pending.push({...c,targetFrame});this.pending.sort((a,b)=>a.targetFrame-b.targetFrame||a.sequence-b.sequence);
        this.emit({type:'queued',id:c.id,frame,wallMs,targetFrame,deadlineWallMs:c.deadlineWallMs,ingestionLeadMs:c.deadlineWallMs-wallMs,pending:this.pending.length});
      }
    }
    if(this.epoch&&wallMs-this.lastHeartbeat>500){const old=this.epoch;this.pending=[];this.voices.clear();this.emit({type:'watchdog-stop',frame,wallMs,heartbeatAgeMs:wallMs-this.lastHeartbeat,pending:0,activeVoices:0});this.epoch='';}
    while(this.pending.length&&this.pending[0].targetFrame<frame+output.length){
      const c=this.pending.shift(),sampleIndex=Math.max(0,c.targetFrame-frame),actualFrame=frame+sampleIndex;
      // Actual callback wall time is an independent coarse witness. The sample
      // offset is a real output index, never an earlier intended timestamp.
      const executionWallMs=wallMs+sampleIndex*1000/sampleRate,errorMs=executionWallMs-c.deadlineWallMs;
      if(errorMs>20){this.emit({type:'late-drop',id:c.id,frame,sampleIndex,actualFrame,wallMs,executionWallMs,deadlineWallMs:c.deadlineWallMs,errorMs});continue;}
      output[sampleIndex]=.25;this.voices.set(c.id,actualFrame+sampleRate*2);
      this.emit({type:'onset',id:c.id,frame,sampleIndex,actualFrame,sampleRate,wallMs,executionWallMs,deadlineWallMs:c.deadlineWallMs,errorMs,actualOutputSample:output[sampleIndex],pending:this.pending.length,activeVoices:this.voices.size});
    }
    for(const [id,end] of this.voices)if(end<=frame)this.voices.delete(id);
    return true;
  }
}
registerProcessor('receiver-clock-probe',ReceiverProbe);`;

const html=String.raw`<!doctype html><meta charset="utf-8"><title>Bongo Planet receiver clock diagnostic</title><button id="enable">Enable diagnostic receiver clock</button><button id="producer-enable">Enable independent diagnostic producer clock</button><pre id="state"></pre><script>
window.probe={rows:[],sync:[],context:null,node:null,socket:null,heartbeat:null,epoch:'',ready:false};
const p=window.probe;p.socket=new WebSocket(location.origin.replace('http:','ws:')+'/sink');
p.socket.onmessage=event=>{const c=JSON.parse(event.data);if(c.type==='sync'){const t1=performance.now();p.sync.push({...c,t1,offsetMs:c.serverMs-(c.t0+t1)/2,uncertaintyMs:(t1-c.t0)/2});return;}if(c.type==='ping')return;if(p.node)p.node.port.postMessage(c);};
document.querySelector('#enable').onclick=async()=>{p.context=new AudioContext({latencyHint:'interactive'});await p.context.resume();await p.context.audioWorklet.addModule('processor.js');p.node=new AudioWorkletNode(p.context,'receiver-clock-probe',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
const mute=p.context.createGain();mute.gain.value=0;p.node.connect(mute).connect(p.context.destination);
p.node.onprocessorerror=()=>p.rows.push({type:'processor-error'});p.node.port.onmessage=event=>{p.rows.push(event.data);p.socket.send(JSON.stringify({type:'receipt',row:event.data}));};p.ready=true;};
window.startHeartbeat=epoch=>{clearInterval(p.heartbeat);p.epoch=epoch;p.heartbeat=setInterval(()=>p.socket.send(JSON.stringify({type:'heartbeat',epoch})),100);};
window.stopHeartbeat=()=>{clearInterval(p.heartbeat);p.heartbeat=null;};
document.querySelector('#producer-enable').onclick=async()=>{p.producer=new AudioContext({latencyHint:'interactive'});await p.producer.resume();const source=p.producer.createConstantSource(),gain=p.producer.createGain();gain.gain.value=0;source.connect(gain).connect(p.producer.destination);source.start();};
</script>`;

const receipts:any[]=[],wire:any[]=[],nodeTimers:any[]=[],cases:any[]=[],failures:string[]=[];
let sink:WebSocket|undefined;
const server=http.createServer((req,res)=>{
  if(req.url==='/BongoPlanet/receiver-clock-probe/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  if(req.url==='/BongoPlanet/receiver-clock-probe/processor.js'){res.setHeader('Content-Type','text/javascript');res.end(processor);return;}
  res.writeHead(404);res.end();
});
const wss=new WebSocketServer({server,path:'/sink'});
wss.on('connection',(ws,req)=>{
  if(req.headers.origin!=='http://127.0.0.1:5421'||sink){ws.close(1008,'Diagnostic sink origin/ownership');return;}sink=ws;
  ws.on('message',data=>{const packet=JSON.parse(data.toString());
    if(packet.type==='sync')ws.send(JSON.stringify({type:'sync',t0:packet.t0,serverMs:performance.now()}));
    else if(packet.type==='receipt')receipts.push({...packet.row,nodeReceiptMs:performance.now(),nodeReceiptWallMs:Date.now()});
    else if(packet.type==='heartbeat')send(packet);
    else if(packet.type==='zero-delay'){
      const arrival=performance.now(),deadlineNodeMs=packet.browserPerformanceMs+packet.browserNodeOffsetMs+(packet.onsetAudioSeconds-packet.audioNowSeconds)*1000;
      const target={type:'trigger',epoch:packet.epoch,id:packet.id,sequence:packet.sequence,deadlineWallMs:deadlineNodeMs+nodeWallAtStart.offsetMs};
      wire.push({...packet,type:'zero-delay-wire',nodeArrivalMs:arrival,deadlineNodeMs,arrivalAfterIntendedMs:arrival-deadlineNodeMs});send(target);
    }
  });ws.on('close',()=>{if(sink===ws)sink=undefined;});
});
function send(packet:any){wire.push({direction:'node-to-sink',nodeMs:performance.now(),nodeWallMs:Date.now(),packet});sink?.send(JSON.stringify(packet));}
async function until(predicate:()=>boolean,reason:string,timeout=3000){const start=performance.now();while(!predicate()){if(performance.now()-start>timeout)throw Error(reason);await sleep(5);}}
const nodeWallAtStart=wallPair();
await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(5421,'127.0.0.1',resolve);});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage();const browserErrors:string[]=[];page.on('pageerror',e=>browserErrors.push(e.message));
let clock:any;
try{
  await page.goto(url);await page.waitForFunction(()=>window.probe?.socket.readyState===window.WebSocket.OPEN);await page.locator('#enable').click();await page.waitForFunction(()=>window.probe.ready);
  // Genuine render-quanta observations after startup; no intended onset is
  // used to fit this independent frame/wall relationship.
  await sleep(300);const cutoff=receipts.length;await until(()=>receipts.slice(cutoff).filter(r=>r.type==='clock').length>=30,'Clock calibration not observed');
  const samples=receipts.slice(cutoff).filter(r=>r.type==='clock'),offsets=samples.map(r=>r.wallMs-r.frame*1000/r.sampleRate),offsetMs=percentile(offsets,.5);
  const residuals=offsets.map(value=>Math.abs(value-offsetMs));
  await page.evaluate(async()=>{const p=window.probe;for(let i=0;i<12;i++){p.socket.send(JSON.stringify({type:'sync',t0:performance.now()}));await new Promise(r=>setTimeout(r,10));}});
  const sync=await page.evaluate(()=>window.probe.sync),bestSync=sync.reduce((a:any,b:any)=>a.uncertaintyMs<b.uncertaintyMs?a:b);
  clock={samples,offsetMs,frameWallResidualMs:{p95:percentile(residuals,.95),max:Math.max(...residuals)},sync,bestSync,nodeWallAtStart,combinedConservativeUncertaintyMs:Math.max(...residuals)+1+bestSync.uncertaintyMs+nodeWallAtStart.uncertaintyMs};
  send({type:'clock-map',offsetMs});await until(()=>receipts.some(r=>r.type==='mapped'),'Worklet map acknowledgement missing');
  if(clock.combinedConservativeUncertaintyMs>10)failures.push('Calibration uncertainty exceeds10ms; timing interpretation not qualified');

  for(const durationMs of [100,250]){
    const epoch=`block-${durationMs}`;send({type:'start',epoch});await page.evaluate(epoch=>window.startHeartbeat(epoch),epoch);
    const deadlineNodeMs=performance.now()+500,id=`${epoch}-1`;
    send({type:'trigger',epoch,id,sequence:1,deadlineWallMs:deadlineNodeMs+nodeWallAtStart.offsetMs});
    await until(()=>receipts.some(r=>r.type==='queued'&&r.id===id),'Prequeued worklet receipt missing');
    const queued=receipts.find(r=>r.type==='queued'&&r.id===id),ingress=receipts.find(r=>r.type==='port-ingress'&&r.id===id);
    const timer=setTimeout(()=>{const actual=performance.now(),errorMs=actual-deadlineNodeMs;nodeTimers.push({id,deadlineNodeMs,actualNodeMs:actual,errorMs,type:errorMs>20?'late-drop':'onset'});},Math.max(0,deadlineNodeMs-performance.now()));
    await sleep(Math.max(0,deadlineNodeMs-30-performance.now()));
    const blockStarted=performance.now();Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,durationMs);const blockEnded=performance.now();
    await until(()=>receipts.some(r=>['onset','late-drop'].includes(r.type)&&r.id===id)&&nodeTimers.some(r=>r.id===id),'Deadline outcome missing');
    const actual=receipts.find(r=>['onset','late-drop'].includes(r.type)&&r.id===id),nativeTimer=nodeTimers.find(r=>r.id===id);
    cases.push({name:epoch,deadlineNodeMs,queued,ingress,blockStarted,blockEnded,actualBlockMs:blockEnded-blockStarted,actual,nativeTimer});
    if(!ingress||ingress.nodeReceiptMs>=blockStarted||queued.ingestionLeadMs<400)failures.push(`${epoch}: actual port prequeue before block not established`);
    if(actual.type!=='onset'||Math.abs(actual.errorMs)>20||actual.actualOutputSample!==.25)failures.push(`${epoch}: real worklet execution outside unchanged20ms policy`);
    if(nativeTimer.type!=='late-drop')failures.push(`${epoch}: old Node timer negative control did not fail`);
    clearTimeout(timer);
  }

  const epoch='lifecycle';send({type:'start',epoch});await page.evaluate(epoch=>window.startHeartbeat(epoch),epoch);
  const future=(id:string,sequence:number,delayMs:number)=>({type:'trigger',epoch,id,sequence,deadlineWallMs:Date.now()+delayMs});
  send(future('cancel-1',1,300));await until(()=>receipts.some(r=>r.type==='queued'&&r.id==='cancel-1'),'Cancel prequeue missing');send({type:'cancel',epoch,ids:['cancel-1']});
  await until(()=>receipts.some(r=>r.type==='cancelled'&&r.ids.includes('cancel-1')),'Cancellation execution missing');await sleep(350);
  if(receipts.some(r=>r.type==='onset'&&r.id==='cancel-1'))failures.push('Cancelled future event executed');
  cases.push({name:'pending-cancel',rows:receipts.filter(r=>r.id==='cancel-1'||r.ids?.includes('cancel-1'))});
  send(future('active-2',2,100));await until(()=>receipts.some(r=>r.type==='onset'&&r.id==='active-2'),'Active voice onset missing');send({type:'cancel',epoch,ids:['active-2']});await until(()=>receipts.some(r=>r.type==='cancelled'&&r.ids.includes('active-2')),'Active release missing');
  const released=receipts.find(r=>r.type==='cancelled'&&r.ids.includes('active-2'));if(released.activeVoices!==0)failures.push('Active cancellation did not release control voice');cases.push({name:'active-cancel',rows:receipts.filter(r=>r.id==='active-2'||r.ids?.includes('active-2'))});
  send(future('retired-3',3,300));await until(()=>receipts.some(r=>r.type==='queued'&&r.id==='retired-3'),'Epoch prequeue missing');send({type:'start',epoch:'new-epoch'});await page.evaluate(()=>window.startHeartbeat('new-epoch'));send(future('stale-4',4,300));await sleep(350);
  if(receipts.some(r=>r.type==='onset'&&['retired-3','stale-4'].includes(r.id)))failures.push('Retired/stale epoch executed');cases.push({name:'epoch-reset',rows:receipts.filter(r=>r.id==='retired-3'||r.id==='stale-4'||r.type==='started')});
  send({type:'trigger',epoch:'new-epoch',id:'watchdog-1',sequence:1,deadlineWallMs:Date.now()+1000});await until(()=>receipts.some(r=>r.type==='queued'&&r.id==='watchdog-1'),'Watchdog prequeue missing');await page.evaluate(()=>window.stopHeartbeat());
  await until(()=>receipts.some(r=>r.type==='watchdog-stop'&&r.epoch==='new-epoch'),'Render watchdog did not execute',1800);await sleep(550);
  const watchdog=receipts.find(r=>r.type==='watchdog-stop'&&r.epoch==='new-epoch');if(watchdog.pending!==0||watchdog.activeVoices!==0||receipts.some(r=>r.type==='onset'&&r.id==='watchdog-1'))failures.push('Watchdog did not clear future work');cases.push({name:'watchdog',actual:watchdog});

  send({type:'start',epoch:'zero-delay'});await page.evaluate(()=>window.startHeartbeat('zero-delay'));
  await page.locator('#producer-enable').click();await page.waitForFunction(()=>window.probe.producer?.state==='running');
  await page.evaluate(offset=>{const p=window.probe,audioNowSeconds=p.producer.currentTime;p.socket.send(JSON.stringify({type:'zero-delay',epoch:'zero-delay',id:'zero-delay-1',sequence:1,onsetAudioSeconds:audioNowSeconds,audioNowSeconds,browserPerformanceMs:performance.now(),browserNodeOffsetMs:offset}));},bestSync.offsetMs);
  await until(()=>receipts.some(r=>['onset','late-drop'].includes(r.type)&&r.id==='zero-delay-1'),'Zero-delay outcome missing');
  const zeroWire=wire.find(r=>r.type==='zero-delay-wire'),zeroActual=receipts.find(r=>['onset','late-drop'].includes(r.type)&&r.id==='zero-delay-1');cases.push({name:'zero-delay-current-audio-now',wire:zeroWire,actual:zeroActual});
  if(!zeroWire||zeroActual.type!=='onset'||Math.abs(zeroActual.errorMs)>20)failures.push('Unshifted zero-delay diagnostic failed20ms policy');
  send({type:'stop',epoch:'zero-delay'});await until(()=>receipts.some(r=>r.type==='stopped'&&r.epoch==='zero-delay'),'Stop execution missing');
}catch(error){failures.push(String(error));}
finally{await page.evaluate(async()=>{window.stopHeartbeat();window.probe.socket.close();await window.probe.producer?.close();await window.probe.context?.close();}).catch(()=>{});await browser.close();await new Promise<void>(r=>wss.close(()=>r()));await new Promise<void>(r=>server.close(()=>r()));}
const nodeWallAtEnd=wallPair();
const report={title:'Bongo Planet diagnostic receiver render-clock feasibility',date:new Date().toISOString(),url,scriptSha256:createHash('sha256').update(fs.readFileSync('scripts/receiver-clock-probe.ts')).digest('hex'),processorSha256:createHash('sha256').update(processor).digest('hex'),clock,nodeWallAtEnd,nodeWallOffsetDriftMs:nodeWallAtEnd.offsetMs-nodeWallAtStart.offsetMs,cases,failures,browserErrors,rawReceipts:receipts,rawWire:wire,nodeTimers,scope:['Standalone diagnostic only; no actual application receiver/F01/F04 integration or acceptance claimed.','Real active AudioContexts, actual process callbacks and output sample writes before a zero-gain output; no microphone, getUserMedia, physical sound, device capture or default-route change.','Date.now is a coarse actual callback-wall witness; calibration is from independent clock blocks, not fitted intended onsets.','Zero-delay case uses an independent producer context currentTime with current audio.now conversion form; it does not reproduce product event-forwarding latency.','Atomics.wait deliberately blocks only this Node diagnostic thread; it is a negative-control stimulus, not a scheduling remedy.']};
if(Math.abs(report.nodeWallOffsetDriftMs)>2)report.failures.push('Host wall/monotonic mapping changed by more than2ms');
fs.writeFileSync(path.join(destination,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({failures:report.failures,cases:cases.map(c=>({name:c.name,workletErrorMs:c.actual?.errorMs,nodeTimerErrorMs:c.nativeTimer?.errorMs})),clockUncertaintyMs:clock?.combinedConservativeUncertaintyMs,cleanup:'Own browser/context/socket/server closed'},null,2));
if(report.failures.length||browserErrors.length)process.exitCode=1;

declare global { interface Window { probe:any;startHeartbeat:(epoch:string)=>void;stopHeartbeat:()=>void; } }
