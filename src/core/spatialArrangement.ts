import layouts from '../../assets/wraparound-layouts.json' with {type:'json'};
import {validateScene,type Piece,type Scene,type Wiring} from './contracts';
import {topology,angle} from './geometry';
import {labelPieces} from './pieceLabels';

type SpatialLayout={paths?:number[][];additions?:Piece[];wiring?:Wiring};
const arrangements=layouts as unknown as Record<string,SpatialLayout>;

/** Authored preset layouts only: preserve every existing musical field and
 * each lane's hop count while changing its embedding on the sphere. */
export function spatialArrangement(scene:Scene,id:string):Scene {
  const layout=arrangements[id];
  if(!layout)return scene;
  const next=structuredClone(scene);
  if(layout.paths) {
    const gates=new Map(next.wiring!.map(record=>[record.vertex,record.exits]));
    const sources=next.pieces.filter(piece=>piece.kind==='generator');
    if(sources.length!==layout.paths.length)throw Error(`${id}: spatial lane count changed.`);
    const mapping=new Map<number,number>(),destinations=new Set<number>();
    for(const [lane,source] of sources.entries()) {
      const oldPath=[source.vertex],seen=new Set(oldPath);
      while(gates.get(oldPath.at(-1)!)?.length) {
        const exits=gates.get(oldPath.at(-1)!)!;
        if(exits.length!==1||seen.has(exits[0]))throw Error(`${id}: spatial lane must be a finite unbranched path.`);
        oldPath.push(exits[0]);seen.add(exits[0]);
      }
      const path=layout.paths[lane];
      if(path.length!==oldPath.length)throw Error(`${id}: spatial path would change musical timing.`);
      for(const [step,vertex] of path.entries()) {
        if(destinations.has(vertex)||mapping.has(oldPath[step]))throw Error(`${id}: spatial lanes must remain disjoint.`);
        if(step&&!topology.neighbors[path[step-1]].includes(vertex))throw Error(`${id}: spatial route must follow adjacent struts.`);
        destinations.add(vertex);mapping.set(oldPath[step],vertex);
      }
    }
    const relocated=(vertex:number)=>{
      const destination=mapping.get(vertex);
      if(destination===undefined)throw Error(`${id}: musical junction is outside its spatial lanes.`);
      return destination;
    };
    next.pieces=next.pieces.map(piece=>({...piece,vertex:relocated(piece.vertex)}));
    next.wiring=next.wiring!.map(record=>({vertex:relocated(record.vertex),exits:record.exits.map(relocated)}));
  }
  const wiring=new Map(next.wiring!.map(record=>[record.vertex,new Set(record.exits)]));
  for(const record of layout.wiring??[]) {
    const exits=wiring.get(record.vertex)??new Set<number>();
    for(const exit of record.exits)exits.add(exit);
    wiring.set(record.vertex,exits);
  }
  for(const piece of layout.additions??[]) {
    if(next.pieces.some(existing=>existing.id===piece.id||existing.vertex===piece.vertex))throw Error(`${id}: a spatial reply must have a free junction and a new identity.`);
    next.pieces.push({...piece});
    if(!wiring.has(piece.vertex))wiring.set(piece.vertex,new Set());
  }
  next.wiring=[...wiring].map(([vertex,exits])=>({vertex,exits:[...exits].sort((a,b)=>a-b)})).sort((a,b)=>a.vertex-b.vertex);
  return validateScene(labelPieces(next));
}

/** Coverage at all 92 mesh junctions; this is not a continuous-surface bound. */
export function spatialCoverage(scene:Scene) {
  const locations=[...new Set(scene.pieces.filter(piece=>piece.kind!=='generator').map(piece=>piece.vertex))];
  if(!locations.length)return {soundingLocations:0,largestGapDegrees:180};
  const largestGap=Math.max(...topology.vertices.map(point=>Math.min(...locations.map(vertex=>angle(point,topology.vertices[vertex])))));
  return {soundingLocations:locations.length,largestGapDegrees:largestGap*180/Math.PI};
}
