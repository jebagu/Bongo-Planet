import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fixtureOracle,onsetGroups,type OracleVoice} from './mixture-timing-oracle';
import {add,interval,nextDown,nextUp,type Interval} from './mixture-onset-interval';
import {NUMERICAL_ASSUMPTIONS,productionMixRange,productionSineRange,squaredDistanceLower,squaredDistanceUpper} from './mixture-production-interval';

export const MVP = Object.freeze({rate:48000,quantum:128,nativeLag:640,rms:1e-6,attackSeconds:.02,
  negativeDelaySamples:4800,seconds:120,residentBytes:256*1024*1024,frontier:2048,cellsPerGroup:4096,
  cells:131072,comparisons:4096,voiceEvaluations:50000000,detailBytes:8*1024*1024,detailsPerGroup:16});
type Voice=Pick<OracleVoice,'sequence'|'onset'|'kind'|'frequency'|'duration'|'level'|'admittedFrame'|'removedFrame'>;
export interface WindowData {actual:Float32Array;firstFrame:number;rate:number;volume:number;voices:readonly Voice[];epoch:number;seconds:number}
export interface Cell {origin:Interval;admissionLo:number;admissionHi:number}
export interface Work {cells:number;comparisons:number;voiceEvaluations:number;detailsBytes:number;maxFrontier:number}
export class BoundError extends Error {}
export function createWork():Work{return{cells:0,comparisons:0,voiceEvaluations:0,detailsBytes:0,maxFrontier:0};}
type Guard=()=>void;
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
function finite(n:number):number{if(!Number.isFinite(n))throw Error('Nonfinite MVP scalar');return n;}
function accumulateLower(sum:number,x:number):number{return Math.max(0,nextDown(sum+x));}
function accumulateUpper(sum:number,x:number):number{return nextUp(sum+x);}
function threshold(n:number):number{return nextUp(n*nextUp(MVP.rms*MVP.rms));}
function lowerThreshold(n:number):number{return Math.max(0,nextDown(n*nextDown(MVP.rms*MVP.rms)));}
function limits(work:Work,guard:Guard):void{guard();if(work.cells>MVP.cells||work.comparisons>MVP.comparisons||work.voiceEvaluations>MVP.voiceEvaluations||work.detailsBytes>MVP.detailBytes)throw new BoundError('MVP work/detail capacity exhausted');}
function checkData(data:WindowData):void{
  if(data.rate!==MVP.rate||!Number.isSafeInteger(data.firstFrame)||data.firstFrame%128!==0||!data.actual.length
    ||!Number.isFinite(data.epoch)||!Number.isFinite(data.seconds)||data.seconds<=0||data.seconds>64
    ||data.voices.some(v=>v.kind!=='sine'||v.removedFrame!==Infinity))throw Error('MVP requires complete sine/non-stealing window');
  if(!Number.isFinite(data.volume)||data.volume<0||data.volume>1)throw Error('Invalid volume');
}
export interface Baseline {low:Float32Array;high:Float32Array;upperSquares:number;lowerSquares:number;active:Voice[][];peak:number}
/** No production renderer import. The interval expression explicitly accounts
 * for the declared Math-call premise, coefficient order and Float32 output. */
