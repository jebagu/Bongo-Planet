import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {exportCompositionFile,importCompositionFile} from '../src/compositionFile';
import {Engine} from '../src/core/engine';
import {LIMITS,type Trigger} from '../src/core/contracts';
import {INSTRUMENTS,isPercussion} from '../src/core/instruments';
import {MonoSynth} from '../src/audio/synth';
import type {InstrumentSample,SampleBank} from '../src/audio/samples';
import {CHORD_FAVORITES,chordFavoriteAppearance} from './chord-favorite-scores';
import {spatialCoverage} from '../src/core/spatialArrangement';

const sampleRate=48000,quantum=128/sampleRate;
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');

// Decode the same PCM recordings and alternating takes as the live worklet.
function decodeWav(path:string):InstrumentSample {
  const bytes=readFileSync(path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
  let channels=0,rate=0,bits=0,format=0,data:Buffer|undefined;
  for(let offset=12;offset+8<=bytes.length;) {
    const name=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4),start=offset+8;
    if(name==='fmt ') {format=bytes.readUInt16LE(start);channels=bytes.readUInt16LE(start+2);rate=bytes.readUInt32LE(start+4);bits=bytes.readUInt16LE(start+14);}
    else if(name==='data')data=bytes.subarray(start,start+length);
    offset=start+length+length%2;
  }
  assert(format===1&&bits===16&&channels>0&&rate>0&&data,'Expected PCM16 source recording.');
  const frames=data.length/(channels*2),pcm=Array.from({length:channels},()=>new Float32Array(frames));
  assert(Number.isInteger(frames));
  for(let frame=0;frame<frames;frame++)for(let channel=0;channel<channels;channel++)pcm[channel][frame]=data.readInt16LE((frame*channels+channel)*2)/32768;
  return {channels:pcm,sampleRate:rate};
}
const samples=Object.fromEntries(INSTRUMENTS.map(instrument=>{
  const takes=instrument.samples.map(path=>decodeWav(`public/${path}`));
  return [instrument.id,{...takes[0],alternates:takes.slice(1)}];
})) as SampleBank;
const reports=[];

const requestedIds=new Set(process.argv.slice(2));
const selected=requestedIds.size?CHORD_FAVORITES.filter(song=>requestedIds.has(song.id)):CHORD_FAVORITES;
assert(!requestedIds.size||selected.length===requestedIds.size,'Unknown chord arrangement ID.');

