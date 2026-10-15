import {z} from 'zod';
import { INSTRUMENT_IDS } from '../core/instruments';
const finite=z.number().finite();const id=z.string().max(128);const xyz=z.tuple([finite.min(-1).max(1),finite.min(-1).max(1),finite.min(-1).max(1)]);
const sound=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('note'),frequency:finite.min(20).max(20000),timbre:z.enum(['sine','triangle']),instrument:z.enum(INSTRUMENT_IDS).optional(),duration:finite.min(.05).max(8),level:finite.min(0).max(1)}).strict(),
 z.object({kind:z.literal('beat'),sound:z.enum(['kick','hat','snare']),duration:finite.min(.03).max(4),level:finite.min(0).max(1)}).strict()
]);
export const packetSchema=z.discriminatedUnion('type',[
 z.object({version:z.literal(1),type:z.literal('sync'),t0:finite}).strict(),
 z.object({version:z.literal(1),type:z.literal('start'),session:id,sequence:z.number().int().nonnegative()}).strict(),
 z.object({version:z.literal(1),type:z.literal('heartbeat'),session:id}).strict(),
 z.object({version:z.literal(1),type:z.literal('position'),session:id,sequence:z.number().int().nonnegative(),nodeId:id,objectId:z.number().int().positive(),position:xyz,sent:finite}).strict(),
 z.object({version:z.literal(1),type:z.literal('trigger'),session:id,sequence:z.number().int().nonnegative(),triggerSequence:z.number().int().positive(),id,objectId:z.number().int().positive(),nodeId:id,generatorId:id,onset:finite,sound}).strict(),
 z.object({version:z.literal(1),type:z.literal('cancel'),session:id,sequence:z.number().int().nonnegative(),ids:z.array(id).max(5376),nodeIds:z.array(id).max(92)}).strict(),
 z.object({version:z.literal(1),type:z.literal('stop'),session:id,sequence:z.number().int().nonnegative(),reason:id}).strict()
]).superRefine((p,ctx)=>{
 if(p.type==='trigger'&&!p.id.endsWith(`-${p.triggerSequence}`))ctx.addIssue({code:'custom',message:'Trigger ID must end with its immutable trigger sequence'});
});
export type Packet=z.infer<typeof packetSchema>;
export function objectId(nodeId:string){let h=2166136261;for(const c of nodeId){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)%2147483646+1;}
/** Keep active IDs stable; sort new names and resolve hashes by linear probing. */
export class ObjectMapping {
 private ids=new Map<string,number>();
 setNodes(names:string[],reset=false){if(reset)this.ids.clear();for(const key of this.ids.keys())if(!names.includes(key))this.ids.delete(key);const used=new Set(this.ids.values());for(const name of [...names].sort())if(!this.ids.has(name)){let n=objectId(name);while(used.has(n))n=n%2147483646+1;this.ids.set(name,n);used.add(n);}}
 get(name:string){const id=this.ids.get(name);if(id===undefined)throw Error('No object mapping for sound node');return id;}
}
export function encodeOSC(object:number,position:number[]):Buffer {
 const str=(s:string)=>{const n=Buffer.byteLength(s)+1,b=Buffer.alloc(Math.ceil(n/4)*4);b.write(s);return b;};
 const data=Buffer.alloc(12);position.forEach((p,i)=>data.writeFloatBE(p,i*4));return Buffer.concat([str(`/adm/obj/${object}/xyz`),str(',fff'),data]);
}
export function decodeOSC(b:Buffer){let offset=0;const str=()=>{const end=b.indexOf(0,offset);if(end<0)throw Error('Invalid OSC string');const s=b.toString('utf8',offset,end);offset=Math.ceil((end+1)/4)*4;return s;};const address=str(),tags=str();if(tags!==',fff'||b.length!==offset+12)throw Error('Expected XYZ floats');const match=/^\/adm\/obj\/(\d+)\/xyz$/.exec(address);if(!match)throw Error('Invalid ADM address');const position=[0,1,2].map(i=>b.readFloatBE(offset+i*4));if(position.some(p=>!Number.isFinite(p)||Math.abs(p)>1))throw Error('Invalid position');return {objectId:Number(match[1]),address,position};}
