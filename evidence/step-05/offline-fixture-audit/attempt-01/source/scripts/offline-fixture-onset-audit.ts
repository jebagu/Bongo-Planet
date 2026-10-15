import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Engine} from '../src/core/engine';
import {MonoSynth} from '../src/audio/synth';
import type {Scene} from '../src/core/contracts';
import {renderOracle, type OracleVoice} from './mixture-timing-oracle';

// Published fixture timings and pitches, specified without the engine, geometry,
// fixture expected.json, or its scheduled event timestamps as an expectation.
const facts = {
  F02: [['gen','chord-0',2,.125,261.6255653005986],['gen','chord-1',2,.125,329.6275569128699],['gen','chord-2',2,.125,391.99543598174927]],
  F03: [['gen','phrase-0',2,.125,261.6255653005986],['gen','phrase-1',2,.5,329.6275569128699],['gen','phrase-2',2,.625,391.99543598174927]],
  F04: [['gen-3','shared-a',1.5,.125,261.6255653005986],['gen-3','shared-b',1.5,.25,261.6255653005986],['gen-3','hat',1.5,.375,0],['gen-4','shared-a',2,.75,261.6255653005986],['gen-4','shared-b',2,.75,261.6255653005986],['gen-4','hat',2,.625,0]],
} satisfies Record<string, [string,string,number,number,number][]>;
const rate=48000, seconds=6, samples=rate*seconds;
const argument=process.argv[2];
if(!argument)throw Error('Provide a new evidence/step-05/offline-fixture-audit child directory');
const base=path.resolve('evidence/step-05/offline-fixture-audit'), directory=path.resolve(argument);
if(!directory.startsWith(base+path.sep)||fs.existsSync(directory))throw Error('Use a new contained evidence directory');
fs.mkdirSync(directory,{recursive:true});
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const sources=['scripts/offline-fixture-onset-audit.ts','scripts/mixture-timing-oracle.ts','src/core/engine.ts','src/core/contracts.ts','src/core/geometry.ts','src/audio/synth.ts'];
const sourceHashes:Record<string,string>={};
for(const file of sources){const bytes=fs.readFileSync(file),out=path.join(directory,'source',file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes);sourceHashes[file]=sha(bytes);}
function actual(scene:Scene){
 const engine=new Engine(scene),synth=new MonoSynth(rate),pcm=new Float32Array(samples);
 let maxVoices=0;const receipts:{generatorId:string;nodeId:string;onset:number}[]=[];
 engine.play(0);
 for(let frame=0;frame<samples;frame+=128){
  const block=pcm.subarray(frame,Math.min(samples,frame+128));engine.advance((frame+block.length)/rate);
  const events=engine.drain();for(const event of events)if(event.type==='onset')receipts.push({generatorId:event.trigger.generatorId,nodeId:event.trigger.nodeId,onset:event.trigger.onset});
  synth.apply(events,frame/rate);maxVoices=Math.max(maxVoices,synth.counters.activeVoices);synth.render(block,frame/rate,scene.settings.volume);
 }
 return {pcm,receipts,maxVoices,stolenVoices:synth.counters.stolenVoices,lateDrops:engine.lateDrops,audioLateDrops:synth.counters.lateDropsAudio};
}
function waves(scene:Scene,rows:[string,string,number,number,number][]){
 const voices:OracleVoice[]=[];let sequence=0;
 for(const [generatorId,nodeId,period,delay,frequency] of rows){
  const piece=scene.pieces.find(piece=>piece.id===nodeId);if(!piece||piece.kind==='generator')throw Error('Missing fixture sound');
  for(let cycle=0;cycle*period+delay<seconds;cycle++){
   const onset=cycle*period+delay;
   voices.push({sequence:++sequence,generatorId,nodeId,onset,kind:frequency?'sine':'kick',frequency,
    duration:piece.kind==='note'?piece.duration:piece.decay,level:piece.level,
    admittedFrame:Math.max(0,(Math.ceil((onset*rate-1e-7)/128)-1)*128),removedFrame:Infinity});
  }
 }
 // No stealing is expected for these three fixtures. Coincident voices add.
 return voices.sort((a,b)=>a.onset-b.onset||a.sequence-b.sequence);
}
function writePCM(name:string,pcm:Float32Array){
 const bytes=Buffer.from(pcm.buffer,pcm.byteOffset,pcm.byteLength);fs.writeFileSync(path.join(directory,name+'.f32'),bytes);
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+bytes.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(3,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(32,34);header.write('data',36);header.writeUInt32LE(bytes.length,40);
 fs.writeFileSync(path.join(directory,name+'.wav'),Buffer.concat([header,bytes]));return sha(bytes);
}
const report:any={title:'Bongo Planet independent offline fixture onset audit',createdAt:new Date().toISOString(),sampleRate:rate,secondsPerRender:seconds,sourceHashes,liveQualificationPassed:false,
 method:'Fixed six-second origin0; explicit periods/delays/pitches, independent scalar sine/kick waveform oracle. No fitted offset. Original full mixes plus clearly labeled isolated pair variants.',
 limitations:['Numerical offline PCM only; no actual browser output or timing qualification.','Isolated variants mute other targets and disable other generators solely to measure each PCM entrance. Full original mixtures are separately compared.','Complete full-mix fidelity and isolated entrance measurements do not establish every live identity alternative or physical sound.'],fixtures:[]};
for(const [fixture,rows] of Object.entries(facts)){
 const bytes=fs.readFileSync('public/fixtures/'+fixture+'.json'),scene=JSON.parse(bytes.toString()) as Scene;
 fs.writeFileSync(path.join(directory,fixture+'.json'),bytes);
 const full=actual(scene),voices=waves(scene,rows),predicted=renderOracle(voices,0,samples,rate,scene.settings.volume);
 let sum=0,maxDifference=0,peak=0,nonfinite=0;
 for(let i=0;i<samples;i++){const difference=full.pcm[i]-predicted[i];sum+=difference*difference;maxDifference=Math.max(maxDifference,Math.abs(difference));peak=Math.max(peak,Math.abs(full.pcm[i]));if(!Number.isFinite(full.pcm[i]))nonfinite++;}
 const pairs=rows.map(row=>{
  const [generatorId,nodeId,period,expected]=row,isolated=structuredClone(scene);
  for(const piece of isolated.pieces){if(piece.kind==='generator')piece.enabled=piece.id===generatorId;else if(piece.id!==nodeId)piece.level=0;}
  const rendered=actual(isolated),piece=scene.pieces.find(piece=>piece.id===nodeId)!;
  if(piece.kind==='generator')throw Error('Missing sound');
  const duration=piece.kind==='note'?piece.duration:piece.decay,entrances=[];
  for(let cycle=0;cycle*period+expected<seconds;cycle++){
   const expectedSeconds=cycle*period+expected;
   const searchStartFrame=cycle===0?0:Math.ceil(((cycle-1)*period+expected+duration+.03)*rate);
   const searchEndFrame=Math.min(samples,Math.ceil((expectedSeconds+.01)*rate));
   let index=-1;for(let frame=searchStartFrame;frame<searchEndFrame;frame++)if(Math.abs(rendered.pcm[frame])>1e-4){index=frame;break;}
   const actualSeconds=index<0?null:index/rate;
   entrances.push({cycle,expectedSeconds,actualFirstSignalSeconds:actualSeconds,errorMs:actualSeconds===null?null:(actualSeconds-expectedSeconds)*1000,searchStartFrame,searchEndFrame,
    passed:actualSeconds!==null&&Math.abs(actualSeconds-expectedSeconds)<=.005});
  }
  return {generatorId,nodeId,period,entrances,stolenVoices:rendered.stolenVoices,
   rawSha256:writePCM(fixture+'-'+generatorId+'-'+nodeId+'-isolated',rendered.pcm),variant:'other generators disabled; other sound levels zero',passed:entrances.every(entrance=>entrance.passed)&&rendered.stolenVoices===0};
 });
 const expected=voices.map(voice=>({generatorId:voice.generatorId,nodeId:voice.nodeId,onset:voice.onset}));
 const receiptsMatch=full.receipts.length===expected.length&&expected.every(row=>full.receipts.filter(actual=>actual.generatorId===row.generatorId&&actual.nodeId===row.nodeId&&Math.abs(actual.onset-row.onset)<1e-9).length===1);
 let independentlyExpectedMaxVoices=0;
 for(let frame=0;frame<samples;frame+=128)independentlyExpectedMaxVoices=Math.max(independentlyExpectedMaxVoices,voices.filter(voice=>voice.admittedFrame<=frame&&voice.onset+voice.duration>frame/rate).length);
 const cycleMeasurements=Array.from({length:pairs[0].entrances.length},(_,cycle)=>{
  const times=pairs.map(pair=>pair.entrances[cycle]?.actualFirstSignalSeconds);
  return {cycle,actualFirstSignalSeconds:times,chordSpreadMs:fixture==='F02'&&times.every(time=>typeof time==='number')?(Math.max(...times as number[])-Math.min(...times as number[]))*1000:null,
   phraseOrdered:fixture==='F03'&&times.every(time=>typeof time==='number')?(times[0]!<times[1]!&&times[1]!<times[2]!):null};
 });
 const cycleRelationsPass=cycleMeasurements.every(cycle=>fixture==='F02'?cycle.chordSpreadMs!==null&&cycle.chordSpreadMs<=5:fixture==='F03'?cycle.phraseOrdered:true);
 const rms=Math.sqrt(sum/samples),passed=rms<=1e-6&&nonfinite===0&&pairs.every(pair=>pair.passed)&&receiptsMatch&&full.lateDrops===0&&full.audioLateDrops===0&&full.stolenVoices===0&&full.maxVoices===independentlyExpectedMaxVoices&&full.maxVoices<=64&&cycleRelationsPass;
 report.fixtures.push({fixture,fixtureSha256:sha(bytes),originalFullMixSha256:writePCM(fixture+'-original',full.pcm),samples,peak,nonfiniteSamples:nonfinite,
  nominalFullMixRmsDifference:rms,nominalFullMixMaxDifference:maxDifference,expectedLogicalOnsets:expected,actualScheduledReceipts:full.receipts,receiptsMatchIndependentSchedule:receiptsMatch,
  maxVoices:full.maxVoices,independentlyExpectedMaxVoices,stolenVoices:full.stolenVoices,engineLateDrops:full.lateDrops,audioLateDrops:full.audioLateDrops,pairs,cycleMeasurements,offlineChecksPassed:passed});
}
report.offlineChecksPassed=report.fixtures.every((fixture:any)=>fixture.offlineChecksPassed);
fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({directory,offlineChecksPassed:report.offlineChecksPassed,fixtures:report.fixtures.map(({fixture,nominalFullMixRmsDifference,maxVoices}:any)=>({fixture,nominalFullMixRmsDifference,maxVoices})),liveQualificationPassed:false}));
if(!report.offlineChecksPassed)process.exitCode=1;
