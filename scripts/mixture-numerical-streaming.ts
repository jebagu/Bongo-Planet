import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {fixtureOracle,renderOracle,scalarVoice,type OracleVoice} from './mixture-timing-oracle';

const RATE=48000,TOP=16,MAX_SEQUENCES=50000,MAX_PROJECTED_BYTES=32*1024*1024,MAX_BLOCKS=100000,MAX_DETAILS=2048;
type CompactTrigger={session:string;generatorId:string;nodeId:string;emission:number;onset:number;sound:any};
type SequenceState={triggers:number;onsets:number;firstTrigger?:CompactTrigger;triggerHash?:string;triggerOrder?:number;firstOnset?:number;onsetHash?:string;onsetOrder?:number;onsetsDiffer:boolean;triggerInWindow:boolean;onsetInWindow:boolean;bytes:number};
type Ledger={entries:Map<number,SequenceState>;bytes:number;maxEntries:number;maxBytes:number;nextTriggerOrder:number;nextOnsetOrder:number};
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
function finite(value:number){if(!Number.isFinite(value))throw Error('Nonfinite diagnostic scalar');return value;}
function ledger():Ledger{return{entries:new Map(),bytes:0,maxEntries:0,maxBytes:0,nextTriggerOrder:0,nextOnsetOrder:0};}
function ingest(state:Ledger,event:any,end:number){
 if(event.type!=='trigger'&&event.type!=='onset')return;
 const tr=event.trigger,seq=tr.sequence;if(!Number.isSafeInteger(seq)||seq<1||seq>MAX_SEQUENCES)throw Error('Compact sequence capacity or identity exceeded');
 finite(tr.onset);finite(tr.emission);
 let entry=state.entries.get(seq);if(!entry){if(state.entries.size>=MAX_SEQUENCES)throw Error('Compact sequence capacity exceeded');entry={triggers:0,onsets:0,onsetsDiffer:false,triggerInWindow:false,onsetInWindow:false,bytes:0};state.entries.set(seq,entry);}
 const hash=sha(JSON.stringify(tr));
 if(event.type==='trigger'){
  entry.triggers++;entry.triggerInWindow ||= tr.onset<end-1e-9;
  if(entry.triggers===1){entry.triggerOrder=state.nextTriggerOrder++;entry.triggerHash=hash;entry.firstTrigger={session:tr.session,generatorId:tr.generatorId,nodeId:tr.nodeId,emission:tr.emission,onset:tr.onset,sound:{...tr.sound}};}
 }else{
  entry.onsets++;entry.onsetInWindow ||= tr.onset<end-1e-9;
  if(entry.onsets===1){entry.onsetOrder=state.nextOnsetOrder++;entry.firstOnset=tr.onset;entry.onsetHash=hash;}else entry.onsetsDiffer ||= hash!==entry.onsetHash;
 }
 if(!Number.isSafeInteger(entry.triggers)||!Number.isSafeInteger(entry.onsets))throw Error('Logical row count overflow');
 const bytes=Buffer.byteLength(JSON.stringify({...entry,bytes:0}));state.bytes+=bytes-entry.bytes;entry.bytes=bytes;
 state.maxEntries=Math.max(state.maxEntries,state.entries.size);state.maxBytes=Math.max(state.maxBytes,state.bytes);
 if(state.bytes>MAX_PROJECTED_BYTES)throw Error('Compact projected byte capacity exceeded');
}
function stats(){return{count:0,min:null as number|null,max:null as number|null,maxAbs:null as number|null};}
function add(s:ReturnType<typeof stats>,value:number){finite(value);s.count++;s.min=s.min===null?value:Math.min(s.min,value);s.max=s.max===null?value:Math.max(s.max,value);s.maxAbs=s.maxAbs===null?Math.abs(value):Math.max(s.maxAbs,Math.abs(value));}
function emissions(scene:any,vertices:number[][],epoch:number,seconds:number){
 const rows:{time:number;generator:any;order:number}[]=[];
 for(const[order,g]of scene.pieces.entries())if(g.kind==='generator'&&g.enabled){const period=g.period*60/scene.settings.bpm;for(let cycle=0;(cycle+g.phase)*period<seconds;cycle++)rows.push({time:epoch+(cycle+g.phase)*period,generator:g,order});}
 rows.sort((a,b)=>a.time-b.time||a.order-b.order);let sequence=0;const result=new Map<number,number>();
 for(const row of rows)for(const node of scene.pieces){if(node.kind==='generator')continue;const a=vertices[row.generator.vertex],b=vertices[node.vertex],angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,x,i)=>sum+x*b[i],0))));if(angle<=row.generator.reach*Math.PI/180+1e-9)result.set(++sequence,row.time);}
 return result;
}
function soundDisagrees(tr:CompactTrigger,v:OracleVoice){return tr.sound.kind!==(v.kind==='sine'?'note':'beat')||tr.sound.duration!==v.duration||tr.sound.level!==v.level||(v.kind==='sine'?(tr.sound.timbre!=='sine'||tr.sound.frequency!==v.frequency):tr.sound.sound!=='kick');}
function detail(list:any[],value:any){if(list.length>=MAX_DETAILS)throw Error('Diagnostic anomaly-detail capacity exceeded; prefix retained');list.push(value);}
function summarize(state:Ledger,declared:OracleVoice[],emissionTimes:Map<number,number>,session:string,end:number){
 const triggerDeltas=stats(),onsetDeltas=stats(),emissionDeltas=stats(),missing:any[]=[],duplicates:any[]=[],soundDifferences:any[]=[],identityDifferences:any[]=[];
 const expected=new Set<number>();
 for(const v of declared){expected.add(v.sequence);const e=state.entries.get(v.sequence),tc=e?.triggers??0,oc=e?.onsets??0;
  if(tc!==1)detail(tc?duplicates:missing,{sequence:v.sequence,type:'trigger',rows:tc});
  if(oc!==1)detail(oc?duplicates:missing,{sequence:v.sequence,type:'onset',rows:oc});
  if(oc===1)add(onsetDeltas,e!.firstOnset!-v.onset);
  if(tc!==1)continue;
  const tr=e!.firstTrigger!;
  if(tr.session!==session||tr.generatorId!==v.generatorId||tr.nodeId!==v.nodeId)detail(identityDifferences,{sequence:v.sequence,actual:{session:tr.session,generatorId:tr.generatorId,nodeId:tr.nodeId},expected:{session,generatorId:v.generatorId,nodeId:v.nodeId}});
  add(triggerDeltas,tr.onset-v.onset);const time=emissionTimes.get(v.sequence);if(time===undefined)throw Error('Independent sequence emission unavailable');add(emissionDeltas,tr.emission-time);
  if(soundDisagrees(tr,v))detail(soundDifferences,{sequence:v.sequence,expected:{kind:v.kind,frequency:v.frequency,duration:v.duration,level:v.level},actual:tr.sound});
  if(oc&&(e!.onsetsDiffer||e!.onsetHash!==e!.triggerHash))detail(identityDifferences,{sequence:v.sequence,type:'trigger/onset scalar mismatch'});
 }
 const extraTriggerRows:{sequence:number;order:number}[]=[],extraOnsetRows:{sequence:number;order:number}[]=[];
 for(const[seq,e]of state.entries)if(!expected.has(seq)){if(e.triggerInWindow)detail(extraTriggerRows,{sequence:seq,order:e.triggerOrder!});if(e.onsetInWindow)detail(extraOnsetRows,{sequence:seq,order:e.onsetOrder!});}
 const extraTriggers=extraTriggerRows.sort((a,b)=>a.order-b.order).map(r=>r.sequence),extraOnsets=extraOnsetRows.sort((a,b)=>a.order-b.order).map(r=>r.sequence);
 return{matchedTriggerRows:triggerDeltas.count,matchedOnsetRows:onsetDeltas.count,triggerOnsetDeltasSeconds:triggerDeltas,retainedOnsetDeltasSeconds:onsetDeltas,emissionDeltasSeconds:emissionDeltas,missing,duplicates,extraTriggers,extraOnsets,soundDifferences,identityDifferences};
}
function rankTop(raw:Buffer,prediction:Float32Array,guard:()=>void){
 const top:{sample:number;error:number;actual:number;nominal:number}[]=[];let aboveStrictThreshold=0;
 for(let i=0;i<prediction.length;i++){const actual=finite(raw.readFloatLE(i*4)),error=Math.abs(actual-prediction[i]);if(error>1e-6)aboveStrictThreshold++;if(top.length<TOP||error>top[top.length-1].error){top.push({sample:i,error,actual,nominal:prediction[i]});top.sort((a,b)=>b.error-a.error||a.sample-b.sample);if(top.length>TOP)top.pop();}if(i%48000===0)guard();}
 return{top,aboveStrictThreshold};
}

