/** Nominal inventory only: no PCM read, timing fit, or actual ownership claim. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fixtureOracle,onsetGroups,erasedBeforeSound,type OracleGroup} from './mixture-timing-oracle';

const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const EXPECTED={F02:{voices:96,groups:32,erased:0},F03:{voices:36,groups:36,erased:0},F06:{voices:14080,groups:160,erased:7280},F08:{voices:40320,groups:240,erased:28200}};
const INPUTS={
 'report.json':'b374b5c7d75ff691fcd7d48e948d87277f91fb00a4df82e4ca5e9ea543df5a32',
 'independent-audit.json':'90f15e60165bc9c214c46b00a8ccd1009f69e508b3435ca941b279c422505205',
 'fixed-fidelity.json':'7856a166b195a203991a413f628e49acf206b7e81535a74a4bd9906bbd56cc70',
 'topology.json':'b729c2f07280a445416a805c1a816214e8f9ed4ced2bc2c1f65e44ce3b93c3f2',
};
const ORACLE_SHA='82a90a5254680efcaeb68e7584be1a8568ce9c0e1a23dced029d2560ab154551';

export function inventory(groups:readonly OracleGroup[],epoch:number){
 assert(Number.isFinite(epoch));assert(groups.length<=500);
 const seen=new Set<number>();let previous=-Infinity;
 return groups.map((group,index)=>{
  assert(Number.isFinite(group.onset)&&group.onset>=previous&&group.voices.length>0&&group.voices.length<=2048);previous=group.onset;
  const signatures:any[]=[];const keys=new Map<string,number>();let audible=0,erased=0,zeroLevel=0;
  const rows=group.voices.map(v=>{
   assert(Number.isSafeInteger(v.sequence)&&v.sequence>0&&!seen.has(v.sequence));seen.add(v.sequence);
   assert([v.onset,v.frequency,v.duration,v.level,v.admittedFrame].every(Number.isFinite));
   assert(Number.isSafeInteger(v.admittedFrame)&&(v.removedFrame===Infinity||Number.isSafeInteger(v.removedFrame)));
   assert(v.duration>0&&v.level>=0&&v.level<=1&&Math.abs(v.onset-group.onset)<1e-9);
   assert(v.kind==='sine'||v.kind==='kick');
   const removedBeforeSound=erasedBeforeSound(v),relativeOrigin=v.onset-group.onset;
   const key=JSON.stringify([v.kind,v.frequency,v.duration,v.level,relativeOrigin]);
   let signature=keys.get(key);if(signature===undefined){signature=signatures.length;keys.set(key,signature);signatures.push({kind:v.kind,frequency:v.frequency,duration:v.duration,level:v.level,relativeOrigin,logicalVoices:0,nominalAudibleVoices:0});}
   signatures[signature].logicalVoices++;
   if(removedBeforeSound)erased++;if(v.level===0)zeroLevel++;
   if(!removedBeforeSound&&v.level>0){audible++;signatures[signature].nominalAudibleVoices++;}
   return[v.sequence,v.generatorId,v.nodeId,relativeOrigin,signature,v.admittedFrame,v.removedFrame===Infinity?null:v.removedFrame,removedBeforeSound];
  });
  return{index,onset:group.onset,relativeOnset:group.onset-epoch,logicalVoices:rows.length,nominalAudibleVoices:audible,erasedBeforeSound:erased,zeroLevelVoices:zeroLevel,signatures,voices:rows,actualIdentified:false};
 });
}

async function run(output:string){
 assert(!fs.existsSync(output),'Refusing existing inventory output');fs.mkdirSync(output,{recursive:true});
 const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'evidence/step-05/original-mixture/binary-capture-01');
 const started=performance.now();let rss=0;
 const guard=()=>{rss=Math.max(rss,process.memoryUsage().rss);assert(performance.now()-started<=120000&&rss<=256*1024*1024,'Cooperative120s/256MiB inventory limit');};
 const result:any={title:'Bongo Planet complete nominal group inventory',qualificationPassed:false,actualIdentifiedGroups:null,status:'preparing',errors:[],segments:[],bindings:{},
  voiceColumns:['sequence','generatorId','nodeId','relativeOrigin','signatureIndex','nominalAdmittedFrame','nominalRemovedFrameOrNull','nominalErasedBeforeSound'],
  limits:{seconds:120,residentBytes:256*1024*1024,serializedBytes:16*1024*1024},
  limitations:['No PCM read, fitting, offset search, resampling or timing qualification.','Ownership/admission/removal are the unchanged analytic model, not observed processor state.','Null removed frame denotes no modeled ownership-steal removal; duration still expires the voice.','Signatures retain exact represented origin differences; identical nominal signals do not prove actual mono identity.','Prior raw integrity/fidelity evidence is hash-bound; large raw/container bytes are not reaudited here.']};
 try{
  const inputs:any={};for(const[name,expected]of Object.entries(INPUTS)){const bytes=fs.readFileSync(path.join(base,name));assert.equal(sha(bytes),expected);inputs[name]=JSON.parse(bytes.toString());result.bindings[name]=expected;guard();}
  assert.equal(sha(fs.readFileSync(path.join(root,'scripts/mixture-timing-oracle.ts'))),ORACLE_SHA);result.bindings.oracle=ORACLE_SHA;result.bindings.helper=sha(fs.readFileSync(import.meta.filename));
  assert(inputs['independent-audit.json'].captureIntegrityAuditPassed&&inputs['independent-audit.json'].errors.length===0);
  const report=inputs['report.json'],fidelity=inputs['fixed-fidelity.json'];assert.equal(fidelity.status,'completed-fixed-fidelity-observation');assert.deepEqual(fidelity.errors,[]);
  for(const [fixture,expected]of Object.entries(EXPECTED)){
   const segment=report.segments.find((s:any)=>s.fixture===fixture&&s.variant==='original-positive');assert(segment);
   const prior=fidelity.segments.find((s:any)=>s.index===segment.index);assert(prior&&prior.epoch===segment.transportEpochContextTime);
   const voices=fixtureOracle(segment.scene,inputs['topology.json'].vertices,segment.transportEpochContextTime,segment.seconds);guard();
   assert.equal(voices.length,expected.voices);const groups=inventory(onsetGroups(voices),segment.transportEpochContextTime);guard();assert.equal(groups.length,expected.groups);
   assert.equal(groups.reduce((n,g)=>n+g.erasedBeforeSound,0),expected.erased);assert(groups.every(g=>g.nominalAudibleVoices>0));
   const stallTargets=segment.stalls.map((stall:any)=>{
    const matched=groups.filter(g=>Math.abs(g.onset-stall.independentlyExpectedGroupOnset)<1e-9);assert.equal(matched.length,1);
    assert(stall.expectedGroupWithinActualContextStall===true&&matched[0].onset>=stall.startContextTime&&matched[0].onset<=stall.endContextTime);
    return{groupIndex:matched[0].index,declaredTarget:stall,nominalGroupVoices:matched[0].logicalVoices,scope:'Declared selected-generator target is retained; its voice count need not equal the entire coincident group.'};
   });
   result.segments.push({fixture,epoch:segment.transportEpochContextTime,seconds:segment.seconds,expected,groups,stallTargets});guard();
  }
  result.modeledGroups=result.segments.reduce((n:number,s:any)=>n+s.groups.length,0);assert.equal(result.modeledGroups,468);result.status='completed-nominal-inventory';
 }catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}
 try{guard();}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}result.elapsedMonotonicSeconds=(performance.now()-started)/1000;result.maximumObservedRss=rss;
 let bytes=Buffer.from(JSON.stringify(result)+'\n');if(bytes.length>16*1024*1024){result.status='failed-or-incomplete';result.errors.push('16MiB inventory retention cap');result.segments=result.segments.map((s:any)=>({...s,groups:undefined,unretainedGroups:s.groups.length}));process.exitCode=1;bytes=Buffer.from(JSON.stringify(result)+'\n');}
 try{guard();}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}result.elapsedMonotonicSeconds=(performance.now()-started)/1000;result.maximumObservedRss=rss;bytes=Buffer.from(JSON.stringify(result)+'\n');
 fs.writeFileSync(path.join(output,'inventory.json'),bytes,{flag:'wx'});console.log(JSON.stringify({status:result.status,modeledGroups:result.modeledGroups,bytes:bytes.length,errors:result.errors,qualificationPassed:false}));
}
function controls(){
 const voice={sequence:1,generatorId:'g',nodeId:'n',onset:1,kind:'sine' as const,frequency:440,duration:.5,level:.2,admittedFrame:47999,removedFrame:Infinity};
 const groups=inventory([{onset:1,voices:[voice,{...voice,sequence:2,nodeId:'m',removedFrame:48000},{...voice,sequence:3,nodeId:'zero',level:0}]}],1);
 assert.equal(groups[0].logicalVoices,3);assert.equal(groups[0].nominalAudibleVoices,1);assert.equal(groups[0].erasedBeforeSound,1);assert.equal(groups[0].zeroLevelVoices,1);assert.equal(groups[0].signatures.length,2);assert.equal(groups[0].voices[0][6],null);
 assert.throws(()=>inventory([{onset:1,voices:[voice,voice]}],1));assert.throws(()=>inventory([{onset:1,voices:[{...voice,onset:1.01}]}],1));assert.throws(()=>inventory([{onset:1,voices:[{...voice,removedFrame:NaN}]}],1));
 console.log(JSON.stringify({sourceControls:true,checks:4,actualPCMRead:false,qualificationPassed:false}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length===1&&args[0]==='--check')controls();else if(args.length===2&&args[0]==='--run')await run(path.resolve(args[1]));else throw Error('Usage: mixture-group-inventory.ts --check | --run <exclusive output>');
}
