import * as THREE from 'three';
import { gateMarks,type GateMark } from './SparkGateModel';
import type { Scene } from '../core/contracts';
import { DEFAULT_SWITCH_LOOK,type SwitchLook } from './art/appearance';
import { emptyScene } from '../core/contracts';

/** Five shared instanced primitives draw every mark; styles never allocate per gate. */
export class SparkGateRenderer extends THREE.Group{
 private dots=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshStandardMaterial({roughness:.8}),1080);
 private dotOutline=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshStandardMaterial({color:'#35312c',roughness:1}),1080);
 private arms=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10),new THREE.MeshStandardMaterial({roughness:.7}),540);
 private outline=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10),new THREE.MeshStandardMaterial({color:'#35312c',roughness:1}),540);
 private tips=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,3),new THREE.MeshStandardMaterial({color:'#35312c'}),540);
 marks:GateMark[]=[];
 private look:SwitchLook={...DEFAULT_SWITCH_LOOK};
 private scene:Scene|null=null;private selected:number|null=null;
 private changed=new Map<string,{time:number;old:boolean}>();
 private passages=new Map<number,number>();
 constructor(){super();for(const mesh of [this.dotOutline,this.dots,this.outline,this.arms,this.tips]){mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.add(mesh);}}
 setScene(scene:Scene,selected:number|null,time:number){const next=gateMarks(scene,selected),old=new Map(this.marks.map(m=>[m.id,m.on]));for(const m of next)if(old.has(m.id)&&old.get(m.id)!==m.on)this.changed.set(m.id,{time,old:old.get(m.id)!});this.marks=next;this.scene=scene;this.selected=selected;}
 setLook(look:SwitchLook){this.look={...look};}
 passage(vertex:number,time:number){this.passages.set(vertex,time);}
 private composeMatrix(point:THREE.Vector3,scale:THREE.Vector3,rotation=new THREE.Quaternion()){return new THREE.Matrix4().compose(point,rotation,scale);}
 private rod(mesh:THREE.InstancedMesh,index:number,a:THREE.Vector3,b:THREE.Vector3,radius:number){const delta=b.clone().sub(a),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());mesh.setMatrixAt(index,this.composeMatrix(a.clone().add(b).multiplyScalar(.5),new THREE.Vector3(radius,delta.length(),radius),rotation));}
 update(time:number,reduced:boolean,wallTime=time){
  const look=this.look,toy=look.style==='toy',glow=look.style==='glow';let count=0;
  for(const m of this.marks){
   const from=new THREE.Vector3(...m.from),to=new THREE.Vector3(...m.to),axis=to.clone().sub(from).normalize(),normal=from.clone().add(to).normalize(),side=new THREE.Vector3().crossVectors(normal,axis).normalize();
   const size=look.size*(m.selected?1:.64),length=.053*size,radius=(toy?.007:glow?.0035:.005)*look.stroke*size;
   const center=new THREE.Vector3(...m.point).addScaledVector(normal,.008);
   const left=center.clone().addScaledVector(axis,-length/2),right=center.clone().addScaledVector(axis,length/2);
   let open=m.on?0:1;
   const change=this.changed.get(m.id);if(change){const elapsed=wallTime-change.time;if(elapsed>.16||reduced||!look.animation)this.changed.delete(m.id);else open=(change.old?0:1)+(open-(change.old?0:1))*Math.max(0,elapsed/.16);}
   // Fixed unevenness is indexed by directed gate ID, never randomized per frame.
   const uneven=look.style==='ink'?((m.vertex*7+m.exit*13)%5-2)*.0007:0;
   const tip=right.clone().addScaledVector(side,length*.62*open+uneven).addScaledVector(normal,.007*open);
   const color=new THREE.Color(m.on?look.onColor:look.offColor);if(!m.selected)color.lerp(new THREE.Color('#9b988b'),.55);
   const passage=this.passages.get(m.vertex),response=look.animation&&!reduced&&passage!==undefined?Math.max(0,1-(time-passage)/.2):0;
   if(passage!==undefined&&time-passage>.3)this.passages.delete(m.vertex);
   color.lerp(new THREE.Color('#fff7d0'),Math.max(0,response)*.35);
   const beadRadius=(toy?.0095:.007)*look.stroke*size;
   for(const [j,p] of [left,right].entries()){this.dotOutline.setMatrixAt(count*2+j,this.composeMatrix(p,new THREE.Vector3().setScalar(beadRadius*1.4)));this.dots.setMatrixAt(count*2+j,this.composeMatrix(p.clone().addScaledVector(normal,.003),new THREE.Vector3().setScalar(beadRadius)));this.dots.setColorAt(count*2+j,color);}
   this.rod(this.outline,count,left,tip,radius*1.45);this.rod(this.arms,count,left.clone().addScaledVector(normal,.003),tip.clone().addScaledVector(normal,.003),radius);this.arms.setColorAt(count,color);
   const directionPoint=right.clone().addScaledVector(axis,.015*size);this.tips.setMatrixAt(count,this.composeMatrix(directionPoint,new THREE.Vector3(.009,.018,.004).multiplyScalar(size),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis)));
   count++;
  }
  this.dots.count=this.dotOutline.count=count*2;this.arms.count=this.outline.count=this.tips.count=count;
  for(const mesh of [this.dots,this.dotOutline,this.arms,this.outline,this.tips]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  for(const mesh of [this.dots,this.arms]){mesh.material.roughness=toy?.3:.8;mesh.material.emissive.set(glow?'#fff4cf':'#ffeab3');mesh.material.emissiveIntensity=look.glow*(glow?.65:.12);}
 }
 get diagnostics(){return {style:this.look.style,marks:this.marks.length,selected:this.selected,geometries:5,materials:5,animation:this.look.animation,look:{...this.look}};}
 dispose(){for(const mesh of [this.dots,this.dotOutline,this.arms,this.outline,this.tips]){mesh.geometry.dispose();mesh.material.dispose();}this.removeFromParent();this.changed.clear();this.passages.clear();}
}
/** Render the actual switch objects into the three small style buttons. */
export function renderGatePreviews(look:SwitchLook):Record<SwitchLook['style'],string>{
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(220,100);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),gates=new SparkGateRenderer(),composition=emptyScene();composition.wiring=[{vertex:44,exits:[46]},{vertex:46,exits:[]}];gates.setScene(composition,44,0);gates.marks=gates.marks.filter(m=>m.id==='44>46'||m.id==='46>44');gates.marks.forEach(m=>m.selected=true);
 const a=new THREE.Vector3(...gates.marks[0].from),b=new THREE.Vector3(...gates.marks[0].to),center=a.clone().add(b).multiplyScalar(.5),normal=center.clone().normalize();
 const camera=new THREE.OrthographicCamera(-.24,.24,.11,-.11,.01,10);camera.position.copy(center).addScaledVector(normal,2);camera.up.copy(new THREE.Vector3().crossVectors(normal,b.clone().sub(a)).normalize());camera.lookAt(center);
 scene.add(new THREE.AmbientLight('#ffffff',2),gates);const light=new THREE.DirectionalLight('#ffffff',3);light.position.copy(camera.position);scene.add(light);
 const lineGeometry=new THREE.BufferGeometry().setFromPoints([a,b]),lineMaterial=new THREE.LineBasicMaterial({color:'#a5a18e'});scene.add(new THREE.Line(lineGeometry,lineMaterial));
 const result={} as Record<SwitchLook['style'],string>;
 for(const style of ['ink','toy','glow'] as const){gates.setLook({...look,style,size:1.4});gates.update(1,true);renderer.render(scene,camera);result[style]=renderer.domElement.toDataURL('image/png');}
 gates.dispose();lineGeometry.dispose();lineMaterial.dispose();renderer.dispose();renderer.forceContextLoss();return result;
}
