/** Bongo Planet source-prepared external containment diagnostic; no automatic run. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {fork,spawn,type ChildProcess} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const ORIGINAL='scripts/receiver-position-invariance-audit.ts';
const ORIGINAL_SHA='da2d512084df29a97b42d3e140a9c65ed4b7373a1a5c72b5a6529a28f097c1c7';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LIMITS={acquireMs:110000,cleanupMs:15000,stallMs:15000,sampleMs:3000,sampleBytes:5*1024*1024,messages:16384,ipcBytes:8*1024*1024,messageBytes:16384,unacked:1024,unackedBytes:512*1024,commandMs:1500,commandBytes:1024*1024};
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
type Wire={incarnation:string;sequence:number;kind:'phase'|'chrome'|'terminal';childTime:number;stage:string;operation:string;progress:boolean;detail?:unknown};
type Proc={pid:number;ppid:number;pgid:number;state:string;command:string};
type Identity={childPid:number;childPath:string;incarnation:string;chromePid?:number;profile?:string};
type Ordering={sequence:number;count:number;bytes:number};
function validateWire(value:any,incarnation:string,state:Ordering):Wire{
 const bytes=Buffer.byteLength(JSON.stringify(value));assert(bytes<=LIMITS.messageBytes);assert(value&&value.incarnation===incarnation);assert.equal(value.sequence,state.sequence+1);assert(['phase','chrome','terminal'].includes(value.kind));assert(Number.isFinite(value.childTime)&&value.childTime>=0);assert(typeof value.stage==='string'&&value.stage.length<=160);assert(typeof value.operation==='string'&&value.operation.length<=160);assert(typeof value.progress==='boolean');if(value.progress)assert(value.kind==='phase'&&value.operation==='structural-stage');assert(state.count+1<=LIMITS.messages&&state.bytes+bytes<=LIMITS.ipcBytes);
 state.sequence=value.sequence;state.count++;state.bytes+=bytes;return value;
}
function validChrome(value:any):{pid:number;profile:string}{
 assert(Number.isSafeInteger(value?.pid)&&value.pid>1);assert.equal(value.executable,CHROME);assert(typeof value.profile==='string'&&value.profile.length<1024&&path.isAbsolute(value.profile));assert(!/[\r\n\0]/.test(value.profile));assert(/\/playwright_chromiumdev_profile-[A-Za-z0-9_-]+$/.test(value.profile));return{pid:value.pid,profile:value.profile};
}
function isNode(p:Proc,id:Identity){return p.pid===id.childPid&&p.command.startsWith(process.execPath+' ')&&p.command.includes(id.childPath)&&p.command.includes(`--containment-incarnation=${id.incarnation}`);}
function hasProfile(p:Proc,id:Identity){if(!id.profile)return false;return p.command.includes(`--user-data-dir=${id.profile} `)||p.command.endsWith(`--user-data-dir=${id.profile}`);}
function isChrome(p:Proc,id:Identity){return p.pid===id.chromePid&&p.command.startsWith(CHROME+' ')&&hasProfile(p,id);}
function isHelper(p:Proc,id:Identity){return p.command.includes('/Google Chrome Framework.framework/')&&hasProfile(p,id);}
function classification(p:Proc|undefined,id:Identity,kind:'node'|'chrome'){
 if(!p)return'absent';if(p.state.includes('Z'))return'defunct-observed';return(kind==='node'?isNode(p,id):isChrome(p,id))?'owned-live':'identity-mismatch';
}
function outcome(input:{forced:boolean;errors:number;terminal:boolean;exit:number|null;closed:boolean}){return!input.forced&&!input.errors&&input.terminal&&input.exit===0&&input.closed?'completed-diagnostic-not-qualification':'failed-or-incomplete';}
function deadlineAction(now:number,acquireEnd:number,outerEnd:number){return now>=outerEnd?'cleanup-budget-exhausted':now>=acquireEnd?'terminate-acquisition':'continue-acquisition';}
function progressTime(previous:number,w:Wire,now:number){return w.progress?now:previous;}
function cleanTerminal(detail:any){return detail?.status==='passed-scoped-checks-with-conditional-clock-model'&&detail?.exitCode===0&&Array.isArray(detail.errors)&&detail.errors.length===0&&['browserClosed','browserProcessClosed','bridgeCloseAcknowledged','serverClosed'].every(key=>detail.cleanup?.[key]===true);}
function releaseParentHandles(p:ChildProcess){
 const result:{pid:number|undefined;scope:string;actions:string[];errors:string[]}={pid:p.pid,scope:'Parent handles only; does not establish process exit or release ownership for signaling',actions:[],errors:[]};
 const attempt=(name:string,action:()=>void)=>{try{action();result.actions.push(name);}catch(e){result.errors.push(name+': '+String(e));}};
 if(p.connected)attempt('disconnect-owned-IPC',()=>p.disconnect());
 for(const [name,stream]of [['stdin',p.stdin],['stdout',p.stdout],['stderr',p.stderr]] as const)if(stream&&!stream.destroyed)attempt('destroy-parent-'+name,()=>{stream.destroy();});
 attempt('unref-owned-process-handle',()=>p.unref());return result;
}
function prepare(root:string){
 const original=fs.readFileSync(path.join(root,ORIGINAL),'utf8');assert.equal(sha(original),ORIGINAL_SHA);let source=original;const patches:{name:string;anchor:string;replacement:string}[]=[];
 const once=(name:string,anchor:string,replacement:string)=>{const i=source.indexOf(anchor);assert(i>=0&&i===source.lastIndexOf(anchor),`Anchor must be unique: ${name}`);source=source.slice(0,i)+replacement+source.slice(i+anchor.length);patches.push({name,anchor,replacement});};
 once('assert-import',"import assert from 'node:assert/strict';","import nativeAssert from 'node:assert/strict';");
 for(const [name,relative]of [['bridge','src/output/bridge.ts'],['geometry','src/core/geometry.ts'],['contracts','src/core/contracts.ts']] as const){const anchor=name==='bridge'?"from '../src/output/bridge';":name==='geometry'?"from '../src/core/geometry';":"from '../src/core/contracts';";once(`private-import-${name}`,anchor,`from ${JSON.stringify(path.join(root,relative))};`);}
 const instrumentation=`
// Private diagnostic instrumentation. No musical/model/clock policy changes.
const __incarnation=process.env.BONGO_POSITION_CONTAINMENT_INCARNATION!;
if(!__incarnation||!process.send)throw Error('Private diagnostic requires owned parent IPC');
let __sequence=0,__stage='child-start',__totalBytes=0,__terminalSequence=0;
const __pending=new Map<number,number>();let __pendingBytes=0;
function __emit(kind:'phase'|'chrome'|'terminal',operation:string,detail:unknown={},progress=false){
 const message={incarnation:__incarnation,sequence:++__sequence,kind,childTime:performance.now()/1000,stage:__stage,operation,progress,detail};
 const bytes=Buffer.byteLength(JSON.stringify(message));
 if(bytes>${LIMITS.messageBytes}||__sequence>${LIMITS.messages}||__totalBytes+bytes>${LIMITS.ipcBytes}||__pending.size>=${LIMITS.unacked}||__pendingBytes+bytes>${LIMITS.unackedBytes})throw Error('Diagnostic phase IPC capacity exceeded');
 __totalBytes+=bytes;__pending.set(__sequence,bytes);__pendingBytes+=bytes;
 if(kind==='terminal')__terminalSequence=__sequence;
 process.send!(message,error=>{if(error){process.exitCode=1;process.stderr.write('Diagnostic IPC send failure\\n');}});
}
let __operationCount=0,__lastOperation='',__operationCounts=new Map<string,number>();
function __flushOperations(){if(__operationCount)__emit('phase','operation-summary',{count:__operationCount,lastOperation:__lastOperation,counts:Object.fromEntries(__operationCounts),scope:'Only completed structural stages; counters during a synchronous stall may remain unflushed'},false);__operationCount=0;__lastOperation='';__operationCounts.clear();}
function __mark(stage:string,detail:unknown={}){__flushOperations();__stage=stage;__emit('phase','structural-stage',detail,true);}
function __operation(operation:string){
 if(operation.length>160||!Number.isSafeInteger(__operationCount+1)||(!__operationCounts.has(operation)&&__operationCounts.size>=64))throw Error('Diagnostic operation counter capacity exceeded');
 __operationCount++;__lastOperation=operation;__operationCounts.set(operation,(__operationCounts.get(operation)??0)+1);
 if(__operationCount===1)__emit('phase','first-operation',{operation},false);
}
process.on('message',(message:any)=>{
 if(message?.kind!=='ack'||message.incarnation!==__incarnation||!Number.isSafeInteger(message.sequence)||!__pending.has(message.sequence))throw Error('Invalid diagnostic phase acknowledgment');
 __pendingBytes-=__pending.get(message.sequence)!;__pending.delete(message.sequence);
 if(message.sequence===__terminalSequence)process.disconnect?.();
});
const assert:typeof nativeAssert=new Proxy(nativeAssert,{
 apply(target,self,args){__operation('assert:call');return Reflect.apply(target,self,args);},
 get(target,key,receiver){const value=Reflect.get(target,key,receiver);if(typeof value!=='function')return value;return(...args:unknown[])=>{__operation('assert:'+String(key));return Reflect.apply(value,target,args);};}
});
function __chrome(server:any){const child=server.process(),arg=child.spawnargs.find((a:string)=>a.startsWith('--user-data-dir='));__emit('chrome','owned-chrome-launch',{pid:child.pid,executable:child.spawnfile,profile:arg?.slice('--user-data-dir='.length)});}
__mark('child-start');
`;
 once('instrumentation',"const app='http://127.0.0.1:5417/BongoPlanet/',port=5424,udpPort=5425;",instrumentation+"\nconst app='http://127.0.0.1:5417/BongoPlanet/',port=5424,udpPort=5425;");
 once('exclusive-child-output',"const out=path.resolve(process.env.BONGO_POSITION_AUDIT_OUT??'evidence/step-09/receiver-position-invariance/attempt-01');","const out=path.resolve(process.env.BONGO_POSITION_AUDIT_OUT!);");
 const before=(name:string,anchor:string,phase:string)=>once(name,anchor,`__mark(${JSON.stringify(phase)});${anchor}`);
 before('binding-preflight',"report.servedBefore=await binding('before');",'binding-and-port-preflight');
 before('receiver-create','bridge=createBridge(port,udpPort,{nativeClock:true});','receiver-create');
 before('receiver-ready','assert.equal(await bounded(bridge.start(),7000),port);','receiver-readiness');
 before('browser-launch','const launch=chromium.launchServer','browser-launch');
 once('chrome-immediate-identity','}).then(s=>{if(closing){s.process().kill',"}).then(s=>{__chrome(s);if(closing){s.process().kill");
 before('page-navigation','await page.goto(app);','page-navigation');
 before('page-ready','await page.waitForFunction(()=>(window as any).__bongo);','page-readiness');
 before('f07-load',"await page.locator('#fixture').selectOption('F07');",'F07-load');
 before('fixtures-retain','const f07=validateScene','fixture-readback');
 before('bridge-connect',"await page.locator('summary').click();",'bridge-connect');
 before('bridge-sync','await page.waitForFunction(()=>(window as any).__bongo.output.clockSynchronization.length===8);','bridge-sync');
 before('initial-probes','const independent:Probe[]=report.independentClockProbes=[]','initial-independent-probes');
 before('cardinals','const cardinal:Record<string,Vec3>=','cardinal-assertions');
 before('camera-before','const cameraBefore=await page.evaluate','camera-before-readback');
 before('camera-gesture','await page.mouse.move(start.x,start.y);','camera-gesture');
 before('camera-after','const cameraAfter=await page.evaluate','camera-after-readback-and-assertions');
 once('fps-stage','for(const fps of [60,15,2]){',"for(const fps of [60,15,2]){__mark('movement-'+fps+'FPS');");
 before('fps-pre-probe','const beforeProbe=await probe(page);','movement-before-probe');
 before('fps-schedule','const edits:Edit[]=await page.evaluate','movement-schedule');
 before('fps-post-probe','const afterProbe=await probe(page);','movement-after-probe');
 before('fps-assert','const native=(await sends(page)).slice(beforeCount)','movement-readback-and-assertions');
 before('burst','const burst=await page.evaluate','synchronous-valid-edit-burst');
 before('f01-start','const controlBeforeProbe=await probe(page);','F01-before-probe-and-start');
 before('f01-window','const windowEnd=await page.evaluate','F01-window-readback');
 before('f01-oracle','const events=windowEnd.events as EngineEvent[]','F01-oracle-and-assertions');
 before('f01-receipts','const receipts=bridge.records.filter','F01-receipt-readback-and-assertions');
 before('raw-match',"const positions=report.sends.filter((r:Send)=>r.packet.type==='position')",'raw-UDP-readback-and-assertions');
 before('sequences','const sequenceByEpoch=new Map','sequence-readback-and-assertions');
 once('cleanup-stage','finally{\n  closing=true;',"finally{\n  __mark('cleanup-start');closing=true;");
 before('cleanup-readback','if(ownedPage&&!ownedPage.isClosed())try{','cleanup-browser-readback');
 before('cleanup-browser','try{await bounded(browser?.close()??Promise.resolve(),3500,true);','cleanup-browser-close');
 before('cleanup-receiver','clearTimeout(watchdog);try{await bounded(bridge?.close()','cleanup-receiver-close');
 before('cleanup-bindings',"if(report.cleanup.watchdog){report.errors.push('Owned browser hard deadline exceeded');",'cleanup-binding-and-retention');
 once('terminal-ack',"console.log(JSON.stringify({status:report.status,errors:report.errors,cleanup:report.cleanup,out}));","console.log(JSON.stringify({status:report.status,errors:report.errors,cleanup:report.cleanup,out}));__flushOperations();__emit('terminal','child-terminal',{status:report.status,errors:report.errors,cleanup:report.cleanup,exitCode:process.exitCode??0});");
 // Operation entry identifies a synchronous hot path without changing stages.
 for(const anchor of ['function clock(output:any,probes:Probe[]){','function arc(a:Vec3,b:Vec3,f:number):Vec3{','function osc(hex:string){','function probeAges(nodeTime:number,probes:Probe[]){','async function probe(page:Page):Promise<Probe>{','async function sends(page:Page):Promise<Send[]>{'])once(`operation-${anchor}`,anchor,anchor+`__operation(${JSON.stringify(anchor.split('(')[0])});`);
 return{original,source,instrumentation,patches,originalSha256:sha(original),copySha256:sha(source)};
}
function parseInventory(text:string):Proc[]{return text.split('\n').filter(s=>s.trim()).map(line=>{const m=/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(line);assert(m,'Malformed process inventory');return{pid:Number(m[1]),ppid:Number(m[2]),pgid:Number(m[3]),state:m[4],command:m[5]};});}
async function main(){
 const args=process.argv.slice(2);assert(args.every(a=>['--check','--run','--sample-on-stall'].includes(a)));assert(args.includes('--check')!==args.includes('--run'),'Choose --check or separately authorized --run');assert(!args.includes('--sample-on-stall')||args.includes('--run'));
 const root=process.cwd(),copy=prepare(root),stamp=args.includes('--check')?'source-controls-01':'attempt-01';
 const out=path.resolve(process.env.BONGO_POSITION_CONTAINED_OUT??`evidence/step-09/receiver-position-containment/${stamp}`);assert(!fs.existsSync(out),'Exclusive output only');fs.mkdirSync(out,{recursive:true});for(const name of ['parent','child'])fs.mkdirSync(path.join(out,name));
 const childPath=path.join(out,'child/audit.ts'),save=(name:string,value:unknown)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.writeFileSync(path.join(out,'child/original.ts'),copy.original,{flag:'wx'});fs.writeFileSync(childPath,copy.source,{flag:'wx'});save('parent/source-binding.json',{parentSourceSha256:sha(fs.readFileSync(import.meta.filename)),original:ORIGINAL,originalSha256:copy.originalSha256,copySha256:copy.copySha256,patches:copy.patches,limits:LIMITS,instrumentedDiagnosticNotQualification:true});
 if(args.includes('--check')){
  const cases:string[]=[],inc='pure-control-incarnation';let order:Ordering={sequence:0,count:0,bytes:0};
  const wire:Wire={incarnation:inc,sequence:1,kind:'phase',childTime:1,stage:'probe',operation:'structural-stage',progress:true};validateWire(wire,inc,order);assert.throws(()=>validateWire(wire,inc,order));cases.push('Strict ordered IPC rejects duplicate');assert.throws(()=>validateWire({...wire,sequence:3},inc,order));cases.push('IPC rejects gaps');assert.throws(()=>validateWire({...wire,sequence:2,incarnation:'foreign'},inc,order));cases.push('IPC rejects foreign incarnation');assert.throws(()=>validateWire({...wire,sequence:2,detail:'x'.repeat(LIMITS.messageBytes)},inc,order));cases.push('IPC rejects oversized message');assert.throws(()=>validChrome({pid:12,profile:'/tmp/ambient',executable:CHROME}));cases.push('Malformed profile never authorizes Chrome');
  const id:Identity={childPid:10,childPath:'/private/audit.ts',incarnation:inc,chromePid:12,profile:'/tmp/playwright_chromiumdev_profile-own'};const p:Proc={pid:10,ppid:1,pgid:10,state:'R',command:`${process.execPath} --import loader /private/audit.ts --run --containment-incarnation=${inc}`};assert.equal(classification(p,id,'node'),'owned-live');assert.equal(classification({...p,command:'ambient-process'},id,'node'),'identity-mismatch');assert.equal(classification({...p,state:'Z',command:'<defunct>'},id,'node'),'defunct-observed');assert.equal(classification(undefined,id,'node'),'absent');cases.push('Owned/live versus reused/defunct/absent decisions');assert.equal(deadlineAction(109999,110000,125000),'continue-acquisition');assert.equal(deadlineAction(110000,110000,125000),'terminate-acquisition');assert.equal(deadlineAction(125000,110000,125000),'cleanup-budget-exhausted');cases.push('Absolute deadline transitions never renew');assert.equal(outcome({forced:true,errors:0,terminal:true,exit:0,closed:true}),'failed-or-incomplete');assert.equal(outcome({forced:false,errors:0,terminal:false,exit:0,closed:true}),'failed-or-incomplete');assert.equal(outcome({forced:false,errors:0,terminal:true,exit:0,closed:false}),'failed-or-incomplete');cases.push('Forced or missing terminal/closure cannot pass');
  assert.equal(progressTime(0,{...wire,operation:'assert:call',progress:false},16000),0);assert.equal(progressTime(0,wire,16000),16000);cases.push('Noisy assertions cannot mask structural-stage silence');assert(copy.source.includes('const __pending=new Map'));assert(copy.source.includes("__operation('assert:'+String(key))"));assert(copy.source.includes('progress,detail'));assert.equal(sha(fs.readFileSync(path.join(root,ORIGINAL))),ORIGINAL_SHA);
  const handleCalls:string[]=[],mockStream={destroyed:false,destroy(){handleCalls.push('destroy');}};const fake={pid:123,connected:true,stdin:null,stdout:mockStream,stderr:{...mockStream},disconnect(){handleCalls.push('disconnect');},unref(){handleCalls.push('unref');},kill(){throw Error('Pure control must never signal');}} as unknown as ChildProcess;
  const released=releaseParentHandles(fake);assert.deepEqual(handleCalls,['disconnect','destroy','destroy','unref']);assert.equal(released.errors.length,0);assert.equal(outcome({forced:false,errors:0,terminal:true,exit:0,closed:false}),'failed-or-incomplete');cases.push('Parent handle release sends no signal and cannot establish process closure');handleCalls.length=0;const broken={...fake,disconnect(){throw Error('mock IPC release error');}} as unknown as ChildProcess;assert.equal(releaseParentHandles(broken).errors.length,1);assert.deepEqual(handleCalls,['destroy','destroy','unref']);cases.push('Parent handle cleanup continues after individual release errors');
  const terminal={status:'passed-scoped-checks-with-conditional-clock-model',exitCode:0,errors:[],cleanup:{browserClosed:true,browserProcessClosed:true,bridgeCloseAcknowledged:true,serverClosed:true}};assert(cleanTerminal(terminal));assert(!cleanTerminal({...terminal,errors:undefined}));assert(!cleanTerminal({...terminal,errors:{length:0}}));assert(!cleanTerminal({...terminal,cleanup:{...terminal.cleanup,browserClosed:'true'}}));cases.push('Malformed terminal errors and truthy nonboolean closure cannot pass');
  const captured:Wire[]=[],context=vm.createContext({nativeAssert:assert,performance:{now:()=>0},Buffer,process:{env:{BONGO_POSITION_CONTAINMENT_INCARNATION:inc},on(){},send(message:Wire,callback:(error?:Error)=>void){captured.push(message);callback();},stderr:{write(){}},exitCode:0}});
  const embedded=ts.transpileModule(copy.instrumentation,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.None}}).outputText;vm.runInContext(embedded,context,{timeout:1000});
  vm.runInContext("for(let row=0;row<1000;row++)for(let op=0;op<21;op++)assert.equal(1,1);",context,{timeout:1000});assert.equal(captured.length,2);assert.equal(captured[1].operation,'first-operation');vm.runInContext("__mark('next-stage');",context,{timeout:1000});assert.equal(captured.length,4);const aggregate=captured[2].detail as any;assert.equal(aggregate.count,21000);assert.equal(aggregate.counts['assert:equal'],21000);assert.equal(aggregate.lastOperation,'assert:equal');assert(captured.every(w=>Buffer.byteLength(JSON.stringify(w))<LIMITS.messageBytes));cases.push('1000-row normal synchronous analysis retains four IPC rows with exact counters and no ACK/yield');assert.throws(()=>vm.runInContext("for(let i=0;i<1100;i++)__mark('overflow-stage');",context,{timeout:1000}),/capacity exceeded/);cases.push('Real embedded instrumentation still rejects unacknowledged IPC overflow');save('parent/source-check.json',{status:'passed-source-controls-only',cases,actualChildBrowserServiceSampleRuns:0,sourceSha256:sha(fs.readFileSync(import.meta.filename)),copySha256:copy.copySha256});console.log(JSON.stringify({status:'source-controls-only',cases:cases.length,out,copySha256:copy.copySha256}));return;
 }
 const incarnation=randomUUID(),began=performance.now(),acquireEnd=began+LIMITS.acquireMs,outerEnd=acquireEnd+LIMITS.cleanupMs;
 const report:any={status:'acquiring',startedUtc:new Date().toISOString(),source:{parent:sha(fs.readFileSync(import.meta.filename)),original:ORIGINAL_SHA,copy:copy.copySha256},limits:LIMITS,incarnation,errors:[],forced:false,commands:[],signals:[],cleanup:{},lastStructuralStage:'fork',lastStructuralTime:began,timingLimitation:'Independent of child loop; parent deadlines remain cooperative and subject to host scheduling.',qualification:'not run: instrumented containment/cause diagnostic only'};
 let child:ChildProcess|undefined,id:Identity|undefined,lastProgress=began,terminal:Wire|undefined,exitCode:number|null=null,exitSignal:string|null=null,sample:ChildProcess|undefined,sampleEnd=0,sampleDone=false,sampleExited=false,sampleTried=false,order:Ordering={sequence:0,count:0,bytes:0},childExited=false,childStdout=0,childStderr=0,phaseRetainedBytes=0;
 const ownedParentProcesses=new Set<ChildProcess>(),ownedSampleFiles=new Set<number>();
 const saveReport=()=>fs.writeFileSync(path.join(out,'parent/report.json'),JSON.stringify(report,null,2)+'\n');
 const phaseFile=path.join(out,'parent/phases.jsonl');fs.writeFileSync(phaseFile,'',{flag:'wx'});
 function error(reason:string){if(report.errors.length<64)report.errors.push(reason);}
 async function command(file:string,argv:string[],end=outerEnd,cap=LIMITS.commandBytes,redact?:(text:string)=>string){
  const remaining=Math.min(LIMITS.commandMs,end-performance.now());if(remaining<=0)throw Error('No remaining inspection budget');const started=performance.now(),p=spawn(file,argv,{stdio:['ignore','pipe','pipe']});ownedParentProcesses.add(p);let stdout='',stderr='',overflow=false,timeout=false,exited=false;const entry:any={file,argv,pid:p.pid,startNodeMs:started,absoluteEnd:started+remaining};report.commands.push(entry);
  const read=(chunk:Buffer,which:'stdout'|'stderr')=>{const prior=which==='stdout'?stdout:stderr;if(Buffer.byteLength(prior)+chunk.length>cap){overflow=true;if(!exited)p.kill('SIGKILL');}else if(which==='stdout')stdout+=chunk.toString();else stderr+=chunk.toString();};p.stdout.on('data',c=>read(c,'stdout'));p.stderr.on('data',c=>read(c,'stderr'));
  let timer:ReturnType<typeof setTimeout>|undefined,closed=false;await new Promise<void>(resolve=>{p.once('error',e=>{stderr+=String(e);resolve();});p.once('exit',(code,signal)=>{exited=true;entry.code=code;entry.signal=signal;});p.once('close',()=>{closed=true;resolve();});timer=setTimeout(()=>{timeout=true;if(!exited)p.kill('SIGKILL');resolve();},remaining);});clearTimeout(timer);if(!closed&&performance.now()<end)await new Promise<void>(resolve=>{const wait=setTimeout(resolve,Math.max(1,Math.min(250,end-performance.now())));p.once('close',()=>{clearTimeout(wait);resolve();});});entry.stdout=redact?redact(stdout):stdout;entry.stderr=stderr;entry.exited=exited;entry.closed=closed;entry.timeout=timeout;entry.overflow=overflow;entry.finishNodeMs=performance.now();if(!closed||!exited||timeout||overflow){entry.parentHandleReleasePlanned=true;try{saveReport();}finally{entry.parentHandleRelease=releaseParentHandles(p);}saveReport();throw Error('Bounded inspection incomplete');}return{...entry,stdout};
 }
 async function inventory(end=outerEnd){const redactor=(text:string)=>{try{return parseInventory(text).filter(p=>id&&(p.pgid===id.childPid||isNode(p,id)||isChrome(p,id)||isHelper(p,id))).map(p=>JSON.stringify(p)).join('\n');}catch{return'Incomplete inventory; ambient process text discarded';}};const c=await command('/bin/ps',['-axo','pid=,ppid=,pgid=,stat=,command='],end,LIMITS.commandBytes,redactor);assert.equal(c.code,0);return parseInventory(c.stdout);}
 function signal(pid:number,kind:NodeJS.Signals,identity:Proc){try{process.kill(pid,kind);report.signals.push({pid,kind,identity,timeNodeMs:performance.now(),issued:true});}catch(e){report.signals.push({pid,kind,identity,timeNodeMs:performance.now(),issued:false,error:String(e)});error('Owned signal failed: '+String(e));}}
 async function terminateOwned(kind:NodeJS.Signals){assert(id);const rows=await inventory(),node=rows.find(p=>p.pid===id!.childPid),chrome=rows.find(p=>p.pid===id!.chromePid),group=rows.filter(p=>p.pgid===id!.childPid&&!p.state.includes('Z'));const nodeState=classification(node,id,'node'),chromeState=classification(chrome,id,'chrome');report.cleanup.lastIdentityStates={node:nodeState,chrome:chromeState};
  if(group.length&&group.every(p=>isNode(p,id!)||isChrome(p,id!)||isHelper(p,id!))){if(nodeState==='owned-live')signal(-id.childPid,kind,node!);}else if(group.length){error('Unknown owned-group member; group signal refused');if(nodeState==='owned-live')signal(id.childPid,kind,node!);}
  if(chromeState==='owned-live')signal(chrome!.pid,kind,chrome!);else if(chromeState==='identity-mismatch')error('Chrome identity mismatch; signal refused');if(nodeState==='identity-mismatch')error('Child PID reused/mismatched; signal refused');
  for(const p of rows)if(isHelper(p,id)&&!p.state.includes('Z'))signal(p.pid,kind,p);
 }
 async function wait(ms:number){const remaining=Math.max(0,Math.min(ms,outerEnd-performance.now()));if(remaining)await new Promise(r=>setTimeout(r,remaining));}
 async function stopSample(){if(!sample||sampleDone)return;if(!sampleExited)sample.kill('SIGTERM');await wait(250);if(!sampleDone&&!sampleExited)sample.kill('SIGKILL');await wait(300);if(!sampleDone)error('Owned sample exit unconfirmed');}
 async function maybeSample(){
  if(!args.includes('--sample-on-stall')||sampleTried||performance.now()-lastProgress<LIMITS.stallMs)return;sampleTried=true;const now=performance.now();report.sample={decisionNodeMs:now,stage:report.lastStructuralStage,stageSilenceMs:now-lastProgress};if(acquireEnd-now<3100){report.sample.skipped='Insufficient remaining acquisition budget';return;}
  assert(id);const rows=await inventory(acquireEnd),p=rows.find(p=>p.pid===id!.childPid);if(!p||classification(p,id,'node')!=='owned-live'){report.sample.skipped='Exact child identity unavailable';error('Sample identity check failed');return;}if(acquireEnd-performance.now()<3100){report.sample.skipped='Budget exhausted during identity check';return;}
  report.sample.identity=p;report.sample.command=['/usr/bin/sample',String(id.childPid),'1','1','-file','/dev/stdout'];report.sample.startedNodeMs=performance.now();sampleEnd=report.sample.startedNodeMs+LIMITS.sampleMs;sample=spawn('/usr/bin/sample',report.sample.command.slice(1),{stdio:['ignore','pipe','pipe']});ownedParentProcesses.add(sample);sample.on('error',e=>error('Sample launch/runtime: '+String(e)));sample.once('exit',(code,signal)=>{sampleExited=true;report.sample.processExit={code,signal,timeNodeMs:performance.now()};});report.sample.pid=sample.pid;let retained=0,seen=0;const stdoutFd=fs.openSync(path.join(out,'parent/sample.stdout.txt'),'wx');ownedSampleFiles.add(stdoutFd);const stderrFd=fs.openSync(path.join(out,'parent/sample.stderr.txt'),'wx');ownedSampleFiles.add(stderrFd);
  const read=(c:Buffer,fd:number)=>{try{seen+=c.length;const n=Math.min(c.length,LIMITS.sampleBytes-retained);if(n>0){fs.writeSync(fd,c.subarray(0,n));retained+=n;}report.sample.seenBytes=seen;report.sample.retainedBytes=retained;if(seen>LIMITS.sampleBytes){report.sample.truncated=true;error('Sample5MiB cap exceeded');if(!sampleExited)sample?.kill('SIGKILL');}}catch(e){error('Sample output retention: '+String(e));}};sample.stdout!.on('data',c=>read(c,stdoutFd));sample.stderr!.on('data',c=>read(c,stderrFd));sample.once('close',(code,signal)=>{sampleDone=true;for(const fd of [stdoutFd,stderrFd])try{fs.closeSync(fd);ownedSampleFiles.delete(fd);}catch(e){error('Sample file close: '+String(e));}report.sample.exitCode=code;report.sample.exitSignal=signal;report.sample.closedNodeMs=performance.now();if(code!==0)error('Sample failed/nonzero');});
 }
 try{
  child=fork(childPath,['--run',`--containment-incarnation=${incarnation}`],{cwd:root,detached:true,execArgv:['--import',pathToFileURL(path.join(root,'node_modules/tsx/dist/loader.mjs')).href],env:{...process.env,BONGO_POSITION_AUDIT_OUT:path.join(out,'child/results'),BONGO_POSITION_CONTAINMENT_INCARNATION:incarnation},stdio:['ignore','pipe','pipe','ipc']});ownedParentProcesses.add(child);child.on('error',e=>error('Child launch/runtime error: '+String(e)));assert(child.pid);id={childPid:child.pid,childPath,incarnation};report.childIdentity=id;saveReport();
  const output=(chunk:Buffer,kind:'stdout'|'stderr')=>{try{const prior=kind==='stdout'?childStdout:childStderr;if(prior+chunk.length>LIMITS.commandBytes){error('Child output1MiB cap exceeded');return;}fs.appendFileSync(path.join(out,`parent/child.${kind}.txt`),chunk);if(kind==='stdout')childStdout+=chunk.length;else childStderr+=chunk.length;}catch(e){error('Child output retention: '+String(e));}};child.stdout!.on('data',c=>output(c,'stdout'));child.stderr!.on('data',c=>output(c,'stderr'));
  child.on('message',value=>{try{const w=validateWire(value,incarnation,order),line=JSON.stringify({parentNodeMs:performance.now(),...w})+'\n';phaseRetainedBytes+=Buffer.byteLength(line);assert(phaseRetainedBytes<=LIMITS.ipcBytes);fs.appendFileSync(phaseFile,line);report.lastPhase=w;lastProgress=progressTime(lastProgress,w,performance.now());if(w.progress){report.lastStructuralStage=w.stage;report.lastStructuralTime=lastProgress;}if(w.kind==='chrome'){const c=validChrome(w.detail);assert(id&&!id.chromePid,'Single owned Chrome identity');id.chromePid=c.pid;id.profile=c.profile;report.chromeIdentity=c;}if(w.kind==='terminal'){assert(!terminal);terminal=w;report.terminal=w;}child!.send({kind:'ack',incarnation,sequence:w.sequence},e=>{if(e)error('Phase acknowledgment failed: '+String(e));});}catch(e){error('IPC protocol: '+String(e));}});
  child.once('exit',(code,signal)=>{childExited=true;exitCode=code;exitSignal=signal;report.childExit={code,signal,timeNodeMs:performance.now()};});
  while(!childExited&&!report.errors.length&&deadlineAction(performance.now(),acquireEnd,outerEnd)==='continue-acquisition'){
   await maybeSample();if(sample&&!sampleDone&&performance.now()>=sampleEnd){report.sample.timedOut=true;error('Sample absolute3s deadline exceeded');await stopSample();}await new Promise(r=>setTimeout(r,100));
  }
  if(!childExited&&performance.now()>=acquireEnd)error('External110s acquisition target reached');if(!terminal&&childExited)error('Child exited without validated terminal acknowledgment');if(exitCode!==0&&childExited)error('Child exited nonzero');
 }catch(e){error(String(e));}
 finally{
  const owned=id;await stopSample();if(child){try{const rows=await inventory(),live=owned?rows.filter(p=>(p.pgid===owned.childPid||isChrome(p,owned)||isHelper(p,owned))&&!p.state.includes('Z')):[];if(live.length||!childExited){report.forced=true;await terminateOwned('SIGTERM');await wait(1500);const remaining=await inventory();if(owned&&remaining.some(p=>(p.pgid===owned.childPid||isChrome(p,owned)||isHelper(p,owned))&&!p.state.includes('Z'))){await terminateOwned('SIGKILL');await wait(1000);}}}catch(e){error('Forced cleanup: '+String(e));}}
  try{const rows=await inventory(),members=owned?rows.filter(p=>p.pgid===owned.childPid||isChrome(p,owned)||isHelper(p,owned)):[];report.cleanup.observedMembers=members;report.cleanup.ownedProcessesClosed=members.every(p=>p.state.includes('Z'));report.cleanup.defunctObserved=members.filter(p=>p.state.includes('Z'));if(!report.cleanup.ownedProcessesClosed)error('Observed owned processes remain');}catch(e){error('Final process inspection: '+String(e));report.cleanup.ownedProcessesClosed=false;}
  try{for(const [name,argv]of [['tcp5424',['-nP','-iTCP:5424','-sTCP:LISTEN']],['udp5425',['-nP','-iUDP:5425']]] as const){const c=await command('/usr/sbin/lsof',[...argv]);report.cleanup[name]={code:c.code,stdout:c.stdout,stderr:c.stderr};assert(c.code===1&&c.stdout===''&&c.stderr==='',`Socket closure unconfirmed:${name}`);}report.cleanup.socketsClosed=true;}catch(e){error('Socket inspection: '+String(e));report.cleanup.socketsClosed=false;}
  report.cleanup.unobservedDetachedHelpers='not claimed absent';report.cleanup.childExitObserved=childExited;report.cleanup.chromeOwnershipAvailable=!!id?.chromePid&&!!id.profile;if(!report.cleanup.chromeOwnershipAvailable)error('Chrome ownership/closure unavailable');report.cleanup.nativeWorkerGracefulClose='only child terminal report can establish; forced cleanup does not';if(!terminal)error('Missing terminal acknowledgment');const terminalDetail:any=terminal?.detail;if(!cleanTerminal(terminalDetail))error('Child terminal status/close acknowledgments are not clean');
  report.status=outcome({forced:report.forced,errors:report.errors.length,terminal:!!terminal,exit:exitCode,closed:report.cleanup.ownedProcessesClosed&&report.cleanup.socketsClosed&&childExited});report.finishedUtc=new Date().toISOString();report.elapsedNodeMs=performance.now()-began;report.deadlineOverrunMs=Math.max(0,performance.now()-outerEnd);report.phaseCounts=order;report.childExitSignal=exitSignal;report.parentHandleReleasePlanned=ownedParentProcesses.size;
  // Preserve known failure/unknown process closure before releasing the parent's live references.
  try{saveReport();}finally{report.parentHandleReleases=[...ownedParentProcesses].map(releaseParentHandles);report.parentSampleFileReleases=[];for(const fd of ownedSampleFiles){try{fs.closeSync(fd);report.parentSampleFileReleases.push({fd,closed:true});}catch(e){error('Final sample file close: '+String(e));report.parentSampleFileReleases.push({fd,closed:false,error:String(e)});}}ownedSampleFiles.clear();}
  if(report.parentHandleReleases.some((r:{errors:string[]})=>r.errors.length)){error('Parent handle release incomplete');report.status='failed-or-incomplete';}
  saveReport();save('parent/completion.json',{status:report.status,errors:report.errors,forced:report.forced,cleanup:report.cleanup,parentHandleReleases:report.parentHandleReleases});assert.equal(sha(fs.readFileSync(path.join(root,ORIGINAL))),ORIGINAL_SHA,'Original audit changed');if(report.status!=='completed-diagnostic-not-qualification')process.exitCode=1;console.log(JSON.stringify({status:report.status,errors:report.errors,cleanup:report.cleanup,out}));
 }
}
void main();
