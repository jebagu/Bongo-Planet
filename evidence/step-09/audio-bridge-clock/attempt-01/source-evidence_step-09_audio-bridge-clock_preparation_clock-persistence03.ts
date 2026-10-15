/** Pure post-writer observation; intentionally no runtime/file imports. */
export function writeThenCheck(writer:()=>void,clock:()=>number,endMs:number):{persisted:boolean;afterMs:number|null;budgetPassed:boolean;error:unknown} {
 let persisted=false,error:unknown=null,afterMs:number|null=null;
 try{writer();persisted=true;}catch(e){error=e;}
 try{afterMs=clock();if(!Number.isFinite(afterMs)||!Number.isFinite(endMs)){if(error===null)error=Error('Unknown post-write deadline');}}catch(e){if(error===null)error=e;}
 return{persisted,afterMs,budgetPassed:persisted&&error===null&&afterMs!==null&&Number.isFinite(afterMs)&&Number.isFinite(endMs)&&afterMs<endMs,error};
}
