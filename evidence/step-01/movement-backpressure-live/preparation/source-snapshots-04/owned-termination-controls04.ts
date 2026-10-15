import assert from 'node:assert/strict';
import {requestOwnedTermination} from './owned-termination04';
import {requireProxyCleanup,type ProxyClosure} from './proxy-cleanup03';

let controls=0;
for(const [exitCode,signalCode,closed] of [[0,null,true],[1,null,true],[null,'SIGTERM',true],[0,null,false],[1,null,false],[null,'SIGTERM',false],[null,null,true]] as const){
  let attempts=0;
  const decision=requestOwnedTermination({exitCode,signalCode,kill:()=>{attempts++;return true;}},closed);
  assert.equal(attempts,0);assert.equal(decision.attempted,false);controls++;
}
// Late fault after fullyClosed/exit0 and nonzero alreadyClosed retain failure but never signal.
for(const [code,errors] of [[0,['late stderr fault']],[1,[]]] as const){
  const closure:ProxyClosure={processClosed:true,stdinClosed:true,stdoutClosed:true,stderrClosed:true,code,signal:null};
  let attempts=0;assert.throws(()=>requireProxyCleanup(closure,errors));
  const decision=requestOwnedTermination({exitCode:code,signalCode:null,kill:()=>{attempts++;return true;}},closure.processClosed);
  assert.equal(attempts,0);assert.equal(decision.attempted,false);controls++;
}
let attempts=0;
const live=requestOwnedTermination({exitCode:null,signalCode:null,kill:signal=>{assert.equal(signal,'SIGTERM');attempts++;return true;}},false);
assert.equal(attempts,1);assert.equal(live.accepted,true);controls++;
const thrown=requestOwnedTermination({exitCode:null,signalCode:null,kill:()=>{throw Error('gone');}},false);
assert.equal(thrown.attempted,true);assert.equal(thrown.accepted,false);assert.match(thrown.error??'',/gone/);controls++;
console.log(JSON.stringify({status:'passed-source-controls',controls,actualAcquisition:false,realProcessSpawn:false,realSignals:false}));
