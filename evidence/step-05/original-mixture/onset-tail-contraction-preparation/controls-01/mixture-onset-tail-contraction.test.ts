import {afterAll,describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {interval,nextDown,nextUp} from '../scripts/mixture-onset-interval';
import {MVP as V2} from '../scripts/mixture-onset-runner-v2';
import {MVP,TAIL_FRACTIONS,BoundError,attackUpperThreshold,fullUpperThreshold,singletonRequiresSupport,supportSchedule,contractSupport,createWork,prepareWindow,searchGroup,inflateSupport,roundedSupportHull,admissionAtSample,initialRows,type WindowData,type Cell,type SupportContraction} from '../scripts/mixture-onset-runner-v3';
type Voice=WindowData['voices'][number];
const voice=(sequence=1,onset=.0040137,duration=.04,frequency=997):Voice=>({sequence,onset,duration,frequency,level:.65,kind:'sine',admittedFrame:128,removedFrame:Infinity});
const records:SupportContraction[]=[],start=performance.now();let maximumSampledRss=0;
/** Independent small synthetic equation, ownership and admission predicates.
 * Does not import the production renderer/oracle to supply expected samples. */
function observed(voices:readonly Voice[],seconds=.08):WindowData {
  const actual=new Float32Array(Math.ceil(seconds*48000/128)*128);
  for(let frame=0;frame<actual.length;frame++){
    const time=frame/48000;let sum=0;
    for(const v of voices){const age=time-v.onset;if(frame<v.admittedFrame||age<0||age>=v.duration)continue;
      const attack=age<1/500?500*age:1,release=v.duration/4<1/50?v.duration/4:1/50;
      const end=age>v.duration-release?(v.duration-age)/release:1;
      sum+=(9/50)*v.level*attack*end*Math.sin(2*Math.PI*v.frequency*age);
    }
    actual[frame]=(49/50)*Math.tanh(.65*sum);
  }
  return{actual,firstFrame:0,rate:48000,volume:.65,voices,epoch:0,seconds};
}
const root=(seconds=.08):Cell=>({origin:interval(-64,seconds),admissionLo:0,admissionHi:128*Math.floor(seconds*48000/128)});
function setup(model:readonly Voice[],actual=observed(model)) {const data={...actual,voices:model},work=createWork(),baseline=prepareWindow(data,work);return{data,work,baseline};}
function contract(model:readonly Voice[],actual=observed(model),guard=()=>{}){const {data,work,baseline}=setup(model,actual),result=contractSupport(data,baseline,model,root(data.seconds),model[0].onset,work,guard);records.push(result);maximumSampledRss=Math.max(maximumSampledRss,process.memoryUsage().rss);return{data,work,baseline,result};}
function contains(box:{lo:number;hi:number},value:number){expect(box.lo).toBeLessThanOrEqual(value);expect(box.hi).toBeGreaterThanOrEqual(value);}
afterAll(()=>{const dir=process.env.BONGO_TAIL_CONTROL_OUTPUT;if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'measured-controls.json'),JSON.stringify({scope:'Finite synthetic source controls supplement necessary-condition proof; no original recording feasibility/qualification',recordingsOpened:false,actualRunnerExecuted:false,qualificationPassed:false,elapsedSeconds:(performance.now()-start)/1000,maximumSampledRss,records},null,2)+'\n',{flag:'wx'});}});

