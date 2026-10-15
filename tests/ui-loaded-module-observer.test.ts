import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {LoadedModuleObserver,MODULE_LIMITS} from '../scripts/loaded-module-observer';
const main='http://127.0.0.1:5417/BongoPlanet/assets/index-test.js',processor='http://127.0.0.1:5417/BongoPlanet/assets/processor-test.js';
const mainBytes=Buffer.from('export const a="☃";','utf8'),processorBytes=Buffer.from([0x61,0x62,0x63,0x0a]);
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const expected={[main]:hash(mainBytes),[processor]:hash(processorBytes)};
function request(o:LoadedModuleObserver,id:string,url:string){o.receive('requestWillBeSent',{requestId:id,request:{url,method:'GET'},frameId:'',loaderId:''},1);}
function response(o:LoadedModuleObserver,id:string,url:string){o.receive('responseReceived',{requestId:id,response:{url,status:200}},2);}
function complete(o:LoadedModuleObserver,id:string,url:string){request(o,id,url);response(o,id,url);o.receive('loadingFinished',{requestId:id,encodedDataLength:4},3);}
const reader=async(id:string)=>({body:id==='m'?mainBytes.toString('utf8'):processorBytes.toString('base64'),base64Encoded:id!=='m'});
describe('original loaded module joins and bounded body ownership',()=>{
  it('retains exact independently specified UTF8/base64 bytes and original unframed IDs',async()=>{
    const ids:string[]=[],o=new LoadedModuleObserver(expected,async id=>{ids.push(id);return reader(id);});complete(o,'m',main);complete(o,'p',processor);await o.finish(100);
    expect(ids).toEqual(['m','p']);expect(o.bodies.map(body=>body.bytes)).toEqual([mainBytes,processorBytes]);
    expect(o.snapshot.joins.map(row=>[row.requestIndex,row.responseIndex,row.finishedIndex])).toEqual([[0,1,2],[3,4,5]]);expect(o.snapshot.pendingBodies).toBe(0);
  });
  it('rejects a response without the original request rather than substituting a fetch',()=>{const o=new LoadedModuleObserver(expected,reader);expect(()=>response(o,'p',processor)).toThrow('no original request');});
  it.each(['request','response','finish'] as const)('rejects duplicate%s ownership',kind=>{const o=new LoadedModuleObserver(expected,reader);request(o,'m',main);if(kind==='request')expect(()=>request(o,'other',main)).toThrow('Duplicate');else{response(o,'m',main);if(kind==='response')expect(()=>response(o,'m',main)).toThrow('duplicate');else{o.receive('loadingFinished',{requestId:'m'},3);expect(()=>o.receive('loadingFinished',{requestId:'m'},4)).toThrow('ordered response');}}});
  it('rejects a body reassigned from another module even with successful response status',async()=>{const o=new LoadedModuleObserver(expected,async()=>({body:processorBytes.toString('utf8'),base64Encoded:false}));complete(o,'m',main);await expect(o.finish(100)).rejects.toThrow('hash mismatch');});
  it('retains loading failure and prevents later certification',async()=>{const o=new LoadedModuleObserver(expected,reader);request(o,'p',processor);expect(()=>o.receive('loadingFailed',{requestId:'p',errorText:'failed'},3)).toThrow('request failed');await expect(o.finish(100)).rejects.toThrow('request failed');});
  it('rejects terminal ordering without a response',()=>{const o=new LoadedModuleObserver(expected,reader);request(o,'p',processor);expect(()=>o.receive('loadingFinished',{requestId:'p'},3)).toThrow('ordered response');});
  it('rejects a response URL belonging to a different admitted original ID',()=>{const o=new LoadedModuleObserver(expected,reader);request(o,'m',main);request(o,'p',processor);expect(()=>response(o,'m',processor)).toThrow('mismatched');});
  it.each(['Y!Jj','YR=='] as const)('rejects malformed/noncanonical base64 %s',async body=>{const o=new LoadedModuleObserver(expected,async()=>({body,base64Encoded:true}));complete(o,'p',processor);await expect(o.finish(100)).rejects.toThrow('base64');});
  it('enforces decoded byte caps before admitting an otherwise matching body',async()=>{const o=new LoadedModuleObserver(expected,async()=>({body:'abc\n',base64Encoded:false}),{...MODULE_LIMITS,bodyBytes:3});complete(o,'p',processor);await expect(o.finish(100)).rejects.toThrow('byte cap');});
  it('bounds task count without starting an excess reader',async()=>{let calls=0;const o=new LoadedModuleObserver(expected,async id=>{calls++;return reader(id);},{...MODULE_LIMITS,bodyTasks:1});complete(o,'m',main);request(o,'p',processor);response(o,'p',processor);expect(()=>o.receive('loadingFinished',{requestId:'p'},3)).toThrow('task cap');await expect(o.finish(100)).rejects.toThrow('task cap');expect(calls).toBe(1);});
  it('fails unresolved tasks rather than accepting partial captured bytes',async()=>{const o=new LoadedModuleObserver(expected,async()=>new Promise(()=>{}));complete(o,'m',main);await expect(o.finish(10)).rejects.toThrow('Unresolved');expect(o.snapshot.pendingBodies).toBe(1);});
  it('rejects missing processor despite a complete matching main',async()=>{const o=new LoadedModuleObserver(expected,reader);complete(o,'m',main);await expect(o.finish(100)).rejects.toThrow('Missing actual');});
  it('bounds event count and bytes, preserving the admitted prefix',()=>{const o=new LoadedModuleObserver(expected,reader,{...MODULE_LIMITS,events:1});request(o,'m',main);expect(()=>response(o,'m',main)).toThrow('event retention cap');expect(o.snapshot.events).toHaveLength(1);const small=new LoadedModuleObserver(expected,reader,{...MODULE_LIMITS,eventSize:8});expect(()=>request(small,'m',main)).toThrow('event retention cap');expect(small.snapshot.events).toHaveLength(0);});
});
