import {expect,it,vi} from 'vitest';
import {WebSocket} from 'ws';
import type {ReceiverClockCommand,ReceiverClockHooks,ReceiverOnset} from '../src/output/ReceiverClock';

const controlled=vi.hoisted(()=>({hooks:null as ReceiverClockHooks|null,commands:[] as ReceiverClockCommand[],closeError:null as Error|null,failPosition:false}));
vi.mock('../src/output/RenderClock',()=>({RenderClock:class{
 ready=true;diagnostics={};
 constructor(hooks:ReceiverClockHooks){controlled.hooks=hooks;controlled.commands=[];controlled.closeError=null;}
 invalidate(reason:string){this.ready=false;controlled.hooks!.failure(reason);}
 servePage(){return false;}acceptConnection(){return false;}
 async start(){}async close(){}send(command:ReceiverClockCommand){controlled.commands.push(command);}
}}));
vi.mock('../src/output/NativeClock',()=>({NativeClock:class{
 ready=true;diagnostics={};
 constructor(hooks:ReceiverClockHooks){controlled.hooks=hooks;controlled.commands=[];controlled.closeError=null;controlled.failPosition=false;}
 invalidate(reason:string){this.ready=false;controlled.hooks!.failure(reason);}
 servePage(){return false;}acceptConnection(){return false;}
 async start(){}async close(){if(controlled.closeError)throw controlled.closeError;}send(command:ReceiverClockCommand){controlled.commands.push(command);if(controlled.failPosition&&command.packet.type==='position'){this.ready=false;controlled.hooks!.failure('controlled synchronous IPC admission failure');}}
}}));
import {createBridge} from '../src/output/bridge';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

function nativeWitness(receipt:ReceiverOnset):ReceiverOnset{
 const before=process.hrtime.bigint(),performanceMs=performance.now(),after=process.hrtime.bigint(),perf=BigInt(Math.round(performanceMs*1e6));
 const lower=before-perf-1n,upper=after-perf+1n,offset=(lower+upper)/2n;
 const actual=BigInt(Math.round(receipt.actual*1e9))+offset;
 const {type,session,id,generatorId,nodeId,objectId,position,intended,errorMs,uncertaintyMs}=receipt;
 // This controlled seam places its synthetic bracket 10ms before execution.
 // It is not a live measurement or a deadline qualification.
 const pairPerformanceMs=(receipt.actual-.01)*1000,pairPerf=BigInt(Math.round(pairPerformanceMs*1e6));
 const pairBefore=pairPerf+offset-5n,pairAfter=pairPerf+offset+5n;
 return {type,session,id,generatorId,nodeId,objectId,position,intended,actual:Number(actual-offset)/1e9,errorMs,uncertaintyMs,
  clockDomain:'native-monotonic',workerIncarnation:'controlled-test-incarnation',fixedNodeHrOffsetNs:offset.toString(),
  intendedHrNs:(BigInt(Math.round(intended*1e9))+offset).toString(),actualHrNs:actual.toString(),
  mutationHrBeforeNs:(actual-10n).toString(),mutationHrAfterNs:actual.toString(),clockPairSequence:1,clockPairAgeMs:Number(actual-pairAfter)/1e6,
  nodeHrPair:{beforeHrNs:pairBefore.toString(),performanceMs:pairPerformanceMs,afterHrNs:pairAfter.toString(),offsetLowerNs:(offset-6n).toString(),offsetUpperNs:(offset+6n).toString(),widthNs:'12'}};
}

