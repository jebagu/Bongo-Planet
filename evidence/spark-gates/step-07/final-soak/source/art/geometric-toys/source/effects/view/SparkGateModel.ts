import { exitsAt,type Scene } from '../core/contracts';
import { topology } from '../core/geometry';
import { strutPoints } from './strutRoutes';
export type GateMark={id:string;vertex:number;exit:number;on:boolean;selected:boolean;point:[number,number,number];from:[number,number,number];to:[number,number,number]};
export function gateMarks(scene:Scene,selected:number|null):GateMark[]{
 if(scene.version!==2)return [];
 const owners=new Set(scene.wiring?.map(w=>w.vertex));if(selected!==null)owners.add(selected);
 return [...owners].sort((a,b)=>a-b).flatMap(vertex=>topology.neighbors[vertex].map(exit=>{const [from,to]=strutPoints(vertex,exit,'seams');return {id:`${vertex}>${exit}`,vertex,exit,on:exitsAt(scene,vertex).includes(exit),selected:vertex===selected,point:from.map((v,i)=>v*.75+to[i]*.25) as [number,number,number],from,to};}));
}
export type ProjectedGate={id:string;vertex:number;exit:number;on:boolean;x:number;y:number;visible:boolean;selected:boolean};
export function pickGate(gates:ProjectedGate[],x:number,y:number,touch=false):ProjectedGate|null{
 const eligible=gates.filter(g=>g.selected&&g.visible).map(g=>({...g,d:Math.hypot(x-g.x,y-g.y)})).sort((a,b)=>a.d-b.d||a.exit-b.exit);
 return eligible[0]?.d<=(touch?22:12)?eligible[0]:null;
}