export function prepareWindow(data:WindowData,work:Work,guard:Guard=()=>{}):Baseline{
  checkData(data);const low=new Float32Array(data.actual.length),high=new Float32Array(data.actual.length),active:Voice[][]=[];
  let upperSquares=0,lowerSquares=0,peak=0;
  for(let block=0;block*128<data.actual.length;block++){
    const frame=data.firstFrame+block*128;
    const owned=data.voices.filter(v=>v.admittedFrame<=frame&&v.onset+v.duration>frame/data.rate)
      .sort((a,b)=>a.admittedFrame-b.admittedFrame||a.sequence-b.sequence);
    peak=Math.max(peak,owned.length);if(peak>64)throw Error('Unproved ownership/capacity branch');active.push(owned);
    for(let i=block*128;i<Math.min(data.actual.length,(block+1)*128);i++){
      const time=interval((data.firstFrame+i)/data.rate),terms=owned.map(v=>{work.voiceEvaluations++;return productionSineRange({...v,origin:interval(v.onset)},time);});
      const box=productionMixRange(terms,data.volume);low[i]=box.lo;high[i]=box.hi;
      upperSquares=accumulateUpper(upperSquares,squaredDistanceUpper(data.actual[i],box));
      lowerSquares=accumulateLower(lowerSquares,squaredDistanceLower(data.actual[i],box));
    }
    if(block%16===0)limits(work,guard);
  }
  limits(work,guard);return{low,high,upperSquares,lowerSquares,active,peak};
}
function boxAt(data:WindowData,baseline:Baseline,selected:readonly Voice[],cell:Cell,index:number,work:Work,multiplicity=1):Interval{
  const frame=data.firstFrame+index,time=interval(frame/data.rate),target=new Set(selected.map(v=>v.sequence));
  const terms:Interval[]=[];
  for(const v of baseline.active[Math.floor(index/128)])if(!target.has(v.sequence)){
    work.voiceEvaluations++;terms.push(productionSineRange({...v,origin:interval(v.onset)},time));
  }
  if(frame>=cell.admissionLo)for(const v of selected){
    // Groups share an analytic origin to 1ns; retain exact component differences.
    const difference=v.onset-selected[0].onset;
    const origin=add(cell.origin,interval(difference));
    work.voiceEvaluations++;
    let term=productionSineRange({...v,origin},time);
    if(frame<cell.admissionHi)term=interval(Math.min(0,term.lo),Math.max(0,term.hi));
    for(let n=0;n<multiplicity;n++)terms.push(term);
  }
  if(terms.length>64)throw Error('Unsupported counterfactual capacity branch');
  return productionMixRange(terms,data.volume);
}
function attackRange(data:WindowData,onset:number):{first:number;last:number;complete:boolean}{
  const first=Math.ceil((onset-data.firstFrame/data.rate)*data.rate),last=first+Math.round(MVP.attackSeconds*data.rate)-1;
  return{first:Math.max(0,first),last:Math.min(data.actual.length-1,last),complete:first>=0&&last<data.actual.length};
}
function samplesForExclusion(data:WindowData,onset:number):number[]{
  const a=attackRange(data,onset),indices=new Set<number>();
  // Fixed independently of PCM values; every chosen sample remains in the full
  // and/or attack denominator. No strongest-attack sample selection from data.
  for(let i=0;i<32;i++)indices.add(Math.round(a.first+(a.last-a.first)*i/31));
  for(let i=0;i<64;i++)indices.add(Math.round((data.actual.length-1)*i/63));
  for(const relative of[-.02,-.01,0,.000125,.0005,.001,.002,.003,.005,.01,.015,.02,.04,.1,.3,.6]){
    const i=Math.round((onset+relative)*data.rate-data.firstFrame);if(i>=0&&i<data.actual.length)indices.add(i);
  }
  return[...indices].filter(i=>i>=0&&i<data.actual.length).sort((a,b)=>a-b);
}
/** Necessary lower bounds only. Per-sample hull inclusion is NOT a common
 * parameter witness; a separate concrete comparison is mandatory. */
