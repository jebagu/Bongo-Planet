import {describe,it,expect} from 'vitest';
import {WebSocket} from 'ws';
import {createBridge} from '../src/output/bridge';
import {encodeOSC,decodeOSC,objectId,packetSchema} from '../src/output/protocol';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
it('oversized producer frames release the session without an unhandled socket error',async()=>{
 const b=createBridge(0,0),port=await b.start();
 const ws=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});
 ws.on('error',()=>{});
 try{
  await new Promise<void>(r=>ws.once('open',r));
  ws.send(JSON.stringify({version:1,type:'start',session:'oversized',sequence:0}));
  for(let attempt=0;attempt<50&&b.state().session!=='oversized';attempt++)await wait(10);
  expect(b.state().session).toBe('oversized');
  const closed=new Promise<number>(r=>ws.once('close',code=>r(code)));
  ws.send('x'.repeat(128*1024+1));
  expect(await closed).toBe(1009);
  expect(b.state().session).toBe('');
  expect(b.state().pending).toBe(0);
  expect(b.records.some(e=>e.type==='socket-error')).toBe(true);
  expect(b.records.some(e=>e.reason==='producer transport error')).toBe(true);
 }finally{ws.terminate();await b.close();}
},3000);
describe('raw protocol and actual local receiver',()=>{
 it('cardinal probes decode actual OSC float bytes, strict schemas reject nonfinite/malformed',()=>{for(const v of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])expect(decodeOSC(encodeOSC(42,v))).toMatchObject({objectId:42,address:'/adm/obj/42/xyz',position:v});expect(()=>decodeOSC(Buffer.from('bad'))).toThrow();expect(objectId('stable')).toBe(objectId('stable'));const position={version:1,type:'position',session:'s',sequence:1,nodeId:'n',objectId:1,position:[1,0,0],sent:0};expect(packetSchema.parse(position)).toEqual(position);expect(()=>packetSchema.parse({...position,position:[NaN,0,0]})).toThrow();expect(()=>packetSchema.parse({...position,version:2})).toThrow();expect(()=>packetSchema.parse({...position,credentials:'forbidden'})).toThrow();});
 it('real WebSocket→UDP→decoded receiver, duplicate/cancel/disconnect/watchdog',async()=>{const b=createBridge(0,0);const port=await b.start();const ws=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});await new Promise<void>(r=>ws.once('open',r));const send=(p:unknown)=>ws.send(JSON.stringify({version:1,...p as Record<string,unknown>}));send({type:'start',session:'s',sequence:0});send({type:'position',session:'s',sequence:1,nodeId:'n',objectId:42,position:[1,0,0],sent:performance.now()/1000});await wait(20);expect(b.raw[0]).toMatchObject({address:'/adm/obj/42/xyz',position:[1,0,0]});const p={type:'trigger',session:'s',sequence:1,id:'s1-1',triggerSequence:1,objectId:42,nodeId:'n',generatorId:'g',onset:performance.now()/1000+.05,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}};send(p);send(p);await wait(100);expect(b.records.filter(e=>e.type==='onset'&&e.id==='s1-1')).toHaveLength(1);const onset=b.records.find(e=>e.type==='onset')!;expect(Math.abs(Number(onset.errorMs))).toBeLessThan(20);expect(b.state().drops).toBe(1);send({...p,sequence:2,triggerSequence:2,id:'s1-2',onset:performance.now()/1000+.1});send({type:'cancel',session:'s',sequence:3,ids:['s1-2'],nodeIds:['n']});await wait(150);expect(b.state().pending).toBe(0);expect(b.state().activeVoices).toBe(0);expect(b.records.some(e=>e.type==='onset'&&e.id==='s1-2')).toBe(false);await wait(300);expect(b.state().session).toBe('');expect(b.records.some(e=>e.reason==='watchdog timeout')).toBe(true);ws.close();await wait(20);await b.close();},3000);
});
it('strict sound messages and colliding valid node names are resolved without changing active IDs',async()=>{const {ObjectMapping}=await import('../src/output/protocol');const a='n-5z56us-1yqnk3',b='n-1cu46m-1pvjh2t';expect(objectId(a)).toBe(objectId(b));const map=new ObjectMapping();map.setNodes([a,b],true);expect(map.get(a)).not.toBe(map.get(b));const before=map.get(a);map.setNodes([a,b,'third']);expect(map.get(a)).toBe(before);const base={version:1,type:'trigger',session:'s',sequence:1,triggerSequence:1,id:'s1-1',nodeId:'n',generatorId:'g',objectId:1,onset:0};for(const sound of [{kind:'note',duration:1,level:.5},{kind:'note',frequency:-1,timbre:'sine',duration:1,level:.5},{kind:'beat',frequency:440,duration:8,level:.5}])expect(()=>packetSchema.parse({...base,sound})).toThrow();});
it('cancel IDs release already active receiver voices and cancelled trigger sequences cannot replay',async()=>{const b=createBridge(0,0),port=await b.start(),ws=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417'});await new Promise<void>(r=>ws.once('open',r));const send=(p:unknown)=>ws.send(JSON.stringify({version:1,...p as Record<string,unknown>}));send({type:'start',session:'s',sequence:0});send({type:'position',session:'s',sequence:1,nodeId:'n',objectId:42,position:[1,0,0],sent:performance.now()/1000});const trigger={type:'trigger',session:'s',sequence:1,triggerSequence:1,id:'s1-1',objectId:42,nodeId:'n',generatorId:'g',onset:performance.now()/1000+.025,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}};send(trigger);await wait(60);expect(b.state().activeVoices).toBe(1);send({type:'cancel',session:'s',sequence:2,ids:['s1-1'],nodeIds:[]});await wait(20);expect(b.state().activeVoices).toBe(0);send({...trigger,sequence:3,onset:performance.now()/1000+.025});await wait(60);expect(b.records.filter(e=>e.type==='onset'&&e.id==='s1-1')).toHaveLength(1);expect(b.state().drops).toBe(1);ws.close();await wait(10);await b.close();});
