import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { RenderClock } from '../src/output/RenderClock';

// Controlled unit regression, not receipt qualification: execute the actual
// embedded processor source with callback walls that deliberately alias when
// observed every8 quanta. Real capture only retained the sparse phase values;
// intermediate values here are a counterexample, not invented live evidence.
function controlledClock() {
  const file=fs.readFileSync(new URL('../src/output/RenderClock.ts',import.meta.url),'utf8');
  const source=file.split('const PROCESSOR = String.raw`')[1].split('`;')[0];
  let Processor:any,processor:any,wall=0;
  const batches:any[]=[],failures:string[]=[];
  const clock=new RenderClock({onset:()=>{},applied:()=>{},release:()=>{},failure:reason=>failures.push(reason)});
  const sandbox:any={currentFrame:0,currentTime:0,sampleRate:48000,Date:{now:()=>wall},Map,Set,Float32Array,
    AudioWorkletProcessor:class{port={onmessage:null as any,postMessage:(message:any)=>{batches.push(message);(clock as any).receive(message);}};},
    registerProcessor:(_name:string,p:any)=>{Processor=p;}};
  vm.runInNewContext(source,sandbox);processor=new Processor();
  (clock as any).socket={readyState:1,bufferedAmount:0,send:(text:string)=>processor.port.onmessage({data:JSON.parse(text)})};
  const quantum=(index:number,extraMs=0)=>{
    sandbox.currentFrame=index*128;sandbox.currentTime=sandbox.currentFrame/48000;
    // Two render quanta share a simulated callback wall. Sampling only the
    // last of each8 sees one phase; every-quantum sampling sees both phases.
    wall=Math.floor(1_000_000+Math.floor(index/2)*256/48)+extraMs;
    const output=new Float32Array(128);processor.process([],[[output]]);return output;
  };
  return {clock,processor,quantum,batches,failures};
}