export function exclusionBounds(data:WindowData,baseline:Baseline,selected:readonly Voice[],cell:Cell,onset:number,work:Work,guard:Guard=()=>{}):{excluded:boolean;fullLower:number;attackLower:number}{
  let fullLower=0,attackLower=0;const attack=attackRange(data,onset);
  for(const i of samplesForExclusion(data,onset)){
    const d=squaredDistanceLower(data.actual[i],boxAt(data,baseline,selected,cell,i,work));
    fullLower=accumulateLower(fullLower,d);if(i>=attack.first&&i<=attack.last)attackLower=accumulateLower(attackLower,d);
  }
  limits(work,guard);
  return{excluded:fullLower>threshold(data.actual.length)||attackLower>threshold(attack.last-attack.first+1),fullLower,attackLower};
}
function affected(data:WindowData,selected:readonly Voice[],origin:number,admission:number):[number,number][] {
  const spans:[number,number][]=[];
  for(const v of selected)for(const start of[v.onset,origin+v.onset-selected[0].onset]){
    // Only changed voice support can change output in the proved non-stealing
    // model. All remaining samples are still counted using baseline enclosures.
    const low=Math.max(0,Math.floor(start*data.rate-data.firstFrame)-1);
    const high=Math.min(data.actual.length-1,Math.ceil((start+v.duration)*data.rate-data.firstFrame)+1);
    if(high>=low)spans.push([low,high]);
  }
  // Admission can only shorten candidate support; do not shorten the retained
  // interval using it, or remove samples before a late entrance.
  void admission;
  spans.sort((a,b)=>a[0]-b[0]);const ranges:[number,number][]=[];
  for(const span of spans){const last=ranges.at(-1);if(last&&last[1]+1>=span[0])last[1]=Math.max(last[1],span[1]);else ranges.push([...span]);}
  return ranges;
}
export interface Witness {origin:number;admission:number;fullUpperRms:number;fullLowerRms:number;attackUpperRms:number;attackLowerRms:number;compatible:boolean;fullSamples:number;attackSamples:number;affectedSamples:number}
export function concreteWitness(data:WindowData,baseline:Baseline,selected:readonly Voice[],origin:number,admission:number,onset:number,work:Work,guard:Guard=()=>{},multiplicity=1):Witness{
  if(!Number.isFinite(origin)||!Number.isSafeInteger(admission)||admission%128!==0||![0,1,2].includes(multiplicity))throw Error('Invalid concrete hypothesis');
  work.comparisons++;limits(work,guard);
  const a=attackRange(data,onset),cell={origin:interval(origin),admissionLo:admission,admissionHi:admission};
  let upper=baseline.upperSquares,lower=baseline.lowerSquares,affectedSamples=0;
  for(const[first,last]of affected(data,selected,origin,admission))for(let i=first;i<=last;i++){
    const original=interval(baseline.low[i],baseline.high[i]),value=data.actual[i];
    // Subtracting the exact retained baseline bound and adding a new bound
    // is outward in the appropriate direction, keeping every original sample.
    upper=nextUp(upper-squaredDistanceUpper(value,original));
    lower=Math.max(0,nextDown(lower-squaredDistanceLower(value,original)));
    const replacement=boxAt(data,baseline,selected,cell,i,work,multiplicity);
    upper=accumulateUpper(upper,squaredDistanceUpper(value,replacement));
    lower=accumulateLower(lower,squaredDistanceLower(value,replacement));affectedSamples++;
    if(affectedSamples%256===0)limits(work,guard);
  }
  let attackUpper=0,attackLower=0;
  for(let i=a.first;i<=a.last;i++){
    const box=boxAt(data,baseline,selected,cell,i,work,multiplicity);
    attackUpper=accumulateUpper(attackUpper,squaredDistanceUpper(data.actual[i],box));
    attackLower=accumulateLower(attackLower,squaredDistanceLower(data.actual[i],box));
  }
  limits(work,guard);const count=a.last-a.first+1;
  return{origin,admission,fullUpperRms:Math.sqrt(Math.max(0,upper)/data.actual.length),fullLowerRms:Math.sqrt(lower/data.actual.length),attackUpperRms:Math.sqrt(attackUpper/count),attackLowerRms:Math.sqrt(attackLower/count),
    compatible:a.complete&&upper<=lowerThreshold(data.actual.length)&&attackUpper<=lowerThreshold(count),fullSamples:data.actual.length,attackSamples:count,affectedSamples};
}
function outer(a:Interval|undefined,b:Interval):Interval{return a?interval(Math.min(a.lo,b.lo),Math.max(a.hi,b.hi)):b;}
function entrance(cell:Cell,rate:number):Interval{return interval(Math.max(cell.origin.lo,cell.admissionLo/rate),Math.max(cell.origin.hi,cell.admissionHi/rate));}
function earlyEquivalent(cell:Cell,rate:number):boolean{return cell.admissionHi/rate<=cell.origin.lo;}
function split(cell:Cell,rate:number):Cell[]{
  const width=(cell.origin.hi-cell.origin.lo)*rate,admissionWidth=earlyEquivalent(cell,rate)?0:cell.admissionHi-cell.admissionLo;
  if(admissionWidth>128&&admissionWidth>width){const mid=cell.admissionLo+Math.floor(admissionWidth/256)*128;return[{...cell,admissionHi:mid},{...cell,admissionLo:mid+128}];}
  const mid=cell.origin.lo/2+cell.origin.hi/2;
  if(mid===cell.origin.lo||mid===cell.origin.hi)return[];
  return[{...cell,origin:interval(cell.origin.lo,mid)},{...cell,origin:interval(mid,cell.origin.hi)}];
}
export interface GroupDiagnostic {
  disposition:string;scope:string;expected:number;outerEntrance?:Interval;unexploredEntrance?:Interval;
  concreteWitnesses:Witness[];unexcludedCells:number;excludedCells:number;processedCells:number;
  allDeclaredCellsProcessed:boolean;completeAttack:boolean;missing:Witness;extra:Witness;
  componentControls:{sequence:number;missing:Witness;delay100:Witness;extra:Witness}[];
  limitations:string[];errors:string[];
}
export function measurementDisposition(completeAttack:boolean,allCellsProcessed:boolean,concreteWitnesses:number,controlsRejected:boolean,hasOuter:boolean):string {
  return !completeAttack?'censored':!allCellsProcessed?'resource-unfinished':!concreteWitnesses?'no-concrete-compatible-witness':!controlsRejected?'ambiguous-component-control':hasOuter?'conditional-family-measurement':'inconsistent-exclusion';
}
export function searchGroup(data:WindowData,baseline:Baseline,selected:readonly Voice[],work:Work,guard:Guard=()=>{},cellsPerGroup=MVP.cellsPerGroup):GroupDiagnostic{
  if(!selected.length||baseline.peak+selected.length*2>64)throw Error('Unproved counterfactual non-stealing branch');
  const expected=selected[0].onset,admission=selected[0].admittedFrame;
  const root:Cell={origin:interval(data.epoch,data.epoch+data.seconds),admissionLo:Math.floor(data.firstFrame/128)*128,admissionHi:Math.floor((data.firstFrame+data.actual.length-1)/128)*128};
  const missing=concreteWitness(data,baseline,selected,expected,admission,expected,work,guard,0),extra=concreteWitness(data,baseline,selected,expected,admission,expected,work,guard,2);
  const componentControls=selected.map(v=>({sequence:v.sequence,missing:concreteWitness(data,baseline,[v],v.onset,v.admittedFrame,expected,work,guard,0),
    delay100:concreteWitness(data,baseline,[v],v.onset+.1,v.admittedFrame,expected,work,guard),extra:concreteWitness(data,baseline,[v],v.onset,v.admittedFrame,expected,work,guard,2)}));
  const row:GroupDiagnostic={disposition:'searching',scope:'Conditional single-group common-origin/quantum-admission family; neighbors fixed',expected,concreteWitnesses:[],unexcludedCells:0,excludedCells:0,processedCells:0,allDeclaredCellsProcessed:false,
    completeAttack:attackRange(data,expected).complete,missing,extra,componentControls,limitations:['Independent component-origin joint changes are not exhaustively searched.','F03 neighboring-origin/admission joint alternatives are unexcluded.','Origins outside retained product timer support are outside the declared family.','JavaScript transcendental implementation bounds are assumed, not certified.','Ordinal clock model; cursor sensitivity is not implemented in this MVP.'],errors:[]};
  const nominal=concreteWitness(data,baseline,selected,expected,admission,expected,work,guard);if(nominal.compatible)row.concreteWitnesses.push(nominal);
  const stack:Cell[]=[root];
  try{
    while(stack.length){
      if(row.processedCells>=cellsPerGroup)throw new BoundError('Per-group interval-cell capacity');
      work.maxFrontier=Math.max(work.maxFrontier,stack.length);if(stack.length>MVP.frontier)throw new BoundError('Interval frontier capacity');
      const cell=stack.pop()!;work.cells++;row.processedCells++;limits(work,guard);
      if(exclusionBounds(data,baseline,selected,cell,expected,work,guard).excluded){row.excludedCells++;continue;}
      if((cell.origin.hi-cell.origin.lo)*data.rate<=1&&(earlyEquivalent(cell,data.rate)||cell.admissionHi-cell.admissionLo<=128)){
        row.unexcludedCells++;row.outerEntrance=outer(row.outerEntrance,entrance(cell,data.rate));
        if(row.concreteWitnesses.length<MVP.detailsPerGroup){
          const origin=cell.origin.lo/2+cell.origin.hi/2,adm=earlyEquivalent(cell,data.rate)?cell.admissionHi:cell.admissionLo;
          const witness=concreteWitness(data,baseline,selected,origin,adm,expected,work,guard);
          if(witness.compatible)row.concreteWitnesses.push(witness);
        }
      }else{const children=split(cell,data.rate);if(!children.length){row.unexcludedCells++;row.outerEntrance=outer(row.outerEntrance,entrance(cell,data.rate));}else stack.push(...children);}
    }
    row.allDeclaredCellsProcessed=true;
  }catch(error){
    if(!(error instanceof BoundError))throw error;
    row.errors.push(error.message);
    // The current cell is not silently forgotten if a guard fires after pop.
    row.unexploredEntrance=entrance(root,data.rate);
    row.outerEntrance=outer(row.outerEntrance,row.unexploredEntrance);
  }
  const controlsRejected=missing.attackLowerRms>MVP.rms&&extra.attackLowerRms>MVP.rms&&componentControls.every(c=>c.missing.attackLowerRms>MVP.rms&&c.delay100.attackLowerRms>MVP.rms&&c.extra.attackLowerRms>MVP.rms);
  row.disposition=measurementDisposition(row.completeAttack,row.allDeclaredCellsProcessed,row.concreteWitnesses.length,controlsRejected,Boolean(row.outerEntrance));
  work.detailsBytes+=Buffer.byteLength(JSON.stringify(row));limits(work,guard);return row;
}

