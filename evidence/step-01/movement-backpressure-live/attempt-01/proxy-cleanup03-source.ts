import assert from 'node:assert/strict';

export type ProxyClosure = {processClosed:boolean;stdinClosed:boolean;stdoutClosed:boolean;stderrClosed:boolean;code:number|null;signal:string|null};

/** Exit0/stop ACK alone is not a certificate: faults can precede final stdio close. */
export function requireProxyCleanup(closure:ProxyClosure,errors:readonly string[]) {
  assert.equal(closure.processClosed,true,'Proxy process close unobserved');
  for(const key of ['stdinClosed','stdoutClosed','stderrClosed'] as const)
    assert.equal(closure[key],true,`Proxy ${key} unobserved`);
  assert.equal(closure.code,0,'Proxy nonzero/unknown exit');
  assert.equal(closure.signal,null,'Proxy signal termination');
  assert.equal(errors.length,0,'Proxy faults retained after stop/exit');
  return {...closure,errorCount:errors.length,certified:true};
}
