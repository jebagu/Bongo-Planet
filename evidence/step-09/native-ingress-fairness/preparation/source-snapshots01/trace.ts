import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
export class Trace {
 readonly rows:any[]=[];bytes=0;message=0;failed:string|null=null;
 readonly maxRows=16000;readonly maxBytes=8388608;
 record(type:string,fields:Record<string,unknown>={}) {
  if(this.failed)return null;
  const row={index:this.rows.length,nodeMs:performance.now(),hrNs:process.hrtime.bigint().toString(),type,...fields};
  const bytes=Buffer.byteLength(JSON.stringify(row));
  if(this.rows.length>=this.maxRows||this.bytes+bytes>this.maxBytes){this.failed='Diagnostic trace capacity exceeded';return null;}
  this.bytes+=bytes;this.rows.push(row);return row;
 }
 counters(d:any){return {ready:d?.ready,failure:d?.failure,unacknowledgedCommands:d?.unacknowledgedCommands,unacknowledgedBytes:d?.unacknowledgedBytes};}
 beginMessage(bytes:number,d:any){const id=++this.message;this.record('message-enter',{id,bytes,...this.counters(d)});return id;}
 packet(id:number,p:any){this.record('message-parsed',{id,packet:{...p}});}
 endMessage(id:number,d:any){this.record('message-exit',{id,...this.counters(d)});}
 applied(sequence:number,d:any){assert(Number.isSafeInteger(sequence)&&sequence>0);this.record('bridge-command-applied',{sequence,...this.counters(d)});}
}
export const trace=new Trace();
