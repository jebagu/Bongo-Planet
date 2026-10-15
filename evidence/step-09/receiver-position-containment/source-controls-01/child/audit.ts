/** Bongo Planet source-prepared audit. Actual invocation requires root GO. */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import dgram from 'node:dgram';
import nativeAssert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium,type Browser,type BrowserServer,type Page} from '@playwright/test';
import {createBridge} from "/Users/jeremyguillory/Documents/ChatGPT/ripple/src/output/bridge.ts";
import {topology} from "/Users/jeremyguillory/Documents/ChatGPT/ripple/src/core/geometry.ts";
import {validateScene,type Scene,type Vec3,type EngineEvent} from "/Users/jeremyguillory/Documents/ChatGPT/ripple/src/core/contracts.ts";


// Private diagnostic instrumentation. No musical/model/clock policy changes.
const __incarnation=process.env.BONGO_POSITION_CONTAINMENT_INCARNATION!;
if(!__incarnation||!process.send)throw Error('Private diagnostic requires owned parent IPC');
let __sequence=0,__stage='child-start',__totalBytes=0,__terminalSequence=0;
const __pending=new Map<number,number>();let __pendingBytes=0;
function __emit(kind:'phase'|'chrome'|'terminal',operation:string,detail:unknown={},progress=false){
 const message={incarnation:__incarnation,sequence:++__sequence,kind,childTime:performance.now()/1000,stage:__stage,operation,progress,detail};
 const bytes=Buffer.byteLength(JSON.stringify(message));
 if(bytes>16384||__sequence>16384||__totalBytes+bytes>8388608||__pending.size>=1024||__pendingBytes+bytes>524288)throw Error('Diagnostic phase IPC capacity exceeded');
 __totalBytes+=bytes;__pending.set(__sequence,bytes);__pendingBytes+=bytes;
 if(kind==='terminal')__terminalSequence=__sequence;
 process.send!(message,error=>{if(error){process.exitCode=1;process.stderr.write('Diagnostic IPC send failure\n');}});
}
function __mark(stage:string,detail:unknown={}){__stage=stage;__emit('phase','structural-stage',detail,true);}
function __operation(operation:string){__emit('phase',operation,{},false);}
process.on('message',(message:any)=>{
 if(message?.kind!=='ack'||message.incarnation!==__incarnation||!Number.isSafeInteger(message.sequence)||!__pending.has(message.sequence))throw Error('Invalid diagnostic phase acknowledgment');
 __pendingBytes-=__pending.get(message.sequence)!;__pending.delete(message.sequence);
 if(message.sequence===__terminalSequence)process.disconnect();
});
const assert:typeof nativeAssert=new Proxy(nativeAssert,{
 apply(target,self,args){__operation('assert:call');return Reflect.apply(target,self,args);},
 get(target,key,receiver){const value=Reflect.get(target,key,receiver);if(typeof value!=='function')return value;return(...args:unknown[])=>{__operation('assert:'+String(key));return Reflect.apply(value,target,args);};}
});
function __chrome(server:any){const child=server.process(),arg=child.spawnargs.find((a:string)=>a.startsWith('--user-data-dir='));__emit('chrome','owned-chrome-launch',{pid:child.pid,executable:child.spawnfile,profile:arg?.slice('--user-data-dir='.length)});}
__mark('child-start');