for(const song of selected) {
  const scene=song.build(),appearance=chordFavoriteAppearance(song),json=exportCompositionFile(scene,appearance)+'\n';
  assert.deepEqual(importCompositionFile(json),{scene,appearance});
  assert.equal(scene.settings.bpm,song.bpm);assert.equal(scene.settings.key,song.key);assert.equal(scene.settings.scale,song.scale);
  const directory=`public/compositions/${song.slug}`;
  mkdirSync(directory,{recursive:true});
  writeFileSync(`${directory}/Bongo-Planet.json`,json);
  writeFileSync(`public/fixtures/${song.id}.json`,JSON.stringify(scene,null,2)+'\n');

  const cycleSeconds=song.cycleBeats*60/song.bpm,beatSeconds=60/song.bpm,simulation=new Engine(scene),onsets:Trigger[]=[];
  let maximumEdges=0,maximumDecisions=0,maximumPending=0;
  simulation.play(0);
  for(let tick=1;tick<=Math.ceil((8*cycleSeconds+beatSeconds)/quantum);tick++) {
    simulation.advance(tick*quantum,quantum);
    const batch=simulation.drain(),state=simulation.snapshot();
    assert(state.running,`${song.id}: playback must remain running.`);
    maximumEdges=Math.max(maximumEdges,state.gatedEdges);maximumPending=Math.max(maximumPending,state.pending);
    maximumDecisions=Math.max(maximumDecisions,batch.filter(event=>event.type==='arrival').length+new Set(batch.filter(event=>event.type==='emission').map(event=>event.time)).size);
    for(const event of batch) {
      assert(event.type!=='reset',`${song.id}: no overload reset is allowed.`);
      if(event.type==='onset')onsets.push(event.trigger);
    }
  }
  const pattern=(cycle:number)=>{
    const start=cycle*cycleSeconds+.25*beatSeconds;
    return onsets.filter(hit=>hit.onset>=start-1e-7&&hit.onset<start+cycleSeconds-1e-7)
      .map(hit=>`${hit.nodeId}/${hit.generatorId}@${Math.round((hit.onset-start)/beatSeconds*4)}`).sort();
  };
  for(let cycle=3;cycle<8;cycle++)assert.deepEqual(pattern(cycle),pattern(2),`${song.id}: repeat without growing or losing the phrase.`);
  assert.deepEqual(new Set(onsets.map(hit=>hit.nodeId)),new Set(scene.pieces.filter(p=>p.kind!=='generator').map(p=>p.id)),`${song.id}: every written layer must be reached.`);
  assert.equal(simulation.lateDrops,0);assert(maximumDecisions<=64&&maximumEdges<=LIMITS.gatedEdges&&maximumPending<=LIMITS.pending);
  const cycleOnsets=onsets.filter(hit=>hit.onset>=(2*song.cycleBeats+.25)*beatSeconds-1e-7&&hit.onset<(3*song.cycleBeats+.25)*beatSeconds-1e-7);
  const percussionTakes=INSTRUMENTS.filter(i=>isPercussion(i.id)).map(i=>({
    instrument:i.id,hits:cycleOnsets.filter(hit=>hit.sound.kind==='note'&&hit.sound.instrument===i.id).length,takes:i.samples.length,
  }));
  // Odd counts need a second musical cycle before the alternating take repeats.
  const audioCycles=percussionTakes.some(i=>i.hits%i.takes!==0)?2:1;
  const exactFrames=audioCycles*cycleSeconds*sampleRate,exactStart=(2*song.cycleBeats+.25)*beatSeconds*sampleRate;
  const loopFrames=Math.round(exactFrames),loopStart=Math.round(exactStart);
  assert(Math.abs(loopFrames-exactFrames)<1e-6&&Math.abs(loopStart-exactStart)<1e-6,'Use sample-aligned loop tempos.');
  const totalFrames=Math.ceil((loopStart+2*loopFrames)/128)*128;
  const output=[new Float32Array(totalFrames),new Float32Array(totalFrames)],engine=new Engine(scene),synth=new MonoSynth(sampleRate,samples);
  engine.play(0);let maximumVoices=0;
  for(let offset=0;offset<totalFrames;offset+=128) {
    const start=offset/sampleRate;engine.advance(start+quantum,quantum);synth.apply(engine.drain(),start);
    for(let channel=0;channel<2;channel++)synth.render(output[channel].subarray(offset,offset+128),start,scene.settings.volume,channel,channel===1);
    maximumVoices=Math.max(maximumVoices,synth.counters.activeVoices);
  }
  const wav=Buffer.alloc(44+loopFrames*4);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*4,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(loopFrames*4,40);
  let peak=0,sumSquares=0,repeatError=0,boundaryDelta=0;
  for(let frame=0;frame<loopFrames;frame++)for(let channel=0;channel<2;channel++) {
    const value=output[channel][loopStart+frame];assert(Number.isFinite(value));
    peak=Math.max(peak,Math.abs(value));sumSquares+=value*value;
    repeatError=Math.max(repeatError,Math.abs(value-output[channel][loopStart+loopFrames+frame]));
    if(frame===0)boundaryDelta=Math.max(boundaryDelta,Math.abs(value-output[channel][loopStart+loopFrames-1]));
    wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+(frame*2+channel)*2);
  }
  assert(peak>.015&&peak<.9,`${song.id}: retain an audible mix and generous headroom (${peak}).`);
  assert(repeatError<1e-5,`${song.id}: tails and sample takes must repeat (${repeatError}).`);
  assert.equal(synth.stolenVoices,0);assert.equal(synth.lateDropsAudio,0);
  writeFileSync(`${directory}/preview.wav`,wav);
  const stacks=new Map<number,number>();
  scene.pieces.filter(p=>p.kind!=='generator').forEach(p=>stacks.set(p.vertex,(stacks.get(p.vertex)??0)+1));
  const report={
    id:song.id,name:song.name,sourceId:song.sourceId??null,bpm:song.bpm,key:song.key,scale:song.scale,cycleBeats:song.cycleBeats,cycleSeconds,
    generators:scene.pieces.filter(p=>p.kind==='generator').length,soundingPieces:scene.pieces.filter(p=>p.kind!=='generator').length,
    stackedVertices:[...stacks.values()].filter(count=>count>1).length,maximumStack:Math.max(...stacks.values()),
    instruments:Object.fromEntries(INSTRUMENTS.map(i=>[i.id,scene.pieces.filter(p=>p.kind==='note'&&p.instrument===i.id).length]).filter(([,count])=>Number(count)>0)),
    spatial:spatialCoverage(scene),compositionSha256:sha(json),simulation:{cycles:8,stablePatternsMatch:true,allLayersReached:true,maximumEdges,maximumDecisionsPerQuantum:maximumDecisions,maximumPending,lateDrops:simulation.lateDrops},
    audio:{file:'preview.wav',sha256:sha(wav),renderedFromCurrentEngineAndSamples:true,cycles:audioCycles,seconds:loopFrames/sampleRate,sampleRate,channels:2,peak,rms:Math.sqrt(sumSquares/(loopFrames*2)),repeatError,boundaryDelta,maximumVoices,stolenVoices:synth.stolenVoices,lateDrops:synth.lateDropsAudio},
  };
  reports.push(report);writeFileSync(`${directory}/validation.json`,JSON.stringify(report,null,2)+'\n');
  writeFileSync(`${directory}/README.md`,`# ${song.name} — chord arrangement\n\n${song.description}\n\n${song.arrangement}\n\nChoose **Load preset → Favorites - Chords → ${song.name}**, then **Play**. Loading a preset starts paused and keeps your current look. Import \`Bongo-Planet.json\` to load the complete music and its coordinated look.\n\nSounding locations are distributed around the sphere. The maximum measured gap at the 92 junction probes is ${report.spatial.largestGapDegrees.toFixed(1)} degrees. Authored spatial paths preserve the original musical timing; selected sparse arrangements include six quiet harmonic replies.\n\nThis is an instrumental loop arrangement: ${song.cycleBeats} master-grid beats at ${song.bpm} BPM (${cycleSeconds} seconds), with ${report.stackedVertices} chord stacks and ${report.generators} finite spark source${report.generators===1?'':'s'}. Each adjacent hop is one sixteenth note; simultaneous stack layers have independent voices without spawning more sparks.\n\n\`preview.wav\` is a stereo 48 kHz loop rendered with the actual engine, synth and recordings. It includes settled tails and the complete alternating-percussion cycle. \`validation.json\` records eight-cycle event stability, all reached layers, bounded work, headroom and matching repeated PCM. Recreate all arrangements with \`npm run songs:chords\`.${song.source?`\n\nMelody reference: ${song.source}\n`:''}`);
  console.log(JSON.stringify({id:song.id,pieces:scene.pieces.length,stacks:report.stackedVertices,peak:Number(peak.toFixed(3)),rms:Number(report.audio.rms.toFixed(3)),voices:maximumVoices,repeatError}));
}
writeFileSync('assets/chord-favorites.json',JSON.stringify(CHORD_FAVORITES.filter(song=>!['C04','C05'].includes(song.id)).map(({id,name})=>({id,name})),null,2)+'\n');
mkdirSync('evidence/chord-favorites',{recursive:true});
if(!requestedIds.size)writeFileSync('evidence/chord-favorites/render-validation.json',JSON.stringify(reports,null,2)+'\n');
