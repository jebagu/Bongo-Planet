import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exportCompositionFile,importCompositionFile} from '../src/compositionFile';
import {Engine} from '../src/core/engine';
import {LIMITS,type Trigger} from '../src/core/contracts';
import {INSTRUMENTS} from '../src/core/instruments';
import {MonoSynth} from '../src/audio/synth';
import type {InstrumentSample,SampleBank} from '../src/audio/samples';
import {PLANET_LOOPS,loopAppearance} from './ambient-routing-scores';

const root=resolve(process.env.BONGO_PROJECT_ROOT??join(dirname(fileURLToPath(import.meta.url)),'..'));
const compositions=resolve(process.env.BONGO_COMPOSITION_DIRECTORY??join(root,'public/compositions'));
const fixtures=resolve(process.env.BONGO_FIXTURE_DIRECTORY??join(root,'public/fixtures'));
const catalogs=resolve(process.env.BONGO_CATALOG_DIRECTORY??join(root,'assets'));
const evidence=resolve(process.env.BONGO_REPORT_DIRECTORY??join(root,'evidence/ambient-routing'));
for(const path of [compositions,fixtures,catalogs,evidence])mkdirSync(path,{recursive:true});
const sampleRate=48000,quantum=128/sampleRate,cycles=8;
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');

function decodeWav(path:string):InstrumentSample {
  const bytes=readFileSync(path);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
  let channels=0,rate=0,bits=0,format=0,data:Buffer|undefined;
  for(let offset=12;offset+8<=bytes.length;) {
    const name=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4),start=offset+8;
    if(name==='fmt ') {format=bytes.readUInt16LE(start);channels=bytes.readUInt16LE(start+2);rate=bytes.readUInt32LE(start+4);bits=bytes.readUInt16LE(start+14);}
    else if(name==='data')data=bytes.subarray(start,start+length);
    offset=start+length+length%2;
  }
  assert(format===1&&bits===16&&channels>0&&rate>0&&data,'Use the current PCM16 source recordings.');
  const frames=data.length/(channels*2),pcm=Array.from({length:channels},()=>new Float32Array(frames));assert(Number.isInteger(frames));
  for(let frame=0;frame<frames;frame++)for(let channel=0;channel<channels;channel++)pcm[channel][frame]=data.readInt16LE((frame*channels+channel)*2)/32768;
  return {channels:pcm,sampleRate:rate};
}
const sourceSamples=INSTRUMENTS.filter(i=>i.kind==='melodic').map(instrument=>{
  const path=join(root,'public',instrument.samples[0]);return {instrument:instrument.id,path,sha256:sha(readFileSync(path))};
});
const samples=Object.fromEntries(sourceSamples.map(source=>[source.instrument,decodeWav(source.path)])) as SampleBank;
const reports=[];