const app='http://127.0.0.1:5417/BongoPlanet/',port=5424,udpPort=5425;
const expectedMain='d8040f401399d61fddde16e1fcd744f1d85208073bf1dd64f2059bcdcaed2245';
const expectedProcessor='0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793';
const sourceFiles=['src/output/NativeClock.ts','src/output/ReceiverClock.ts','src/output/bridge.ts','src/output/protocol.ts','src/output/OutputAdapter.ts','src/core/geometry.ts'];
const out=path.resolve(process.env.BONGO_POSITION_AUDIT_OUT!);
type Send={before:number;after:number;bufferedBefore:number;bufferedAfter:number;packet:any};
type Edit={planned:number;before:number;after:number;from:number;to:number;scene:Scene};
type Probe={t0:number;t1:number;server:number;halfRTTMs:number;allowanceMs:number;offset:number;interval:[number,number]};
type ProbeArm={name:string;before:Probe;after:Probe};
const clockAssumption='Conditional model: during this one browser navigation and ordinary receiver lifetime, browser performance.now and Node performance.now share a stable monotonic rate and fixed origin difference, with the declared1ms timestamp precision allowance. Sparse sync observations do not prove absence of interior rate/offset excursions. No unmeasured drift allowance is invented; incompatible observations fail.';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const dot=(a:number[],b:number[])=>a.reduce((s,v,i)=>s+v*b[i],0);
const angle=(a:number[],b:number[])=>Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
const percentile=(values:number[],q:number)=>{assert(values.length>0&&values.every(Number.isFinite));return [...values].sort((a,b)=>a-b)[Math.ceil(values.length*q)-1];};
function arc(a:Vec3,b:Vec3,f:number):Vec3{__operation("function arc");
 const t=Math.min(1,Math.max(0,f)),theta=angle(a,b);assert(theta>.01&&theta<Math.PI-.01,'Declared paths exclude ambiguous antipodal/coincident cases');
 return a.map((v,i)=>(Math.sin((1-t)*theta)*v+Math.sin(t*theta)*b[i])/Math.sin(theta)) as Vec3;
}
// Independent OSC byte parser, deliberately not production encode/decodeOSC.
function osc(hex:string){__operation("function osc");
 assert(/^(?:[0-9a-f]{2})+$/.test(hex));const bytes=Buffer.from(hex,'hex');let cursor=0;
 const string=()=>{const end=bytes.indexOf(0,cursor);assert(end>=cursor);const value=bytes.toString('ascii',cursor,end),next=(end+4)&~3;assert(next<=bytes.length);for(let i=end;i<next;i++)assert.equal(bytes[i],0);cursor=next;return value;};
 const address=string(),tags=string(),match=/^\/adm\/obj\/([1-9]\d*)\/xyz$/.exec(address);assert(match);assert.equal(tags,',fff');assert.equal(bytes.length-cursor,12);
 const position=[0,1,2].map(i=>bytes.readFloatBE(cursor+i*4));assert(position.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));return{objectId:Number(match[1]),address,position};
}
function clock(output:any,probes:Probe[]){__operation("function clock");
 const samples=output.clockSynchronization;assert(Array.isArray(samples)&&samples.length===8);
 const chosen=samples.reduce((a:any,b:any)=>a.uncertaintyMs<=b.uncertaintyMs?a:b);assert(Number.isFinite(chosen.offset)&&Number.isFinite(chosen.uncertaintyMs));
 const interval:[number,number]=[chosen.offset-chosen.uncertaintyMs/1000,chosen.offset+chosen.uncertaintyMs/1000];
 const comparisons=probes.map(p=>({probe:p,compatible:p.interval[0]<=interval[1]&&interval[0]<=p.interval[1],boundMs:Math.max(Math.abs(p.interval[0]-chosen.offset),Math.abs(p.interval[1]-chosen.offset))*1000}));
 assert(comparisons.every(p=>p.compatible),'Independent intervals incompatible with frozen producer offset');
 const boundMs=Math.max(chosen.uncertaintyMs,...comparisons.map(p=>p.boundMs));assert(boundMs<=10,'Conditional producer conversion uncertainty exceeds10ms');return{chosen,interval,comparisons,boundMs,boundStatus:'conditional-on-declared-fixed-monotonic-model',clockAssumption};
}
function probeAges(nodeTime:number,probes:Probe[]){__operation("function probeAges");
 assert(Number.isFinite(nodeTime));const ordered=[...probes].sort((a,b)=>a.server-b.server),before=ordered.filter(p=>p.server<=nodeTime).at(-1)??null,after=ordered.find(p=>p.server>=nodeTime)??null;
 return{observationClock:'Node performance seconds; probe server timestamps',before,after,precedingProbeAgeMs:before?(nodeTime-before.server)*1000:null,followingProbeLeadMs:after?(after.server-nodeTime)*1000:null,bracketed:!!before&&!!after,continuousClockProof:false};
}
async function probe(page:Page):Promise<Probe>{__operation("async function probe");return page.evaluate(port=>new Promise((resolve,reject)=>{
 const ws=new WebSocket(`ws://127.0.0.1:${port}`),timer=setTimeout(()=>{ws.close();reject(Error('Independent sync timed out'));},2000);let t0=0;
 ws.onopen=()=>{t0=performance.now()/1000;ws.send(JSON.stringify({version:1,type:'sync',t0}));};
 ws.onerror=()=>{clearTimeout(timer);ws.close();reject(Error('Independent sync transport failed'));};
 ws.onmessage=event=>{const t1=performance.now()/1000,m=JSON.parse(event.data);clearTimeout(timer);ws.close();if(m.type!=='sync'||m.version!==1||m.t0!==t0||!Number.isFinite(m.server)||t1<t0){reject(Error('Invalid independent sync'));return;}
  const halfRTTMs=(t1-t0)*500,allowanceMs=1,offset=m.server-(t0+t1)/2,u=(halfRTTMs+allowanceMs)/1000;resolve({t0,t1,server:m.server,halfRTTMs,allowanceMs,offset,interval:[offset-u,offset+u]});};
 }),port);}
