import { exitsAt, LIMITS, type GatedEdge, type Generator, type Scene } from './contracts';
import { seamDistance } from './routes';
import { topology } from './geometry';

export const MEAN_STRUT_LENGTH=topology.edges.reduce((sum,[a,b])=>sum+seamDistance(a,b),0)/topology.edges.length;

/** Only committed edges are retained. Neither Infinite nor branching grows a route. */
export class GatedPropagation {
  readonly edges=new Map<string,GatedEdge>();
  private sequence=0;
  private emissions=0;
  private arrivals:number[]=[];
  completed=0;
  next():GatedEdge|undefined {let first:GatedEdge|undefined;for(const edge of this.edges.values())if(!first||edge.arrival<first.arrival-1e-10||(Math.abs(edge.arrival-first.arrival)<1e-10&&edge.order<first.order))first=edge;return first;}
  launch(scene:Scene,generator:Generator,session:string,time:number,beat:number,bpm:number):GatedEdge[]{
    const exits=exitsAt(scene,generator.vertex);
    const speed=MEAN_STRUT_LENGTH/(60/bpm/4);
    const emissionId=`${session}-e${++this.emissions}`;
    return this.depart(scene,{id:'',session,generatorId:generator.id,emissionId,emission:time,beat,from:generator.vertex,to:generator.vertex,departure:time,arrival:time,speed,hops:0,limit:generator.travel??8,order:0},exits,time);
  }
  arrive(edge:GatedEdge){
    this.arrivals=this.arrivals.filter(t=>t>edge.arrival-1+1e-10);
    if(this.arrivals.length>=LIMITS.gatedArrivals)throw Error('gated arrival limit exceeded');
    this.arrivals.push(edge.arrival);this.edges.delete(edge.id);this.completed++;
  }
  continue(scene:Scene,edge:GatedEdge):{children:GatedEdge[];reason:string|null}{
    const hops=edge.hops+1;
    if(edge.limit!=='infinite'&&hops>=edge.limit)return {children:[],reason:'travel limit'};
    const exits=exitsAt(scene,edge.to);
    if(!exits.length)return {children:[],reason:'all exits Off'};
    const children=this.depart(scene,{...edge,hops,triggerId:undefined},exits,edge.arrival);
    return {children,reason:exits.length>1?'split':null};
  }
  private depart(_scene:Scene,parent:GatedEdge,exits:number[],time:number):GatedEdge[]{
    if(this.edges.size+exits.length>LIMITS.gatedEdges)throw Error('gated edge limit exceeded');
    const children=exits.map(to=>{
      const order=++this.sequence;
      const arrival=time+seamDistance(parent.to,to)/parent.speed;
      if(!Number.isFinite(arrival)||arrival<=time||!Number.isSafeInteger(parent.hops))throw Error('invalid gated timing');
      const split=exits.length>1;
      return {...parent,id:!parent.id||split?`${parent.session}-b${order}`:parent.id,...(split&&parent.id?{parentId:parent.id}:{}),from:parent.to,to,departure:time,arrival,order};
    });
    for(const child of children)this.edges.set(child.id,child);
    return children;
  }
  removeSources(ids:readonly string[]):string[]{const removed:string[]=[];for(const [id,edge] of this.edges)if(ids.includes(edge.generatorId)){removed.push(id);this.edges.delete(id);}return removed;}
  clear(){this.edges.clear();this.arrivals=[];}
  reset(){this.clear();this.sequence=0;this.emissions=0;this.completed=0;}
  get arrivalWindow(){return this.arrivals.length;}
}
