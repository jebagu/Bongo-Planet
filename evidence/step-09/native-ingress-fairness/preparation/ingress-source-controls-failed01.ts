import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {packetSchema,encodeOSC} from './frozen-source/protocol';
import {Trace} from './trace';
const folder=path.dirname(fileURLToPath(import.meta.url)),hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');let controls=0;
const b=fs.readFileSync(path.join(folder,'bridge-baseline.ts'),'utf8'),s=fs.readFileSync(path.join(folder,'bridge-successor.ts'),'utf8');
assert.equal(b.replace('allowSynchronousEvents:true','allowSynchronousEvents:false'),s);assert.equal((b.match(/allowSynchronousEvents:/g)??[]).length,1);controls++;
assert(b.includes('perMessageDeflate:false'));assert(s.includes('perMessageDeflate:false'));controls++;
const binds=JSON.parse(fs.readFileSync(path.join(folder,'candidate-bindings.json'),'utf8'));
for(const name of ['NativeClock','RenderClock','ReceiverClock','protocol','bridge']){assert.equal(hash(fs.readFileSync(path.join(folder,'frozen-source',name+'.ts'))),binds.hashes[name]);assert.equal(hash(fs.readFileSync('src/output/'+name+'.ts')),binds.hashes[name]);controls++;}
const f=JSON.parse(fs.readFileSync(path.join(folder,'fixture.json'),'utf8'));assert.equal(hash(fs.readFileSync(path.join(folder,'fixture.json'))),binds.hashes.fixture);controls++;
assert.equal(f.initial.length,94);assert.equal(f.burst.length,1219);assert.equal(f.initial.filter((p:any)=>p.type==='position').length,92);assert.equal(f.burst.filter((p:any)=>p.type==='position').length,1200);controls++;
const all=[...f.initial,...f.burst],positions=all.filter((p:any)=>p.type==='position');assert(all.every((p:any)=>packetSchema.safeParse(p).success));assert(!all.some((p:any)=>['trigger','cancel'].includes(p.type)));controls++;
assert.deepEqual(positions.map((p:any)=>p.sequence),Array.from({length:1292},(_,i)=>i+1));assert.equal(new Set(positions.map((p:any)=>p.nodeId)).size,92);assert.equal(new Set(positions.map((p:any)=>p.objectId)).size,92);controls++;
assert.deepEqual(positions[0].position,[0,0.5257311121191336,0.85065080835204]);assert(positions.every((p:any)=>p.position.length===3&&p.position.every((x:number)=>Number.isFinite(x)&&Math.abs(x)<=1)));controls++;
const offsets=f.burstSentOffsetsMs.filter((v:any)=>v!==null);assert.equal(offsets.length,1200);assert.equal(offsets[0],-260);assert.equal(offsets.at(-1),0);assert(offsets.every((v:number,i:number)=>v===Math.floor(i/92)*20-260));controls++;
const byteCount=all.reduce((sum,p)=>sum+Buffer.byteLength(JSON.stringify(p)),0);assert(byteCount<1048576);controls++;
// Independent literal OSC vector, not produced by another encoder call.
assert.equal(encodeOSC(1,[1,0,-1]).toString('hex'),'2f61646d2f6f626a2f312f78797a0000002c666666000000003f80000000000000bf800000');controls++;
const t=new Trace(),d={ready:true,failure:null,unacknowledgedCommands:2,unacknowledgedBytes:500};const id=t.beginMessage(100,d);t.packet(id,{type:'heartbeat',session:'owned'});t.endMessage(id,{...d,unacknowledgedCommands:3,unacknowledgedBytes:700});t.applied(1,{...d,unacknowledgedCommands:2,unacknowledgedBytes:500});assert.deepEqual(t.rows.map(v=>v.type),['message-enter','message-parsed','message-exit','bridge-command-applied']);assert.deepEqual(t.rows.map(v=>v.index),[0,1,2,3]);assert.equal(t.rows[2].unacknowledgedBytes,700);assert.equal(t.rows[3].unacknowledgedBytes,500);controls++;
const cap=new Trace();cap.rows.push(...Array.from({length:16000},()=>({})));assert.throws(()=>cap.record('extra'),/capacity/);assert.throws(()=>cap.record('later'),/capacity/);assert.equal(cap.rows.length,16000);controls++;
const byteCap=new Trace();byteCap.bytes=8388608;assert.throws(()=>byteCap.record('extra'),/capacity/);assert.equal(byteCap.rows.length,0);controls++;
console.log(JSON.stringify({status:'passed-source-controls',controls,fixtureCommands:all.length,fixturePositions:positions.length,fixtureSerializedBytes:byteCount,workersStarted:0,socketsStarted:0,actualAcquisition:false}));
