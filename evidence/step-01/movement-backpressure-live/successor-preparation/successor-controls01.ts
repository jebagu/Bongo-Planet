/** Pure source controls only: no child processes, timers, ports or browser. */
import assert from 'node:assert/strict';
import {admitSend,SEND_PHASE_CAPS,nativeLeaseAdmission,requireStage,requirePositionTriples,requireLatestSnapshot} from './successor-contract01';

const results:{name:string;passed:boolean}[]=[];
const check=(name:string,run:()=>void)=>{run();results.push({name,passed:true});};
const reject=(run:()=>void)=>assert.throws(run);
const counts=()=>({startup:0,pressure:0,tail:0,cleanup:0});
check('fixed phase ceilings total original16384',()=>assert.equal(Object.values(SEND_PHASE_CAPS).reduce((a,b)=>a+b,0),16384));
for(const phase of Object.keys(SEND_PHASE_CAPS) as (keyof typeof SEND_PHASE_CAPS)[]){
 check(`${phase} final legal send and first excess`,()=>{const c=counts();c[phase]=SEND_PHASE_CAPS[phase]-1;admitSend(c,phase);c[phase]++;reject(()=>admitSend(c,phase));});
}
check('global ceiling cannot be evaded by unused phase',()=>{const c={startup:1024,pressure:10240,tail:4096,cleanup:1024};reject(()=>admitSend(c,'startup'));});
check('malformed counts fail before admission',()=>{for(const n of [-1,.5,NaN,Infinity]){const c=counts();c.startup=n;reject(()=>admitSend(c,'pressure'));}});
check('unknown phase rejected',()=>reject(()=>admitSend(counts(),'unknown' as any)));
check('stage equality and nonfinite values reject',()=>{requireStage(99,100,'stage');for(const n of [100,101,Infinity,NaN])reject(()=>requireStage(n,100,'stage'));reject(()=>requireStage(1,NaN,'stage'));});
check('successful awaited result does not bypass elapsed stage',()=>{let now=99;const operation=()=>{now=101;return 'success';};requireStage(now,100,'stage');assert.equal(operation(),'success');reject(()=>requireStage(now,100,'stage'));});

const lease=()=>({readerUpperHrNs:'1000000000',observedHrNs:'990000000',lastHeartbeatHrNs:'650000000',session:'epoch-a',expectedSession:'epoch-a',incarnation:'worker-a',expectedIncarnation:'worker-a',voices:1});
check('native-only150ms admission at boundary leaves parent unknown',()=>assert.deepEqual(nativeLeaseAdmission(lease(),true),{ageMs:350,remainingMs:150,parentMargin:null}));
check('native-only margin one ns short rejects drain',()=>{const v=lease();v.readerUpperHrNs='1000000001';reject(()=>nativeLeaseAdmission(v,true));});
check('sustain can observe later valid native lease without asserting parent margin',()=>{const v=lease();v.lastHeartbeatHrNs='600000000';const r=nativeLeaseAdmission(v,false);assert.equal(r.remainingMs,100);assert.equal(r.parentMargin,null);});
check('unknown malformed lease or changed epoch/voice rejects',()=>{for(const patch of [{session:'epoch-b'},{incarnation:'worker-b'},{voices:0},{voices:2},{readerUpperHrNs:'invalid'}])reject(()=>nativeLeaseAdmission({...lease(),...patch},true));});
check('stale state is rejected despite heartbeat within lease',()=>{const v=lease();v.observedHrNs='949999999';reject(()=>nativeLeaseAdmission(v,true));});
check('exact50ms state-age admission is allowed',()=>{const v=lease();v.observedHrNs='950000000';nativeLeaseAdmission(v,true);});
check('future/reversed witness cannot certify freshness',()=>{for(const patch of [{observedHrNs:'1000000001'},{observedHrNs:'640000000'}])reject(()=>nativeLeaseAdmission({...lease(),...patch},true));});
check('native lease expired rejects irrespective of fresh state',()=>{const v=lease();v.lastHeartbeatHrNs='499999999';reject(()=>nativeLeaseAdmission(v,false));});

const wire=[{nodeId:'sentinel',objectId:7,position:[.5257311121191336,-.85065080835204,0]}];
const received=structuredClone(wire),raw=[{objectId:7,position:[Math.fround(.5257311121191336),Math.fround(-.85065080835204),0]}];
check('OSC independent IEEE754 float32 oracle differs from double and passes',()=>{assert.notEqual(wire[0].position[0],raw[0].position[0]);requirePositionTriples(wire,received,raw);});
check('wire receiver double mutation rejects even if decoded float unchanged',()=>{const r=structuredClone(received);r[0].position[0]+=1e-12;reject(()=>requirePositionTriples(wire,r,raw));});
check('raw incorrect float32 coordinate rejects',()=>{const r=structuredClone(raw);r[0].position[0]=0;reject(()=>requirePositionTriples(wire,received,r));});
check('missing or extra raw receipt cannot be ignored',()=>{reject(()=>requirePositionTriples(wire,received,[]));reject(()=>requirePositionTriples(wire,received,[...raw,...raw]));});
check('ordinal ID transposition rejects independent of equal coordinates',()=>{const w=[...wire,{...wire[0],nodeId:'other',objectId:8}],r=structuredClone(w),d=[raw[0],{...raw[0],objectId:8}];requirePositionTriples(w,r,d);reject(()=>requirePositionTriples(w,r,[d[1],d[0]]));});

const expected=Array.from({length:91},(_,i)=>({nodeId:`note-${i}`,objectId:i+1,position:[i/100,-i/100,(90-i)/100]}));
check('latest full91-object snapshot includes stable sentinel IDs',()=>{const old=expected.map(v=>({...v,position:[0,0,0]}));requireLatestSnapshot(expected,[...old,...structuredClone(expected)],structuredClone(expected));});
check('missing sentinel from complete latest receiver state rejects',()=>reject(()=>requireLatestSnapshot(expected,expected,expected.slice(1))));
check('stale latest movement coordinate rejects',()=>{const p=structuredClone(expected);p[90].position[0]-=.01;reject(()=>requireLatestSnapshot(expected,p,expected));});
check('retained ID rebinding rejects',()=>{const p=structuredClone(expected);p[50].objectId=92;reject(()=>requireLatestSnapshot(expected,p,expected));});
check('duplicate oracle IDs cannot hide incomplete denominator',()=>{const e=structuredClone(expected);e[90].nodeId=e[0].nodeId;reject(()=>requireLatestSnapshot(e,expected,expected));});
check('nonfinite complete oracle is not a recovery witness',()=>{const e=structuredClone(expected);e[10].position[2]=NaN;reject(()=>requireLatestSnapshot(e,expected,expected));});
console.log(JSON.stringify({scope:'Pure source controls, no acquisition',passed:results.length,results},null,2));
