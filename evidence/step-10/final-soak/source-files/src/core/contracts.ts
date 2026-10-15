import { z } from 'zod';
export const TOPOLOGY = 'icosa-3v-v1' as const;
export const LIMITS = {vertices:92,generators:8,voices:64,bpmMin:40,bpmMax:180,pending:5376,eventsPerSecond:2016,history:100} as const;
const num=(min:number,max:number)=>z.number().finite().min(min).max(max);
const common={id:z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),vertex:z.number().int().min(0).max(91)};
export const generatorSchema=z.object({...common,kind:z.literal('generator'),period:z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(6),z.literal(8)]),phase:num(0,0.999999),reach:num(0,180),enabled:z.boolean()}).strict();
export const noteSchema=z.object({...common,kind:z.literal('note'),degree:z.number().int().min(0).max(6),octave:z.number().int().min(2).max(6),timbre:z.enum(['sine','triangle']),duration:num(0.05,8),level:num(0,1)}).strict();
export const beatSchema=z.object({...common,kind:z.literal('beat'),sound:z.enum(['kick','hat','snare']),decay:num(0.03,4),level:num(0,1)}).strict();
export const pieceSchema=z.discriminatedUnion('kind',[generatorSchema,noteSchema,beatSchema]);
export const settingsSchema=z.object({bpm:num(40,180),key:z.number().int().min(0).max(11),scale:z.enum(['major','minor','pentatonic']),travel:num(0.25,0.75),quantization:z.union([z.literal(0),z.literal(0.125),z.literal(0.25)]),volume:num(0,1)}).strict();
export const sceneSchema=z.object({version:z.literal(1),topology:z.literal(TOPOLOGY),settings:settingsSchema,pieces:z.array(pieceSchema).max(92)}).strict().superRefine((s,ctx)=>{
 const ids=new Set<string>(),slots=new Set<number>();
 for(const p of s.pieces){if(ids.has(p.id)||slots.has(p.vertex))ctx.addIssue({code:'custom',message:'Duplicate piece ID or occupied vertex'});ids.add(p.id);slots.add(p.vertex);}
 if(s.pieces.filter(p=>p.kind==='generator').length>8)ctx.addIssue({code:'custom',message:'At most 8 generators are supported'});
});
export type Scene=z.infer<typeof sceneSchema>;
export type Piece=z.infer<typeof pieceSchema>;
export type Generator=Extract<Piece,{kind:'generator'}>;
export type SoundPiece=Exclude<Piece,Generator>;
export type Vec3=[number,number,number];
export type Sound={kind:'note';frequency:number;timbre:'sine'|'triangle';duration:number;level:number}|{kind:'beat';sound:'kick'|'hat'|'snare';duration:number;level:number};
export interface Trigger {session:string;sequence:number;id:string;generatorId:string;nodeId:string;emission:number;beat:number;onset:number;angle:number;sound:Sound;position:Vec3}
export type EngineEvent={type:'trigger';trigger:Trigger}|{type:'onset';trigger:Trigger}|{type:'cancel';ids:string[];nodeIds:string[];reason:string}|{type:'reset';session:string;reason:string}|{type:'emission';generatorId:string;time:number;periodSeconds:number;reach:number};
export const defaults:Scene['settings']={bpm:120,key:0,scale:'major',travel:0.75,quantization:0.25,volume:0.65};
export const emptyScene=():Scene=>({version:1,topology:TOPOLOGY,settings:{...defaults},pieces:[]});
export function newPiece<K extends Piece['kind']>(kind:K,vertex:number,id:string):Extract<Piece,{kind:K}>;
export function newPiece(kind:Piece['kind'],vertex:number,id:string):Piece {
 if(kind==='generator')return {id,vertex,kind,period:4,phase:0,reach:90,enabled:true};
 if(kind==='note')return {id,vertex,kind,degree:0,octave:4,timbre:'sine',duration:0.6,level:0.65};
 return {id,vertex,kind,sound:'kick',decay:0.25,level:0.7};
}
export function validateScene(input:unknown):Scene{return sceneSchema.parse(input);}
export function changeScene(scene:Scene,change:(s:Scene)=>void):Scene{const next=structuredClone(scene);change(next);return validateScene(next);}
export function movePiece(scene:Scene,id:string,vertex:number):Scene{return changeScene(scene,s=>{const p=s.pieces.find(p=>p.id===id);if(!p)throw Error('Piece not found');p.vertex=vertex;});}
