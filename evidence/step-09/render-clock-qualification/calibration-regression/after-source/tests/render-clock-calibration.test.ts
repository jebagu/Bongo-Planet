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
    processor.process([],[[new Float32Array(128)]]);
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
    expect(runtime.uncertaintyComponents.maximumFrameWallResidualMs).toBe(runtime.maximumFrameWallResidualMs);
  });
  it('retains exact offending callback and uncertainty terms before releasing on drift',()=>{
    const h=controlledClock();for(let i=0;i<354;i++)h.quantum(i);h.quantum(354,100);
    const fatal=h.batches.find(row=>row.type==='fatal');
    expect(fatal.reason).toBe('Render callback mapping drift');
    expect(fatal.currentFrame).toBe(354*128);expect(fatal.currentTime).toBe(354*128/48000);
    expect(fatal.callbackWallMs).toBe(Math.floor(1_000_000+Math.floor(354/2)*256/48)+100);
    expect(fatal.signedResidualMs).toBeGreaterThan(90);
    expect(fatal.uncertaintyComponents.fullRenderQuantumMs).toBe(128/48000*1000);
    expect(fatal.uncertaintyMs).toBeGreaterThan(10);
    expect(h.clock.ready).toBe(false);expect((h.clock.diagnostics as any).fatalWitness.currentFrame).toBe(354*128);
  });
});
