import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { WebSocket, WebSocketServer } from 'ws';
import { RenderClock } from '../src/output/RenderClock';
import type { RenderReceiverOnset, ReceiverClockCommand } from '../src/output/ReceiverClock';

// Isolated real companion: no product producer, no microphone or physical audio.
// All deadlines use Node monotonic time. The control sample is actually written
// in process(), then muted; this qualifies control scheduling only.
test('real render clock survives Node stalls and owns cancellation/epoch/watchdog', async () => {
  test.setTimeout(30000);
  const executionCases: unknown[] = [], startedAt = new Date().toISOString();
  let cleanup = { browserClosed:false, serverClosed:false }, failureText='';
  const onsets: RenderReceiverOnset[] = [], failures: string[] = [], releases: {session:string;reason:string}[] = [], applied: number[] = [];
  const clock = new RenderClock({ onset: r => { if(r.clockDomain==='native-monotonic') throw Error('Expected render witness'); onsets.push(r); }, failure: r => failures.push(r), release: (session,reason) => releases.push({session,reason}), applied: s => applied.push(s) });
  const server = http.createServer((req,res) => { if (!clock.servePage(req,res)) { res.writeHead(404);res.end(); } });
  const wss = new WebSocketServer({server});
  wss.on('connection',(ws,req) => { if(!clock.acceptConnection(ws,req))ws.close(1008); });
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  const port = (server.address() as {port:number}).port;
  let sequence=0, heartbeat:ReturnType<typeof setInterval>|undefined;
  const send = (packet:ReceiverClockCommand['packet']) => clock.send({commandSequence:++sequence,packet});
  const start = (session:string) => {
    if(heartbeat)clearInterval(heartbeat);
    send({version:1,type:'start',session,sequence:0});
    send({version:1,type:'position',session,sequence:1,nodeId:'note',objectId:1,position:[0,0,1],sent:performance.now()/1000});
    heartbeat=setInterval(()=>send({version:1,type:'heartbeat',session}),75);
  };
  const trigger = (session:string, triggerSequence:number, delayMs:number) => {
    const intended=performance.now()/1000+delayMs/1000,id=`${session}-${triggerSequence}`;
    send({version:1,type:'trigger',session,sequence:triggerSequence+1,triggerSequence,id,nodeId:'note',generatorId:'gen',objectId:1,onset:intended,sound:{kind:'note',frequency:440,timbre:'sine',duration:2,level:.1}});
    return {id,intended};
  };
  const nap=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
  try {
    await clock.start(port);expect(clock.ready).toBe(true);expect(clock.diagnostics.uncertaintyMs).toBeLessThanOrEqual(10);
    const forbidden=await fetch(`http://127.0.0.1:${port}/clock`);expect(forbidden.status).toBe(403);
    const unauthorized=new WebSocket(`ws://127.0.0.1:${port}/render-clock?capability=invalid`,{origin:`http://127.0.0.1:${port}`});
    await new Promise<void>(resolve=>unauthorized.on('close',code=>{expect(code).toBe(1008);resolve();}));
    for(const blockMs of [100,250]){
      const session=`stall-${blockMs}`;start(session);const t=trigger(session,1,500);
      await expect.poll(()=>clock.diagnostics.queuedCount).toBeGreaterThanOrEqual(blockMs===100?1:2);
      const queued=(clock.diagnostics.recent as any[]).find(row=>row.type==='queued'&&row.id===t.id);
      expect(queued.queueLeadMs).toBeGreaterThan(400);
      let timerError:number|undefined;
      const timer=setTimeout(()=>{timerError=(performance.now()/1000-t.intended)*1000;},Math.max(0,t.intended*1000-performance.now()));
      await nap(Math.max(0,t.intended*1000-performance.now()-30));
      const before=performance.now();Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,blockMs);
      const actualBlockMs=performance.now()-before;expect(actualBlockMs).toBeGreaterThanOrEqual(blockMs-1);
      await expect.poll(()=>onsets.find(row=>row.id===t.id)).toBeTruthy();
      await expect.poll(()=>timerError).toBeGreaterThan(20);clearTimeout(timer);
      const receipt=onsets.find(row=>row.id===t.id)!;
      executionCases.push({blockMs,actualBlockMs,queued,receipt,nodeTimerErrorMs:timerError,diagnostics:clock.diagnostics});
      expect(receipt.type).toBe('onset');expect(Math.abs(receipt.errorMs)).toBeLessThanOrEqual(20);
      expect(receipt.position).toEqual([0,0,1]);expect(receipt).toMatchObject({nodeId:'note',generatorId:'gen',objectId:1});
      expect(receipt.currentFrame).toBeGreaterThan(0);expect(receipt.sampleOffset).toBeGreaterThanOrEqual(0);
      expect(receipt.actual).toBeCloseTo((receipt.callbackWallMs+receipt.sampleOffset*1000/(clock.diagnostics.lastClock as any).sampleRate-(clock.diagnostics.calibration as any).initialNodeWall.offsetMs)/1000,8);
    }
    start('cancel');const cancelled=trigger('cancel',1,200);
    send({version:1,type:'cancel',session:'cancel',sequence:3,ids:[cancelled.id],nodeIds:[]});
    const cancelSequence=sequence;await expect.poll(()=>applied.at(-1)).toBeGreaterThanOrEqual(cancelSequence);await nap(250);
    expect(onsets.some(row=>row.id===cancelled.id)).toBe(false);
    const retired=trigger('cancel',2,200);start('fresh');await nap(250);
    expect(onsets.some(row=>row.id===retired.id)).toBe(false);
    const watchdog=trigger('fresh',1,1000);if(heartbeat)clearInterval(heartbeat);heartbeat=undefined;
    await expect.poll(()=>releases.some(row=>row.session==='fresh'&&row.reason.includes('watchdog')),{timeout:2000}).toBe(true);
    await nap(600);expect(onsets.some(row=>row.id===watchdog.id)).toBe(false);
    expect((clock.diagnostics.lastClock as any).pending).toBe(0);expect((clock.diagnostics.lastClock as any).activeVoices).toBe(0);
    expect(onsets.filter(row=>row.type==='onset')).toHaveLength(2);
    expect(failures).toEqual([]);expect(clock.ready).toBe(true);
    start('suspend');trigger('suspend',1,1000);
    await (clock as any).page.evaluate(async()=>{await (window as any).receiverClock.context.suspend();});
    await expect.poll(()=>clock.ready).toBe(false);
    await expect.poll(()=>failures.some(reason=>reason.includes('suspended'))).toBe(true);
  } catch(error) { failureText=String(error);throw error; } finally {
    if(heartbeat)clearInterval(heartbeat);await clock.close();cleanup.browserClosed=true;
    await new Promise<void>(resolve=>wss.close(()=>resolve()));
    await new Promise<void>(resolve=>server.close(()=>resolve()));cleanup.serverClosed=true;
    const destination=process.env.BONGO_RENDER_CLOCK_REPORT;
    if(destination){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify({
      scope:'Isolated actual silent control receiver; not integrated fixture/sound acceptance',startedAt,finishedAt:new Date().toISOString(),
      sourceSha256:Object.fromEntries(['src/output/RenderClock.ts','tests/render-clock-browser.spec.ts'].map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')])),
      executionCases,onsets,releases,failures,expectedFailureReasons:['Receiver AudioContext suspended/closed'],applied,failureText,diagnostics:clock.diagnostics,cleanup
    },null,2)+'\n');}
  }
});