async function availability(){
 const tcp=net.createServer();try{await new Promise<void>((r,j)=>{tcp.once('error',j);tcp.listen(port,'127.0.0.1',r);});}finally{if(tcp.listening)await new Promise<void>(r=>tcp.close(()=>r()));}
 const udp=dgram.createSocket('udp4');try{await new Promise<void>((r,j)=>{udp.once('error',j);udp.bind(udpPort,'127.0.0.1',r);});}finally{await new Promise<void>(r=>{try{udp.close(()=>r());}catch{r();}});}
}
async function main(){
 assert(process.argv.includes('--run'),'Source preparation only: actual --run needs separate root GO');assert(!fs.existsSync(out),'Never overwrite an attempt');fs.mkdirSync(out,{recursive:true});
 const report:any={title:'Bongo Planet actual receiver position invariance',status:'preparing',startedUtc:new Date().toISOString(),port,udpPort,clockAssumption,cases:[],errors:[],cleanup:{},limits:['Position-age upper bounds and combined producer uncertainty are conditional on the declared fixed monotonic/precision model, not continuously observed clock proof.','Diagnostic actual control transport only; no spatial sound, physical audio timing or venue interpolation claim.','Short F01 mapping is not the full two-minute F01/F04 gate.','Rapid-edit coalescing is not simulated/actual bufferedAmount congestion qualification.']};
 const began=performance.now(),deadline=began+110000;let bridge:ReturnType<typeof createBridge>|undefined,server:BrowserServer|undefined,browser:Browser|undefined,ownedPage:Page|undefined,closing=false,monitor:ReturnType<typeof setInterval>|undefined,watchdog:ReturnType<typeof setTimeout>|undefined,softDeadline:ReturnType<typeof setTimeout>|undefined;
 const save=(name:string,value:unknown)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 function retain(){const bytes=JSON.stringify(report,null,2)+'\n';assert(Buffer.byteLength(bytes)<=32*1024*1024,'32MiB retention cap');fs.writeFileSync(path.join(out,'report.json'),bytes);}
 async function bounded<T>(work:Promise<T>,ms=5000,cleanup=false):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,j)=>{timer=setTimeout(()=>j(Error(cleanup?'Audit cleanup deadline':'Audit operation deadline')),Math.max(1,Math.min(ms,(cleanup?began+120000:deadline)-performance.now())));})]);}finally{clearTimeout(timer);}}
 async function bytes(url:string){const response=await fetch(url,{signal:AbortSignal.timeout(3000)});assert(response.ok);return Buffer.from(await response.arrayBuffer());}
 async function binding(label:string){const html=await bytes(app),mainPath=html.toString().match(/<script[^>]*src="([^"]+)"/)?.[1];assert(mainPath?.startsWith('/BongoPlanet/assets/'));const bundle=await bytes(new URL(mainPath!,app).href),processor=bundle.toString().match(/assets\/processor-[\w-]+\.js/)?.[0];assert(processor);assert.equal(sha(bundle),expectedMain);assert.equal(sha(await bytes(app+processor)),expectedProcessor);fs.writeFileSync(path.join(out,`served-${label}.html`),html,{flag:'wx'});return{mainPath,mainSha256:sha(bundle),processorSha256:expectedProcessor};}
 function healthy(){assert(bridge);const state=bridge.state();assert('ready' in state.clock);assert.equal(state.clock.ready,true,'Receiver lost readiness');assert.equal(state.drops,0,'Receiver rejected/dropped traffic');assert(bridge.records.length<5000&&bridge.raw.length<5000,'Complete receiver retention cap reached');return state;}
 async function sends(page:Page):Promise<Send[]>{__operation("async function sends");const capture=await page.evaluate(()=>({rows:(window as any).__positionAudit.sends,truncated:(window as any).__positionAudit.truncated}));assert.equal(capture.truncated,false);return capture.rows;}
 try{
  fs.copyFileSync(import.meta.filename,path.join(out,'audit-source.ts'));report.harnessSha256=sha(fs.readFileSync(import.meta.filename));report.sources={};for(const file of sourceFiles){const content=fs.readFileSync(file),target=path.join(out,'sources',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content,{flag:'wx'});report.sources[file]=sha(content);}
  __mark("binding-and-port-preflight");report.servedBefore=await binding('before');await availability();__mark("receiver-create");bridge=createBridge(port,udpPort,{nativeClock:true});__mark("receiver-readiness");assert.equal(await bounded(bridge.start(),7000),port);report.initialReceiver=healthy();assert.equal(report.initialReceiver.session,'');
  report.receiverHealth=[];monitor=setInterval(()=>{try{const s=healthy();assert(report.receiverHealth.length<1600);report.receiverHealth.push({time:performance.now()/1000,session:s.session,ready:'ready' in s.clock?s.clock.ready:false,pending:s.pending,voices:s.activeVoices,objects:s.objects.length});}catch(error){if(!report.receiverHealthFailure){report.receiverHealthFailure={reason:String(error),state:bridge?.state()};report.errors.push(String(error));}}},80);
  __mark("browser-launch");const launch=chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,timeout:7000,args:['--mute-audio','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']}).then(s=>{__chrome(s);if(closing){s.process().kill('SIGTERM');void s.close().catch(()=>{});}return s;});
  server=await bounded(launch,8000);report.ownedBrowserPid=server.process().pid;softDeadline=setTimeout(()=>{report.cleanup.operationDeadline=true;report.errors.push('110s operation deadline exceeded');server?.process().kill('SIGTERM');},Math.max(1,deadline-performance.now()));watchdog=setTimeout(()=>{report.cleanup.watchdog=true;server?.process().kill('SIGTERM');},Math.max(1,120000-(performance.now()-began)));browser=await bounded(chromium.connect(server.wsEndpoint()));report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000}});context.setDefaultTimeout(3500);const page=ownedPage=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(port=>{
   (window as any).__name=(fn:unknown)=>fn;const Native=window.WebSocket,originalSend=Native.prototype.send,audit=(window as any).__positionAudit={sends:[] as any[],truncated:false};
   class Routed extends Native{constructor(url:string|URL,protocols?:string|string[]){const exact=String(url)==='ws://127.0.0.1:5418';super(exact?`ws://127.0.0.1:${port}`:url,protocols);}}
   Native.prototype.send=function(data:string|Blob|BufferSource){const before=performance.now()/1000,bufferedBefore=this.bufferedAmount;originalSend.call(this,data);const after=performance.now()/1000,bufferedAfter=this.bufferedAmount;if(this.url===`ws://127.0.0.1:${port}/`&&typeof data==='string'){if(audit.sends.length>=8192){audit.truncated=true;return;}audit.sends.push({before,after,bufferedBefore,bufferedAfter,packet:JSON.parse(data)});}};
   window.WebSocket=Routed;
  },port);
  __mark("page-navigation");await page.goto(app);__mark("page-readiness");await page.waitForFunction(()=>(window as any).__bongo);__mark("F07-load");await page.locator('#fixture').selectOption('F07');await page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===6);
  __mark("fixture-readback");const f07=validateScene(JSON.parse((await bytes(app+'fixtures/F07.json')).toString())),f01=validateScene(JSON.parse((await bytes(app+'fixtures/F01.json')).toString()));save('fixtures.json',{F07:f07,F01:f01});
  __mark("bridge-connect");await page.locator('summary').click();await page.locator('#bridge').click();__mark("bridge-sync");await page.waitForFunction(()=>(window as any).__bongo.output.clockSynchronization.length===8);await page.waitForTimeout(120);healthy();
  __mark("initial-independent-probes");const independent:Probe[]=report.independentClockProbes=[],arms:ProbeArm[]=report.probeArms=[];for(let i=0;i<3;i++)independent.push(await probe(page));report.outputStartup=await page.evaluate(()=>(window as any).__bongo.output);clock(report.outputStartup,independent);
  __mark("cardinal-assertions");const cardinal:Record<string,Vec3>={right:[1,0,0],left:[-1,0,0],forward:[0,1,0],back:[0,-1,0],up:[0,0,1],down:[0,0,-1]};
  const initial=healthy();assert.equal(initial.objects.length,6);for(const [id,xyz]of Object.entries(cardinal)){const object=initial.objects.find(o=>o.nodeId===id);assert(object);assert(distance(object.position,xyz)<=1e-6);}
  report.cases.push({name:'Paused cardinal initial snapshot',objects:initial.objects,passed:true});
  __mark("camera-before-readback");const cameraBefore=await page.evaluate(()=>({scene:(window as any).__bongo.scene,view:(window as any).__bongo.view.getDiagnostics(),slots:(window as any).__bongo.slots})),canvas=await page.locator('canvas').boundingBox();assert(canvas);const start={x:canvas.x+10,y:canvas.y+canvas.height*.5};assert(cameraBefore.slots.filter((s:any)=>s.visible).every((s:any)=>Math.hypot(s.x-start.x,s.y-start.y)>40));__mark("camera-gesture");await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.7,canvas.y+canvas.height*.65,{steps:20});await page.mouse.up();await page.waitForTimeout(500);
  __mark("camera-after-readback-and-assertions");const cameraAfter=await page.evaluate(()=>({scene:(window as any).__bongo.scene,view:(window as any).__bongo.view.getDiagnostics()}));assert.deepEqual(cameraAfter.scene,cameraBefore.scene);assert(distance(cameraAfter.view.camera,cameraBefore.view.camera)>.02);assert.deepEqual(healthy().objects,initial.objects);report.cases.push({name:'Actual camera orbit leaves receiver source positions unchanged',cameraBefore,cameraAfter,objects:healthy().objects,passed:true});
  const occupied=new Set(f07.pieces.map(p=>p.vertex));let last=f07.pieces.find(p=>p.id==='right')!.vertex;const destinations:number[]=[];for(let v=0;v<92&&destinations.length<3;v++)if(!occupied.has(v)&&angle(topology.vertices[last],topology.vertices[v])>.2&&angle(topology.vertices[last],topology.vertices[v])<Math.PI-.2){destinations.push(v);last=v;}assert.equal(destinations.length,3);
  for(const fps of [60,15,2]){__mark('movement-'+fps+'FPS');
   await page.evaluate(scene=>(window as any).__bongo.load(scene),f07);await page.locator('#fps').selectOption(String(fps));await page.waitForTimeout(140);healthy();const beforeCount=(await sends(page)).length,baseline=healthy();
   __mark("movement-before-probe");const beforeProbe=await probe(page);independent.push(beforeProbe);
   __mark("movement-schedule");const edits:Edit[]=await page.evaluate(({scene,destinations})=>new Promise(resolve=>{
    const origin=performance.now()/1000,rows:any[]=[],s=structuredClone(scene);let index=0;
    const next=()=>{const planned=origin+.1+index*.35;setTimeout(()=>{const piece=s.pieces.find(p=>p.id==='right')!,from=piece.vertex,to=destinations[index];piece.vertex=to;const before=performance.now()/1000;(window as any).__bongo.edit(s);const after=performance.now()/1000;rows.push({planned,before,after,from,to,scene:structuredClone((window as any).__bongo.scene)});if(++index<destinations.length)next();else setTimeout(()=>resolve(rows),260);},Math.max(0,(planned-performance.now()/1000)*1000));};next();
   }),{scene:f07,destinations});
   __mark("movement-after-probe");const afterProbe=await probe(page);independent.push(afterProbe);const arm:ProbeArm={name:`Movement${fps}FPS`,before:beforeProbe,after:afterProbe};arms.push(arm);
   __mark("movement-readback-and-assertions");const native=(await sends(page)).slice(beforeCount),positions=native.filter(p=>p.packet.type==='position'&&p.packet.nodeId==='right');report.pendingCase={name:`Movement${fps}FPS`,edits,native,baseline};assert(positions.length>=9);const final=healthy().objects.find(o=>o.nodeId==='right')!,old=baseline.objects.find(o=>o.nodeId==='right')!;assert.equal(final.objectId,old.objectId);assert(distance(final.position,topology.vertices[destinations.at(-1)!])<=1e-6);
   const fixed=clock(report.outputStartup,independent),moves:any[]=[];for(let i=0;i<edits.length;i++){
    const e=edits[i];validateScene(e.scene);assert(e.after>=e.before);if(i)assert(e.before-edits[i-1].after>=.24,'Host delay invalidated separated move schedule');const expected=structuredClone(i?edits[i-1].scene:f07);expected.pieces.find(p=>p.id==='right')!.vertex=e.to;assert.deepEqual(e.scene,expected);
    const rows=positions.filter(row=>row.before>=e.before&&row.before<(edits[i+1]?.before??Infinity));assert(rows.length>=3);let progress=-Infinity;
    for(const row of rows){assert.equal(row.packet.objectId,old.objectId);const a=topology.vertices[e.from],b=topology.vertices[e.to],t=row.packet.sent-fixed.chosen.offset,lo=arc(a,b,(t-e.after)/.12),hi=arc(a,b,(t-e.before)/.12),value=angle(a,row.packet.position),lower=angle(a,lo),upper=angle(a,hi);assert(value>=lower-1e-6&&value<=upper+1e-6,'Position outside independently bracketed120ms trajectory');assert(distance(row.packet.position,arc(a,b,value/angle(a,b)))<=1e-6,'Position departed shortest arc');assert(value>=progress-1e-6,'Stale trajectory regression');assert(Math.abs(Math.hypot(...row.packet.position)-1)<=1e-6);progress=value;}
    assert(distance(rows.at(-1)!.packet.position,topology.vertices[e.to])<=1e-6);moves.push({edit:e,rows,maximumSendIntervalMs:Math.max(...rows.slice(1).map((r,j)=>(r.before-rows[j].before)*1000))});
   }
   assert.equal(await page.evaluate(()=>(window as any).__bongo.status?.running??false),false);report.cases.push({name:`Identical scheduled movement at${fps}FPS`,fps,destinations,moves,objectId:old.objectId,probeArm:arm,conditionalClock:fixed,passed:true});delete report.pendingCase;retain();
  }
  await page.evaluate(scene=>(window as any).__bongo.load(scene),f07);await page.waitForTimeout(140);const burstStart=(await sends(page)).length,burstObjectId=healthy().objects.find(o=>o.nodeId==='right')!.objectId;
  __mark("synchronous-valid-edit-burst");const burst=await page.evaluate(({scene,destinations})=>{const s=structuredClone(scene),before=performance.now()/1000;for(let i=0;i<100;i++){s.pieces.find(p=>p.id==='right')!.vertex=destinations[i%2];(window as any).__bongo.edit(s);}return{before,after:performance.now()/1000,scene:(window as any).__bongo.scene};},{scene:f07,destinations});await page.waitForTimeout(260);
  const burstPositions=(await sends(page)).slice(burstStart).filter(p=>p.packet.type==='position'&&p.packet.nodeId==='right');assert(burstPositions.length>0&&burstPositions.length<100);assert(burstPositions.every(p=>p.packet.objectId===burstObjectId));const burstExpected=structuredClone(f07);burstExpected.pieces.find(p=>p.id==='right')!.vertex=destinations[1];assert.deepEqual(burst.scene,burstExpected);assert(distance(burstPositions.at(-1)!.packet.position,topology.vertices[destinations[1]])<=1e-6);report.cases.push({name:'100 synchronous valid edits retain newest unsent movement',burst,positions:burstPositions,passed:true,scope:'Ordinary coalescing, not socket congestion'});
  await page.evaluate(scene=>(window as any).__bongo.load(scene),f01);await page.waitForTimeout(140);__mark("F01-before-probe-and-start");const controlBeforeProbe=await probe(page);independent.push(controlBeforeProbe);await page.locator('#play').click();await page.waitForFunction(()=>(window as any).__bongo.events.some((e:any)=>e.type==='emission'));await page.waitForTimeout(6000);
  __mark("F01-window-readback");const windowEnd=await page.evaluate(()=>({audioEnd:(window as any).__bongo.audio.now,events:structuredClone((window as any).__bongo.events)}));report.controlWindow=windowEnd;assert(Number.isFinite(windowEnd.audioEnd));await page.waitForTimeout(100);const beforePause=healthy();await page.locator('#play').click();await page.waitForTimeout(100);healthy();
  __mark("F01-oracle-and-assertions");const events=windowEnd.events as EngineEvent[],emissions=events.filter((e):e is Extract<EngineEvent,{type:'emission'}>=>e.type==='emission');assert(emissions.length>0);const origin=Math.min(...emissions.map(e=>e.time)),duration=windowEnd.audioEnd-origin;assert(Number.isFinite(origin)&&Number.isFinite(duration)&&duration>0);
  const committed=events.filter((e):e is Extract<EngineEvent,{type:'trigger'}>=>e.type==='trigger'&&e.trigger.onset<=windowEnd.audioEnd).map(e=>e.trigger),g=f01.pieces.find(p=>p.kind==='generator')!;assert(g.kind==='generator');const expectedEvents:any[]=[];
  for(let k=0;origin+k*g.period*60/f01.settings.bpm<=windowEnd.audioEnd;k++)for(const node of f01.pieces)if(node.kind!=='generator'){
   const theta=angle(topology.vertices[g.vertex],topology.vertices[node.vertex]);if(theta>g.reach*Math.PI/180+1e-9)continue;const raw=f01.settings.travel*g.period*theta/Math.PI,grid=f01.settings.quantization,delay=grid?Math.min(Math.floor(raw/grid+.5+1e-10)*grid,(Math.ceil(g.period/grid)-1)*grid):raw,onset=origin+(k*g.period+delay)*60/f01.settings.bpm;if(onset<=windowEnd.audioEnd)expectedEvents.push({nodeId:node.id,generatorId:g.id,onset});
  }
  assert(expectedEvents.length>0);assert.equal(committed.length,expectedEvents.length);const key=(e:any)=>`${e.nodeId}:${e.generatorId}:${Math.round(e.onset*1e6)}`;assert.deepEqual(committed.map(key).sort(),expectedEvents.map(key).sort());assert.equal(new Set(committed.map(t=>t.id)).size,committed.length);
  __mark("F01-receipt-readback-and-assertions");const receipts=bridge.records.filter((r:any)=>r.type==='onset'&&committed.some(t=>t.id===r.id));assert.equal(receipts.length,committed.length);const controlWires=await sends(page);for(const t of committed){const rows=receipts.filter(r=>r.id===t.id);assert.equal(rows.length,1);const r:any=rows[0],node=f01.pieces.find(p=>p.id===t.nodeId)!;assert.equal(r.nodeId,t.nodeId);assert.equal(r.generatorId,t.generatorId);assert(distance(r.position,topology.vertices[node.vertex])<=1e-6);const wireRows=controlWires.filter(w=>w.packet.type==='trigger'&&w.packet.id===t.id);assert.equal(wireRows.length,1);const w=wireRows[0];assert.equal(r.objectId,w.packet.objectId);const preceding:Send[]=controlWires.slice(0,controlWires.indexOf(w)).filter(p=>p.packet.type==='position'&&p.packet.session===w.packet.session&&p.packet.nodeId===r.nodeId&&p.packet.objectId===r.objectId);assert(preceding.length>0);assert(distance(preceding.at(-1)!.packet.position,r.position)<=1e-6);}
  const controlAfterProbe=await probe(page);independent.push(controlAfterProbe);const controlArm:ProbeArm={name:'ShortF01',before:controlBeforeProbe,after:controlAfterProbe};arms.push(controlArm);
  report.cases.push({name:'Short real F01 complete fixed-position control mapping',origin,audioEnd:windowEnd.audioEnd,duration,expectedEvents,committed,receipts,probeArm:controlArm,postWindowReceipts:beforePause.events.filter((r:any)=>r.type==='onset'&&!committed.some(t=>t.id===r.id)),scope:'Short fixture window, not full two-minute gate; clock uncertainty conditional on declared stable monotonic model',passed:true});
  for(let i=0;i<3;i++)independent.push(await probe(page));report.clock=clock(report.outputStartup,independent);report.sends=await sends(page);report.receiverRecords=bridge.records.slice();report.rawOSC=bridge.raw.slice();
  __mark("raw-UDP-readback-and-assertions");const positions=report.sends.filter((r:Send)=>r.packet.type==='position') as Send[];assert.equal(positions.length,report.rawOSC.length,'Every native position send needs one raw UDP receipt');const matched:any[]=[];
  for(let i=0;i<positions.length;i++){const send=positions[i],raw:any=report.rawOSC[i],decoded=osc(raw.hex),p=send.packet;assert.equal(decoded.objectId,p.objectId);assert.deepEqual(decoded.position,p.position.map(Math.fround));assert.equal(decoded.address,`/adm/obj/${p.objectId}/xyz`);const ageMs=(raw.arrival-p.sent)*1000,conditionalUpperAgeMs=ageMs+report.clock.boundMs,conditionalLowerAgeMs=ageMs-report.clock.boundMs;assert(conditionalUpperAgeMs>=0,'UDP observation incompatible with conditional causal clock interval');matched.push({send,raw,decoded,ageMs,conditionalLowerAgeMs,conditionalUpperAgeMs,clockProbeContext:probeAges(raw.arrival,independent),boundStatus:report.clock.boundStatus});}
  const upperAges=matched.map(r=>r.conditionalUpperAgeMs);assert(percentile(upperAges,.95)<=40);assert(Math.max(...upperAges)<=60);report.actualUDPFreshness={conditionalP95UpperMs:percentile(upperAges,.95),conditionalMaxUpperMs:Math.max(...upperAges),boundStatus:report.clock.boundStatus,matched};
  for(const c of report.cases)if(c.fps){const movementSends:Send[]=c.moves.flatMap((m:any)=>m.rows),rows=matched.filter(r=>movementSends.some(s=>s.packet.session===r.send.packet.session&&s.packet.sequence===r.send.packet.sequence)),ages=rows.map(r=>r.conditionalUpperAgeMs);assert.equal(rows.length,movementSends.length);for(const r of rows){assert(r.send.before>=c.probeArm.before.t1&&r.send.after<=c.probeArm.after.t0);const context=probeAges(r.raw.arrival,[c.probeArm.before,c.probeArm.after]);assert(context.bracketed,'FPS UDP receipt lacks its fresh per-arm clock bracket');r.armClockProbeContext=context;}assert(percentile(ages,.95)<=40);assert(Math.max(...ages)<=60);c.actualUDPFreshness={conditionalP95UpperMs:percentile(ages,.95),conditionalMaxUpperMs:Math.max(...ages),boundStatus:report.clock.boundStatus,rows};}
  __mark("sequence-readback-and-assertions");const sequenceByEpoch=new Map<string,{control:number;position:number}>(),crossings:any[]=[];for(const send of report.sends as Send[]){const p=send.packet;if(p.type==='start'){sequenceByEpoch.set(p.session,{control:p.sequence,position:-1});continue;}if(p.type==='position'||['trigger','cancel','stop'].includes(p.type)){const epoch=sequenceByEpoch.get(p.session);assert(epoch);const stream=p.type==='position'?'position':'control';assert(p.sequence>epoch[stream],'Per-stream sequence must advance');if(p.type==='trigger'&&p.sequence<=epoch.position)crossings.push({packet:p,priorPositionSequence:epoch.position});epoch[stream]=p.sequence;}}
  assert(crossings.length>0,'Need actual accepted controls below the independent position-stream sequence');report.controlReceiptClockContexts=(receipts as any[]).map(r=>{const context=probeAges(r.actual,[controlArm.before,controlArm.after]);assert(context.bracketed,'Short control receipt lacks per-arm clock observations');const conditionalCombinedUncertaintyMs=r.uncertaintyMs+report.clock.boundMs;assert(conditionalCombinedUncertaintyMs<=10,'Conditional combined short-control uncertainty exceeds10ms');return{id:r.id,actual:r.actual,reportArrival:r.reportArrival,nativeUncertaintyMs:r.uncertaintyMs,conditionalCombinedUncertaintyMs,context,boundStatus:report.clock.boundStatus};});report.sequenceByEpoch=Object.fromEntries(sequenceByEpoch);report.controlPositionSequenceCrossings=crossings;healthy();assert.deepEqual(report.errors,[]);await page.locator('#bridge').click();await page.waitForTimeout(140);assert.equal(bridge.state().session,'');report.status='passed-scoped-checks-with-conditional-clock-model';
 }catch(error){report.status='failed-or-incomplete';report.errors.push(String(error));process.exitCode=1;}
 finally{
  __mark('cleanup-start');closing=true;clearInterval(monitor);clearTimeout(softDeadline);if(bridge){report.receiverRecords=bridge.records.slice();report.rawOSC=bridge.raw.slice();report.finalReceiver=bridge.state();}
  __mark("cleanup-browser-readback");if(ownedPage&&!ownedPage.isClosed())try{report.sends=await bounded(sends(ownedPage),1000,true);report.finalBrowser=await bounded(ownedPage.evaluate(()=>({scene:(window as any).__bongo.scene,output:(window as any).__bongo.output,status:(window as any).__bongo.status,events:(window as any).__bongo.events,audioState:(window as any).__bongo.audio.state})),1000,true);}catch(error){report.errors.push('Failure-prefix readback: '+String(error));process.exitCode=1;}
  __mark("cleanup-browser-close");try{await bounded(browser?.close()??Promise.resolve(),3500,true);await bounded(server?.close()??Promise.resolve(),3500,true);report.cleanup.browserClosed=true;}catch(error){server?.process().kill('SIGTERM');report.errors.push('Browser cleanup: '+String(error));process.exitCode=1;}
  if(server){const until=performance.now()+1500;while(server.process().exitCode===null&&server.process().signalCode===null&&performance.now()<until)await new Promise(r=>setTimeout(r,20));report.cleanup.browserProcessClosed=server.process().exitCode!==null||server.process().signalCode!==null;if(!report.cleanup.browserProcessClosed){server.process().kill('SIGKILL');report.errors.push('Owned browser exit unconfirmed; kill sent');process.exitCode=1;}}
  __mark("cleanup-receiver-close");clearTimeout(watchdog);try{await bounded(bridge?.close()??Promise.resolve(),5000,true);report.cleanup.bridgeCloseAcknowledged=true;report.cleanup.serverClosed=!bridge?.server.listening;}catch(error){report.errors.push('Receiver cleanup: '+String(error));report.cleanup.bridgeCloseAcknowledged=false;process.exitCode=1;}
  __mark("cleanup-binding-and-retention");if(report.cleanup.watchdog){report.errors.push('Owned browser hard deadline exceeded');process.exitCode=1;}try{report.servedAfter=await binding('after');for(const file of sourceFiles)assert.equal(sha(fs.readFileSync(file)),report.sources[file],'Runtime source changed during audit');}catch(error){report.errors.push('Final binding: '+String(error));process.exitCode=1;}
  if(report.errors.length)report.status='failed-or-incomplete';report.finishedUtc=new Date().toISOString();report.elapsedMonotonicSeconds=(performance.now()-began)/1000;retain();save('completion.json',{status:report.status,errors:report.errors,cleanup:report.cleanup});console.log(JSON.stringify({status:report.status,errors:report.errors,cleanup:report.cleanup,out}));__emit('terminal','child-terminal',{status:report.status,errors:report.errors,cleanup:report.cleanup,exitCode:process.exitCode??0});
 }
}
void main();