/** Retain complete denominator before any search; never mark dense rows run. */
export function initialRows(inventory:any):any[]{
  const expected=[32,36,160,240];if(inventory.modeledGroups!==468||inventory.segments?.length!==4)throw Error('Full468 inventory missing');
  return inventory.segments.flatMap((s:any,index:number)=>{if(s.groups.length!==expected[index])throw Error('Fixture group denominator changed');return s.groups.map((g:any)=>({fixture:s.fixture,segment:index,index:g.index,expected:g.onset,logicalVoices:g.logicalVoices,nominalAudibleVoices:g.nominalAudibleVoices,erased:g.erasedBeforeSound,
    stallTarget:s.stallTargets.some((t:any)=>t.groupIndex===g.index),disposition:index<2?'unattempted':'dense-unsupported-unattempted',actualIdentified:false}));});
}
async function run(capture:string,output:string,inventoryPath:string):Promise<void>{
  if(fs.existsSync(output))throw Error('Refusing existing output directory');fs.mkdirSync(output,{recursive:true});
  const start=performance.now();let maxRss=0,fd:number|undefined;
  const work=createWork(),result:any={title:'Bongo Planet conditional F02/F03 onset MVP',status:'preparing',qualificationPassed:false,acceptancePassed:false,actualIdentifiedGroups:null,errors:[],rows:[],limits:MVP,numericalAssumptions:NUMERICAL_ASSUMPTIONS,
    missingImplementation:['dense ownership search','neighbor joint-variable search','joint distinct-component continuous search','cursor sensitivity'],negativeReference:{nativeLag:640,productDelaySamples:4800,recenter:false,actualNegativeAnalysis:'unattempted-MVP'},work};
  const guard=()=>{maxRss=Math.max(maxRss,process.memoryUsage().rss);if(performance.now()-start>MVP.seconds*1000||maxRss>MVP.residentBytes)throw new BoundError('Cooperative120s/256MiB bound');};
  const digest=async(file:string)=>{const h=createHash('sha256');for await(const bytes of fs.createReadStream(file)){h.update(bytes);guard();}return h.digest('hex');};
  try{
    const inventoryBytes=fs.readFileSync(inventoryPath),inventory=JSON.parse(inventoryBytes.toString());result.rows=initialRows(inventory);
    if(sha(inventoryBytes)!=='448590de61a9e4265fb33238b6c2e0ca2582d8f7c32373a4c8fda7be89213998')throw Error('Frozen inventory binding changed');
    const reportBytes=fs.readFileSync(path.join(capture,'report.json')),report=JSON.parse(reportBytes.toString()),auditBytes=fs.readFileSync(path.join(capture,'independent-audit.json')),audit=JSON.parse(auditBytes.toString()),fidelityBytes=fs.readFileSync(path.join(capture,'fixed-fidelity.json')),fidelity=JSON.parse(fidelityBytes.toString());
    if(!audit.captureIntegrityAuditPassed||audit.errors.length||audit.bindings.reportSha256!==sha(reportBytes)||fidelity.bindings.report!==sha(reportBytes)||fidelity.bindings.audit!==sha(auditBytes))throw Error('Completed audited fixed evidence missing');
    result.bindings={inventory:sha(inventoryBytes),report:sha(reportBytes),audit:sha(auditBytes),originalFixedFidelity:sha(fidelityBytes)};
    const files={input:path.join(capture,'virtual-input.f32'),tap:path.join(capture,'product-tap.f32'),metadata:path.join(capture,'quantums.jsonl'),events:path.join(capture,'events.jsonl'),oracle:'scripts/mixture-timing-oracle.ts',topology:path.join(capture,'topology.json'),helper:'scripts/mixture-onset-runner.ts',expressionHelper:'scripts/mixture-production-interval.ts',realInterval:'scripts/mixture-onset-interval.ts'};
    for(const[k,f]of Object.entries(files))result.bindings[k]=await digest(f);
    if(result.bindings.input!==audit['virtual-input'].sha256||result.bindings.tap!==audit['product-tap'].sha256||result.bindings.metadata!==audit.bindings.quantumsSha256||result.bindings.events!==audit.bindings.eventsSha256||result.bindings.oracle!==inventory.bindings.oracle||result.bindings.topology!==inventory.bindings['topology.json'])throw Error('Original raw/model binding mismatch');
    let count=0,baseFrame:number|undefined;
    for await(const line of readline.createInterface({input:fs.createReadStream(files.metadata),crlfDelay:Infinity})){
      const r=JSON.parse(line);if(r.index!==count||r.quantum!==128||r.inputLength!==128||r.sourceLength!==128||r.inputChannels<1||r.sourceChannels<1||r.inputOffset!==count*128||r.sourceOffset!==count*128)throw Error('Full original ordinal metadata missing');
      if(baseFrame===undefined)baseFrame=finite(r.currentFrame);count++;guard();
    }
    if(count!==report.stats.blocks||baseFrame===undefined)throw Error('Metadata denominator changed');result.clockModel={type:'fixed-original-ordinal',baseFrame,fitPerformed:false};
    const vertices=JSON.parse(fs.readFileSync(files.topology,'utf8')).vertices;fd=fs.openSync(files.input,'r');
    for(let index=0;index<2;index++){
      guard();const s=report.segments[index],a=audit.segments[index],first=s.firstAnalysisObserverIndex,last=s.lastAnalysisObserverIndex,epoch=s.firstEmission.event.time;
      if(!a.nativeBeforeAfterAgreed||a.nativeBefore.lagSamples!==640||a.nativeAfter.lagSamples!==640||a.coverage.firstOriginalIndex!==first||a.coverage.lastOriginalIndex!==last||a.coverage.startContextTime!==epoch||a.coverage.endContextTime!==epoch+s.seconds||s.transportEpochContextTime!==epoch)throw Error('Full native/epoch coverage mismatch');
      const fixture=fs.readFileSync(path.join(capture,'segment-'+index+'-fixture.json'));if(sha(fixture)!==s.fixtureSha256||JSON.stringify(JSON.parse(fixture.toString()))!==JSON.stringify(s.scene))throw Error('Scene binding mismatch');
      const samples=(last-first+1)*128,actual=new Float32Array(samples),chunk=Buffer.alloc(128*1024),rawStart=(first*128+640)*4;
      for(let byte=0;byte<samples*4;){const required=Math.min(chunk.length,samples*4-byte);const n=fs.readSync(fd,chunk,0,required,rawStart+byte);if(n!==required)throw Error('Truncated native mapped full window');for(let i=0;i<n;i+=4)actual[byte/4+i/4]=finite(chunk.readFloatLE(i));byte+=n;guard();}
      const voices=fixtureOracle(s.scene,vertices,epoch,s.seconds+.25,MVP.rate),groups=onsetGroups(voices).filter(g=>g.onset<epoch+s.seconds-1e-9);
      if(groups.length!==inventory.segments[index].groups.length)throw Error('Independent group denominator changed');
      const data:WindowData={actual,firstFrame:baseFrame+first*128,rate:MVP.rate,volume:s.scene.settings.volume,voices,epoch,seconds:s.seconds},baseline=prepareWindow(data,work,guard);
      for(const[gIndex,g]of groups.entries()){
        const row=result.rows.find((r:any)=>r.segment===index&&r.index===gIndex);row.disposition='attempting';
        row.diagnostic=searchGroup(data,baseline,g.voices,work,guard);row.disposition=row.diagnostic.disposition;row.conditionalMeasurement=row.disposition==='conditional-family-measurement';
        if(row.diagnostic.outerEntrance)row.signedErrorSeconds={lo:nextDown(row.diagnostic.outerEntrance.lo-g.onset-1/MVP.rate),hi:nextUp(row.diagnostic.outerEntrance.hi-g.onset+1/MVP.rate)};
        if(!row.diagnostic.allDeclaredCellsProcessed)throw new BoundError('Search prefix incomplete; no automatic continuation');
        if(gIndex%8===0)console.log('ONSET_MVP '+JSON.stringify({fixture:s.fixture,group:gIndex,status:row.disposition,work,qualificationPassed:false}));
      }
    }
    result.status='completed-conditional-MVP';
  }catch(error){result.status='failed-or-incomplete';result.errors.push(String(error));for(const row of result.rows)if(row.disposition==='unattempted'||row.disposition==='attempting')row.disposition=error instanceof BoundError?'resource-unfinished':'unattempted-after-failure';process.exitCode=1;}
  finally{
    if(fd!==undefined)fs.closeSync(fd);result.elapsedMonotonicSeconds=(performance.now()-start)/1000;maxRss=Math.max(maxRss,process.memoryUsage().rss);result.maximumObservedRss=maxRss;
    if(result.elapsedMonotonicSeconds>MVP.seconds||maxRss>MVP.residentBytes){result.status='failed-or-incomplete';result.errors.push('Final cooperative resource bound exceeded');process.exitCode=1;}
    result.counts={fixedPositiveDenominator:result.rows.length,conditionalMeasurements:result.rows.filter((r:any)=>r.conditionalMeasurement).length,denseUnsupported:result.rows.filter((r:any)=>r.disposition==='dense-unsupported-unattempted').length};
    fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,counts:result.counts,qualificationPassed:false}));
  }
}
// Importing this module never opens recordings or starts a search. Actual entry
// requires a separate explicit --run command and an exclusive new output.
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length!==6||args[0]!=='--run'||args[2]!=='--output'||args[4]!=='--inventory')throw Error('Usage: --run <capture> --output <new-directory> --inventory <frozen-inventory>');
  await run(path.resolve(args[1]),path.resolve(args[3]),path.resolve(args[5]));
}