describe('render clock calibration coverage',()=>{
  it('covers every startup phase and fixes independent all-quantum interval midpoint',()=>{
    const h=controlledClock();for(let i=0;i<370;i++)h.quantum(i);
    const calibration=h.clock.diagnostics.calibration as any;
    expect(calibration.samples).toHaveLength(256);
    const phases=Array.from({length:8},(_,phase)=>calibration.samples.filter((row:any)=>row.blockIndex%8===phase));
    expect(phases.map(rows=>rows.length)).toEqual(Array(8).fill(32));
    const offsets=calibration.samples.map((row:any)=>row.callbackWallMs-row.currentFrame/48);
    expect(calibration.frameWallOffset).toBeCloseTo((Math.min(...offsets)+Math.max(...offsets))/2,7);
    const sparse=phases[0].map((row:any)=>row.callbackWallMs-row.currentFrame/48);
    const sparseCenter=(Math.min(...sparse)+Math.max(...sparse))/2;
    expect(Math.abs(sparseCenter-calibration.frameWallOffset)).toBeGreaterThan(1);
    expect(h.clock.ready).toBe(true);expect(h.failures).toEqual([]);
    const runtime=(h.clock.diagnostics.lastClock as any);
    expect(runtime.phaseExtrema).toHaveLength(8);
    expect(runtime.phaseExtrema.every((phase:any)=>phase.count>0)).toBe(true);
    expect(runtime.maximumFrameWallResidualMs).toBeGreaterThan(1);
    expect(runtime.uncertaintyComponents.maximumFrameWallResidualMs).toBeUndefined();
    expect(runtime.uncertaintyMs).toBeCloseTo(Object.values(runtime.uncertaintyComponents).reduce((a:any,b:any)=>a+b,0) as number,8);
  });
  it('checks a buffered timestamp budget over10 before any following command/onset',()=>{
    const h=controlledClock();for(let i=0;i<370;i++)h.quantum(i);
    const base=h.processor.baseUncertaintyMs;
    h.processor.port.onmessage({data:{type:'budget',baseUncertaintyMs:10.1,nodeWallDriftMaxMs:10.1-base,
      maximumNodeWallPairUncertaintyMs:h.processor.maximumNodeWallPairUncertaintyMs,nodeWallPair:h.processor.nodeWallPair,nodeWallPairSequence:0}});
    h.clock.send({commandSequence:1,packet:{version:1,type:'start',session:'budget',sequence:0}});
    h.clock.send({commandSequence:2,packet:{version:1,type:'position',session:'budget',sequence:1,nodeId:'note',objectId:1,position:[0,0,1],sent:0}});
    h.clock.send({commandSequence:3,packet:{version:1,type:'trigger',session:'budget',sequence:2,triggerSequence:1,id:'budget-1',nodeId:'note',objectId:1,generatorId:'gen',onset:0,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.1}}});
    const output=h.quantum(370);
    const fatal=h.batches.find(row=>row.type==='fatal');
    expect(fatal?.reason).toBe('Render timestamp uncertainty exceeds 10ms');
    expect(fatal.uncertaintyMs).toBe(10.1);expect(fatal.commandSequence).toBe(0);
    expect(h.batches.flatMap(row=>row.rows??[]).some(row=>row.type==='onset')).toBe(false);
    expect([...output].every(sample=>sample===0)).toBe(true);
  });
  it('mapper residual appears in actual control error and is separate from measurement uncertainty',()=>{
    const h=controlledClock();for(let i=0;i<370;i++)h.quantum(i);
    const base=h.processor.baseUncertaintyMs,frame=370*128,offset=32;
    const onset=(h.processor.frameWallOffset+(frame+offset)/48-h.processor.nodeWallOffset)/1000;
    h.clock.send({commandSequence:1,packet:{version:1,type:'start',session:'model',sequence:0}});
    h.clock.send({commandSequence:2,packet:{version:1,type:'position',session:'model',sequence:1,nodeId:'note',objectId:1,position:[0,0,1],sent:0}});
    h.clock.send({commandSequence:3,packet:{version:1,type:'trigger',session:'model',sequence:2,triggerSequence:1,id:'model-1',nodeId:'note',objectId:1,generatorId:'gen',onset,sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.1}}});
    const output=h.quantum(370,3),receipt=h.batches.flatMap(row=>row.rows??[]).find(row=>row.type==='onset');
    expect(receipt).toBeDefined();expect(output[receipt.sampleOffset]).toBe(.25);
    const residual=receipt.callbackWallMs-receipt.currentFrame/48-h.processor.frameWallOffset;
    expect(Math.abs(residual)).toBeGreaterThan(3);
    expect(receipt.errorMs).toBeCloseTo(residual,1); // sample rounding <1/48ms
    expect(receipt.uncertaintyMs).toBe(base);
    expect(receipt.maximumFrameWallResidualMs).toBeGreaterThan(3);
    expect(receipt.uncertaintyMs+receipt.maximumFrameWallResidualMs).toBeGreaterThan(receipt.uncertaintyMs);
    expect(receipt.nodeWallPairSequence).toBe(0);expect(receipt.nodeWallPair).toEqual((h.clock.diagnostics.calibration as any).initialNodeWall);
    expect(h.failures).toEqual([]);
  });
  it('retains wider Node brackets, never shrinks their lifetime bound, and fails excessive width',()=>{
    const h=controlledClock();for(let i=0;i<370;i++)h.quantum(i);
    const initial=(h.clock.diagnostics.calibration as any).initialNodeWall,mid=(initial.before+initial.after)/2;
    const pair=(half:number)=>({before:mid-half,after:mid+half,wallMs:initial.wallMs,offsetMs:initial.offsetMs,uncertaintyMs:1+half});
    (h.clock as any).observeNodeWall(pair(4));(h.clock as any).updateUncertainty();h.quantum(370);
    const widened=h.clock.diagnostics as any;
    expect(widened.uncertaintyMs).toBeCloseTo(5+1+128/48,8);
    expect(widened.calibration.maximumNodeWallPair).toEqual(pair(4));expect(widened.calibration.nodeWallPairSequence).toBe(1);
    (h.clock as any).observeNodeWall(pair(.001));(h.clock as any).updateUncertainty();h.quantum(371);
    expect((h.clock.diagnostics as any).calibration.maximumNodeWallPairUncertaintyMs).toBe(5);
    (h.clock as any).observeNodeWall(pair(12));(h.clock as any).updateUncertainty();
    const failed=h.clock.diagnostics as any;
    expect(h.clock.ready).toBe(false);expect(failed.uncertaintyMs).toBeGreaterThan(10);
    expect(failed.fatalWitness.maximumNodeWallPair).toEqual(pair(12));expect(failed.fatalWitness.nodeWallPairSequence).toBe(3);
    expect(failed.fatalWitness.maximumNodeWallPairUncertaintyMs).toBe(13);
  });
  it('retains exact offending callback and uncertainty terms before releasing on drift',()=>{
    const h=controlledClock();for(let i=0;i<354;i++)h.quantum(i);h.quantum(354,100);
    const fatal=h.batches.find(row=>row.type==='fatal');
    expect(fatal.reason).toBe('Render callback mapping drift');
    expect(fatal.currentFrame).toBe(354*128);expect(fatal.currentTime).toBe(354*128/48000);
    expect(fatal.callbackWallMs).toBe(Math.floor(1_000_000+Math.floor(354/2)*256/48)+100);
    expect(fatal.signedResidualMs).toBeGreaterThan(90);
    expect(fatal.uncertaintyComponents.fullRenderQuantumMs).toBe(128/48000*1000);
    expect(fatal.maximumFrameWallResidualMs).toBeGreaterThan(10);
    expect(fatal.uncertaintyMs).toBeLessThan(10);
    expect(h.clock.ready).toBe(false);expect((h.clock.diagnostics as any).fatalWitness.currentFrame).toBe(354*128);
  });
});
