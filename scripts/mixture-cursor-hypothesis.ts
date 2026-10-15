import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import {scalarVoice} from './mixture-timing-oracle';

// A declared numerical mechanism diagnostic, never an onset measurement.
// The initial processor cursor was not captured. Seed only the first observed
// raw clock, without searching or choosing an initial state from product PCM.
const directory=path.resolve(process.argv[2]??'');
if(process.argv.length!==3)throw Error('Provide the original capture directory');
const output=path.join(directory,'cursor-hypothesis.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite hypothesis evidence');
const start=performance.now(),rate=48000;
const result:any={title:'Bongo Planet declared cursor arithmetic hypothesis',qualificationPassed:false,acceptancePassed:false,status:'preparing',errors:[],samples:[],
 limitations:['Initial processor cursor before observer admission is unknown; this is one explicitly seeded hypothesis.',
 'This block-only hypothesis omits independent engine/command state from the production clock floor.',
 'The sixteen samples were selected by largest baseline error; this is a selected diagnostic subset.',
 'A closer prediction does not uniquely establish causality or identify acoustic onsets.',
 'Original fixed-fidelity results, failed criteria and raw audio remain unchanged.',
 'No initial state, event time, offset or sample is fitted to product PCM.']};
function guard(){if(performance.now()-start>30000||process.memoryUsage().rss>256*1024*1024)throw Error('Hypothesis cooperative resource bound exceeded');}
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
async function digest(file:string){const h=createHash('sha256');for await(const b of fs.createReadStream(file)){h.update(b);guard();}return h.digest('hex');}
let fd:number|undefined;
try{
 const read=(name:string)=>fs.readFileSync(path.join(directory,name));
 const reportBytes=read('report.json'),report=JSON.parse(reportBytes.toString());
 const auditBytes=read('independent-audit.json'),audit=JSON.parse(auditBytes.toString());
 const fidelityBytes=read('fixed-fidelity.json'),fidelity=JSON.parse(fidelityBytes.toString());
 const discrepancyBytes=read('numerical-discrepancy.json'),discrepancy=JSON.parse(discrepancyBytes.toString());
 if(!audit.captureIntegrityAuditPassed||audit.errors.length||audit.bindings.reportSha256!==hash(reportBytes)
  ||fidelity.bindings.audit!==hash(auditBytes)||discrepancy.bindings.fixedFidelity!==hash(fidelityBytes)
  ||discrepancy.bindings.report!==hash(reportBytes))throw Error('Prior immutable evidence bindings absent');
 const metadata=path.join(directory,'quantums.jsonl'),raw=path.join(directory,'product-tap.f32');
 const bindings={report:hash(reportBytes),audit:hash(auditBytes),fidelity:hash(fidelityBytes),discrepancy:hash(discrepancyBytes),
  metadata:await digest(metadata),raw:await digest(raw),oracle:await digest('scripts/mixture-timing-oracle.ts'),
  processor:await digest(path.join(directory,'application-source/src/audio/processor.ts')),helper:await digest('scripts/mixture-cursor-hypothesis.ts')};
 if(bindings.metadata!==audit.bindings.quantumsSha256||bindings.raw!==audit['product-tap'].sha256
  ||bindings.oracle!==fidelity.bindings.oracle||bindings.processor!==report.sourceHashes['src/audio/processor.ts'])throw Error('Bound metadata/raw/model/processor changed');
 result.bindings=bindings;
 const segment=discrepancy.segments.find((s:any)=>s.index===2);
 if(!segment||segment.top.length!==16||segment.samples!==960128)throw Error('Complete retained F06 top16 required');
 const wanted=new Map<number,any[]>();for(const sample of segment.top){const list=wanted.get(sample.originalIndex)??[];list.push(sample);wanted.set(sample.originalIndex,list);}
 fd=fs.openSync(raw,'r');let previousEnd:number|undefined,index=0,baseFrame:number|undefined;
 let minDelta=Infinity,maxDelta=-Infinity;
 for await(const line of readline.createInterface({input:fs.createReadStream(metadata),crlfDelay:Infinity})){
  const row=JSON.parse(line);
  if(row.index!==index||row.quantum!==128||row.sourceOffset!==index*128||!Number.isFinite(row.currentTime)||!Number.isSafeInteger(row.currentFrame))throw Error('Original metadata order/clock invalid');
  baseFrame??=Number(row.currentFrame);
  const cursor=Math.max(row.currentTime,previousEnd??row.currentTime);
  if(cursor-row.currentTime>.02+.01/rate)throw Error('Declared cursor hypothesis exceeds existing backward-clock policy');
  previousEnd=cursor+128/rate;
  const ordinal=(baseFrame+index*128)/rate,delta=cursor-ordinal;
  minDelta=Math.min(minDelta,delta);maxDelta=Math.max(maxDelta,delta);
  if(index===0)result.initialState={originalIndex:0,seedRawContextTime:row.currentTime,unknownEarlierProcessorHistory:true};
  for(const sample of wanted.get(index)??[]){
   if(sample.frame!==baseFrame+index*128+sample.withinBlock||sample.activeOwnership.length>64||!sample.scalarReconstructionMatchesNominal)throw Error('Original top-sample mapping/reconstruction differs');
   const bytes=Buffer.alloc(4);if(fs.readSync(fd,bytes,0,4,(row.sourceOffset+sample.withinBlock)*4)!==4)throw Error('Raw top sample missing');
   const actual=bytes.readFloatLE();if(actual!==sample.actual)throw Error('Retained actual top sample changed');
   const hypothesisTime=cursor+sample.withinBlock/rate;let mix=0;
   for(const voice of sample.activeOwnership)mix+=scalarVoice(voice,hypothesisTime);
   const hypothesis=Math.fround(.98*Math.tanh(mix*report.segments[2].scene.settings.volume));
   result.samples.push({originalIndex:index,withinBlock:sample.withinBlock,frame:sample.frame,actual,nominal:sample.nominal,
    nominalAbsError:Math.abs(actual-sample.nominal),hypothesis,hypothesisAbsError:Math.abs(actual-hypothesis),
    hypothesisBlockStart:cursor,hypothesisSampleTime:hypothesisTime,sampleTimeDeltaSeconds:hypothesisTime-sample.ordinalTime,
    ownershipScope:'Original analytic ownership retained; no product active-array witness.'});
  }
  index++;guard();
 }
 if(index!==audit.metadata.blocks||result.samples.length!==16)throw Error('Complete bound metadata or declared top16 missing');
 result.metadataBlocks=index;result.cursorDeltaSeconds={min:minDelta,max:maxDelta};
 result.status='completed-declared-hypothesis';
}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}
finally{if(fd!==undefined)fs.closeSync(fd);result.elapsedMonotonicSeconds=(performance.now()-start)/1000;result.memoryAtFinish=process.memoryUsage();try{guard();}catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));process.exitCode=1;}fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,samples:result.samples.length,qualificationPassed:false}));}
