import fs from "node:fs";
const MAX_FRAME=262144,MAX_CONTAINER=64*1024*1024,MAX_FRAMES=4096;
type Ledger={pcm:number;events:number;blocks:number;eventRecords:number;bytes:number;frames:number};
function checksum(bytes:Uint8Array){let h=2166136261;for(const value of bytes)h=Math.imul(h^value,16777619);return h>>>0;}
function encode(kind:number,meta:any,source=Buffer.alloc(0),input=Buffer.alloc(0)){
 if(!finiteJSON(meta))throw Error('Original nonfinite metadata/events');const json=Buffer.from(JSON.stringify(meta)),length=28+json.length+source.length+input.length;if(length>MAX_FRAME||source.length%4||input.length%4)throw Error('Frame cap/PCM byte alignment');
 const header=Buffer.alloc(28);[0x42475031,1,kind,meta.sequence,json.length,source.length/4,input.length/4].forEach((v,i)=>header.writeUInt32LE(v,i*4));return Buffer.concat([header,json,source,input]);
}
function decode(frame:Buffer){
 if(frame.length<28||frame.length>MAX_FRAME||frame.readUInt32LE(0)!==0x42475031||frame.readUInt32LE(4)!==1)throw Error('Invalid frame header/cap');
 const kind=frame.readUInt32LE(8),sequence=frame.readUInt32LE(12),jsonBytes=frame.readUInt32LE(16),sourceSamples=frame.readUInt32LE(20),inputSamples=frame.readUInt32LE(24);
 if(![1,2].includes(kind)||28+jsonBytes+4*(sourceSamples+inputSamples)!==frame.length)throw Error('Frame length/kind mismatch');
 const meta=JSON.parse(frame.subarray(28,28+jsonBytes).toString());if(meta.sequence!==sequence)throw Error('Frame sequence binding');
 const source=frame.subarray(28+jsonBytes,28+jsonBytes+4*sourceSamples),input=frame.subarray(28+jsonBytes+4*sourceSamples);return{kind,meta,source,input,frameBytes:frame.length};
}
function finiteJSON(value:any):boolean{if(typeof value==='number')return Number.isFinite(value);if(value&&typeof value==='object')return Object.values(value).every(finiteJSON);return true;}
function validate(d:ReturnType<typeof decode>,l:Ledger):Ledger{
 if(!Number.isSafeInteger(d.meta.sequence)||!finiteJSON(d.meta)||l.frames>=MAX_FRAMES||l.bytes+d.frameBytes+4>MAX_CONTAINER)throw Error('Sequence/finite/container frame or byte cap');
 const next={...l,frames:l.frames+1,bytes:l.bytes+d.frameBytes+4};
 if(d.kind===1){
  if(d.meta.sequence!==l.pcm||!Array.isArray(d.meta.blocks)||d.meta.blocks.length!==32||d.source.length!==32*128*4||d.input.length!==32*128*4)throw Error('PCM sequence/batch/path length');
  for(const [i,b]of d.meta.blocks.entries())if(b.index!==l.blocks+i||b.quantum!==128||b.sourceLength!==128||b.inputLength!==128||!Number.isSafeInteger(b.sourceChannels)||b.sourceChannels<1||!Number.isSafeInteger(b.inputChannels)||b.inputChannels<1||!Number.isSafeInteger(b.currentFrame)||b.currentFrame<0||!Number.isFinite(b.currentTime)||b.currentTime<0)throw Error('PCM independent index/channels/quantum/clock');
  for(const bytes of[d.source,d.input])for(let i=0;i<bytes.length;i+=4)if(!Number.isFinite(bytes.readFloatLE(i)))throw Error('Nonfinite original Float32');
  if(checksum(d.source)!==d.meta.sourceChecksum32||checksum(d.input)!==d.meta.inputChecksum32)throw Error('Original Float32 byte checksum mismatch');
  next.pcm++;next.blocks+=32;
 }else{
  if(d.source.length||d.input.length||d.meta.sequence!==l.events||!Array.isArray(d.meta.events)||!d.meta.events.length||d.meta.events.length>2048||!Number.isFinite(d.meta.receiveBrowserMonotonicMs)||!Number.isFinite(d.meta.receiveContextTime))throw Error('Event sequence/count/path/receive clock');
  next.events++;next.eventRecords+=d.meta.events.length;
 }
 return next;
}
function validAck(ack:any,kind:string,sequence:number,frameBytes:number,nextSequence:number){if(!ack||ack.kind!==(kind==='pcm'?1:2)||ack.sequence!==sequence||ack.sequence!==nextSequence||ack.frameBytes!==frameBytes)throw Error('Missing/reordered/invalid retention ACK');return true;}
function appendComplete(fd:number,record:Buffer,trace:any,write=(buffer:Buffer,offset:number,length:number)=>fs.writeSync(fd,buffer,offset,length)){
 trace.expectedRecordBytes=record.length;trace.writtenBytes=0;while(trace.writtenBytes<record.length){const count=write(record,trace.writtenBytes,record.length-trace.writtenBytes);if(!Number.isSafeInteger(count)||count<=0||count>record.length-trace.writtenBytes)throw Error('Incomplete/invalid container write');trace.writtenBytes+=count;}
}
type Collector={ledger:Ledger;failure:null|{error:string;nodeMonotonicMs:number;writtenBytes:number;expectedRecordBytes:number|null}};
function commitFrame(fd:number,frame:Buffer,trace:any,collector:Collector,write?: (buffer:Buffer,offset:number,length:number)=>number){
 if(collector.failure){trace.refusedAfterPoison=true;throw Error('Collector terminal failure: '+collector.failure.error);}
 try{trace.decodeStartMs=performance.now();const decoded=decode(frame);trace.decodeEndMs=performance.now();trace.validateStartMs=performance.now();const delta=validate(decoded,collector.ledger);trace.validateEndMs=performance.now();trace.writeStartMs=performance.now();const prefix=Buffer.alloc(4);prefix.writeUInt32LE(frame.length);appendComplete(fd,Buffer.concat([prefix,frame]),trace,write);trace.writeEndMs=performance.now();collector.ledger=delta;return{kind:decoded.kind,sequence:decoded.meta.sequence,frameBytes:frame.length};}
 catch(error){trace.error=String(error);collector.failure={error:trace.error,nodeMonotonicMs:performance.now(),writtenBytes:trace.writtenBytes??0,expectedRecordBytes:trace.expectedRecordBytes??null};throw error;}
}
export {checksum,encode,decode,validate,validAck,appendComplete,commitFrame};
