import {afterAll,describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {interval,nextDown,nextUp} from '../scripts/mixture-onset-interval';
import {squaredDistanceLower} from '../scripts/mixture-production-interval';
import {MVP,BoundError,attackUpperThreshold,singletonRequiresSupport,inflateSupport,admissionAtSample,roundedSupportHull,intersectNecessary,contractSupport,createWork,prepareWindow,searchGroup,type WindowData,type Cell,type SupportContraction} from '../scripts/mixture-onset-runner-v2';
import {MVP as ORIGINAL} from '../scripts/mixture-onset-runner';

type Voice=WindowData['voices'][number];
const voice=(sequence=1,onset=.0040137,duration=.012):Voice=>({sequence,onset,duration,frequency:997,level:.65,kind:'sine',admittedFrame:128,removedFrame:Infinity});
const records:SupportContraction[]=[],start=performance.now();let maximumSampledRss=0;
function observed(voices:readonly Voice[],seconds=.04):WindowData {
  const actual=new Float32Array(Math.ceil(seconds*48000/128)*128);
  // Independent equation and admission predicate, not the interval model or
  // production renderer. Small synthetic inputs only; no recordings are read.
  for(let frame=0;frame<actual.length;frame++){
    let sum=0;const time=frame/48000;
    for(const v of voices){const age=time-v.onset;if(frame<v.admittedFrame||age<0||age>=v.duration)continue;
      const attack=age<1/500?age*500:1,release=v.duration/4<1/50?v.duration/4:1/50;
      const end=age>v.duration-release?(v.duration-age)/release:1;
      sum+=(9/50)*v.level*attack*end*Math.sin(2*Math.PI*v.frequency*age);
    }
    actual[frame]=(49/50)*Math.tanh(.65*sum);
  }
  return{actual,firstFrame:0,rate:48000,volume:.65,voices,epoch:0,seconds};
}
const root=(hi=.04):Cell=>({origin:interval(-64,hi),admissionLo:0,admissionHi:128*Math.floor(.04*48000/128)});
function setup(model:readonly Voice[],actual=observed(model)) {const data={...actual,voices:model},work=createWork(),baseline=prepareWindow(data,work);return{data,work,baseline};}
function contract(model:readonly Voice[],actual=observed(model),guard=()=>{},cell=root()){
  const {data,work,baseline}=setup(model,actual),result=contractSupport(data,baseline,model,cell,model[0].onset,work,guard);records.push(result);maximumSampledRss=Math.max(maximumSampledRss,process.memoryUsage().rss);return{data,work,baseline,result};
}
function contains(box:{lo:number;hi:number},value:number){expect(box.lo).toBeLessThanOrEqual(value);expect(box.hi).toBeGreaterThanOrEqual(value);}
afterAll(()=>{const dir=process.env.BONGO_CONTRACTION_CONTROL_OUTPUT;if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'measured-controls.json'),JSON.stringify({scope:'Synthetic source controls only; no continuous proof from finite candidates',recordingsOpened:false,actualRunnerExecuted:false,qualificationPassed:false,elapsedSeconds:(performance.now()-start)/1000,maximumSampledRss,records},null,2)+'\n',{flag:'wx'});}});

describe('complete singleton attack allowance',()=>{
  it('preserves every original tolerance/resource/clock constant',()=>{expect(MVP).toEqual(ORIGINAL);expect(MVP.rms).toBe(1e-6);expect(MVP.cellsPerGroup).toBe(4096);});
  it('requires STRICT excess over complete960 upper threshold; equality/touching do not contract',()=>{
    const threshold=attackUpperThreshold(960);expect(threshold).toBeGreaterThanOrEqual(960*1e-12);
    expect(singletonRequiresSupport(threshold,960,true)).toBe(false);expect(singletonRequiresSupport(nextDown(threshold),960,true)).toBe(false);
    expect(singletonRequiresSupport(nextUp(threshold),960,true)).toBe(true);
    expect(squaredDistanceLower(1,interval(0,1))).toBe(0);
    expect(singletonRequiresSupport(squaredDistanceLower(1,interval(0,1)),960,true)).toBe(false);
  });
  it('does not intersect several weak singletons whose collective sum contradicts',()=>{
    const threshold=attackUpperThreshold(960),weak=[.4,.4,.4].map(f=>f*threshold);expect(weak.reduce((a,b)=>a+b,0)).toBeGreaterThan(threshold);expect(weak.every(n=>!singletonRequiresSupport(n,960,true))).toBe(true);
    const v=voice(),actual=observed([v]);actual.actual.fill(Math.sqrt(threshold/2));const {result}=contract([v],actual);
    expect(result.status).toBe('committed');expect(result.records.every(r=>!r.necessary)).toBe(true);expect(result.domain).toEqual(result.original);
  });
  it('rejects clipped denominator/incomplete attack/nonfinite arithmetic conservatively',()=>{
    expect(()=>singletonRequiresSupport(1,959,true)).toThrow('denominator');expect(()=>singletonRequiresSupport(1,960,false)).toThrow('Incomplete');
    for(const value of[NaN,Infinity,-Infinity,-1])expect(()=>singletonRequiresSupport(value,960,true)).toThrow();
    const v=voice(1,.035);const {result}=contract([v]);expect(result.status).toBe('unresolved');expect(result.domain).toEqual(result.original);expect(result.records).toHaveLength(0);
  });
});