for(const domain of ['render','native'] as const)for(const action of ['cancel','stop','new-session'] as const)it(`${domain} retains an executed onset reported after ${action} without reviving its voice`,async()=>{
 const bridge=createBridge(0,0,domain==='native'?{nativeClock:true}:{renderClock:true}),port=await bridge.start();
 const socket=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});
 socket.on('error',()=>{});
 try{
  await new Promise<void>(resolve=>socket.once('open',resolve));
  const send=(packet:Record<string,unknown>)=>socket.send(JSON.stringify({version:1,...packet}));
  send({type:'start',session:'old',sequence:0});
  send({type:'position',session:'old',sequence:1,nodeId:'n',objectId:7,position:[1,0,0],sent:performance.now()/1000});
  const intended=performance.now()/1000+.3;
  send({type:'trigger',session:'old',sequence:1,triggerSequence:1,id:'old-1',nodeId:'n',generatorId:'g',objectId:7,onset:intended,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}});
  send({type:'trigger',session:'old',sequence:2,triggerSequence:2,id:'old-2',nodeId:'n',generatorId:'g',objectId:7,onset:intended+.1,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}});
  for(let i=0;i<50&&bridge.state().pending!==2;i++)await wait(5);
  expect(bridge.state().pending).toBe(2);
  await wait(Math.max(0,(intended-performance.now()/1000)*1000+5));
  if(action==='cancel')send({type:'cancel',session:'old',sequence:3,ids:['old-1','old-2'],nodeIds:[]});
  else send({type:'stop',session:'old',sequence:3,reason:'test stop'});
  for(let i=0;i<50&&bridge.state().pending;i++)await wait(5);
  expect(bridge.state().pending).toBe(0);
  const boundary=controlled.commands.at(-1)!.commandSequence;
  if(action==='new-session'){
   send({type:'start',session:'new',sequence:0});
   for(let i=0;i<50&&bridge.state().session!=='new';i++)await wait(5);
   expect(bridge.state().session).toBe('new');
  }
  // Controlled ordered clock seam: this execution happened before cancellation,
  // but its receipt reaches Node afterwards and before the applied boundary.
  const renderReceipt:ReceiverOnset={type:'onset',session:'old',id:'old-1',generatorId:'g',nodeId:'n',objectId:7,position:[1,0,0],intended,actual:intended+.002,errorMs:2,currentFrame:48000,currentTime:1,blockIndex:375,sampleOffset:3,callbackWallMs:Date.now(),uncertaintyMs:4};
  const receipt=domain==='native'?nativeWitness(renderReceipt):renderReceipt;
  controlled.hooks!.onset(receipt);
  expect(bridge.records.filter(row=>row.type==='onset')).toHaveLength(1);
  expect(bridge.records.find(row=>row.type==='onset')).toMatchObject({position:[1,0,0],reportAfterCancelOrStop:true});
  expect(bridge.state().activeVoices).toBe(0);
  controlled.hooks!.applied(boundary);
  controlled.hooks!.onset(receipt);
  // This second cancelled trigger had no execution receipt before the applied
  // boundary. Pruning must reject it independently of first-onset deduplication.
  controlled.hooks!.onset({...receipt,id:'old-2',intended:intended+.1,actual:intended+.102});
  expect(bridge.records.filter(row=>row.type==='onset')).toHaveLength(1);
  expect(bridge.state().activeVoices).toBe(0);
 }finally{socket.terminate();await bridge.close();}
});

it('keeps slash-containing session and trigger namespaces distinct for delayed receipts',async()=>{
 const bridge=createBridge(0,0,{renderClock:true}),port=await bridge.start();
 const socket=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});socket.on('error',()=>{});
 try{
  await new Promise<void>(resolve=>socket.once('open',resolve));
  const intended=performance.now()/1000+.3;
  const send=(packet:Record<string,unknown>)=>socket.send(JSON.stringify({version:1,...packet}));
  for(const [session,id] of [['a','b/c-1'],['a/b','c-1']]){
   send({type:'start',session,sequence:0});
   send({type:'position',session,sequence:1,nodeId:'n',objectId:7,position:[1,0,0],sent:performance.now()/1000});
   send({type:'trigger',session,sequence:1,triggerSequence:1,id,nodeId:'n',generatorId:'g',objectId:7,onset:intended,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}});
   for(let i=0;i<50&&bridge.state().pending!==1;i++)await wait(5);
   expect(bridge.state().pending).toBe(1);
   send({type:'stop',session,sequence:2,reason:'test stop'});
   for(let i=0;i<50&&bridge.state().pending;i++)await wait(5);
   expect(bridge.state().pending).toBe(0);
  }
  for(const [session,id]of [['a','b/c-1'],['a/b','c-1']])controlled.hooks!.onset({type:'onset',session,id,generatorId:'g',nodeId:'n',objectId:7,position:[1,0,0],intended,actual:intended+.002,errorMs:2,currentFrame:48000,currentTime:1,blockIndex:375,sampleOffset:3,callbackWallMs:Date.now(),uncertaintyMs:4});
  expect(bridge.records.filter(row=>row.type==='onset').map(row=>[row.session,row.id])).toEqual([['a','b/c-1'],['a/b','c-1']]);
  expect(bridge.state().activeVoices).toBe(0);
 }finally{socket.terminate();await bridge.close();}
});

