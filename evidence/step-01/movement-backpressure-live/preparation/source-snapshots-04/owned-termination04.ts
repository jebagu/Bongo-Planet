export type OwnedChild = {exitCode:number|null;signalCode:string|null;kill:(signal:'SIGTERM')=>boolean};

/** Never signal a PID/group after observed exit or close. Residual descendants belong to the identity-checking controller. */
export function requestOwnedTermination(child:OwnedChild,closeObserved:boolean) {
  if(closeObserved!==false || child.exitCode!==null || child.signalCode!==null)
    return {attempted:false,accepted:false,reason:'Known-closed/exited or unresolved identity fields'};
  try{return {attempted:true,accepted:child.kill('SIGTERM'),reason:'Unresolved owned ChildProcess handle only'};}
  catch(e){return {attempted:true,accepted:false,reason:'Owned ChildProcess signal failed',error:String(e)};}
}
