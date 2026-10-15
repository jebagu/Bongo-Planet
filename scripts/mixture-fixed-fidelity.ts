import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import {fixtureOracle, onsetGroups, erasedBeforeSound, renderOracle} from './mixture-timing-oracle';
import type {Scene} from '../src/core/contracts';

// Read-only model fidelity at independently retained epochs. No onset fitting,
// offset search, PCM repair, reordering, group qualification or browser launch.
const args=process.argv.slice(2);
if(args.length!==3||args[1]!=='--audit')throw Error('Usage: mixture-fixed-fidelity.ts <completed capture> --audit <independent-audit.json>');
const root=path.resolve(args[0]),auditPath=path.resolve(args[2]),output=path.join(root,'fixed-fidelity.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite any analysis');
const reportBytes=fs.readFileSync(path.join(root,'report.json')),report=JSON.parse(reportBytes.toString());
const auditBytes=fs.readFileSync(auditPath),audit=JSON.parse(auditBytes.toString());
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const started=performance.now(),maxSeconds=120,maxResidentBytes=256*1024*1024;
function guard(){if(performance.now()-started>maxSeconds*1000)throw Error('Analysis120s runtime bound');if(process.memoryUsage().rss>maxResidentBytes)throw Error('Analysis256MiB resident bound');}
async function digest(file:string){const h=createHash('sha256');for await(const bytes of fs.createReadStream(file)){h.update(bytes);guard();}return h.digest('hex');}
const result:any={title:'Bongo Planet fixed-epoch full-mixture fidelity',qualificationPassed:false,acceptancePassed:false,status:'preparing',limits:{maxSeconds,maxResidentBytes},errors:[],segments:[],
 scope:'Full retained sample comparison at fixed original emission epochs; independent native route only. Not actual onset identification.',
 limitations:['A nominal oracle match cannot prove uniqueness among differing identities, saturated duplicates or all alternative onset models.','Observed native calibration endpoints and sampled raw path equality do not establish an unsampled continuum or physical-speaker latency.','Negative100ms is a separately predeclared graph hypothesis, never a fitted/recentered product calibration.','No group entrance-family search or acoustic missing/duplicate qualification is performed.']};