describe('correct complete comparison for early and tail singletons',()=>{
  it('keeps all v2 model, clock, tolerance and capacity constants identical',()=>{expect(MVP).toEqual(V2);expect(TAIL_FRACTIONS).toEqual([1,.75,.5,.375,.25,.1875,.125,.0625]);});
  it('requires strict COMPLETE FULL threshold outside attack; values between allowances do not contract',()=>{
    const attack=attackUpperThreshold(960),full=fullUpperThreshold(3072000),middle=(attack+full)/2;
    expect(full).toBeGreaterThanOrEqual(3.072e-6);expect(middle).toBeGreaterThan(attack);
    expect(singletonRequiresSupport(middle,960,true,'attack')).toBe(true);expect(singletonRequiresSupport(middle,3072000,true,'full')).toBe(false);
    expect(singletonRequiresSupport(full,3072000,true,'full')).toBe(false);expect(singletonRequiresSupport(nextDown(full),3072000,true,'full')).toBe(false);expect(singletonRequiresSupport(nextUp(full),3072000,true,'full')).toBe(true);
    expect(()=>singletonRequiresSupport(1,3072000,false,'full')).toThrow('Incomplete');for(const n of[0,-1,.5,Infinity,NaN])expect(()=>fullUpperThreshold(n)).toThrow();
  });
  it('does not substitute attack allowance or sum independently weak FULL tail samples',()=>{
    const model=[voice()],actual=observed(model),schedule=supportSchedule(actual,model,model[0].onset),attack=attackUpperThreshold(960),full=fullUpperThreshold(actual.actual.length);
    for(const slot of schedule.slots)if(slot.source==='tail')actual.actual[slot.index]=Math.sqrt((attack+full)/2);
    const {result}=contract(model,actual),tail=result.records.filter(r=>r.slot.source==='tail'&&!r.slot.duplicate);
    expect(result.status).toBe('committed');expect(tail).toHaveLength(8);expect(tail.every(r=>r.slot.criterion==='full'&&r.denominator===actual.actual.length&&r.thresholdUpper===full)).toBe(true);
    expect(tail.every(r=>r.lower!>attack&&r.lower!<full&&!r.necessary)).toBe(true);expect(tail.reduce((sum,r)=>sum+r.lower!,0)).toBeGreaterThan(full);
    expect(result.domain).toEqual(result.records[7].after);
  });
});

describe('fixed model-derived sixteen-slot schedule',()=>{
  it('predeclares every slot without amplitude access and breaks rounded-end ties by supplied order',()=>{
    let amplitudeReads=0;const actual=new Proxy({length:3840},{get(target,key){if(key==='length')return target.length;amplitudeReads++;throw Error('Amplitude access');}}) as unknown as Float32Array;
    const data={firstFrame:0,rate:48000,actual},model=[voice(9,.01,.04),voice(2,.03,.02)];
    const schedule=supportSchedule(data,model,.01);expect(amplitudeReads).toBe(0);expect(schedule.slots).toHaveLength(16);expect(schedule.anchor.selectedIndex).toBe(0);expect(schedule.anchor.sequence).toBe(9);expect(schedule.anchor.end).toBe(.05);expect(schedule.anchor.release).toBe(.01);
    expect(schedule.slots.slice(0,8).every(s=>s.source==='early')).toBe(true);expect(schedule.slots.slice(8).map(s=>s.fraction)).toEqual(TAIL_FRACTIONS);
    const reversed=supportSchedule(data,[model[1],model[0]],.01);expect(reversed.anchor.sequence).toBe(2);expect(reversed.anchor.release).toBe(.005);
  });
  it('retains proposed rounding separately from actual ordinal sample frame/time',()=>{
    const v=voice(1,.01,.031),data=observed([v]),schedule=supportSchedule(data,[v],v.onset);
    // end=.041, release=.00775; first tail=.03325 gives frame1596.
    const tail=schedule.slots[8];expect(tail.index).toBe(1596);expect(tail.frame).toBe(1596);expect(tail.time).toBe(1596/48000);expect(tail.proposedTime).toBeCloseTo(.03325,14);
    const shifted=supportSchedule({...data,firstFrame:128},[v],v.onset);expect(shifted.slots[8].index).toBe(tail.index-128);expect(shifted.slots[8].frame).toBe(tail.frame);
    expect(()=>supportSchedule({...data,firstFrame:Number.MAX_SAFE_INTEGER},[v],v.onset)).toThrow('Unsafe');expect(()=>supportSchedule(data,[{...v,duration:NaN}],v.onset)).toThrow('duration');
  });
  it('deduplicates rounded coincident indices without extra amplitude reads/slots/proofs',()=>{
    const v=voice(1,.004,1e-6),{result}=contract([v]);expect(result.status).toBe('committed');expect(result.scheduledSlots!.slots).toHaveLength(16);
    expect(result.records.some(r=>r.slot.duplicate)).toBe(true);expect(result.work.cells).toBe(16);
    expect(result.records.filter(r=>r.slot.duplicate).every(r=>r.absent===undefined&&r.lower===undefined&&!r.necessary&&r.operations.absentMixes===0)).toBe(true);
    expect(result.work.singletonComparisons).toBe(result.schedule.length);
  });
  it('uses attack allowance for overlapping in-attack tail indices, retaining full-window provenance',()=>{
    const v=voice(1,.0040137,.012),{data,result}=contract([v]);expect(result.status).toBe('committed');
    const tail=result.records.filter(r=>r.slot.source==='tail'&&!r.slot.duplicate);expect(tail.length).toBeGreaterThan(0);expect(tail.every(r=>r.slot.criterion==='attack'&&r.denominator===960&&r.thresholdUpper===attackUpperThreshold(960))).toBe(true);
    expect(data.actual.length).toBe(3840);
  });
  it('retains out-of-window reason and restores original root instead of clipping the comparison',()=>{
    const v=voice(1,.004,.12),{result}=contract([v],observed([v],.04));expect(result.status).toBe('unresolved');expect(result.domain).toEqual(result.original);expect(result.error).toContain('outside complete retained window');
    const bad=result.records.at(-1)!;expect(bad.slot.eligible).toBe(false);expect(bad.slot.reason).toBe('Outside retained full window');expect(bad.lower).toBeUndefined();expect(bad.denominator).toBeUndefined();expect(result.scheduledSlots!.slots).toHaveLength(16);
  });
});

