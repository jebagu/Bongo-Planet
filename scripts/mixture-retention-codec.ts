// Side-effect-free extraction of the reviewed transport protocol.
// Importing this module never launches servers, browsers, captures or file writes.
import fs from 'node:fs';
export const MAX_FRAME=262144,MAX_CONTAINER=64*1024*1024,MAX_FRAMES=4096;
export type Ledger={pcm:number;events:number;blocks:number;eventRecords:number;bytes:number;frames:number};
export function checksum(bytes:Uint8Array){let h=2166136261;for(const value of bytes)h=Math.imul(h^value,16777619);return h>>>0;}
export function encode(kind:number,meta:any,source=Buffer.alloc(0),input=Buffer.alloc(0)){
 if(!finiteJSON(meta))throw Error('Original nonfinite metadata/events');const json=Buffer.from(JSON.stringify(meta)),length=28+json.length+source.length+input.length;if(length>MAX_FRAME||source.length%4||input.length%4)throw Error('Frame cap/PCM byte alignment');
 const header=Buffer.alloc(28);[0x42475031,1,kind,meta.sequence,json.length,source.length/4,input.length/4].forEach((v,i)=>header.writeUInt32LE(v,i*4));return Buffer.concat([header,json,source,input]);
}
export function decode(frame:Buffer){
 if(frame.length<28||frame.length>MAX_FRAME||frame.readUInt32LE(0)!==0x42475031||frame.readUInt32LE(4)!==1)throw Error('Invalid frame header/cap');
 const kind=frame.readUInt32LE(8),sequence=frame.readUInt32LE(12),jsonBytes=frame.readUInt32LE(16),sourceSamples=frame.readUInt32LE(20),inputSamples=frame.readUInt32LE(24);
 if(![1,2].includes(kind)||28+jsonBytes+4*(sourceSamples+inputSamples)!==frame.length)throw Error('Frame length/kind mismatch');
 const meta=JSON.parse(frame.subarray(28,28+jsonBytes).toString());if(meta.sequence!==sequence)throw Error('Frame sequence binding');
 const source=frame.subarray(28+jsonBytes,28+jsonBytes+4*sourceSamples),input=frame.subarray(28+jsonBytes+4*sourceSamples);return{kind,meta,source,input,frameBytes:frame.length};
}
export function finiteJSON(value:any):boolean{if(typeof value==='number')return Number.isFinite(value);if(value&&typeof value==='object')return Object.values(value).every(finiteJSON);return true;}
export interface ContainerLimits { maxBytes: number; maxFrames: number }
export const DIAGNOSTIC_LIMITS: ContainerLimits = { maxBytes: MAX_CONTAINER, maxFrames: MAX_FRAMES };
export function validate(d:ReturnType<typeof decode>,l:Ledger,limits:ContainerLimits=DIAGNOSTIC_LIMITS):Ledger{
 if(!Number.isSafeInteger(limits.maxBytes)||limits.maxBytes<MAX_FRAME||!Number.isSafeInteger(limits.maxFrames)||limits.maxFrames<1)throw Error("Invalid declared container limits");
 if(!Number.isSafeInteger(d.meta.sequence)||!finiteJSON(d.meta)||l.frames>=limits.maxFrames||l.bytes+d.frameBytes+4>limits.maxBytes)throw Error('Sequence/finite/container frame or byte cap');
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
export function validAck(ack:any,kind:string,sequence:number,frameBytes:number,nextSequence:number){if(!ack||ack.kind!==(kind==='pcm'?1:2)||ack.sequence!==sequence||ack.sequence!==nextSequence||ack.frameBytes!==frameBytes)throw Error('Missing/reordered/invalid retention ACK');return true;}
export function appendComplete(fd:number,record:Buffer,trace:any,write=(buffer:Buffer,offset:number,length:number)=>fs.writeSync(fd,buffer,offset,length)){
 trace.expectedRecordBytes=record.length;trace.writtenBytes=0;while(trace.writtenBytes<record.length){const count=write(record,trace.writtenBytes,record.length-trace.writtenBytes);if(!Number.isSafeInteger(count)||count<=0||count>record.length-trace.writtenBytes)throw Error('Incomplete/invalid container write');trace.writtenBytes+=count;}
}
export type Collector={ledger:Ledger;failure:null|{error:string;nodeMonotonicMs:number;writtenBytes:number;expectedRecordBytes:number|null}};
export function commitFrame(fd:number,frame:Buffer,trace:any,collector:Collector,write?: (buffer:Buffer,offset:number,length:number)=>number,limits:ContainerLimits=DIAGNOSTIC_LIMITS){
 if(collector.failure){trace.refusedAfterPoison=true;throw Error('Collector terminal failure: '+collector.failure.error);}
 try{trace.decodeStartMs=performance.now();const decoded=decode(frame);trace.decodeEndMs=performance.now();trace.validateStartMs=performance.now();const delta=validate(decoded,collector.ledger,limits);trace.validateEndMs=performance.now();trace.writeStartMs=performance.now();const prefix=Buffer.alloc(4);prefix.writeUInt32LE(frame.length);appendComplete(fd,Buffer.concat([prefix,frame]),trace,write);trace.writeEndMs=performance.now();collector.ledger=delta;return{kind:decoded.kind,sequence:decoded.meta.sequence,frameBytes:frame.length};}
 catch(error){trace.error=String(error);collector.failure={error:trace.error,nodeMonotonicMs:performance.now(),writtenBytes:trace.writtenBytes??0,expectedRecordBytes:trace.expectedRecordBytes??null};throw error;}
}

/** Browser-native Float32 frame; caller supplies shared guards when serialized. */
export function encodeBrowserPCM(data:any){
 const sourceChecksum32=checksum(new Uint8Array(data.source.buffer,data.source.byteOffset,data.source.byteLength)),inputChecksum32=checksum(new Uint8Array(data.input.buffer,data.input.byteOffset,data.input.byteLength));
 const meta={sequence:data.sequence,blocks:data.blocks,sourceChecksum32,inputChecksum32};
 if(!finiteJSON(meta))throw Error('Original PCM metadata nonfinite');
 const metadata=new TextEncoder().encode(JSON.stringify(meta)),length=28+metadata.byteLength+data.source.byteLength+data.input.byteLength;
 if(length>262144)throw Error('Binary PCM frame cap');
 const bytes=new Uint8Array(length),header=new DataView(bytes.buffer);
 [0x42475031,1,1,data.sequence,metadata.length,data.source.length,data.input.length].forEach((value,index)=>header.setUint32(index*4,value,true));
 bytes.set(metadata,28);bytes.set(new Uint8Array(data.source.buffer,data.source.byteOffset,data.source.byteLength),28+metadata.length);bytes.set(new Uint8Array(data.input.buffer,data.input.byteOffset,data.input.byteLength),28+metadata.length+data.source.byteLength);
 return{sequence:data.sequence,frameBytes:length,wire:bytes};
}

/** Preserve one original callback across bounded ordered transport frames. */
export function eventChunks(original:any,sequenceStart:number){
 if(!finiteJSON(original)||!Array.isArray(original.events)||!original.events.length||original.events.length>2048||!Number.isSafeInteger(original.callbackIndex)||original.callbackIndex<0||!Number.isSafeInteger(sequenceStart)||sequenceStart<0)throw Error('Original event callback invalid');
 const rows=original.events,parts:any[][]=[rows];
 while(true){let changed=false;for(let i=0;i<parts.length;i++){const meta={...original,sequence:sequenceStart+i,callbackRows:rows.length,chunkIndex:i,chunkCount:parts.length,chunkOffset:parts.slice(0,i).reduce((n,a)=>n+a.length,0),events:parts[i]};const wire=JSON.stringify(meta);if(28+new TextEncoder().encode(wire).length>262144){if(parts[i].length===1)throw Error('Single original event exceeds frame cap');const half=Math.ceil(parts[i].length/2);parts.splice(i,1,parts[i].slice(0,half),parts[i].slice(half));changed=true;break;}}if(!changed)break;if(parts.length>128)throw Error('Original callback exceeds bounded chunk count');}
 let offset=0;return parts.map((events,index)=>{const meta={...original,sequence:sequenceStart+index,callbackRows:rows.length,chunkIndex:index,chunkCount:parts.length,chunkOffset:offset,events};offset+=events.length;const wire=JSON.stringify(meta),frameBytes=28+new TextEncoder().encode(wire).length;if(frameBytes>262144)throw Error('Event chunk frame cap');return{sequence:meta.sequence,frameBytes,wire,meta};});
}
export interface EventAssembly { nextCallback:number; offset:number; identity:string|null; chunks:number; rows:number; nextChunk:number }
export const EMPTY_EVENT_ASSEMBLY:EventAssembly={nextCallback:0,offset:0,identity:null,chunks:0,rows:0,nextChunk:0};
/** Returns a new state, installed only after the corresponding complete write. */
export function validateEventChunk(meta:any,state:EventAssembly):EventAssembly{
 const count=meta.events?.length;
 if(!Number.isSafeInteger(meta.callbackIndex)||meta.callbackIndex!==state.nextCallback||!Number.isSafeInteger(meta.callbackRows)||meta.callbackRows<1||meta.callbackRows>2048||!Number.isSafeInteger(meta.chunkIndex)||meta.chunkIndex!==state.nextChunk||!Number.isSafeInteger(meta.chunkCount)||meta.chunkCount<1||meta.chunkCount>128||!Number.isSafeInteger(meta.chunkOffset)||meta.chunkOffset!==state.offset||!Array.isArray(meta.events)||!count||meta.chunkOffset+count>meta.callbackRows||meta.chunkIndex>=meta.chunkCount)throw Error('Original callback chunk order/denominator');
 const identity=JSON.stringify([meta.callbackIndex,meta.callbackRows,meta.chunkCount,meta.segment,meta.sessionNamespace,meta.receiveContextTime,meta.receiveBrowserMonotonicMs]);
 if(state.identity!==null&&state.identity!==identity)throw Error('Original callback chunk provenance changed');
 const offset=state.offset+count;
 if(meta.chunkIndex===meta.chunkCount-1){if(offset!==meta.callbackRows)throw Error('Original callback incomplete');return{...EMPTY_EVENT_ASSEMBLY,nextCallback:state.nextCallback+1};}
 if(offset>=meta.callbackRows)throw Error('Original callback has extra chunks');
 return{nextCallback:state.nextCallback,offset,identity,chunks:meta.chunkCount,rows:meta.callbackRows,nextChunk:state.nextChunk+1};
}

/** Pure projection of validated event chunks into the legacy audit row schema. */
export function derivedEventRows(meta:any,eventBase:number,segmentBase:number,containerFrame:number,containerOffset:number){
 return meta.events.map((event:any,index:number)=>({independentEventIndex:eventBase+index,perSegmentEventIndex:segmentBase+index,sessionNamespace:event.trigger?.session??event.session??meta.sessionNamespace,eventBatchIndex:meta.sequence,segment:meta.segment,receiveContextTime:meta.receiveContextTime,receiveBrowserMonotonicMs:meta.receiveBrowserMonotonicMs,event,containerFrame,containerOffset,originalCallbackIndex:meta.callbackIndex,originalCallbackRows:meta.callbackRows,originalCallbackRowIndex:meta.chunkOffset+index,chunkIndex:meta.chunkIndex,chunkCount:meta.chunkCount,chunkOffset:meta.chunkOffset}));
}
