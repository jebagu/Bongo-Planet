import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {appendResourceClaim, continuousPressure, requireObservationDeadline, validatePositionEpochs} from './trace-contract02';

let controls=0;
const packet=(type:string,session:string,sequence=0)=>({packet:{type,session,sequence}});
const idle='owned-idle-2',engine='owned-s2-4';
const ordered=[packet('sync',''),packet('start',idle),packet('position',idle,1),packet('stop',idle,1),
  packet('start',engine),packet('position',engine,1),packet('position',engine,2)];
assert.deepEqual(validatePositionEpochs(ordered),{positions:3,epochs:2,active:engine,retired:[idle]});controls++;
for(const bad of [
  [...ordered,packet('position',engine,2)],
  [packet('start',idle),packet('position',engine,1)],
  [packet('start',idle),packet('start',engine)],
  [...ordered,packet('stop',engine,1),packet('start',idle)],
]){assert.throws(()=>validatePositionEpochs(bad));controls++;}

const high=10,close=530;
const base=()=>({sends:[],intervalRuns:[],samples:Array.from({length:26},(_,i)=>({time:20+i*20,buffered:70000}))});
assert.equal(continuousPressure(base(),3,high,close).eligible,true);controls++;
for(const kind of ['send','entry','exit','sample','cap-equality'] as const){
  const a:any=base();
  if(kind==='send')a.sends.push({index:0,before:35,bufferedBefore:12});
  if(kind==='entry')a.intervalRuns.push({id:3,index:0,entry:35,exit:36,bufferedBefore:12,bufferedAfter:70000});
  if(kind==='exit')a.intervalRuns.push({id:3,index:0,entry:35,exit:36,bufferedBefore:70000,bufferedAfter:12});
  if(kind==='sample')a.samples[8].buffered=12;
  if(kind==='cap-equality')a.sends.push({index:0,before:35,bufferedBefore:65536});
  const r=continuousPressure(a,3,high,close);assert.equal(r.eligible,false);assert.equal(r.lows.length,1);controls++;
}
assert.equal(continuousPressure(base(),null,high,close).eligible,false);controls++;
const gap=base();gap.samples=gap.samples.filter(v=>v.time>=80);
assert.equal(continuousPressure(gap,3,high,close).eligible,false);controls++;
const tail=base();tail.samples=tail.samples.filter(v=>v.time<=460);
assert.equal(continuousPressure(tail,3,high,close).eligible,false);controls++;
requireObservationDeadline(249.999,250);controls++;
for(const elapsed of [250,300,NaN,Infinity,-1]){assert.throws(()=>requireObservationDeadline(elapsed,250));controls++;}

// Persistence controls use only throwaway files, no process or socket spawn.
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'bongo-claim-source-'));
try{
  const journal=path.join(folder,'owner-created.jsonl');fs.writeFileSync(journal,'',{flag:'wx'});
  assert.deepEqual(appendResourceClaim(journal,1001,1000,'proxy'),{pid:1001,parentPid:1000,kind:'proxy'});
  appendResourceClaim(journal,1002,1000,'browser-server');
  assert.equal(fs.readFileSync(journal,'utf8'),'{"pid":1001,"parentPid":1000,"kind":"proxy"}\n{"pid":1002,"parentPid":1000,"kind":"browser-server"}\n');controls++;
  const retained=fs.readFileSync(journal,'utf8');assert.throws(()=>appendResourceClaim(journal,1001,1000,'proxy'));
  assert.equal(fs.readFileSync(journal,'utf8'),retained);controls++;
  assert.throws(()=>appendResourceClaim(path.join(folder,'absent'),1003,1000,'proxy'));
  assert(!fs.existsSync(path.join(folder,'absent')));controls++;
  for(const pid of [0,-1,NaN,1.5,1000]){assert.throws(()=>appendResourceClaim(journal,pid,1000,'proxy'));controls++;}
  for(let i=3;i<=8;i++)appendResourceClaim(journal,1000+i,1000,'proxy');
  assert.throws(()=>appendResourceClaim(journal,1009,1000,'proxy'));controls++;
  const tooBig=path.join(folder,'large');fs.writeFileSync(tooBig,'x'.repeat(8193));
  assert.throws(()=>appendResourceClaim(tooBig,1009,1000,'proxy'));controls++;
  const partial=path.join(folder,'partial');fs.writeFileSync(partial,'{"pid":1001');
  assert.throws(()=>appendResourceClaim(partial,1009,1000,'proxy'));controls++;
  const short=path.join(folder,'short-write');fs.writeFileSync(short,'');
  const originalWrite=fs.writeSync;
  try{
    fs.writeSync=((fd:number,b:Buffer)=>originalWrite(fd,b.subarray(0,3))) as typeof fs.writeSync;
    assert.throws(()=>appendResourceClaim(short,1009,1000,'proxy'));
  }finally{fs.writeSync=originalWrite;}
  assert.equal(fs.readFileSync(short,'utf8'),'{"p');
  assert.throws(()=>appendResourceClaim(short,1010,1000,'browser-server'));
  assert.equal(fs.readFileSync(short,'utf8'),'{"p');controls++;
}finally{fs.rmSync(folder,{recursive:true});}
console.log(JSON.stringify({status:'passed-source-controls',controls,actualAcquisition:false,realProcessClaims:false}));
