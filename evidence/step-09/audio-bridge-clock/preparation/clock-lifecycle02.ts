/** Pure lifecycle/deadline controls; no clock acquisition or runtime imports. */
export function requireDeadline(nowMs:number,endMs:number,label:string):void {
 if(!Number.isFinite(nowMs)||!Number.isFinite(endMs)||nowMs>=endMs)throw Error(label+' deadline expired/unknown');
}
export function requireNonWindowBudget(nowMs:number,beganMs:number,completedWindowsMs:number,allowanceMs:number):void {
 if(![nowMs,beganMs,completedWindowsMs,allowanceMs].every(Number.isFinite)||nowMs<beganMs||completedWindowsMs<0||completedWindowsMs>nowMs-beganMs||allowanceMs<=0||nowMs-beganMs-completedWindowsMs>allowanceMs)throw Error('Cumulative non-window budget expired/unknown');
}
export function requireBrowserFaultSnapshot(value:any):void {
 if(!value||value.observerError!==''||value.observerOverflow!==false||!value.current||value.current.error!==''||value.current.errorOverflow!==false||value.current.omitted!==0||value.current.stopped!==true||!['ready','paused','running','starting'].includes(value.audioState))throw Error('Final browser fault/unknown snapshot');
}
export function requireBrowserShutdownCertificate(before:any,after:any):void {
 requireBrowserFaultSnapshot(before);requireBrowserFaultSnapshot(after);
 if(after.clock?.state!=='closed')throw Error('Audio context lacks post-disposal closed witness');
}