describe('necessary alternatives and transactional preservation',()=>{
  it('retains off-grid translated origins and late admissions from independent compatible synthetic notes',()=>{
    for(const onset of[.0037719,.004137,.0050137])for(const admittedFrame of[128,1024]){
      const model=[voice()],actual=observed([{...model[0],onset,admittedFrame}]),{result}=contract(model,actual);
      expect(result.status).toBe('committed');expect(result.domain).not.toBeNull();contains(result.domain!.origin,onset);expect(result.domain!.admissionLo).toBeLessThanOrEqual(admittedFrame);expect(result.domain!.admissionHi).toBeGreaterThanOrEqual(admittedFrame);
    }
  });
  it('hulls ALL component inverses when another unequal component contributes before the schedule anchor even begins',()=>{
    const model=[{...voice(1,.03,.014),level:0},voice(2,.004,.035,1301)],origin=.041;
    const actual=observed(model.map(v=>({...v,onset:origin+(v.onset-model[0].onset)}))),{result}=contract(model,actual);
    expect(result.status).toBe('committed');contains(result.domain!.origin,origin);expect(result.scheduledSlots!.anchor.selectedIndex).toBe(0);
    const firstTail=result.records[8];expect(firstTail.necessary).toBe(true);expect(firstTail.time).toBeLessThan(origin);expect(firstTail.components![0].origin.hi).toBeLessThan(origin);contains(firstTail.components![1].origin,origin);contains(firstTail.originHull!,origin);
    expect(firstTail.components!.map(c=>c.duration)).toEqual([.014,.035]);expect(firstTail.operations.componentInversions).toBe(2);
  });
  it('retains weak/zero tails without forced pruning, and does not identify aliases inside support',()=>{
    const model=[voice()],actual=observed(model),schedule=supportSchedule(actual,model,model[0].onset);
    for(const slot of schedule.slots)if(slot.source==='tail')actual.actual[slot.index]=0;
    const weak=contract(model,actual).result;expect(weak.status).toBe('committed');expect(weak.records.slice(8).every(r=>!r.necessary)).toBe(true);expect(weak.domain).toEqual(weak.records[7].after);
    const zeros=observed(model);zeros.actual.fill(0);const silent=contract(model,zeros).result;expect(silent.domain).toEqual(silent.original);expect(silent.records.every(r=>!r.necessary)).toBe(true);
    // Pure necessary support cannot identify a carrier. One50us period at20kHz
    // fits between the early+tail constraints; no waveform-fit claim is made.
    const carrier={...model[0],frequency:20000},support=contract([carrier]).result;expect(support.status).toBe('committed');expect(support.records.some(r=>r.slot.source==='early'&&r.necessary)).toBe(true);expect(support.records.some(r=>r.slot.source==='tail'&&r.necessary)).toBe(true);contains(support.domain!.origin,carrier.onset);contains(support.domain!.origin,carrier.onset+1/20000);
  });
  it('preserves RN inverse signed-zero/subnormal and exact admission boundaries',()=>{
    expect(inflateSupport(interval(-0,0))).toEqual({lo:-Number.MIN_VALUE,hi:Number.MIN_VALUE});expect(inflateSupport(interval(Number.MIN_VALUE))).toEqual({lo:0,hi:2*Number.MIN_VALUE});
    expect([127,128,129].map(admissionAtSample)).toEqual([0,128,128]);expect(()=>admissionAtSample(Number.MAX_SAFE_INTEGER+1)).toThrow();
    const v=voice(1,.004,.012),time=480/48000,inverse=roundedSupportHull(480,48000,[v]);for(const origin of[nextDown(time),time,nextUp(time),nextDown(time-v.duration),time-v.duration,nextUp(time-v.duration)])if(time-origin>=0&&time-origin<=v.duration)contains(inverse.origin,origin);
  });
  it('charges sixteen preparation cells and all expression/detail records to original caps',()=>{
    const {result}=contract([voice()]);expect(result.status).toBe('committed');expect(result.work.cells).toBe(16);expect(result.work.singletonComparisons).toBe(result.schedule.length);expect(result.work.voiceEvaluations).toBe(result.schedule.length);expect(result.work.detailBytes).toBeGreaterThan(0);expect(result.records.length).toBeLessThanOrEqual(MVP.detailsPerGroup);
    expect(result.records.some(r=>r.slot.source==='tail'&&r.slot.criterion==='full'&&r.necessary)).toBe(true);expect(result.domain!.origin.hi-result.domain!.origin.lo).toBeLessThan(.002);
  });
  it('restores original root during tail construction and on every unchanged work/detail/cell guard',()=>{
    let calls=0;const interrupted=contract([voice()],undefined,()=>{if(++calls===20)throw new BoundError('tail interruption');}).result;
    expect(interrupted.status).toBe('unresolved');expect(interrupted.records.length).toBeGreaterThanOrEqual(8);expect(interrupted.domain).toEqual(interrupted.original);
    const model=[voice()],{data,baseline}=setup(model);
    for(const field of['cells','voiceEvaluations','detailsBytes'] as const){const work=createWork();work[field]=field==='cells'?MVP.cells:field==='voiceEvaluations'?MVP.voiceEvaluations:MVP.detailBytes;const r=contractSupport(data,baseline,model,root(),model[0].onset,work);expect(r.status).toBe('unresolved');expect(r.domain).toEqual(r.original);}
    const r=contractSupport(data,baseline,model,root(),model[0].onset,createWork(),()=>{},8);expect(r.status).toBe('unresolved');expect(r.records).toHaveLength(8);expect(r.domain).toEqual(r.original);
  });
  it('retains bounded charged frontier aggregate before cell cap but restores ORIGINAL entrance after failure',()=>{
    const model=[voice()],{data,work,baseline}=setup(model),row=searchGroup(data,baseline,model,work,()=>{},17);
    expect(row.supportContraction!.status).toBe('committed');expect(row.disposition).toBe('resource-unfinished');expect(row.allDeclaredCellsProcessed).toBe(false);expect(row.processedCells+row.supportContraction!.work.cells).toBe(17);
    const summary=row.frontierBeforeCap!;expect(summary).toBeDefined();expect(summary.pendingCells).toBeGreaterThan(0);expect(summary.detailBytes).toBe(Buffer.byteLength(JSON.stringify(summary)));expect(work.detailsBytes).toBeGreaterThanOrEqual(summary.detailBytes+row.supportContraction!.work.detailBytes);
    contains(summary.originHull,model[0].onset);expect(row.unexploredEntrance!.hi).toBeGreaterThanOrEqual(data.seconds);expect(row.outerEntrance!.hi).toBeGreaterThan(summary.entranceHull.hi);
  });
  it('retains every original468 row including400 unsupported dense rows',()=>{
    const inventory={modeledGroups:468,segments:[32,36,160,240].map((n,i)=>({fixture:['F02','F03','F06','F08'][i],groups:Array.from({length:n},(_,index)=>({index,onset:index,logicalVoices:1,nominalAudibleVoices:1,erasedBeforeSound:0})),stallTargets:[]}))};
    const rows=initialRows(inventory);expect(rows).toHaveLength(468);expect(rows.filter(r=>r.disposition==='dense-unsupported-unattempted')).toHaveLength(400);
  });
});