const sourceFd=fs.openSync(path.join(root,'product-tap.f32'),'r'),inputFd=fs.openSync(path.join(root,'virtual-input.f32'),'r');
function read(fd:number,sampleOffset:number,samples:number){if(!Number.isSafeInteger(sampleOffset)||sampleOffset<0||!Number.isSafeInteger(samples)||samples<1)throw Error('Invalid unmodified sample slice');const bytes=Buffer.alloc(samples*4);let n=0;while(n<bytes.length){const count=fs.readSync(fd,bytes,n,bytes.length-n,sampleOffset*4+n);if(!count)throw Error('Raw window is truncated');n+=count;}return bytes;}
function compare(actual:Buffer,expected:Float32Array){if(actual.length!==expected.length*4||!expected.length)throw Error('Comparison denominator mismatch');let squares=0,maxAbs=0,mismatches=0;for(let i=0;i<expected.length;i++){const value=actual.readFloatLE(i*4),predicted=expected[i];if(!Number.isFinite(value)||!Number.isFinite(predicted))throw Error('Nonfinite full-window comparison');const d=value-predicted;squares+=d*d;maxAbs=Math.max(maxAbs,Math.abs(d));if(value!==predicted)mismatches++;if(i%48000===0)guard();}return{samples:expected.length,rms:Math.sqrt(squares/expected.length),maxAbs,mismatchSamples:mismatches,agreementWithin1eMinus6:Math.sqrt(squares/expected.length)<=1e-6&&maxAbs<=1e-6,actualWindowSha256:sha(actual),oracleWindowSha256:sha(Buffer.from(expected.buffer,expected.byteOffset,expected.byteLength))};}
try{
 if(report.status!=='captured-observation'||!report.captureErrorFree||!report.browserClosed||!report.browserProcessClosed||!report.serverClosed||!report.socketServerClosed||report.errors.length)throw Error('Capture did not complete/clean up without error');
 if(!audit.captureIntegrityAuditPassed||!Array.isArray(audit.errors)||audit.errors.length||audit.bindings?.reportSha256!==sha(reportBytes))throw Error('Successful independent audit does not bind this original report');
 const files={quantums:path.join(root,'quantums.jsonl'),source:path.join(root,'product-tap.f32'),input:path.join(root,'virtual-input.f32'),oracle:'scripts/mixture-timing-oracle.ts',topology:path.join(root,'topology.json')};
 const hashes={audit:sha(auditBytes),report:sha(reportBytes),quantums:await digest(files.quantums),source:await digest(files.source),input:await digest(files.input),oracle:await digest(files.oracle),topology:await digest(files.topology),helper:await digest('scripts/mixture-fixed-fidelity.ts')};
 if(audit.bindings.quantumsSha256!==hashes.quantums||audit['product-tap']?.sha256!==hashes.source||audit['virtual-input']?.sha256!==hashes.input||report.sourceHashes['scripts/mixture-timing-oracle.ts']!==hashes.oracle||report.topologySha256!==hashes.topology)throw Error('Independent audit/retained model/raw binding mismatch');
 result.bindings=hashes;result.mainHash=report.mainHash;result.processorHash=report.processorHash;
 const rows:any[]=[];for await(const line of readline.createInterface({input:fs.createReadStream(files.quantums),crlfDelay:Infinity})){if(!line)throw Error('Empty original metadata row');const r=JSON.parse(line);rows.push({index:r.index,currentFrame:r.currentFrame,currentTime:r.currentTime,quantum:r.quantum,sourceLength:r.sourceLength,inputLength:r.inputLength,sourceChannels:r.sourceChannels,inputChannels:r.inputChannels,sourceOffset:r.sourceOffset,inputOffset:r.inputOffset});guard();}
 if(!rows.length||rows.some((r,i)=>r.index!==i||r.quantum!==128||r.sourceOffset!==i*128||r.inputOffset!==i*128))throw Error('Original metadata order/ordinal mapping changed');
 const baseFrame=rows[0].currentFrame;let minResidual=Infinity,maxResidual=-Infinity;for(const r of rows){const residual=r.currentFrame-(baseFrame+r.index*128);minResidual=Math.min(minResidual,residual);maxResidual=Math.max(maxResidual,residual);}
 result.ordinalClockMapping={baseFrame,perOriginalIndexSamples:128,observedCurrentFrameResidualSamples:{min:minResidual,max:maxResidual},method:'Unmodified contiguous original stream ordinal; no sorting or fitted clock translation'};
 const vertices=JSON.parse(fs.readFileSync(files.topology,'utf8')).vertices;
 const plan=[['F02',64,0],['F03',24,0],['F06',20,0],['F08',20,0],['F02',12,.1]];
 if(report.segments.length!==5||audit.segments.length!==5)throw Error('Full five-segment denominator missing');
 for(const[index,segment]of report.segments.entries()){
  guard();const audited=audit.segments[index],coverage=audited?.coverage,scene=segment.scene as Scene;
  if(segment.index!==index||segment.fixture!==plan[index][0]||segment.seconds!==plan[index][1]||segment.delaySeconds!==plan[index][2])throw Error('Fixed original plan changed');
  const fixture=fs.readFileSync(path.join(root,'segment-'+index+'-fixture.json'));if(sha(fixture)!==segment.fixtureSha256||JSON.stringify(JSON.parse(fixture.toString()))!==JSON.stringify(scene))throw Error('Original full scene/fixture mismatch');
  const epoch=segment.firstEmission.event.time,first=segment.firstAnalysisObserverIndex,last=segment.lastAnalysisObserverIndex;
  if(!coverage||audited.index!==index||coverage.firstOriginalIndex!==first||coverage.lastOriginalIndex!==last||coverage.startContextTime!==epoch||coverage.endContextTime!==epoch+segment.seconds||segment.transportEpochContextTime!==epoch||!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<first||last>=rows.length)throw Error('Full window/epoch differs from independent audit');
  const selected=rows.slice(first,last+1);if(selected.some(r=>r.sourceLength!==128||r.inputLength!==128||r.sourceChannels<1||r.inputChannels<1))throw Error('Full original window path absent');
  const before=audited.nativeBefore,after=audited.nativeAfter;
  if(!before||!after||before.lagSamples!==640||after.lagSamples!==640||!audited.nativeBeforeAfterAgreed)throw Error('Native before/after calibration does not independently support declared640sample route');
  const firstFrame=baseFrame+first*128,samples=selected.length*128,sourceOffset=selected[0].sourceOffset,inputOffset=selected[0].inputOffset;
  const voices=fixtureOracle(scene,vertices,epoch,segment.seconds+.25,48000),predicted=renderOracle(voices,firstFrame,samples,48000,scene.settings.volume);guard();
  const source=read(sourceFd,sourceOffset,samples),nativeInput=read(inputFd,inputOffset+640,samples);
  const nominalSource=compare(source,predicted),nominalInput=compare(nativeInput,predicted);
  const extraDelaySamples=segment.delaySeconds===.1?4800:0;
  const delayedInput=extraDelaySamples?read(inputFd,inputOffset+640+extraDelaySamples,samples):null;
  const groups=onsetGroups(voices).filter(g=>g.onset<epoch+segment.seconds-1e-9),declared=voices.filter(v=>v.onset<epoch+segment.seconds-1e-9);
  const entry:any={index,fixture:segment.fixture,variant:segment.variant,epoch,firstOriginalIndex:first,lastOriginalIndex:last,firstFrame,samples,sourceRawOffset:sourceOffset,nativeInputRawOffset:inputOffset+640,nativeLagSamples:640,nativeBefore:before,nativeAfter:after,declaredLogicalVoices:declared.length,groups:groups.length,modeledAudibleGroups:groups.filter(g=>g.voices.some(v=>v.level>0&&!erasedBeforeSound(v))).length,erasedBeforeSound:declared.filter(v=>erasedBeforeSound(v)).length,actualIdentifiedGroups:null,nominalSource,nominalInput,actualStalls:segment.stalls,qualificationPassed:false};
  if(delayedInput){entry.predeclaredActualDelayHypothesis={extraSamples:4800,extraMs:100,inputRawOffset:inputOffset+5440,comparison:compare(delayedInput,predicted),fitPerformed:false,scope:'Measured graph-delay hypothesis at independently fixed native route; no fitted product origin'};entry.negativeRejectsNominal=!nominalInput.agreementWithin1eMinus6;}
  result.segments.push(entry);console.log('FIDELITY_SEGMENT '+JSON.stringify({index,fixture:entry.fixture,sourceRms:nominalSource.rms,inputRms:nominalInput.rms,negativeRejectsNominal:entry.negativeRejectsNominal,qualificationPassed:false}));
 }
 result.positiveModeledAudibleGroups=result.segments.slice(0,4).reduce((n:number,s:any)=>n+s.modeledAudibleGroups,0);if(result.positiveModeledAudibleGroups!==468)throw Error('Original468 modeled group denominator changed');
 result.actualIdentifiedGroups=null;result.status='completed-fixed-fidelity-observation';
}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}
finally{fs.closeSync(sourceFd);fs.closeSync(inputFd);result.elapsedMonotonicSeconds=(performance.now()-started)/1000;result.memoryAtFinish=process.memoryUsage();if(result.elapsedMonotonicSeconds>maxSeconds||result.memoryAtFinish.rss>maxResidentBytes){result.status='failed-or-incomplete';result.errors.push('Final runtime/memory bound exceeded');process.exitCode=1;}fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,qualificationPassed:false}));}
