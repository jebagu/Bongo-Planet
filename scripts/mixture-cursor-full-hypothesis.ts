import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {fixtureOracle,renderOracle,scalarVoice,type OracleVoice} from './mixture-timing-oracle';

const RATE=48000,QUANTUM=128;
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function renderHypothesis(voices:readonly OracleVoice[],firstFrame:number,samples:number,
  blockStarts:Float64Array,firstIndex:number,volume:number,guard:()=>void):Float32Array{
 const candidates=voices.filter(v=>v.onset*RATE<firstFrame+samples&&v.removedFrame>firstFrame&&(v.onset+v.duration)*RATE>firstFrame)
  .sort((a,b)=>a.admittedFrame-b.admittedFrame||a.sequence-b.sequence);
 const output=new Float32Array(samples);let cursor=0,active:OracleVoice[]=[];
 for(let sample=0;sample<samples;sample++){
  const frame=firstFrame+sample,time=blockStarts[firstIndex+Math.floor(sample/QUANTUM)]+sample%QUANTUM/RATE;
  if(!Number.isFinite(time))throw Error('Missing hypothesis block time');
  while(cursor<candidates.length&&candidates[cursor].admittedFrame<=frame)active.push(candidates[cursor++]);
  // Preserve original analytic ownership/removal; only the waveform time changes.
  active=active.filter(v=>frame<v.removedFrame&&frame/RATE<v.onset+v.duration);
  let mix=0;for(const voice of active)mix+=scalarVoice(voice,time);
  output[sample]=.98*Math.tanh(mix*volume);
  if(sample%48000===0)guard();
 }
 return output;
}
function compare(raw:Buffer,prediction:Float32Array,guard:()=>void){
 if(raw.length!==prediction.byteLength)throw Error('Sample denominator mismatch');
 let squares=0,maxAbs=0,mismatches=0,above1eMinus6=0;
 for(let i=0;i<prediction.length;i++){
  const actual=raw.readFloatLE(i*4),predicted=prediction[i];
  if(!Number.isFinite(actual)||!Number.isFinite(predicted))throw Error('Nonfinite sample');
  const error=actual-predicted;squares+=error*error;maxAbs=Math.max(maxAbs,Math.abs(error));
  if(actual!==predicted)mismatches++;if(Math.abs(error)>1e-6)above1eMinus6++;
  if(i%48000===0)guard();
 }
 return{samples:prediction.length,rms:Math.sqrt(squares/prediction.length),maxAbs,mismatchSamples:mismatches,above1eMinus6,
  rawWindowSha256:sha(raw),hypothesisWindowSha256:sha(Buffer.from(prediction.buffer,prediction.byteOffset,prediction.byteLength))};
}
async function run(directory:string){
 const output=path.join(directory,'cursor-full-hypothesis.json');if(fs.existsSync(output))throw Error('Refusing to overwrite evidence');
 const started=performance.now();let fd:number|undefined,maxObservedRss=0;
 const guard=()=>{maxObservedRss=Math.max(maxObservedRss,process.memoryUsage().rss);if(performance.now()-started>120000||maxObservedRss>256*1024*1024)throw Error('Cooperative120s/256MiB hypothesis bound exceeded');};
 const digest=async(file:string)=>{const h=createHash('sha256');for await(const bytes of fs.createReadStream(file)){h.update(bytes);guard();}return h.digest('hex');};
 const result:any={title:'Bongo Planet full-window declared cursor hypothesis',status:'preparing',errors:[],qualificationPassed:false,acceptancePassed:false,actualIdentifiedGroups:null,segments:[],
  limits:{seconds:120,residentBytes:256*1024*1024},
  limitations:['The initial processor history is unknown; seed is the first raw observer clock, not chosen from PCM.',
   'Block-only recurrence omits the production engine/command clock floor.',
   'Original analytic admission, ownership and removal are preserved; the actual active array was not observed.',
   'Full-window agreement supports this numerical hypothesis without establishing unique causality or acoustic onsets.',
   'Original fixed-fidelity failures remain unchanged. No production code, calibration, sample, epoch or threshold is altered.']};
 try{
  const read=(name:string)=>fs.readFileSync(path.join(directory,name));
  const reportBytes=read('report.json'),report=JSON.parse(reportBytes.toString()),auditBytes=read('independent-audit.json'),audit=JSON.parse(auditBytes.toString()),fidelityBytes=read('fixed-fidelity.json'),fidelity=JSON.parse(fidelityBytes.toString());
  if(!audit.captureIntegrityAuditPassed||audit.errors.length||audit.bindings.reportSha256!==sha(reportBytes)||fidelity.status!=='completed-fixed-fidelity-observation'||fidelity.errors.length||fidelity.bindings.audit!==sha(auditBytes)||fidelity.bindings.report!==sha(reportBytes))throw Error('Prior immutable evidence bindings absent');
  const files={metadata:path.join(directory,'quantums.jsonl'),raw:path.join(directory,'product-tap.f32'),topology:path.join(directory,'topology.json'),oracle:'scripts/mixture-timing-oracle.ts',processor:path.join(directory,'application-source/src/audio/processor.ts'),helper:'scripts/mixture-cursor-full-hypothesis.ts'};
  const bindings:any={report:sha(reportBytes),audit:sha(auditBytes),fidelity:sha(fidelityBytes)};
  for(const[key,file]of Object.entries(files))bindings[key]=await digest(file);
  if(bindings.metadata!==audit.bindings.quantumsSha256||bindings.raw!==audit['product-tap'].sha256||bindings.topology!==fidelity.bindings.topology||bindings.oracle!==fidelity.bindings.oracle||bindings.processor!==report.sourceHashes['src/audio/processor.ts'])throw Error('Raw/metadata/source bindings changed');result.bindings=bindings;
  const count=report.stats.blocks;if(!Number.isSafeInteger(count)||count<1||count>100000)throw Error('Metadata capacity');
  const starts=new Float64Array(count);let index=0,previousEnd:number|undefined,baseFrame:number|undefined,minDelta=Infinity,maxDelta=-Infinity;
  for await(const line of readline.createInterface({input:fs.createReadStream(files.metadata),crlfDelay:Infinity})){
   const r=JSON.parse(line);if(r.index!==index||index>=count||r.quantum!==QUANTUM||r.sourceLength!==QUANTUM||r.sourceOffset!==index*QUANTUM||!Number.isSafeInteger(r.currentFrame)||!Number.isFinite(r.currentTime))throw Error('Original metadata mapping invalid');
   baseFrame??=r.currentFrame;const cursor=Math.max(r.currentTime,previousEnd??r.currentTime);
   if(cursor-r.currentTime>.02+.01/RATE)throw Error('Hypothesis exceeds existing backward-clock policy');
   starts[index]=cursor;previousEnd=cursor+QUANTUM/RATE;
   const delta=cursor-(baseFrame!+index*QUANTUM)/RATE;minDelta=Math.min(minDelta,delta);maxDelta=Math.max(maxDelta,delta);
   if(index===0)result.initialState={seedRawContextTime:r.currentTime,unknownEarlierProcessorHistory:true};index++;guard();
  }
  if(index!==count||index!==audit.metadata.blocks)throw Error('Metadata denominator mismatch');
  result.metadataBlocks=index;result.cursorDeltaSeconds={min:minDelta,max:maxDelta};
  const vertices=JSON.parse(read('topology.json').toString()).vertices;fd=fs.openSync(files.raw,'r');
  for(let s=0;s<4;s++){
   guard();const segment=report.segments[s],prior=fidelity.segments[s],first=segment.firstAnalysisObserverIndex,last=segment.lastAnalysisObserverIndex,epoch=segment.firstEmission.event.time,samples=(last-first+1)*QUANTUM,firstFrame=baseFrame!+first*QUANTUM;
   if(prior.index!==s||prior.epoch!==epoch||prior.firstOriginalIndex!==first||prior.lastOriginalIndex!==last||prior.samples!==samples||first<0||last>=count)throw Error('Original fixed window changed');
   const voices=fixtureOracle(segment.scene,vertices,epoch,segment.seconds+.25,RATE);
   const nominal=renderOracle(voices,firstFrame,samples,RATE,segment.scene.settings.volume);guard();
   if(sha(Buffer.from(nominal.buffer))!==prior.nominalSource.oracleWindowSha256)throw Error('Unchanged nominal oracle differs');
   const raw=Buffer.alloc(samples*4);let n=0;while(n<raw.length){const got=fs.readSync(fd,raw,n,raw.length-n,first*QUANTUM*4+n);if(!got)throw Error('Raw window truncated');n+=got;}
   if(sha(raw)!==prior.nominalSource.actualWindowSha256)throw Error('Raw window changed');
   const predicted=renderHypothesis(voices,firstFrame,samples,starts,first,segment.scene.settings.volume,guard),comparison=compare(raw,predicted,guard);
   result.segments.push({index:s,fixture:segment.fixture,epoch,firstOriginalIndex:first,lastOriginalIndex:last,samples,nominal:{rms:prior.nominalSource.rms,maxAbs:prior.nominalSource.maxAbs,agreementWithin1eMinus6:prior.nominalSource.agreementWithin1eMinus6},hypothesis:comparison,qualificationPassed:false});
   console.log(JSON.stringify({fixture:segment.fixture,hypothesisMaxAbs:comparison.maxAbs,samples,qualificationPassed:false}));
  }
  if(result.segments.reduce((n:number,s:any)=>n+s.samples,0)!==6144384)throw Error('Full positive denominator changed');
  result.status='completed-full-window-hypothesis';
 }catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}
 finally{
  if(fd!==undefined)fs.closeSync(fd);result.elapsedMonotonicSeconds=(performance.now()-started)/1000;result.memoryAtFinish=process.memoryUsage();
  try{guard();}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}result.maxObservedRss=maxObservedRss;
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,qualificationPassed:false}));
 }
}
function controls(output:string){
 if(fs.existsSync(output))throw Error('Refusing to overwrite controls');
 const voice:OracleVoice={sequence:1,generatorId:'g',nodeId:'n',onset:0,kind:'sine',frequency:440,duration:1,level:.5,admittedFrame:0,removedFrame:Infinity};
 const starts=Float64Array.from([0,128/RATE]);
 assert.deepEqual(renderHypothesis([voice],0,256,starts,0,.65,()=>{}),Float32Array.from({length:256},(_,i)=>Math.fround(.98*Math.tanh(scalarVoice(voice,starts[Math.floor(i/128)]+i%128/RATE)*.65))));
 const changed=Float64Array.from([0,.003]);const predicted=renderHypothesis([voice],0,256,changed,0,.65,()=>{});assert.equal(predicted[129],Math.fround(.98*Math.tanh(scalarVoice(voice,.003+1/RATE)*.65)));
 const removed={...voice,removedFrame:128};assert.equal(renderHypothesis([removed],0,256,changed,0,.65,()=>{})[129],0);
 const raw=Buffer.alloc(12);raw.writeFloatLE(0,0);raw.writeFloatLE(.25,4);raw.writeFloatLE(-.5,8);const c=compare(raw,Float32Array.from([0,.25,-.5]),()=>{});assert.equal(c.mismatchSamples,0);assert.equal(c.maxAbs,0);
 fs.writeFileSync(output,JSON.stringify({title:'Bongo Planet full cursor source controls',sourceOnly:true,helperSha256:sha(fs.readFileSync('scripts/mixture-cursor-full-hypothesis.ts')),checks:['block-plus-within-block arithmetic','declared changed time','original removal retained','comparison exactness'],passed:true,qualificationPassed:false},null,2)+'\n',{flag:'wx'});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length===4&&process.argv[2]==='--controls')controls(path.resolve(process.argv[3]));
 else if(process.argv.length===3)await run(path.resolve(process.argv[2]));
 else throw Error('Usage: mixture-cursor-full-hypothesis.ts <capture> | --controls <new file>');
}
