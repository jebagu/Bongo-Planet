/** Pure final-disposition predicates; import starts no worker/browser/runtime. */
export function assertFinalNative(state:any,records:any[],closed:boolean):void {
 const c=state?.clock,w=c?.worker;
 if(!c||c.ready!==!closed||c.failure!==''||c.closeFailure!==''||c.clockEvidenceFailure!==''||!Array.isArray(c.reportedFailures)||c.reportedFailures.length!==0)throw Error('Final native clock fault/unknown state');
 if(!Number.isFinite(c.uncertaintyMs)||c.uncertaintyMs<0||c.uncertaintyMs>10||state.drops!==0||state.pending!==0||state.activeVoices!==0)throw Error('Final bridge clock/drop/work fault');
 if(!w||w.pending!==0||w.activeVoices!==0||w.onsetCount!==0||w.lateDrops!==0)throw Error('Final authoritative native musical work');
 if(!Array.isArray(records)||records.length>512||records.some(r=>['queued','onset','late-drop','rejected','clock-error','socket-error','steal'].includes(r?.type)))throw Error('Final receiver musical/fault row');
 if(closed&&(!Array.isArray(state.objects)||state.objects.length!==0||state.session!==''||w.session!==''||w.objects!==0||c.cleanup?.closedAcknowledged!==true||c.cleanup?.exitObserved!==true||c.cleanup?.exitCode!==0))throw Error('Final native closure not graceful/empty');
}
export function assertFinalBrowser(value:any):void {
 const w=value?.witness;
 if(!value||value.audioState!=='locked'||value.contextState!==null||!Array.isArray(value.events)||value.events.length!==0||value.status?.running===true)throw Error('Final browser not locked/zero-music');
 if(!w||w.error!==''||(w.errorOverflow!==undefined&&w.errorOverflow!==false)||!Array.isArray(w.rows)||w.rows.length>512||!Number.isFinite(w.bytes)||w.bytes<0||w.bytes>262144||w.connections!==2)throw Error('Final browser witness fault/unknown state');
 if(w.rows.some((r:any)=>r.kind==='send'&&['trigger','cancel'].includes(r.packet?.type)))throw Error('Final browser generated musical traffic');
 if(w.rows.some((r:any)=>r.kind==='reply'&&r.packet?.type==='error'))throw Error('Final browser received error');
}
