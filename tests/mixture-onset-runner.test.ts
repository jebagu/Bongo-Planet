import {afterAll,describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {interval} from '../scripts/mixture-onset-interval';
import {binary32Range,CALL_ERROR,conditionalSine,productionSineRange,squaredDistanceLower} from '../scripts/mixture-production-interval';
import {BoundError,MVP,concreteWitness,createWork,exclusionBounds,initialRows,measurementDisposition,prepareWindow,searchGroup,type WindowData} from '../scripts/mixture-onset-runner';

type V=WindowData['voices'][number];
let sourceControlMaximumRss=0;
const controlStart=performance.now(),workRecords:ReturnType<typeof createWork>[]=[];
function memory(){sourceControlMaximumRss=Math.max(sourceControlMaximumRss,process.memoryUsage().rss);}
afterAll(()=>{
  memory();const record={elapsedMonotonicSeconds:(performance.now()-controlStart)/1000,maximumSampledRss:sourceControlMaximumRss,workRecords,recordingsOpened:false,actualRunnerExecuted:false,qualificationPassed:false,
    scope:'Small independently generated synthetic cases only; sampled process RSS does not prove full recording workload feasibility.'};
  const output=process.env.BONGO_ONSET_CONTROL_OUTPUT;
  if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'measured-controls.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
});
const voice=(sequence=1,onset=.004,frequency=1000):V=>({sequence,onset,frequency,duration:.008,level:.65,kind:'sine',admittedFrame:128,removedFrame:Infinity});
/** Independent synthetic controls: directly stated analytic note equation,
 * independent insertion predicate and Float32 output. No production/oracle
 * imports provide expected waveforms. Rational .18=9/50 and .98=49/50 are
 * written separately; Math accuracy remains the declared conditional premise. */
function observed(voices:readonly V[],seconds=.04,volume=.65):WindowData {
  const actual=new Float32Array(Math.ceil(seconds*48000/128)*128);
  for(let i=0;i<actual.length;i++){
    const t=i/48000;let sum=0;
    for(const v of voices){if(i<v.admittedFrame)continue;const age=t-v.onset;if(age<0||age>=v.duration)continue;
      const attack=age<.002?500*age:1,releaseSeconds=v.duration/4<.02?v.duration/4:.02;
      const end=age>v.duration-releaseSeconds?(v.duration-age)/releaseSeconds:1;
      sum+=(9/50)*v.level*attack*end*Math.sin(2*Math.PI*v.frequency*age);
    }
    actual[i]=(49/50)*Math.tanh(volume*sum);
  }
  return{actual,firstFrame:0,rate:48000,volume,voices,epoch:0,seconds};
}
function setup(model:readonly V[],actual=observed(model)){
  const data={...actual,voices:model},work=createWork(),baseline=prepareWindow(data,work);
  workRecords.push(work);
  memory();
  return{data,work,baseline};
}

describe('conditional production expression intervals',()=>{
  it('contains independently rational quarter-cycle attack amplitude45/1024',()=>{
    // t=1/1024, f=256 gives a quarter cycle; attack=125/256,
    // .18*.5=9/100, yielding45/1024 before the master tanh.
    const r=productionSineRange({origin:interval(0),frequency:256,duration:1/16,level:.5},interval(1/1024));
    expect(r.lo).toBeLessThanOrEqual(45/1024);expect(r.hi).toBeGreaterThanOrEqual(45/1024);
  });
  it('bounds continuous off-grid and turning-point arguments, rather than endpoints alone',()=>{
    const r=conditionalSine(interval(Math.PI/2-.001,Math.PI/2+.001));
    expect(r.lo).toBeLessThan(1);expect(r.hi).toBeGreaterThanOrEqual(1);
    const broad=conditionalSine(interval(-8,8));expect(broad.lo).toBeLessThanOrEqual(-1);expect(broad.hi).toBeGreaterThanOrEqual(1);
  });
  it('retains explicit function-call assumptions and rejects nonfinite inputs',()=>{
    expect(CALL_ERROR).toBe(1/1099511627776);
    expect(()=>conditionalSine(interval(NaN))).toThrow();expect(()=>conditionalSine(interval(Infinity))).toThrow();
  });
  it('handles binary32 ties/subnormals and endpoint ranges independently',()=>{
    expect(binary32Range(interval(2**-150))).toEqual({lo:0,hi:0});
    const b=binary32Range(interval(0,2**-149));expect(b).toEqual({lo:0,hi:2**-149});
    expect(()=>binary32Range(interval(1e100))).toThrow('overflow');
  });
  it('retains zero before attack/after duration, including a crossing envelope branch',()=>{
    const v={origin:interval(.004),frequency:1000,duration:.008,level:.65};
    expect(productionSineRange(v,interval(.003))).toEqual(interval(0));
    expect(productionSineRange(v,interval(.013))).toEqual(interval(0));
    const r=productionSineRange({...v,origin:interval(.00399,.00401)},interval(.004));expect(r.lo).toBeLessThanOrEqual(0);expect(r.hi).toBeGreaterThanOrEqual(0);
  });
});

describe('fixed epoch/common parameter witnesses and controls',()=>{
  it('accepts the off-grid analytic witness, preserving full/attack denominators',()=>{
    const v=voice(1,.0040137),{data,work,baseline}=setup([v]);
    const w=concreteWitness(data,baseline,[v],v.onset,v.admittedFrame,v.onset,work);
    expect(w.compatible).toBe(true);expect(w.fullSamples).toBe(data.actual.length);expect(w.attackSamples).toBe(960);
  });
  it('rejects omission, extra copy and a delayed individual chord component',()=>{
    const chord=[voice(1,.004,997),voice(2,.004,1301),voice(3,.004,1553)],{data,work,baseline}=setup(chord);
    const omitted=concreteWitness(data,baseline,[chord[0]],.004,128,.004,work,()=>{},0);
    const extra=concreteWitness(data,baseline,[chord[1]],.004,128,.004,work,()=>{},2);
    const delayed=concreteWitness(data,baseline,[chord[2]],.007,128,.004,work);
    expect(omitted.attackLowerRms).toBeGreaterThan(1e-6);expect(extra.attackLowerRms).toBeGreaterThan(1e-6);expect(delayed.compatible).toBe(false);
  });
  it('distinguishes unchanged-phase late insertion from translated origin',()=>{
    const model=[voice()],actual=observed([{...model[0],admittedFrame:384}]),{data,work,baseline}=setup(model,actual);
    expect(concreteWitness(data,baseline,model,.004,384,.004,work).compatible).toBe(true);
    expect(concreteWitness(data,baseline,model,.008,384,.004,work).compatible).toBe(false);
    expect(concreteWitness(data,baseline,model,.004,128,.004,work).compatible).toBe(false);
  });
  it('does not hide joint origin/admission changes in the nominal epoch',()=>{
    const model=[voice()],actual=observed([{...model[0],onset:.006137,admittedFrame:384}]),{data,work,baseline}=setup(model,actual);
    expect(concreteWitness(data,baseline,model,.006137,384,.004,work).compatible).toBe(true);
    expect(concreteWitness(data,baseline,model,.004,128,.004,work).compatible).toBe(false);
  });
  it('requires a concrete witness even when per-sample interval hulls include observations',()=>{
    // Exact independent counterexample: x0=p, x1=p, observed(0,1).
    // Both interval predictions[0,1] include each observation, yet
    // p^2+(p-1)^2=2(p-.5)^2+.5>=.5 for every common p.
    expect(squaredDistanceLower(0,interval(0,1))+squaredDistanceLower(1,interval(0,1))).toBe(0);
    expect(measurementDisposition(true,true,0,true,true)).toBe('no-concrete-compatible-witness');
  });
  it('keeps a carrier-period alias from being established by matching steady tails',()=>{
    const v=voice(),{data,work,baseline}=setup([v]);
    const alias=concreteWitness(data,baseline,[v],v.onset+.001,v.admittedFrame,v.onset,work);
    expect(alias.attackLowerRms).toBeGreaterThan(1e-6);expect(alias.compatible).toBe(false);
  });
  it('retains F03 fixed-neighbor limitation when an overlapping neighbor changes',()=>{
    const model=[voice(1,.004,1000),voice(2,.009,1600)],actual=observed([model[0],{...model[1],onset:.011}]),{data,work,baseline}=setup(model,actual);
    expect(concreteWitness(data,baseline,[model[0]],.004,128,.004,work).compatible).toBe(false);
  });
  it('rejects background noise without increasing the predeclared RMS threshold',()=>{
    const v=voice(),actual=observed([v]);for(let i=0;i<actual.actual.length;i++)actual.actual[i]+=(i%2?1:-1)*.002;
    const{data,work,baseline}=setup([v],actual);expect(concreteWitness(data,baseline,[v],.004,128,.004,work).compatible).toBe(false);expect(MVP.rms).toBe(1e-6);
  });
  it('does not infer attack presence when a weak component is below the declared criterion',()=>{
    const v={...voice(),level:1e-9},{data,work,baseline}=setup([v]);
    const missing=concreteWitness(data,baseline,[v],v.onset,v.admittedFrame,v.onset,work,()=>{},0);
    expect(missing.compatible).toBe(true);expect(missing.attackIncompatible).toBe(false);
    expect(measurementDisposition(true,true,1,false,true)).toBe('ambiguous-component-control');
  });
  it('uses only independently fixed native640 for the actual100ms negative control',()=>{
    const source=observed([voice()],.16).actual,input=new Float32Array(source.length+640+4800);input.set(source,640+4800);
    let nominal=0,declared=0;for(let i=0;i<source.length;i++){nominal+=(input[i+640]-source[i])**2;declared+=(input[i+5440]-source[i])**2;}
    expect(Math.sqrt(nominal/source.length)).toBeGreaterThan(1e-6);expect(declared).toBe(0);expect(MVP.nativeLag).toBe(640);expect(MVP.negativeDelaySamples).toBe(4800);
  });
});

describe('coverage/exclusion and resource honesty',()=>{
  it('completes a small continuous family and reports the entire remaining entrance range',()=>{
    const v=voice(1,.0040137),{data,work,baseline}=setup([v]),row=searchGroup(data,baseline,[v],work);
    expect(row.allDeclaredCellsProcessed).toBe(true);expect(row.concreteWitnesses.some(w=>w.compatible)).toBe(true);
    expect(row.outerEntrance!.lo).toBeLessThanOrEqual(v.onset);expect(row.outerEntrance!.hi).toBeGreaterThanOrEqual(v.onset);
    expect(row.disposition).toBe('conditional-family-measurement');
  });
  it('finds a concrete shifted off-grid witness without rebasing the expected epoch',()=>{
    const v=voice(),actual=observed([{...v,onset:.004137}]),{data,work,baseline}=setup([v],actual),row=searchGroup(data,baseline,[v],work);
    expect(row.expected).toBe(.004);expect(row.allDeclaredCellsProcessed).toBe(true);
    expect(row.concreteWitnesses.some(w=>w.compatible&&Math.abs(w.origin-.004137)<1e-7)).toBe(true);
    expect(row.outerEntrance!.lo).toBeLessThanOrEqual(.004137);expect(row.outerEntrance!.hi).toBeGreaterThanOrEqual(.004137);
  });
  it('keeps full original468 rows including all dense/unattempted and stall targets',()=>{
    const inventory={modeledGroups:468,segments:[32,36,160,240].map((n,i)=>({fixture:['F02','F03','F06','F08'][i],groups:Array.from({length:n},(_,index)=>({index,onset:index,logicalVoices:1,nominalAudibleVoices:1,erasedBeforeSound:0})),stallTargets:i<2?[]:[{groupIndex:0},{groupIndex:1}]}))};
    const rows=initialRows(inventory);expect(rows).toHaveLength(468);expect(rows.filter(r=>r.disposition==='dense-unsupported-unattempted')).toHaveLength(400);expect(rows.filter(r=>r.stallTarget)).toHaveLength(4);
  });
  it('preserves the whole domain when a frontier/cell budget prevents completion',()=>{
    const v=voice(),{data,work,baseline}=setup([v]),row=searchGroup(data,baseline,[v],work,()=>{},0);
    expect(row.disposition).toBe('resource-unfinished');expect(row.allDeclaredCellsProcessed).toBe(false);expect(row.outerEntrance!.lo).toBeLessThanOrEqual(0);expect(row.outerEntrance!.hi).toBeGreaterThanOrEqual(data.seconds);
    expect(row.concreteWitnesses.some(w=>w.compatible)).toBe(true);
  });
  it('excludes a far-away origin by attack evidence at independently fixed samples',()=>{
    const v=voice(),{data,work,baseline}=setup([v]),cell={origin:interval(.03,.031),admissionLo:0,admissionHi:0};
    expect(exclusionBounds(data,baseline,[v],cell,.004,work).excluded).toBe(true);
  });
  it('rejects unsupported branch/voice types and responds to cooperative limits',()=>{
    const v=voice(),data=observed([v]);expect(()=>prepareWindow({...data,voices:[{...v,kind:'kick'}]},createWork())).toThrow('sine');
    expect(()=>prepareWindow(data,createWork(),()=>{throw new BoundError('test-bound');})).toThrow('test-bound');
    const exhausted=createWork();exhausted.voiceEvaluations=MVP.voiceEvaluations+1;
    expect(()=>prepareWindow(data,exhausted)).toThrow('capacity');
  });
  it('censors a truncated attack even when the retained prefix has a nominal witness',()=>{
    const v=voice(1,.035),{data,work,baseline}=setup([v]);
    expect(concreteWitness(data,baseline,[v],v.onset,v.admittedFrame,v.onset,work).compatible).toBe(false);
    expect(measurementDisposition(false,true,1,true,true)).toBe('censored');
  });
});