async function run(capture:string){
 const output=path.join(capture,'numerical-streaming.json');if(fs.existsSync(output))throw Error('Refusing to overwrite diagnostic');
 const start=performance.now();let maxRss=0,fd:number|undefined;
 const result:any={title:'Bongo Planet streaming numerical discrepancy diagnostic',status:'preparing',errors:[],qualificationPassed:false,acceptancePassed:false,actualIdentifiedGroups:null,ledger:[],segments:[],limits:{seconds:120,residentBytes:256*1024*1024,maxSequences:MAX_SEQUENCES,maxProjectedBytes:MAX_PROJECTED_BYTES,maxMetadataBlocks:MAX_BLOCKS,maxAnomalyDetailsPerKind:MAX_DETAILS,scope:'Cooperative detected bounds; no GC flags or cap increase.'},allocation:{metadataTypedArrayBytes:0,denseOnsetTypedArrayBytes:0,maxLedgerSequences:0,maxLedgerProjectedBytes:0,ledgerReleasedBeforeDenseRender:false},limitations:['Logical retained rows are not actual acoustic onset identification.','Analytic ownership is not directly observed product ownership.','No alternate clock, arithmetic, fitting or global onset hypothesis is evaluated.']};
 const guard=()=>{maxRss=Math.max(maxRss,process.memoryUsage().rss);if(performance.now()-start>120000||maxRss>256*1024*1024)throw Error('Cooperative streaming resource bound exceeded');};
 const hash=async(file:string)=>{const h=createHash('sha256');for await(const bytes of fs.createReadStream(file)){h.update(bytes);guard();}return h.digest('hex');};
 const readRows=async(file:string,consume:(r:any)=>void)=>{for await(const line of readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity})){if(!line)throw Error('Empty retained row');consume(JSON.parse(line));guard();}};
 try{
  const reportBytes=fs.readFileSync(path.join(capture,'report.json')),report=JSON.parse(reportBytes.toString()),auditBytes=fs.readFileSync(path.join(capture,'independent-audit.json')),audit=JSON.parse(auditBytes.toString()),fidelityBytes=fs.readFileSync(path.join(capture,'fixed-fidelity.json')),fidelity=JSON.parse(fidelityBytes.toString());
  if(!audit.captureIntegrityAuditPassed||audit.errors.length||fidelity.status!=='completed-fixed-fidelity-observation'||fidelity.errors.length||audit.bindings.reportSha256!==sha(reportBytes)||fidelity.bindings.report!==sha(reportBytes)||fidelity.bindings.audit!==sha(auditBytes))throw Error('Completed independent binding absent');
  const files={metadata:path.join(capture,'quantums.jsonl'),events:path.join(capture,'events.jsonl'),raw:path.join(capture,'product-tap.f32'),input:path.join(capture,'virtual-input.f32'),oracle:'scripts/mixture-timing-oracle.ts',processor:path.join(capture,'application-source/src/audio/processor.ts'),synth:path.join(capture,'application-source/src/audio/synth.ts'),topology:path.join(capture,'topology.json'),helper:'scripts/mixture-numerical-streaming.ts'};
  const hashes:any={report:sha(reportBytes),audit:sha(auditBytes),fixedFidelity:sha(fidelityBytes)};for(const[k,f]of Object.entries(files))hashes[k]=await hash(f);
  if(hashes.metadata!==audit.bindings.quantumsSha256||hashes.events!==audit.bindings.eventsSha256||hashes.raw!==audit['product-tap'].sha256||hashes.input!==audit['virtual-input'].sha256||hashes.oracle!==fidelity.bindings.oracle||hashes.topology!==fidelity.bindings.topology||hashes.processor!==report.sourceHashes['src/audio/processor.ts']||hashes.synth!==report.sourceHashes['src/audio/synth.ts'])throw Error('Exact retained bindings mismatch');result.bindings=hashes;
  const blocks=report.stats.blocks;if(!Number.isSafeInteger(blocks)||blocks<1||blocks>MAX_BLOCKS)throw Error('Metadata capacity exceeded');
  const frames=new Float64Array(blocks),times=new Float64Array(blocks);result.allocation.metadataTypedArrayBytes=frames.byteLength+times.byteLength;let metadataCount=0;
  await readRows(files.metadata,r=>{if(r.index!==metadataCount||r.index>=blocks||r.quantum!==128||r.sourceLength!==128||r.sourceOffset!==r.index*128)throw Error('Original metadata ordinal changed');frames[metadataCount]=finite(r.currentFrame);times[metadataCount]=finite(r.currentTime);metadataCount++;});if(metadataCount!==blocks)throw Error('Full metadata denominator missing');
  const vertices=JSON.parse(fs.readFileSync(files.topology,'utf8')).vertices,denseOnsets=new Map<number,Float64Array>();let currentSegment=-1,perSegmentIndex=0,eventCount=0,state=ledger();
  const finish=()=>{if(currentSegment<0)return;if(currentSegment<4){const s=report.segments[currentSegment],epoch=s.firstEmission.event.time,voices=fixtureOracle(s.scene,vertices,epoch,s.seconds+.25,RATE),declared=voices.filter(v=>v.onset<epoch+s.seconds-1e-9),summary=summarize(state,declared,emissions(s.scene,vertices,epoch,s.seconds+.25),s.actualSessionNamespace,epoch+s.seconds);
    result.ledger.push({index:currentSegment,fixture:s.fixture,declaredLogicalVoices:declared.length,declaredModelAudibleGroups:fidelity.segments[currentSegment].modeledAudibleGroups,...summary,scope:'Logical retained trigger/onset timestamps; not PCM onset identification.'});
    if(currentSegment>=2){const retained=new Float64Array(MAX_SEQUENCES+1);retained.fill(NaN);for(const[seq,e]of state.entries)if(e.firstTrigger)retained[seq]=e.firstTrigger.onset;denseOnsets.set(currentSegment,retained);result.allocation.denseOnsetTypedArrayBytes+=retained.byteLength;}
   }result.allocation.maxLedgerSequences=Math.max(result.allocation.maxLedgerSequences,state.maxEntries);result.allocation.maxLedgerProjectedBytes=Math.max(result.allocation.maxLedgerProjectedBytes,state.maxBytes);state.entries.clear();state=ledger();guard();};
  await readRows(files.events,r=>{if(r.independentEventIndex!==eventCount++||!Number.isInteger(r.segment)||r.segment<currentSegment||r.segment>4)throw Error('Original global event/segment ordering changed');if(r.segment!==currentSegment){if(r.segment!==currentSegment+1)throw Error('Segment event denominator skipped');finish();currentSegment=r.segment;perSegmentIndex=0;}if(r.perSegmentEventIndex!==perSegmentIndex++)throw Error('Original per-segment event ordering changed');if(currentSegment<4){const s=report.segments[currentSegment];ingest(state,r.event,s.firstEmission.event.time+s.seconds);}});finish();
  if(eventCount!==report.stats.events||currentSegment!==4||result.ledger.length!==4)throw Error('Full original event/positive ledger denominator missing');result.eventCount=eventCount;result.allocation.ledgerReleasedBeforeDenseRender=state.entries.size===0;
  fd=fs.openSync(files.raw,'r');
  for(const index of [2,3]){
   guard();const s=report.segments[index],prior=fidelity.segments[index],epoch=s.firstEmission.event.time,first=s.firstAnalysisObserverIndex,last=s.lastAnalysisObserverIndex,samples=(last-first+1)*128,firstFrame=frames[0]+first*128;
   if(prior.epoch!==epoch||prior.firstOriginalIndex!==first||prior.lastOriginalIndex!==last||prior.samples!==samples)throw Error('Full fixed fidelity window changed');
   const voices=fixtureOracle(s.scene,vertices,epoch,s.seconds+.25,RATE),prediction=renderOracle(voices,firstFrame,samples,RATE,s.scene.settings.volume);guard();
   const raw=Buffer.alloc(samples*4);let n=0;while(n<raw.length){const count=fs.readSync(fd,raw,n,raw.length-n,first*128*4+n);if(!count)throw Error('Truncated untouched raw window');n+=count;}
   if(sha(raw)!==prior.nominalSource.actualWindowSha256||sha(Buffer.from(prediction.buffer))!==prior.nominalSource.oracleWindowSha256)throw Error('Unchanged nominal model/raw equality failed');
   const ranked=rankTop(raw,prediction,guard),details:any[]=[];result.segments.push({index,fixture:s.fixture,epoch,firstOriginalIndex:first,lastOriginalIndex:last,samples,aboveStrictThreshold:ranked.aboveStrictThreshold,originalStrictCriterionMet:prior.nominalSource.agreementWithin1eMinus6,rawWindowSha256:sha(raw),oracleWindowSha256:sha(Buffer.from(prediction.buffer)),top:details});
   for(const p of ranked.top){const frame=firstFrame+p.sample,time=frame/RATE,originalIndex=first+Math.floor(p.sample/128),withinBlock=p.sample%128,active=voices.filter(v=>v.admittedFrame<=frame&&v.removedFrame>frame&&v.onset+v.duration>time).sort((a,b)=>a.admittedFrame-b.admittedFrame||a.sequence-b.sequence);let sum=0;
    const ownership=active.map(v=>{const value=scalarVoice(v,time);sum+=value;const retained=denseOnsets.get(index)![v.sequence];return{sequence:v.sequence,generatorId:v.generatorId,nodeId:v.nodeId,onset:v.onset,retainedOnset:Number.isFinite(retained)?retained:null,admittedFrame:v.admittedFrame,removedFrame:Number.isFinite(v.removedFrame)?v.removedFrame:null,kind:v.kind,frequency:v.frequency,duration:v.duration,level:v.level,ageSeconds:time-v.onset,scalarContribution:value};});
    const scalarReconstruction=Math.fround(.98*Math.tanh(sum*s.scene.settings.volume));details.push({...p,frame,ordinalTime:time,originalIndex,withinBlock,rawClock:{currentFrame:frames[originalIndex],currentTime:times[originalIndex],reportedTimeMinusOrdinalBlockStart:times[originalIndex]-(frame-withinBlock)/RATE},scalarReconstruction,scalarReconstructionMatchesNominal:scalarReconstruction===p.nominal,activeOwnership:ownership,ownershipScope:'Analytic64-voice ownership; retained product active array not directly observed.'});if(scalarReconstruction!==p.nominal)throw Error('Top-sample scalar reconstruction differs from unchanged oracle');}
   denseOnsets.delete(index);console.log(JSON.stringify({fixture:s.fixture,aboveStrictThreshold:ranked.aboveStrictThreshold,largestError:ranked.top[0]?.error,qualificationPassed:false}));
  }result.status='completed-diagnostic-observation';
 }catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}
 finally{if(fd!==undefined)fs.closeSync(fd);result.elapsedMonotonicSeconds=(performance.now()-start)/1000;result.memoryAtFinish=process.memoryUsage();try{guard();}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}result.maxObservedRss=maxRss;fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,qualificationPassed:false}));}
}

