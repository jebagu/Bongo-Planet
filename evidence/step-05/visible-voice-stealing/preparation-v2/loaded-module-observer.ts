import {createHash} from 'node:crypto';
export type NetworkKind='requestWillBeSent'|'responseReceived'|'loadingFinished'|'loadingFailed';
type Body={body:string;base64Encoded:boolean};
type Joined={requestId:string;url:string;requestIndex:number;responseIndex?:number;finishedIndex?:number;status?:number};
export const MODULE_LIMITS={events:256,eventBytes:1024*1024,eventSize:16384,bodyTasks:2,bodyBytes:1024*1024,totalBodyBytes:2*1024*1024} as const;

/** One public page-CDP session only. No synthetic request, route or fallback. */
export class LoadedModuleObserver{
  readonly events:{index:number;kind:NetworkKind;receivedNodeMs:number;event:unknown}[]=[];
  readonly bodies:{requestId:string;url:string;requestIndex:number;responseIndex:number;finishedIndex:number;bytes:Buffer;sha256:string}[]=[];
  private joined=new Map<string,Joined>();private admittedURLs=new Set<string>();private tasks:Promise<void>[]=[];
  private eventBytes=0;private bodyBytes=0;private pending=0;private failure:string|null=null;
  constructor(private expected:Readonly<Record<string,string>>,private getBody:(requestId:string)=>Promise<Body>,private limits:{[K in keyof typeof MODULE_LIMITS]:number}=MODULE_LIMITS){
    if(Object.keys(expected).length!==2||Object.values(expected).some(hash=>!/^[a-f0-9]{64}$/.test(hash)))throw Error('Expected exactly frozen main and processor hashes');
  }
  private fail(message:string):never{this.failure??=message;throw Error(this.failure);}
  receive(kind:NetworkKind,event:any,receivedNodeMs:number):void{
    if(this.failure)throw Error(this.failure);
    if(!Number.isFinite(receivedNodeMs))this.fail('Invalid receive clock');
    const serialized=JSON.stringify(event),bytes=Buffer.byteLength(serialized??'','utf8');
    if(!serialized||bytes>this.limits.eventSize||this.events.length>=this.limits.events||this.eventBytes+bytes>this.limits.eventBytes)this.fail('Raw event retention cap exceeded');
    const index=this.events.length;this.events.push({index,kind,receivedNodeMs,event:JSON.parse(serialized)});this.eventBytes+=bytes;
    if(typeof event.requestId!=='string'||!event.requestId)this.fail('Missing original request ID');
    const id=event.requestId;
    if(kind==='requestWillBeSent'){
      const url=event.request?.url;if(!Object.hasOwn(this.expected,url))return;
      if(event.request.method!=='GET'||event.redirectResponse||this.joined.has(id)||this.admittedURLs.has(url))this.fail('Duplicate/redirected/non-GET module request');
      this.joined.set(id,{requestId:id,url,requestIndex:index});this.admittedURLs.add(url);return;
    }
    const row=this.joined.get(id);
    if(kind==='responseReceived'){
      if(!row){if(Object.hasOwn(this.expected,event.response?.url))this.fail('Module response has no original request');return;}
      if(row.responseIndex!==undefined||row.finishedIndex!==undefined||event.response?.url!==row.url||event.response.status!==200)this.fail('Invalid/mismatched/duplicate module response');
      row.responseIndex=index;row.status=event.response.status;return;
    }
    if(!row)return;
    if(kind==='loadingFailed')this.fail(`Original module request failed: ${id}`);
    if(row.responseIndex===undefined||row.finishedIndex!==undefined)this.fail('Finished module lacks one ordered response');
    row.finishedIndex=index;
    if(this.tasks.length>=this.limits.bodyTasks)this.fail('Body task cap exceeded');
    this.pending++;
    // Catch synchronously thrown getBody implementations inside the promise;
    // every admitted task settles into retained failure or exact bytes.
    const task=Promise.resolve().then(()=>this.getBody(id)).then(result=>{
      if(this.failure)return;
      if(typeof result.body!=='string'||typeof result.base64Encoded!=='boolean')this.fail('Malformed module body result');
      if(Buffer.byteLength(result.body,'utf8')>2*this.limits.bodyBytes)this.fail('Encoded body cap exceeded');
      if(result.base64Encoded&&(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(result.body)||result.body.length%4!==0))this.fail('Invalid base64 body');
      const buffer=Buffer.from(result.body,result.base64Encoded?'base64':'utf8');
      if(result.base64Encoded&&buffer.toString('base64')!==result.body)this.fail('Noncanonical base64 body');
      if(!buffer.length||buffer.length>this.limits.bodyBytes||this.bodyBytes+buffer.length>this.limits.totalBodyBytes)this.fail('Decoded body byte cap exceeded');
      const hash=createHash('sha256').update(buffer).digest('hex');if(hash!==this.expected[row.url])this.fail('Actual loaded body hash mismatch');
      this.bodyBytes+=buffer.length;this.bodies.push({requestId:id,url:row.url,requestIndex:row.requestIndex,responseIndex:row.responseIndex!,finishedIndex:row.finishedIndex!,bytes:buffer,sha256:hash});
    }).catch(error=>{this.failure??=String(error);}).finally(()=>{this.pending--;});
    this.tasks.push(task);
  }
  get snapshot(){return {scope:'one page CDP session; original request bodies only',limits:this.limits,events:this.events,eventBytes:this.eventBytes,pendingBodies:this.pending,admittedBodyTasks:this.tasks.length,bodyBytes:this.bodyBytes,failure:this.failure,joins:[...this.joined.values()],bodies:this.bodies.map(({bytes,...body})=>({...body,byteLength:bytes.length}))};}
  async finish(timeoutMs:number):Promise<void>{
    if(!Number.isFinite(timeoutMs)||timeoutMs<=0)this.fail('Invalid body settlement bound');
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      const done=await Promise.race([Promise.all(this.tasks).then(()=>true),new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})]);
      if(!done||this.pending)this.fail('Unresolved original body task');
      if(this.failure)throw Error(this.failure);
      if(this.bodies.length!==2||Object.keys(this.expected).some(url=>this.bodies.filter(body=>body.url===url).length!==1))this.fail('Missing actual loaded main/processor body');
    }finally{clearTimeout(timer);}
  }
}