for(const loop of PLANET_LOOPS) {
  const scene=loop.build(),appearance=loopAppearance(loop),json=exportCompositionFile(scene,appearance)+'\n';
  assert.deepEqual(importCompositionFile(json),{scene,appearance});assert(Buffer.byteLength(json)<=128*1024);
  assert.equal(scene.settings.bpm,loop.bpm);assert.equal(scene.settings.key,loop.key);assert.equal(scene.settings.scale,loop.scale);
  const sources=scene.pieces.filter(p=>p.kind==='generator'),notes=scene.pieces.filter(p=>p.kind==='note');
  assert(sources.every(p=>Number.isInteger(p.travel)&&Number(p.travel)>0),'All sources need finite hop budgets.');
  if(loop.group==='Minimal Routing')assert(notes.length>=1&&notes.length<=4&&scene.wiring!.some(w=>w.exits.length>1));
  else assert(notes.length>=30,'The wide compositions should populate much of the planet.');
  const seconds=loop.cycleBeats*60/loop.bpm,beatSeconds=60/loop.bpm,simulation=new Engine(scene),onsets:Trigger[]=[];
  const arrivalPatterns=Array.from({length:cycles},()=>[] as string[]),reached=new Set(sources.map(p=>p.vertex));
  let maximumEdges=0,maximumPending=0,maximumDecisions=0;
  simulation.play(0);
  for(let tick=1;tick<=Math.ceil(cycles*seconds/quantum);tick++) {
    simulation.advance(tick*quantum,quantum);const batch=simulation.drain(),state=simulation.snapshot();
    assert(state.running,`${loop.id}: the route must keep running without overload.`);
    maximumEdges=Math.max(maximumEdges,state.gatedEdges);maximumPending=Math.max(maximumPending,state.pending);
    maximumDecisions=Math.max(maximumDecisions,batch.filter(e=>e.type==='arrival').length+new Set(batch.filter(e=>e.type==='emission').map(e=>e.time)).size);
    for(const event of batch) {
      assert(event.type!=='reset',`${loop.id}: no reset or capacity pause.`);
      if(event.type==='onset')onsets.push(event.trigger);
      if(event.type==='arrival') {
        reached.add(event.vertex);
        const cycle=Math.floor((event.time+1e-7)/seconds),step=Math.round((event.time-cycle*seconds)/beatSeconds*4);
        if(cycle<cycles)arrivalPatterns[cycle].push(`${event.generatorId}/${event.vertex}/${event.hops}@${step}`);
      }
    }
  }
  const onsetPattern=(cycle:number)=>onsets.filter(hit=>hit.onset>=cycle*seconds-1e-7&&hit.onset<(cycle+1)*seconds-1e-7)
    .map(hit=>`${hit.nodeId}/${hit.generatorId}@${Math.round((hit.onset-cycle*seconds)/beatSeconds*4)}`).sort();
  for(let cycle=3;cycle<cycles;cycle++) {
    assert.deepEqual(onsetPattern(cycle),onsetPattern(2),`${loop.id}: musical pattern must repeat.`);
    assert.deepEqual(arrivalPatterns[cycle].sort(),arrivalPatterns[2].sort(),`${loop.id}: silent and sounding routing must repeat.`);
  }
  assert.deepEqual(new Set(onsets.map(hit=>hit.nodeId)),new Set(notes.map(p=>p.id)),`${loop.id}: every instrument must sound.`);
  assert(reached.size>=80,`${loop.id}: the active routes must cover most of the globe.`);
  assert.equal(simulation.lateDrops,0);assert(maximumDecisions<=LIMITS.gatedQuantum&&maximumEdges<=LIMITS.gatedEdges&&maximumPending<=LIMITS.pending);

  // Two complete warmup cycles settle the finite journeys and natural sample tails.
  // The next two cycles must match sample for sample before one is exported.
  const exactFrames=seconds*sampleRate,loopFrames=Math.round(exactFrames),loopStart=2*loopFrames;
  assert(Math.abs(exactFrames-loopFrames)<1e-6,'Choose a sample-aligned loop duration.');
  const totalFrames=Math.ceil(4*loopFrames/128)*128,output=[new Float32Array(totalFrames),new Float32Array(totalFrames)];
  const engine=new Engine(scene),synth=new MonoSynth(sampleRate,samples);engine.play(0);let maximumVoices=0;
  for(let offset=0;offset<totalFrames;offset+=128) {
    const start=offset/sampleRate;engine.advance(start+quantum,quantum);synth.apply(engine.drain(),start);
    for(let channel=0;channel<2;channel++)synth.render(output[channel].subarray(offset,offset+128),start,scene.settings.volume,channel,channel===1);
    maximumVoices=Math.max(maximumVoices,synth.counters.activeVoices);
  }
  const wav=Buffer.alloc(44+loopFrames*4);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*4,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(loopFrames*4,40);
  let peak=0,sumSquares=0,repeatError=0,boundaryDelta=0;
  for(let frame=0;frame<loopFrames;frame++)for(let channel=0;channel<2;channel++) {
    const value=output[channel][loopStart+frame];assert(Number.isFinite(value));
    peak=Math.max(peak,Math.abs(value));sumSquares+=value*value;
    repeatError=Math.max(repeatError,Math.abs(value-output[channel][loopStart+loopFrames+frame]));
    if(frame===0)boundaryDelta=Math.max(boundaryDelta,Math.abs(value-output[channel][loopStart+loopFrames-1]));
    wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+(frame*2+channel)*2);
  }
  assert(peak>.008&&peak<.88,`${loop.id}: use an audible mix with headroom (${peak}).`);
  assert(repeatError<1e-5,`${loop.id}: repeated tails must match (${repeatError}).`);
  assert.equal(synth.stolenVoices,0);assert.equal(synth.lateDropsAudio,0);
  const directory=join(compositions,loop.slug);mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'Bongo-Planet.json'),json);writeFileSync(join(directory,'preview.wav'),wav);
  writeFileSync(join(fixtures,`${loop.id}.json`),JSON.stringify(scene,null,2)+'\n');
  const report={
    id:loop.id,name:loop.name,slug:loop.slug,group:loop.group,description:loop.description,routing:loop.routing,
    bpm:loop.bpm,key:loop.key,scale:loop.scale,cycleBeats:loop.cycleBeats,cycleSeconds:seconds,
    generators:sources.length,soundingPieces:notes.length,occupiedVertices:new Set(scene.pieces.map(p=>p.vertex)).size,
    activeRoutedVertices:reached.size,directedGates:scene.wiring!.reduce((sum,w)=>sum+w.exits.length,0),forks:scene.wiring!.filter(w=>w.exits.length>1).length,
    sourceHopBudgets:sources.map(p=>p.travel),allTravelFinite:true,instruments:Object.fromEntries(INSTRUMENTS.map(i=>[i.id,notes.filter(p=>p.instrument===i.id).length]).filter(([,n])=>Number(n)>0)),
    compositionSha256:sha(json),simulation:{cycles,seconds:cycles*seconds,allLayersReached:true,musicalPatternRepeats:true,routingPatternRepeats:true,maximumEdges,maximumPending,maximumDecisionsPerQuantum:maximumDecisions,lateDrops:simulation.lateDrops,overloads:0},
    audio:{file:'preview.wav',sha256:sha(wav),renderedFromCurrentEngineAndSamples:true,sampleRate,channels:2,seconds,peak,rms:Math.sqrt(sumSquares/(loopFrames*2)),repeatError,boundaryDelta,maximumVoices,stolenVoices:synth.stolenVoices,lateDrops:synth.lateDropsAudio},
  };
  reports.push(report);writeFileSync(join(directory,'validation.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(join(directory,'README.md'),`# ${loop.name}\n\n${loop.description}\n\n${loop.routing}\n\n${loop.bpm} BPM; ${loop.cycleBeats} beats / ${seconds} seconds per loop. ${sources.length} finite generator(s), ${notes.length} sounding piece(s), ${reached.size} active routed junctions, ${report.directedGates} directed gates.\n\nChoose **Load preset → ${loop.group} → ${loop.name}**, then **Play**. Preset loading starts paused and keeps the current look. To bring in its coordinated ${loop.theme===22?'Moon chalk':'Lilac dusk'} appearance too, import \`Bongo-Planet.json\` in the Composition section.\n\n\`preview.wav\` is a 48 kHz stereo loop from Bongo Planet’s actual engine and current instrument recordings, with settled natural tails. \`validation.json\` records eight-cycle event and route stability, all reached instruments, bounded work and repeat-matched PCM. Offline validation does not claim physical listening or venue spatial-audio qualification.\n\nRecreate this collection with \`npm run songs:ambient\`.\n`);
  console.log(JSON.stringify({id:loop.id,name:loop.name,notes:notes.length,coverage:reached.size,peak:Number(peak.toFixed(4)),rms:Number(report.audio.rms.toFixed(4)),voices:maximumVoices,repeatError}));
}
for(const [group,name] of [['Airy & Ambient','ambient-presets.json'],['Minimal Routing','routing-presets.json']] as const)
  writeFileSync(join(catalogs,name),JSON.stringify(PLANET_LOOPS.filter(loop=>loop.group===group).map(({id,name})=>({id,name})),null,2)+'\n');
writeFileSync(join(evidence,'render-validation.json'),JSON.stringify({sourceSamples:sourceSamples.map(({instrument,sha256})=>({instrument,sha256})),loops:reports},null,2)+'\n');