async function controls(output:string){
 if(fs.existsSync(output))throw Error('Refusing to overwrite source controls');
 const old=fs.readFileSync('scripts/mixture-numerical-discrepancy.ts','utf8');if(sha(old)!=='32aca733ad92ff4cba13d59cd923c90d3041f6dfa3f81dd89e83201d5f672e2b')throw Error('Frozen reference helper changed');
 const strip=(await import('node:module') as any).stripTypeScriptTypes;
 const reference=(events:any[],declared:OracleVoice[])=>{const context:any={Map,Set,Math,JSON,Error,exactFinite:finite,ledger:{triggers:new Map(),onsets:new Map()},declared,emissionTimes:new Map(declared.map(v=>[v.sequence,0])),segment:{actualSessionNamespace:'s'},epoch:0,index:0,prior:{modeledAudibleGroups:declared.length},result:{ledger:[]},onsetDeltas:[],retainedOnsetDeltas:[],emissionDeltas:[],soundDifferences:[],identityDifferences:[],missing:[],duplicates:[],expectedSequences:new Set(declared.map(v=>v.sequence))};context.segment.seconds=1;
  for(const event of events){const map=event.type==='trigger'?context.ledger.triggers:context.ledger.onsets,list=map.get(event.trigger.sequence)??[];list.push({event});map.set(event.trigger.sequence,list);}vm.createContext(context);vm.runInContext(strip(old.slice(old.indexOf('function stats('),old.indexOf('\nlet fd:'))),context);vm.runInContext(strip(old.slice(old.indexOf('  for(const v of declared){'),old.indexOf('\n  if(index<2)continue;'))),context);const r=context.result.ledger[0];for(const k of ['index','fixture','declaredLogicalVoices','declaredModelAudibleGroups','scope'])delete r[k];return JSON.parse(JSON.stringify(r));};
 const voice=(sequence:number):OracleVoice=>({sequence,generatorId:'g',nodeId:'n'+sequence,onset:.1,kind:'sine',frequency:440,duration:.6,level:.65,admittedFrame:0,removedFrame:Infinity}),declared=[voice(1),voice(2),voice(3)];
 const event=(type:string,seq:number,change:any={})=>({type,trigger:{session:'s',sequence:seq,id:'s-'+seq,generatorId:'g',nodeId:'n'+seq,emission:0,onset:.1,sound:{kind:'note',frequency:440,timbre:'sine',duration:.6,level:.65},position:[1,0,0],...change}});
 const cases=[['distinct',[event('trigger',1),event('onset',1),event('trigger',2),event('onset',2),event('trigger',3),event('onset',3)]],['onset-before-trigger',[event('onset',1),event('trigger',1),event('onset',2),event('trigger',2)]],['missing-and-duplicate',[event('trigger',2),event('trigger',2),event('onset',2),event('onset',2)]],['wrong-sound-and-full-trigger-mismatch',[event('trigger',1,{sound:{kind:'note',frequency:440,timbre:'triangle',duration:.6,level:.65}}),event('onset',1),event('trigger',2),event('onset',2,{position:[0,1,0]})]],['duplicate-onset-different-first-and-second',[event('onset',1,{onset:.2}),event('onset',1),event('trigger',1),event('onset',4),event('trigger',4)]],['independent-extra-domain-insertion-order',[event('onset',4),event('onset',5),event('trigger',5),event('trigger',4)]]] as const;
 const checked:any[]=[];for(const[name,events]of cases){const state=ledger();for(const e of events)ingest(state,e,1);assert.deepEqual(summarize(state,declared,new Map(declared.map(v=>[v.sequence,0])),'s',1),reference([...events],declared));checked.push({name,passed:true});}
 const kick:OracleVoice={...declared[0],kind:'kick',frequency:0};assert.equal(soundDisagrees({session:'s',generatorId:'g',nodeId:'n1',emission:0,onset:.1,sound:{kind:'beat',sound:'kick',duration:.6,level:.65}},kick),false);assert.equal(soundDisagrees({session:'s',generatorId:'g',nodeId:'n1',emission:0,onset:.1,sound:{kind:'beat',sound:'snare',duration:.6,level:.65}},kick),true);checked.push({name:'explicit wrong beat sound rejection',passed:true});
 const prediction=renderOracle(declared,0,12000,RATE,.65),raw=Buffer.from(prediction.buffer.slice(0));for(let i=0;i<raw.length/4;i+=307)raw.writeFloatLE(raw.readFloatLE(i*4)+.000002,i*4);
 const ranking=rankTop(raw,prediction,()=>{}),context:any={raw,prediction,samples:prediction.length,topSamples:TOP,exactFinite:finite,guard:()=>{}};vm.createContext(context);vm.runInContext(strip(old.slice(old.indexOf('  const top:{sample:number;'),old.indexOf('\n  const details:any[]=[];')))+'\nglobalThis.actual={top,aboveStrictThreshold};',context);assert.deepEqual(ranking,JSON.parse(JSON.stringify(context.actual)));checked.push({name:'top16/error-threshold ranking exact frozen-loop equivalence',passed:true});
 for(const p of ranking.top){const time=p.sample/RATE;let sum=0;for(const v of declared)sum+=scalarVoice(v,time);assert.equal(Math.fround(.98*Math.tanh(sum*.65)),p.nominal);}checked.push({name:'scalar reconstruction exact unchanged oracle',passed:true});
 const before=process.memoryUsage(),large=ledger();for(let seq=1;seq<=42000;seq++){ingest(large,event('onset',seq),1);ingest(large,event('trigger',seq),1);}const after=process.memoryUsage();assert.ok(large.maxBytes<=MAX_PROJECTED_BYTES&&large.maxEntries<=MAX_SEQUENCES);checked.push({name:'42000-sequence synthetic compact allocation within structural caps',passed:true});
 const r={title:'Bongo Planet streaming numerical source controls',sourceOnly:true,qualificationPassed:false,helperSha256:sha(fs.readFileSync('scripts/mixture-numerical-streaming.ts')),frozenReferenceSha256:sha(old),checks:checked,syntheticAllocation:{sequences:large.maxEntries,projectedSerializedBytes:large.maxBytes,processBefore:before,processAfter:after,scope:'Measured synthetic allocation, not an absolute V8 RSS prediction; actual cooperative256MiB limit unchanged.'},structuralBounds:{sequences:MAX_SEQUENCES,projectedSerializedBytes:MAX_PROJECTED_BYTES,metadataTypedArrayMaximumBytes:MAX_BLOCKS*16,denseRetainedOnsetMaximumBytes:2*(MAX_SEQUENCES+1)*8,maxDenseRawPlusPredictionBytes:2*960128*4}};fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,checks:checked.length,passed:true,qualificationPassed:false}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]==='--controls'&&process.argv.length===4)await controls(path.resolve(process.argv[3]));
 else if(process.argv.length===3)await run(path.resolve(process.argv[2]));
 else throw Error('Usage: mixture-numerical-streaming.ts <completed capture> | --controls <new output.json>');
}