describe('independent rounded inverse and admission boundaries',()=>{
  it('inflates signed zero/subnormals and rejects infinite endpoints without clipping',()=>{
    expect(inflateSupport(interval(-0,0))).toEqual({lo:-Number.MIN_VALUE,hi:Number.MIN_VALUE});
    expect(inflateSupport(interval(Number.MIN_VALUE))).toEqual({lo:0,hi:2*Number.MIN_VALUE});
    expect(()=>inflateSupport(interval(Infinity))).toThrow();expect(()=>inflateSupport(interval(-Number.MAX_VALUE,0))).toThrow('Unbounded');
  });
  it('retains age zero/duration and immediately adjacent rounded subtraction/addition boundaries',()=>{
    const frame=480,time=frame/48000,duration=.003;
    const model=[voice(1,.004,duration),voice(2,.004000000000000001,duration)];
    const inverse=roundedSupportHull(frame,48000,model);
    for(const candidate of[nextDown(time),time,nextUp(time),nextDown(time-duration),time-duration,nextUp(time-duration)]){
      for(const component of inverse.components){const c=candidate+component.difference,age=time-c;
        if(age>=0&&age<=component.duration)contains(component.origin,candidate);
      }
    }
    contains(inverse.components[0].origin,time);contains(inverse.components[0].origin,time-duration);
    // Under cancellation at large times, preserve the actual rounded delta,
    // not a decimal onset difference or reassociated (t-origin)-delta.
    const large=roundedSupportHull(48000*64,48000,[voice(1,64),voice(2,nextUp(64))]);
    expect(large.components[1].difference).toBe(nextUp(64)-64);
    contains(large.components[1].origin,64-large.components[1].difference);
  });
  it('uses a hull of alternatives with unequal durations; only one component need support the sample',()=>{
    const model=[voice(1,.004,.001),voice(2,.009,.006)],support=roundedSupportHull(480,48000,model);
    expect(support.components[0].origin.lo).toBeGreaterThan(.004);contains(support.components[1].origin,.004);contains(support.origin,.004);
    const contracted=intersectNecessary(root(),support)!;contains(contracted.origin,.004);
    expect(support.components.map(c=>c.duration)).toEqual([.001,.006]);expect(support.components[1].difference).toBe(.009-.004);
  });
  it('floors safe integer admission frames before/at/after exact128 boundaries',()=>{
    expect([127,128,129,255,256,257].map(admissionAtSample)).toEqual([0,128,128,128,256,256]);
    expect(admissionAtSample(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER-127);
    for(const frame of[-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])expect(()=>admissionAtSample(frame)).toThrow();
    const cell={origin:interval(-1,1),admissionLo:128,admissionHi:512};
    expect(intersectNecessary(cell,{origin:interval(-.5,.5),admissionHi:128})!.admissionHi).toBe(128);
    expect(intersectNecessary(cell,{origin:interval(-.5,.5),admissionHi:0})).toBeNull();
  });
  it('retains a distant periodic alias within necessary support instead of identifying phase',()=>{
    const support=roundedSupportHull(4800,48000,[voice(1,.004,1)]),nominal=.0040137,alias=nominal+.05;
    //997*.05 is not chosen as a fitted period; a separate frequency20 branch
    // gives exactly one carrier period. Neither support domain selects one.
    const periodSupport=roundedSupportHull(4800,48000,[{...voice(1,.004,1),frequency:20}]);
    contains(support.origin,nominal);contains(periodSupport.origin,nominal);contains(periodSupport.origin,alias);
  });
});

describe('transactional fixed schedule/search preparation',()=>{
  it('retains known compatible off-grid origins and late admission from independently synthesized notes',()=>{
    for(const onset of[.0040137,.004137,.0062719])for(const admission of[128,384]){
      const model=[voice()],actual=observed([{...model[0],onset,admittedFrame:admission}]),{result}=contract(model,actual);
      expect(result.status).toBe('committed');expect(result.domain).not.toBeNull();contains(result.domain!.origin,onset);
      expect(result.domain!.admissionLo).toBeLessThanOrEqual(admission);expect(result.domain!.admissionHi).toBeGreaterThanOrEqual(admission);
      expect(result.records.length).toBeLessThanOrEqual(16);
    }
  });
  it('fixes traversal before amplitudes and charges each step/expression/proof to unchanged limits',()=>{
    const v=voice(),strong=contract([v]),weakData=observed([v]);weakData.actual.fill(0);const weak=contract([v],weakData);
    expect(strong.result.schedule).toEqual(weak.result.schedule);expect(strong.result.schedule).toHaveLength(16);
    expect(strong.result.records.some(r=>r.necessary)).toBe(true);expect(strong.result.work.cells).toBe(16);
    expect(strong.result.work.voiceEvaluations).toBeGreaterThanOrEqual(16);expect(strong.result.work.detailBytes).toBeGreaterThan(0);
    expect(strong.result.domain!.origin.hi-strong.result.domain!.origin.lo).toBeLessThan(.1);
    for(const r of strong.result.records){expect(r.denominator).toBe(960);expect(r.thresholdUpper).toBe(attackUpperThreshold(960));if(r.necessary){expect(r.lower).toBeGreaterThan(r.thresholdUpper);expect(r.components).toHaveLength(1);}}
  });
  it('restores the entire original long root on interruption DURING certificate construction',()=>{
    let calls=0;const {result}=contract([voice()],undefined,()=>{if(++calls===4)throw new BoundError('controlled interruption');});
    expect(result.status).toBe('unresolved');expect(result.records.length).toBeGreaterThan(0);expect(result.records.length).toBeLessThan(16);
    expect(result.domain).toEqual(root());expect(result.error).toContain('controlled interruption');
  });
  it('restores original root when expression/detail/cell guards are exhausted; retains prior records',()=>{
    const model=[voice()],{data,baseline}=setup(model);
    for(const field of['voiceEvaluations','detailsBytes','cells'] as const){const work=createWork();work[field]=field==='cells'?MVP.cells:field==='detailsBytes'?MVP.detailBytes:MVP.voiceEvaluations;
      const r=contractSupport(data,baseline,model,root(),model[0].onset,work);expect(r.status).toBe('unresolved');expect(r.domain).toEqual(root());}
    const r=contractSupport(data,baseline,model,root(),model[0].onset,createWork(),()=>{},1);expect(r.status).toBe('unresolved');expect(r.records).toHaveLength(1);expect(r.domain).toEqual(root());
  });
  it('certified empty domain is incompatible, not a timing measurement',()=>{
    const {result}=contract([voice()],undefined,()=>{},{origin:interval(.03,.04),admissionLo:0,admissionHi:1792});
    expect(result.status).toBe('committed');expect(result.domain).toBeNull();
  });
  it('preserves certificate and restores ORIGINAL root on subsequent bisection failure',()=>{
    const model=[voice()],{data,baseline,work}=setup(model),row=searchGroup(data,baseline,model,work,()=>{},17);
    expect(row.supportContraction!.status).toBe('committed');expect(row.supportContraction!.domain!.origin.hi-row.supportContraction!.domain!.origin.lo).toBeLessThan(.1);
    expect(row.disposition).toBe('resource-unfinished');expect(row.allDeclaredCellsProcessed).toBe(false);expect(row.unexploredEntrance!.lo).toBeLessThanOrEqual(0);expect(row.unexploredEntrance!.hi).toBeGreaterThanOrEqual(.04);
    expect(row.outerEntrance!.hi).toBeGreaterThan(row.supportContraction!.domain!.origin.hi);expect(row.concreteWitnesses.some(w=>w.compatible)).toBe(true);
  });
});