for(const corruption of ['domain','integer','mutation','pair-width','understated-bound','intended-map','actual-map','error','position','forged-age','future-pair'] as const)it(`rejects ${corruption} corruption in a native execution witness and releases the session`,async()=>{
 const bridge=createBridge(0,0,{nativeClock:true}),port=await bridge.start();
 const socket=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});socket.on('error',()=>{});
 try{
  await new Promise<void>(resolve=>socket.once('open',resolve));
  const send=(packet:Record<string,unknown>)=>socket.send(JSON.stringify({version:1,...packet}));
  send({type:'start',session:'witness',sequence:0});
  send({type:'position',session:'witness',sequence:1,nodeId:'n',objectId:7,position:[1,0,0],sent:performance.now()/1000});
  const intended=performance.now()/1000+.3;
  send({type:'trigger',session:'witness',sequence:1,triggerSequence:1,id:'witness-1',nodeId:'n',generatorId:'g',objectId:7,onset:intended,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}});
  for(let i=0;i<50&&bridge.state().pending!==1;i++)await wait(5);
  expect(bridge.state().pending).toBe(1);
  const receipt=nativeWitness({type:'onset',session:'witness',id:'witness-1',generatorId:'g',nodeId:'n',objectId:7,position:[1,0,0],intended,actual:intended+.002,errorMs:2,currentFrame:1,currentTime:1,blockIndex:1,sampleOffset:1,callbackWallMs:Date.now(),uncertaintyMs:4});
  if(receipt.clockDomain!=='native-monotonic')throw Error('Controlled native seam was not constructed');
  if(corruption==='domain')controlled.hooks!.onset({...receipt,clockDomain:'render-frame'} as unknown as ReceiverOnset);
  else{
   if(corruption==='integer')receipt.actualHrNs='not-an-integer';
   if(corruption==='mutation')receipt.mutationHrAfterNs=(BigInt(receipt.actualHrNs)-1n).toString();
   if(corruption==='pair-width')receipt.nodeHrPair.widthNs=(BigInt(receipt.nodeHrPair.widthNs)+1n).toString();
   if(corruption==='understated-bound')receipt.uncertaintyMs=0;
   if(corruption==='intended-map')receipt.intendedHrNs=(BigInt(receipt.intendedHrNs)+2n).toString();
   if(corruption==='actual-map')receipt.actual+=.001;
   if(corruption==='error')receipt.errorMs=0;
   if(corruption==='position')receipt.position=[NaN,0,0];
   if(corruption==='forged-age')receipt.clockPairAgeMs+=1;
   if(corruption==='future-pair'){const shift=20000000n;receipt.nodeHrPair.beforeHrNs=(BigInt(receipt.nodeHrPair.beforeHrNs)+shift).toString();receipt.nodeHrPair.afterHrNs=(BigInt(receipt.nodeHrPair.afterHrNs)+shift).toString();receipt.nodeHrPair.performanceMs+=20;receipt.clockPairAgeMs=1;}
   controlled.hooks!.onset(receipt);
  }
  expect(bridge.state()).toMatchObject({session:'',pending:0,activeVoices:0,objects:[]});
  expect(bridge.records.filter(row=>row.type==='onset')).toEqual([]);
  expect(bridge.state().clock).toMatchObject({ready:false,clockEvidenceFailure:'receiver clock evidence invalid'});
  expect(bridge.records.find(row=>row.type==='stop'&&String(row.reason).includes('receiver clock evidence invalid'))).toBeTruthy();
  const reconnect=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});reconnect.on('error',()=>{});
  try{await new Promise<void>(resolve=>reconnect.once('open',resolve));reconnect.send(JSON.stringify({version:1,type:'start',session:'after-corruption',sequence:0}));await wait(20);expect(bridge.state().session).toBe('');expect(bridge.records.find(row=>row.type==='start'&&row.session==='after-corruption')).toBeUndefined();}finally{reconnect.terminate();}
 }finally{socket.terminate();await bridge.close();}
});

it('closes network resources even when native worker cleanup reports a failure',async()=>{
 const bridge=createBridge(0,0,{nativeClock:true});await bridge.start();
 controlled.closeError=Error('controlled missing worker close acknowledgement');
 await expect(bridge.close()).rejects.toThrow('controlled missing worker close acknowledgement');
 expect(bridge.server.address()).toBeNull();
});

it('does not emit position OSC after synchronous native command admission fails',async()=>{
 const bridge=createBridge(0,0,{nativeClock:true}),port=await bridge.start();
 const socket=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});socket.on('error',()=>{});
 try{
  await new Promise<void>(resolve=>socket.once('open',resolve));
  socket.send(JSON.stringify({version:1,type:'start',session:'admission',sequence:0}));
  for(let i=0;i<50&&bridge.state().session!=='admission';i++)await wait(5);
  expect(bridge.state().session).toBe('admission');controlled.failPosition=true;
  socket.send(JSON.stringify({version:1,type:'position',session:'admission',sequence:1,nodeId:'n',objectId:7,position:[1,0,0],sent:performance.now()/1000}));
  for(let i=0;i<50&&bridge.state().session;i++)await wait(5);
  await wait(30);
  expect(bridge.state()).toMatchObject({session:'',objects:[],pending:0,activeVoices:0,clock:{ready:false}});
  expect(bridge.records.filter(row=>row.type==='position')).toEqual([]);
  expect(bridge.raw).toEqual([]);
  expect(bridge.records.find(row=>row.type==='clock-error')).toMatchObject({reason:'controlled synchronous IPC admission failure'});
 }finally{socket.terminate();await bridge.close();}
});
