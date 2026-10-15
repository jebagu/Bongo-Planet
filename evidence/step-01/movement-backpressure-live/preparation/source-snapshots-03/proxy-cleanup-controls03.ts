import assert from 'node:assert/strict';
import {requireProxyCleanup,type ProxyClosure} from './proxy-cleanup03';

let controls=0;
const complete=():ProxyClosure=>({processClosed:true,stdinClosed:true,stdoutClosed:true,stderrClosed:true,code:0,signal:null});
assert.equal(requireProxyCleanup(complete(),[]).certified,true);controls++;
for(const key of ['processClosed','stdinClosed','stdoutClosed','stderrClosed'] as const){
  const c=complete();c[key]=false;assert.throws(()=>requireProxyCleanup(c,[]));controls++;
}
// Ordered lifecycle: stop ACK and exit0 are observed, then stderr faults before final close.
const c=complete();c.processClosed=false;c.stdoutClosed=false;c.stderrClosed=false;
const errors:string[]=[];
assert.throws(()=>requireProxyCleanup(c,errors));controls++;
errors.push('late stderr error after stop ACK/exit0');
c.stdoutClosed=true;c.stderrClosed=true;c.processClosed=true;
assert.throws(()=>requireProxyCleanup(c,errors));assert.equal(errors.length,1);controls++;
// A later fault must invalidate the report success predicate even after prior clean readback.
const late:string[]=[];assert.equal(requireProxyCleanup(complete(),late).certified,true);
late.push('late child error');assert.throws(()=>requireProxyCleanup(complete(),late));controls++;
for(const exit of [{code:1,signal:null},{code:null,signal:'SIGTERM'},{code:0,signal:'SIGTERM'}]){
  assert.throws(()=>requireProxyCleanup({...complete(),...exit},[]));controls++;
}
console.log(JSON.stringify({status:'passed-source-controls',controls,actualAcquisition:false,realProcessSpawn:false}));
