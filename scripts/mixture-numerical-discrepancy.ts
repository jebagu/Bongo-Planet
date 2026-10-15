import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import {fixtureOracle,renderOracle,scalarVoice,type OracleVoice} from './mixture-timing-oracle';

// Diagnostic only. The nominal fixed-fidelity result is never modified.
const capture=path.resolve(process.argv[2]??'');
if(process.argv.length!==3)throw Error('Usage: mixture-numerical-discrepancy.ts <completed capture>');
const output=path.join(capture,'numerical-discrepancy.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite diagnostic');
const started=performance.now(),topSamples=16,rate=48000;
const result:any={title:'Bongo Planet dense numerical discrepancy diagnostic',status:'preparing',errors:[],qualificationPassed:false,acceptancePassed:false,actualIdentifiedGroups:null,topSamples,segments:[],ledger:[],
 limitations:['Observed event ledger is not actual acoustic onset identification.','Analytic ownership is not a retained direct snapshot of the production active array.','No alternate cursor, scalar arithmetic or fitted waveform hypothesis is evaluated.','Logical clock/phase differences are not a unique causal attribution or timing acceptance.'],limits:{seconds:120,residentBytes:256*1024*1024,scope:'Cooperative detected bounds; synchronous rendering checked before/after.'}};
function guard(){if(performance.now()-started>120000||process.memoryUsage().rss>256*1024*1024)throw Error('Cooperative diagnostic resource bound exceeded');}
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
async function hash(file:string){const h=createHash('sha256');for await(const bytes of fs.createReadStream(file)){h.update(bytes);guard();}return h.digest('hex');}
async function rows(file:string,consume:(row:any)=>void){for await(const line of readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity})){if(!line)throw Error('Empty retained row');consume(JSON.parse(line));guard();}}
function exactFinite(value:number){if(!Number.isFinite(value))throw Error('Nonfinite diagnostic scalar');return value;}
function stats(values:number[]){if(!values.length)return{count:0,min:null,max:null,maxAbs:null};return{count:values.length,min:Math.min(...values),max:Math.max(...values),maxAbs:Math.max(...values.map(Math.abs))};}
function analyticEmissions(scene:any,vertices:number[][],epoch:number,seconds:number){
 const emissions:{time:number;generator:any;order:number}[]=[];
 for(const[order,g]of scene.pieces.entries())if(g.kind==='generator'&&g.enabled){const period=g.period*60/scene.settings.bpm;for(let cycle=0;(cycle+g.phase)*period<seconds;cycle++)emissions.push({time:epoch+(cycle+g.phase)*period,generator:g,order});}
 emissions.sort((a,b)=>a.time-b.time||a.order-b.order);let sequence=0;const times=new Map<number,number>();
 for(const emission of emissions)for(const node of scene.pieces){if(node.kind==='generator')continue;const a=vertices[emission.generator.vertex],b=vertices[node.vertex],angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,x,i)=>sum+x*b[i],0))));if(angle<=emission.generator.reach*Math.PI/180+1e-9)times.set(++sequence,emission.time);}
 return times;
}
function soundDisagrees(tr:any,v:OracleVoice){return tr.sound.kind!==(v.kind==='sine'?'note':'beat')||tr.sound.duration!==v.duration||tr.sound.level!==v.level||(v.kind==='sine'?(tr.sound.timbre!=='sine'||tr.sound.frequency!==v.frequency):tr.sound.sound!=='kick');}
function rowCountIssue(count:number){return count===1?null:count===0?'missing':'duplicate';}
let fd:number|undefined;
try{
 const reportBytes=fs.readFileSync(path.join(capture,'report.json')),report=JSON.parse(reportBytes.toString());
 const auditBytes=fs.readFileSync(path.join(capture,'independent-audit.json')),audit=JSON.parse(auditBytes.toString());
 const fidelityBytes=fs.readFileSync(path.join(capture,'fixed-fidelity.json')),fidelity=JSON.parse(fidelityBytes.toString());
 if(!audit.captureIntegrityAuditPassed||audit.errors.length||fidelity.status!=='completed-fixed-fidelity-observation'||fidelity.errors.length||audit.bindings.reportSha256!==sha(reportBytes)||fidelity.bindings.report!==sha(reportBytes)||fidelity.bindings.audit!==sha(auditBytes))throw Error('Completed independent audit/fidelity/report binding absent');
 const files={metadata:path.join(capture,'quantums.jsonl'),events:path.join(capture,'events.jsonl'),raw:path.join(capture,'product-tap.f32'),input:path.join(capture,'virtual-input.f32'),oracle:'scripts/mixture-timing-oracle.ts',processor:path.join(capture,'application-source','src/audio/processor.ts'),synth:path.join(capture,'application-source','src/audio/synth.ts'),topology:path.join(capture,'topology.json'),helper:'scripts/mixture-numerical-discrepancy.ts'};
 // Captured source layout is bound explicitly; no current production imports.
 const hashes:any={report:sha(reportBytes),audit:sha(auditBytes),fixedFidelity:sha(fidelityBytes)};for(const[k,f]of Object.entries(files))hashes[k]=await hash(f);
 if(hashes.metadata!==audit.bindings.quantumsSha256||hashes.events!==audit.bindings.eventsSha256||hashes.raw!==audit['product-tap'].sha256||hashes.input!==audit['virtual-input'].sha256||hashes.oracle!==fidelity.bindings.oracle||hashes.topology!==fidelity.bindings.topology||hashes.processor!==report.sourceHashes['src/audio/processor.ts']||hashes.synth!==report.sourceHashes['src/audio/synth.ts'])throw Error('Retained source/raw/events binding mismatch');
 result.bindings=hashes;
 const meta:any[]=[];
 await rows(files.metadata,r=>{if(r.index!==meta.length||r.quantum!==128||r.sourceLength!==128||r.sourceOffset!==r.index*128)throw Error('Unmodified contiguous metadata required');meta.push({index:r.index,currentFrame:r.currentFrame,currentTime:r.currentTime,sourceOffset:r.sourceOffset,quantum:r.quantum});});
 const bySegment=new Map<number,{triggers:Map<number,any[]>,onsets:Map<number,any[]>}>();let eventIndex=0;
 await rows(files.events,r=>{if(r.independentEventIndex!==eventIndex++)throw Error('Original event index changed');if(r.event.type!=='trigger'&&r.event.type!=='onset')return;let segment=bySegment.get(r.segment);if(!segment){segment={triggers:new Map(),onsets:new Map()};bySegment.set(r.segment,segment);}const map=r.event.type==='trigger'?segment.triggers:segment.onsets,seq=r.event.trigger.sequence;const list=map.get(seq)??[];list.push({event:r.event});map.set(seq,list);});
 if(eventIndex!==report.stats.events)throw Error('Retained full event count mismatch');
 const vertices=JSON.parse(fs.readFileSync(files.topology,'utf8')).vertices;fd=fs.openSync(files.raw,'r');
 for(const[index,segment]of report.segments.slice(0,4).entries()){
  guard();const epoch=segment.firstEmission.event.time,first=segment.firstAnalysisObserverIndex,last=segment.lastAnalysisObserverIndex,prior=fidelity.segments[index];
  if(prior.epoch!==epoch||prior.firstOriginalIndex!==first||prior.lastOriginalIndex!==last||prior.samples!==(last-first+1)*128)throw Error('Original fidelity denominator changed');
  const scene=segment.scene,voices=fixtureOracle(scene,vertices,epoch,segment.seconds+.25,rate),declared=voices.filter(v=>v.onset<epoch+segment.seconds-1e-9),ledger=bySegment.get(index),emissionTimes=analyticEmissions(scene,vertices,epoch,segment.seconds+.25);
  if(!ledger)throw Error('Declared segment event ledger absent');
  const onsetDeltas:number[]=[],retainedOnsetDeltas:number[]=[],emissionDeltas:number[]=[],soundDifferences:any[]=[],identityDifferences:any[]=[],missing:any[]=[],duplicates:any[]=[];
  const expectedSequences=new Set(declared.map(v=>v.sequence));
  for(const v of declared){const triggerRows=ledger.triggers.get(v.sequence)??[],onsetRows=ledger.onsets.get(v.sequence)??[];
   const triggerIssue=rowCountIssue(triggerRows.length),onsetIssue=rowCountIssue(onsetRows.length);
   if(triggerIssue)(triggerRows.length?duplicates:missing).push({sequence:v.sequence,type:'trigger',rows:triggerRows.length});
   if(onsetIssue)(onsetRows.length?duplicates:missing).push({sequence:v.sequence,type:'onset',rows:onsetRows.length});
   if(onsetRows.length===1)retainedOnsetDeltas.push(exactFinite(onsetRows[0].event.trigger.onset-v.onset));
   if(triggerIssue)continue;
   const tr=triggerRows[0].event.trigger;if(tr.session!==segment.actualSessionNamespace||tr.generatorId!==v.generatorId||tr.nodeId!==v.nodeId)identityDifferences.push({sequence:v.sequence,actual:{session:tr.session,generatorId:tr.generatorId,nodeId:tr.nodeId},expected:{session:segment.actualSessionNamespace,generatorId:v.generatorId,nodeId:v.nodeId}});
   onsetDeltas.push(exactFinite(tr.onset-v.onset));
   const analyticEmission=emissionTimes.get(v.sequence);if(analyticEmission===undefined)throw Error('Independent sequence emission unavailable');
   emissionDeltas.push(exactFinite(tr.emission-analyticEmission));
   if(soundDisagrees(tr,v))soundDifferences.push({sequence:v.sequence,expected:{kind:v.kind,frequency:v.frequency,duration:v.duration,level:v.level},actual:tr.sound});
   if(onsetRows.some(r=>JSON.stringify(r.event.trigger)!==JSON.stringify(tr)))identityDifferences.push({sequence:v.sequence,type:'trigger/onset scalar mismatch'});
  }
  const extraTriggers=[...ledger.triggers].filter(([seq,list])=>!expectedSequences.has(seq)&&list.some(r=>r.event.trigger.onset<epoch+segment.seconds-1e-9)).map(([seq])=>seq);
  const extraOnsets=[...ledger.onsets].filter(([seq,list])=>!expectedSequences.has(seq)&&list.some(r=>r.event.trigger.onset<epoch+segment.seconds-1e-9)).map(([seq])=>seq);
  result.ledger.push({index,fixture:segment.fixture,declaredLogicalVoices:declared.length,matchedTriggerRows:onsetDeltas.length,matchedOnsetRows:retainedOnsetDeltas.length,declaredModelAudibleGroups:prior.modeledAudibleGroups,triggerOnsetDeltasSeconds:stats(onsetDeltas),retainedOnsetDeltasSeconds:stats(retainedOnsetDeltas),emissionDeltasSeconds:stats(emissionDeltas),missing,duplicates,extraTriggers,extraOnsets,soundDifferences,identityDifferences,scope:'Logical retained trigger/onset timestamps; not PCM onset identification.'});
  if(index<2)continue;
  const samples=(last-first+1)*128,firstFrame=meta[0].currentFrame+first*128,prediction=renderOracle(voices,firstFrame,samples,rate,scene.settings.volume);guard();
  const raw=Buffer.alloc(samples*4);let n=0;while(n<raw.length){const count=fs.readSync(fd,raw,n,raw.length-n,meta[first].sourceOffset*4+n);if(!count)throw Error('Truncated raw dense slice');n+=count;}
  if(sha(raw)!==prior.nominalSource.actualWindowSha256||sha(Buffer.from(prediction.buffer))!==prior.nominalSource.oracleWindowSha256)throw Error('Diagnostic nominal window differs from original fidelity');
  const top:{sample:number;error:number;actual:number;nominal:number}[]=[];let aboveStrictThreshold=0;
  for(let i=0;i<samples;i++){const actual=raw.readFloatLE(i*4),error=Math.abs(exactFinite(actual)-prediction[i]);if(error>1e-6)aboveStrictThreshold++;if(top.length<topSamples||error>top[top.length-1].error){top.push({sample:i,error,actual,nominal:prediction[i]});top.sort((a,b)=>b.error-a.error||a.sample-b.sample);if(top.length>topSamples)top.pop();}if(i%48000===0)guard();}
  const details:any[]=[];
  result.segments.push({index,fixture:segment.fixture,epoch,firstOriginalIndex:first,lastOriginalIndex:last,samples,aboveStrictThreshold,originalStrictCriterionMet:prior.nominalSource.agreementWithin1eMinus6,rawWindowSha256:sha(raw),oracleWindowSha256:sha(Buffer.from(prediction.buffer)),top:details});
  for(const p of top){
   const frame=firstFrame+p.sample,time=frame/rate,originalIndex=first+Math.floor(p.sample/128),withinBlock=p.sample%128,m=meta[originalIndex];
   const active=voices.filter(v=>v.admittedFrame<=frame&&v.removedFrame>frame&&v.onset+v.duration>time).sort((a,b)=>a.admittedFrame-b.admittedFrame||a.sequence-b.sequence);
   let sum=0;const ownership=active.map(v=>{const value=scalarVoice(v,time);sum+=value;return{sequence:v.sequence,generatorId:v.generatorId,nodeId:v.nodeId,onset:v.onset,retainedOnset:ledger.triggers.get(v.sequence)?.[0]?.event.trigger.onset??null,admittedFrame:v.admittedFrame,removedFrame:Number.isFinite(v.removedFrame)?v.removedFrame:null,kind:v.kind,frequency:v.frequency,duration:v.duration,level:v.level,ageSeconds:time-v.onset,scalarContribution:value};});
   const scalarReconstruction=Math.fround(.98*Math.tanh(sum*scene.settings.volume));
   details.push({...p,frame,ordinalTime:time,originalIndex,withinBlock,rawClock:{currentFrame:m.currentFrame,currentTime:m.currentTime,reportedTimeMinusOrdinalBlockStart:m.currentTime-(frame-withinBlock)/rate},scalarReconstruction,scalarReconstructionMatchesNominal:scalarReconstruction===p.nominal,activeOwnership:ownership,ownershipScope:'Analytic64-voice ownership; retained product active array not directly observed.'});
   if(scalarReconstruction!==p.nominal)throw Error('Top-sample scalar reconstruction differs from unchanged oracle');
  }
  console.log(JSON.stringify({fixture:segment.fixture,aboveStrictThreshold,largestError:top[0]?.error,qualificationPassed:false}));
 }
 result.status='completed-diagnostic-observation';
}catch(e){result.status='failed-or-incomplete';result.errors.push(String(e));process.exitCode=1;}
finally{if(fd!==undefined)fs.closeSync(fd);result.elapsedMonotonicSeconds=(performance.now()-started)/1000;result.memoryAtFinish=process.memoryUsage();try{guard();}catch(e){result.status='failed-or-incomplete';result.errors.push(String(e));process.exitCode=1;}fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,qualificationPassed:false}));}
