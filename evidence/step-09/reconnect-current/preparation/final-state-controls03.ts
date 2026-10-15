import assert from 'node:assert/strict';
import {assertFinalNative,assertFinalBrowser} from './final-state03';
// Independently supplied healthy shape uses literal null for NativeClock failure/closeFailure.
// Production diagnostics source defines these nullable fields; no product module is imported.
const before:any={session:'new',objects:[{}],drops:0,pending:0,activeVoices:0,clock:{ready:true,failure:null,closeFailure:null,clockEvidenceFailure:'',reportedFailures:[],uncertaintyMs:1,worker:{session:'new',objects:6,pending:0,activeVoices:0,onsetCount:0,lateDrops:0}}};
const after:any={...structuredClone(before),session:'',objects:[],clock:{...structuredClone(before.clock),ready:false,worker:{...structuredClone(before.clock.worker),session:'',objects:0},cleanup:{closedAcknowledged:true,exitObserved:true,exitCode:0}}};
const browser:any={audioState:'locked',contextState:null,status:null,events:[],witness:{error:'',bytes:100,connections:2,rows:[]}};
let cases=0;const pass=(f:()=>void)=>{f();cases++;},reject=(f:()=>void)=>{assert.throws(f);cases++;};
pass(()=>assertFinalNative(before,[],false));pass(()=>assertFinalNative(after,[],true));pass(()=>assertFinalBrowser(browser));
for(const field of ['failure','closeFailure','clockEvidenceFailure'])for(const [baseline,closed]of [[before,false],[after,true]] as const){const v=structuredClone(baseline);v.clock[field]='late fault';reject(()=>assertFinalNative(v,[],closed));}
for(const field of ['failure','closeFailure'])for(const [baseline,closed]of [[before,false],[after,true]] as const)for(const malformed of [undefined,'',false,0,{},[]]){const v=structuredClone(baseline);v.clock[field]=malformed;reject(()=>assertFinalNative(v,[],closed));}
const unknownEvidence=structuredClone(after);unknownEvidence.clock.clockEvidenceFailure=null;reject(()=>assertFinalNative(unknownEvidence,[],true));
const reported=structuredClone(after);reported.clock.reportedFailures=['late callback'];reject(()=>assertFinalNative(reported,[],true));
for(const type of ['queued','onset','late-drop','rejected','clock-error','socket-error','steal'])reject(()=>assertFinalNative(after,[{type}],true));
const dropped=structuredClone(after);dropped.drops=1;reject(()=>assertFinalNative(dropped,[],true));
const ready=structuredClone(before);ready.clock.ready=false;reject(()=>assertFinalNative(ready,[],false));
const unclosed=structuredClone(after);unclosed.clock.cleanup.exitObserved=false;reject(()=>assertFinalNative(unclosed,[],true));
const voice=structuredClone(after);voice.clock.worker.activeVoices=1;reject(()=>assertFinalNative(voice,[],true));
const badBrowser=structuredClone(browser);badBrowser.witness.error='Late cap';reject(()=>assertFinalBrowser(badBrowser));
reject(()=>assertFinalBrowser({...browser,witness:{...browser.witness,errorOverflow:true}}));
reject(()=>assertFinalBrowser({...browser,audioState:'running'}));reject(()=>assertFinalBrowser({...browser,contextState:'running'}));reject(()=>assertFinalBrowser({...browser,events:[{type:'reset'}]}));reject(()=>assertFinalBrowser({...browser,status:{running:true}}));
reject(()=>assertFinalBrowser({...browser,witness:{...browser.witness,rows:[{kind:'send',packet:{type:'trigger'}}]}}));reject(()=>assertFinalBrowser({...browser,witness:{...browser.witness,rows:[{kind:'reply',packet:{type:'error'}}]}}));
console.log(JSON.stringify({title:'Bongo Planet reconnect final-disposition pure negatives',passed:cases,failures:0,scope:'Toy observations only; no browser/bridge/native runtime',sourceModules:['final-state03.ts','final-state-controls03.ts']}));
