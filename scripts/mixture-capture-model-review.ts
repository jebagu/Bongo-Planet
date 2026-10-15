import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fixtureOracle, onsetGroups, erasedBeforeSound, renderOracle} from './mixture-timing-oracle';
import type {Scene} from '../src/core/contracts';

// Diagnostic forward fidelity at an independently declared epoch. No offset
// search, peak alignment, resampling or individual-arrival qualification.
const directory=path.resolve(process.argv[2]??'');
if(!process.argv[2])throw Error('Provide a completed mixture capture directory');
const output=path.join(directory,'forward-model-review.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite model evidence');
const reportBytes=fs.readFileSync(path.join(directory,'report.json'));
const report=JSON.parse(reportBytes.toString());
if(report.status!=='captured-observation'||!report.captureErrorFree||!report.browserClosed||!report.serverClosed)throw Error('Capture is not complete, error-free and cleaned up');
const metadataBytes=fs.readFileSync(path.join(directory,'quantums.jsonl'));
const rows=metadataBytes.toString().trim().split('\n').map(line=>JSON.parse(line));
const sourceBytes=fs.readFileSync(path.join(directory,'product-tap.f32'));
const vertices=JSON.parse(fs.readFileSync(path.join(directory,'topology.json'),'utf8')).vertices;
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const auditBytes=fs.readFileSync(path.join(directory,'capture-audit.json'));
const audit=JSON.parse(auditBytes.toString());
if(!audit.captureIntegrityAuditPassed||audit.errors.length||audit.bindings.reportSha256!==hash(reportBytes)||audit.bindings.quantumsSha256!==hash(metadataBytes)||audit['product-tap'].sha256!==hash(sourceBytes))throw Error('Successful capture audit does not bind these original artifacts');
const baseFrame=rows[0].currentFrame;
if(rows.some((row,index)=>row.index!==index||row.quantum!==128))throw Error('Original observer index/quantum discontinuity');
const frameResiduals=rows.map(row=>row.currentFrame-(baseFrame+row.index*128));
const result:any={title:'Bongo Planet full original forward-mixture readback',qualificationPassed:false,acceptancePassed:false,
 method:'Fixed independent first-emission epoch and original observer sample order; no fitted product offset.',
 sourceRawSha256:hash(sourceBytes),captureAuditSha256:hash(auditBytes),oracleSha256:hash(fs.readFileSync('scripts/mixture-timing-oracle.ts')),
 reviewerSha256:hash(fs.readFileSync('scripts/mixture-capture-model-review.ts')),
 originalFrameResidualSamples:{min:Math.min(...frameResiduals),max:Math.max(...frameResiduals)},segments:[],
 limitations:['Forward PCM equality is model fidelity, not global uniqueness of individual entrances.',
 'A mono mixture cannot identify erased voices or distinguish every duplicate/identity alternative.',
 'Independent native calibration and input-path audit are separate; no product-derived latency fit is used.']};
for(const segment of report.segments){
 const scene=segment.scene as Scene,epoch=segment.transportEpochContextTime,rate=48000;
 const first=segment.firstAnalysisObserverIndex,last=segment.lastAnalysisObserverIndex;
 const audited=audit.segments[segment.index];
 if(!audited||audited.index!==segment.index||audited.coverage.firstOriginalIndex!==first||audited.coverage.lastOriginalIndex!==last||audited.coverage.startContextTime!==epoch||audited.coverage.endContextTime!==epoch+segment.seconds||segment.firstEmission.event.time!==epoch)throw Error('Model denominator or epoch differs from independent full-window audit');
 if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<first||last>=rows.length)throw Error('Missing full fixed analysis denominator');
 const selected=rows.slice(first,last+1);
 if(selected.length!==last-first+1)throw Error('Truncated full fixed analysis denominator');
 if(selected.some((row,index)=>row.sourceLength!==128||row.inputLength!==128||row.sourceOffset!==selected[0].sourceOffset+index*128))throw Error('Incomplete original analysis path');
 const firstFrame=baseFrame+first*128,samples=selected.length*128;
 // Include actual neighboring voices in the retained tail; count only the
 // fixed declared analysis window. A boundary group cannot omit its neighbors.
 const voices=fixtureOracle(scene,vertices,epoch,segment.seconds+.25,rate);
 const predicted=renderOracle(voices,firstFrame,samples,rate,scene.settings.volume);
 let sum=0,max=0,nonfinite=0,mismatchSamples=0;
 for(let i=0;i<samples;i++){
  const actual=sourceBytes.readFloatLE((selected[0].sourceOffset+i)*4),difference=actual-predicted[i];
  if(!Number.isFinite(actual)||!Number.isFinite(predicted[i]))nonfinite++;
  sum+=difference*difference;max=Math.max(max,Math.abs(difference));if(actual!==predicted[i])mismatchSamples++;
 }
 const groups=onsetGroups(voices).filter(group=>group.onset<epoch+segment.seconds-1e-9);
 const declaredVoices=voices.filter(voice=>voice.onset<epoch+segment.seconds-1e-9);
 result.segments.push({index:segment.index,fixture:segment.fixture,variant:segment.variant,
  firstOriginalIndex:first,lastOriginalIndex:last,firstFrame,samples,declaredSeconds:segment.seconds,
  transportEpochFrame:segment.transportEpochFrame,epochRoundingResidualSamples:epoch*rate-segment.transportEpochFrame,
  originalLogicalVoices:declaredVoices.length,originalGroups:groups.length,
  intentionallyErasedBeforeSound:declaredVoices.filter(voice=>erasedBeforeSound(voice,rate)).length,
  groupsWithModeledAudibleSurvivor:groups.filter(group=>group.voices.some(voice=>voice.level>0&&!erasedBeforeSound(voice,rate))).length,
  nominalRmsDifference:Math.sqrt(sum/samples),nominalMaxDifference:max,mismatchSamples,nonfiniteSamples:nonfinite,
  nominalForwardFidelityWithin1eMinus6:nonfinite===0&&Math.sqrt(sum/samples)<=1e-6,
  modeledGroups:groups.map(group=>({expectedOnset:group.onset,logicalVoices:group.voices.length,
   survivors:group.voices.filter(voice=>voice.level>0&&!erasedBeforeSound(voice,rate)).length,
   expectedOnsetInsideMeasuredStall:segment.stalls.some((stall:any)=>stall.startContextTime<=group.onset&&group.onset<=stall.endContextTime)})),
  qualificationPassed:false});
}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,segments:result.segments.map(({index,nominalRmsDifference,originalGroups,groupsWithModeledAudibleSurvivor}:any)=>({index,nominalRmsDifference,originalGroups,groupsWithModeledAudibleSurvivor})),qualificationPassed:false}));
