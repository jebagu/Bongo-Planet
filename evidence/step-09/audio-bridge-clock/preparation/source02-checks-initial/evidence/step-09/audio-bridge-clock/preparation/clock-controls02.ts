import assert from 'node:assert/strict';
import './clock-controls01';
import {requireDeadline,requireNonWindowBudget,requireBrowserFaultSnapshot,requireBrowserShutdownCertificate} from './clock-lifecycle02';
// Synthetic microtask interleavings only; no browser/process/timer/native import.
let passed=0;const check=(f:()=>void)=>{f();passed++;};const reject=(f:()=>void)=>{assert.throws(f);passed++;};
const clean=()=>({observerError:'',observerOverflow:false,current:{error:'',errorOverflow:false,omitted:0,stopped:true},audioState:'paused',clock:{state:'running'}});
const closed=()=>({...clean(),clock:{state:'closed'}});
check(()=>requireBrowserFaultSnapshot(clean()));check(()=>requireBrowserShutdownCertificate(clean(),closed()));
for(const field of ['observerError','observerOverflow','audioState'] as const){for(const phase of ['before','after']){const b=clean(),a=closed(),v=phase==='before'?b:a;(v as any)[field]=field==='observerError'?'processor error':field==='observerOverflow'?true:'error';reject(()=>requireBrowserShutdownCertificate(b,a));}}
for(const change of [(v:any)=>v.current.error='late processor failure',(v:any)=>v.current.errorOverflow=true,(v:any)=>v.current.omitted=1,(v:any)=>v.current.stopped=false,(v:any)=>v.clock.state='running']){const a=closed();change(a);reject(()=>requireBrowserShutdownCertificate(clean(),a));}
reject(()=>requireBrowserShutdownCertificate(undefined,closed()));reject(()=>requireBrowserShutdownCertificate(clean(),undefined));reject(()=>requireBrowserFaultSnapshot({...clean(),observerOverflow:undefined}));
check(()=>requireDeadline(4999.999,5000,'first emission'));reject(()=>requireDeadline(5000,5000,'first emission'));reject(()=>requireDeadline(5000.001,5000,'first emission'));reject(()=>requireDeadline(NaN,5000,'first emission'));reject(()=>requireDeadline(4999,NaN,'first emission'));
check(()=>requireNonWindowBudget(155000,0,120000,35000));reject(()=>requireNonWindowBudget(155000.001,0,120000,35000));reject(()=>requireNonWindowBudget(120000,0,240000,35000));reject(()=>requireNonWindowBudget(1,0,-1,35000));
// A genuine asynchronous completion arrives at/after the deadline with success;
// both ordinary success and a final empty remainder must still be rejected.
for(const late of [5000,5000.001]){let now=4999;const value=await Promise.resolve().then(()=>{now=late;return{running:true,window:{},queuedSamples:0,queuedEvents:0};});assert(value.running);reject(()=>{requireDeadline(now,5000,'first emission');if(value.running)return;});}
for(const empty of [true,false]){let now=124999;const value=await Promise.resolve().then(()=>{now=125001;return{window:{},queuedSamples:empty?0:1};});reject(()=>{requireDeadline(now,125000,'final fixture readback');if(value.window&&value.queuedSamples===0)return;});}
// The pre-close certificate is clean; original callback runs exactly once while
// awaited disposal is pending and changes the AFTER snapshot, without throwing.
for(const fault of ['error','interrupted']){const before=clean(),after=closed();let originalCalls=0;await Promise.resolve().then(()=>{originalCalls++;after.audioState=fault;after.observerError='original audio '+fault;after.current.error='original audio '+fault;});assert.equal(originalCalls,1);reject(()=>requireBrowserShutdownCertificate(before,after));}
// Two successful120s windows do not exempt post-window work or cleanup from35s.
let elapsed=274999;requireNonWindowBudget(elapsed,0,240000,35000);await Promise.resolve().then(()=>{elapsed=275001;});reject(()=>requireNonWindowBudget(elapsed,0,240000,35000));
console.log(JSON.stringify({title:'Bongo Planet clock Source02 lifecycle/deadline pure controls',additionalPassed:passed,originalPassed:32,passed:passed+32,failures:0,scope:'Synthetic asynchronous completions only; no runtime acquisition'}));
