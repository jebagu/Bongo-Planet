import { randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { WebSocket } from 'ws';
import type { Browser, Page } from '@playwright/test';
import type { ReceiverClock, ReceiverClockCommand, ReceiverClockHooks, ReceiverOnset } from './ReceiverClock';

const MAX_PENDING = 5376;
const MAX_RECEIPTS = 8192;
const MAX_WIRE_BYTES = 1024 * 1024;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wallPair = () => {
  const before = performance.now(), wallMs = Date.now(), after = performance.now();
  return { before, after, wallMs, offsetMs: wallMs - (before + after) / 2, uncertaintyMs: 1 + (after - before) / 2 };
};

// Deliberately embedded: the companion has no publicly accessible processor or
// producer endpoint. Output samples are control witnesses, downstream muted.
const PROCESSOR = String.raw`
class RenderClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();this.commands=[];this.pending=[];this.objects=new Map();this.voices=new Map();
    this.session='';this.commandSequence=0;this.triggerSequence=0;this.lastHeartbeat=0;
    this.receipts=[];this.inFlight=0;this.batchSequence=0;this.flightAt=0;
    this.tick=0;this.blockIndex=0;this.mapped=false;this.dead=false;this.phaseExtrema=Array.from({length:8},()=>({count:0,minOffsetMs:Infinity,maxOffsetMs:-Infinity}));this.lastFrame=null;this.lastWall=null;this.expiredSessions=new Set();
    this.port.onmessage=({data:c})=>{
      if(c.type==='ack'){if(c.batchSequence===this.inFlight)this.inFlight=0;return;}
      if(c.type==='shutdown'){this.fail('Companion shutdown');return;}
      if(this.dead)return;
      if(this.commands.length>=8192){this.fail('Render command capacity exceeded');return;}
      this.commands.push(c);
    };
  }
  components(){return {initialNodeWallUncertaintyMs:this.nodeWallPairUncertaintyMs??0,nodeWallDriftMaxMs:this.nodeWallDriftMaxMs??0,
    workletDateCoarseMs:1,fullRenderQuantumMs:(this.quantum??128)*1000/sampleRate,maximumFrameWallResidualMs:this.runtimeResidualMax??0};}
  fail(reason){
    if(this.dead)return;
    const callbackWallMs=this.callbackWall??Date.now(),signedResidualMs=this.mapped?callbackWallMs-currentFrame*1000/sampleRate-this.frameWallOffset:null;
    const witness={type:'fatal',reason,session:this.session,currentFrame,currentTime,blockIndex:this.blockIndex,callbackWallMs,
      observedFailureWallMs:Date.now(),previousFrame:this.previousFrame,previousCallbackWallMs:this.previousWall,sampleRate,quantum:this.quantum??128,
      signedResidualMs,frameWallOffsetMs:this.frameWallOffset??null,uncertaintyMs:this.uncertaintyMs??null,uncertaintyComponents:this.components(),
      phaseExtrema:this.phaseExtrema,pendingBeforeRelease:this.pending.length,activeVoicesBeforeRelease:this.voices.size,objectsBeforeRelease:this.objects.size,
      commandSequence:this.commandSequence,receiptBatchSequence:this.inFlight};
    this.dead=true;this.pending=[];this.voices.clear();this.objects.clear();this.commands=[];
    this.port.postMessage(witness);this.session='';
  }
  emit(row){
    if(this.receipts.length>=8192){this.fail('Render receipt capacity exceeded');return;}
    this.receipts.push(row);
  }
  flush(wall){
    if(this.inFlight){if(wall-this.flightAt>500)this.fail('Render receipt acknowledgement timeout');return;}
    if(!this.receipts.length)return;
    let count=0,bytes=128;
    for(const row of this.receipts){
      const serialized=JSON.stringify(row);let rowBytes=0;
      for(const char of serialized){const n=char.codePointAt(0);rowBytes+=n<=127?1:n<=2047?2:n<=65535?3:4;}
      if(rowBytes>60000){this.fail('Render receipt row exceeds wire capacity');return;}
      if(count===16||bytes+rowBytes>61440)break;
      count++;bytes+=rowBytes+1;
    }
    this.inFlight=++this.batchSequence;this.flightAt=wall;
    this.port.postMessage({type:'batch',batchSequence:this.inFlight,rows:this.receipts.splice(0,count)});
  }
  retire(session){this.expiredSessions.add(session);if(this.expiredSessions.size>1000)this.expiredSessions.delete(this.expiredSessions.values().next().value);}
  release(reason,frame,wall){
    const session=this.session;this.pending=[];this.voices.clear();this.objects.clear();this.session='';
    if(session)this.emit({type:'release',session,reason,currentFrame:frame,callbackWallMs:wall});
  }
  process(_inputs,outputs){
    const output=outputs[0][0],frame=currentFrame,wall=Date.now();output.fill(0);this.blockIndex++;this.callbackWall=wall;this.quantum=output.length;this.previousFrame=this.lastFrame;this.previousWall=this.lastWall;
    if(this.dead)return true;
    // Inspect the old epoch before buffered heartbeat/start commands. A delayed
    // heartbeat cannot revive an epoch whose real wall-clock lease expired.
    if(this.lastFrame!==null&&(frame!==this.lastFrame+output.length||wall<this.lastWall||wall-this.lastWall>500)){
      this.fail('Render callback frame/wall discontinuity');return true;
    }
    this.lastFrame=frame;this.lastWall=wall;
    if(this.mapped){
      this.runtimeResidualMax=Math.max(this.runtimeResidualMax,Math.abs(wall-frame*1000/sampleRate-this.frameWallOffset));
      this.uncertaintyMs=this.baseUncertaintyMs+this.runtimeResidualMax;
      if(this.uncertaintyMs>10){this.fail('Render callback mapping drift');return true;}
    }
    if(this.session&&wall-this.lastHeartbeat>500){this.retire(this.session);this.release('Producer heartbeat watchdog',frame,wall);}
    const offset=wall-frame*1000/sampleRate;
    if(this.blockIndex>96){const phase=this.phaseExtrema[this.blockIndex%8];phase.count++;phase.minOffsetMs=Math.min(phase.minOffsetMs,offset);phase.maxOffsetMs=Math.max(phase.maxOffsetMs,offset);}
    let applied=0;this.tick++;
    // Startup observes every callback; runtime rows retain extrema over ALL
    // intervening callbacks, so fixed-phase reporting cannot hide an excursion.
    if(!this.mapped||this.tick%8===0)this.emit({type:'clock',currentFrame:frame,currentTime,sampleRate,quantum:output.length,
      blockIndex:this.blockIndex,callbackWallMs:wall,pending:this.pending.length,activeVoices:this.voices.size,objects:this.objects.size,
      phaseExtrema:this.mapped?this.phaseExtrema.map(p=>({...p})):undefined,maximumFrameWallResidualMs:this.mapped?this.runtimeResidualMax:undefined,uncertaintyMs:this.mapped?this.uncertaintyMs:undefined,uncertaintyComponents:this.mapped?this.components():undefined});
    for(const c of this.commands.splice(0)){
      if(c.type==='map'){
        this.frameWallOffset=c.frameWallOffset;this.nodeWallOffset=c.nodeWallOffset;this.baseUncertaintyMs=c.baseUncertaintyMs;this.runtimeResidualMax=c.residualMaxMs;this.uncertaintyMs=c.uncertaintyMs;this.nodeWallPairUncertaintyMs=c.nodeWallPairUncertaintyMs;this.nodeWallDriftMaxMs=c.nodeWallDriftMaxMs;this.mapped=true;this.phaseExtrema=Array.from({length:8},()=>({count:0,minOffsetMs:Infinity,maxOffsetMs:-Infinity}));
        this.emit({type:'mapped',currentFrame:frame,callbackWallMs:wall});continue;
      }
      if(c.type==='budget'){
        this.baseUncertaintyMs=c.baseUncertaintyMs;this.nodeWallDriftMaxMs=c.nodeWallDriftMaxMs;
        // The new base may invalidate an unsampled intervening callback's
        // lifetime residual. Recheck before any following commands/onsets.
        this.uncertaintyMs=this.baseUncertaintyMs+this.runtimeResidualMax;
        if(this.uncertaintyMs>10){this.fail('Render callback mapping drift');break;}
        continue;
      }
      if(c.type!=='command'||!this.mapped||!Number.isSafeInteger(c.commandSequence)||c.commandSequence<=this.commandSequence){this.fail('Invalid render command ordering/readiness');break;}
      this.commandSequence=c.commandSequence;applied=c.commandSequence;const p=c.packet;
      if(p.type==='start'){
        if(p.session===this.session||this.expiredSessions.has(p.session)){this.fail('Expired render epoch reused');break;}
        if(this.session){this.retire(this.session);this.release('New epoch',frame,wall);}
        this.session=p.session;this.triggerSequence=0;this.lastHeartbeat=wall;
        this.emit({type:'started',session:this.session,currentFrame:frame,callbackWallMs:wall});continue;
      }
      if(!this.session||p.session!==this.session){this.emit({type:'stale',session:p.session,commandSequence:c.commandSequence});continue;}
      if(p.type==='heartbeat'){this.lastHeartbeat=wall;continue;}
      if(p.type==='stop'){this.retire(this.session);this.release(p.reason,frame,wall);continue;}
      if(p.type==='position'){
        if(this.objects.has(p.nodeId)&&this.objects.get(p.nodeId).objectId!==p.objectId){this.fail('Render active object binding changed');break;}
        if(!this.objects.has(p.nodeId)&&this.objects.size>=92){this.fail('Render object capacity exceeded');break;}
        this.objects.set(p.nodeId,{objectId:p.objectId,position:[...p.position]});continue;
      }
      if(p.type==='cancel'){
        const ids=new Set(p.ids),nodes=new Set(p.nodeIds);
        this.pending=this.pending.filter(t=>!ids.has(t.id)&&!nodes.has(t.nodeId));
        for(const [id,v] of this.voices)if(ids.has(id)||nodes.has(v.nodeId))this.voices.delete(id);
        for(const id of nodes)this.objects.delete(id);
        this.emit({type:'cancelled',session:this.session,commandSequence:c.commandSequence,cancelledIDs:p.ids.length,cancelledNodes:p.nodeIds.length,pending:this.pending.length,activeVoices:this.voices.size});continue;
      }
      if(p.type==='trigger'){
        if(p.triggerSequence<=this.triggerSequence||this.objects.get(p.nodeId)?.objectId!==p.objectId){this.fail('Render trigger sequence/object mismatch');break;}
        this.triggerSequence=p.triggerSequence;
        if(this.pending.length>=5376){this.fail('Render pending capacity exceeded');break;}
        const deadlineWallMs=p.onset*1000+this.nodeWallOffset;
        const targetFrame=Math.ceil((deadlineWallMs-this.frameWallOffset)*sampleRate/1000);
        this.pending.push({...p,deadlineWallMs,targetFrame});
        this.pending.sort((a,b)=>a.targetFrame-b.targetFrame||a.triggerSequence-b.triggerSequence);
        this.emit({type:'queued',session:this.session,id:p.id,intended:p.onset,currentFrame:frame,currentTime,blockIndex:this.blockIndex,
          callbackWallMs:wall,targetFrame,queueLeadMs:deadlineWallMs-wall,pending:this.pending.length});
      }
    }
    if(this.dead)return true;
    if(applied)this.emit({type:'applied',commandSequence:applied});
    for(const [id,v] of this.voices)if(v.endFrame<=frame)this.voices.delete(id);
    while(this.pending.length&&this.pending[0].targetFrame<frame+output.length){
      const t=this.pending.shift(),sampleOffset=Math.max(0,t.targetFrame-frame);
      // A real control tap is written at this sample; actual is observed callback
      // wall plus this offset. It is never reconstructed from intended onset.
      const actual=(wall+sampleOffset*1000/sampleRate-this.nodeWallOffset)/1000,errorMs=(actual-t.onset)*1000;
      const late=Math.abs(errorMs)>20;
      if(!late){
        output[sampleOffset]=.25;
        if(this.voices.size>=64){const oldest=this.voices.keys().next().value;this.voices.delete(oldest);}
        this.voices.set(t.id,{nodeId:t.nodeId,endFrame:frame+sampleOffset+Math.ceil(t.sound.duration*sampleRate)});
      }
      this.emit({type:late?'late-drop':'onset',session:this.session,id:t.id,generatorId:t.generatorId,nodeId:t.nodeId,objectId:t.objectId,position:[...this.objects.get(t.nodeId).position],intended:t.onset,actual,errorMs,
        currentFrame:frame,currentTime,blockIndex:this.blockIndex,sampleOffset,callbackWallMs:wall,uncertaintyMs:this.uncertaintyMs,
        actualOutputSample:late?0:output[sampleOffset],pending:this.pending.length,activeVoices:this.voices.size});
    }
    this.flush(wall);return true;
  }
}
registerProcessor('bongo-render-clock',RenderClockProcessor);
`;

type ClockRow = { currentFrame: number; currentTime: number; sampleRate: number; quantum: number; blockIndex: number; callbackWallMs: number; pending: number; activeVoices: number; objects: number };

/** Explicit Chrome companion dependency. No deadline timers or fallback path. */
export class RenderClock implements ReceiverClock {
  private socket?: WebSocket;
  private browser?: Browser;
  private page?: Page;
  private port = 0;
  private readonly capability = randomBytes(32).toString('hex');
  private readonly initialWall = wallPair();
  private finalWall?: ReturnType<typeof wallPair>;
  private calibrated = false;
  private failed = '';
  private closing = false;
  private started = false;
  private lastCommandSequence = 0;
  private lastBatchSequence = 0;
  private appliedCommandSequence = 0;
  private unacknowledgedCommands = new Set<number>();
  private lastReceiptAt = 0;
  private health?: ReturnType<typeof setInterval>;
  private samples: ClockRow[] = [];
  private warmupCallbacks = 0;
  private lastClock?: ClockRow;
  private frameWallOffset = 0;
  private uncertaintyMs = Infinity;
  private maximumWorkletUncertaintyMs = 0;
  private fatalWitness?: Record<string,unknown>;
  private residualMaxMs = 0;
  private nodeWallDriftMaxMs = 0;
  private lastNodeWall?: ReturnType<typeof wallPair>;
  private onsetCount = 0;
  private lateDropCount = 0;
  private queuedCount = 0;
  private readonly recent: unknown[] = [];

  constructor(private readonly hooks: ReceiverClockHooks) {}
  get ready() { return this.calibrated && !this.failed && !this.closing && this.socket?.readyState === WebSocket.OPEN; }
  get diagnostics(): Record<string, unknown> {
    return { fatalWitness: this.fatalWitness, mode: 'audio-render-clock', ready: this.ready, failure: this.failed, uncertaintyMs: Math.max(this.uncertaintyMs, this.maximumWorkletUncertaintyMs), nodeEstimateUncertaintyMs: this.uncertaintyMs, maximumWorkletUncertaintyMs: this.maximumWorkletUncertaintyMs,
      calibration: { method:'independent all-quantum min/max midpoint',requiredSamples:256,warmupQuanta:96,phaseCoverage:Array.from({length:8},(_,phase)=>this.samples.filter(row=>row.blockIndex%8===phase).length),warmupCallbacks: this.warmupCallbacks, samples: this.samples, frameWallOffset: this.frameWallOffset, residualMaxMs: this.residualMaxMs, nodeWallDriftMaxMs: this.nodeWallDriftMaxMs, lastNodeWall: this.lastNodeWall, initialNodeWall: this.initialWall, finalNodeWall: this.finalWall },
      lastClock: this.lastClock, lastReceiptAt: this.lastReceiptAt, lastCommandSequence: this.lastCommandSequence, appliedCommandSequence: this.appliedCommandSequence, unacknowledgedCommands: this.unacknowledgedCommands.size,
      onsetCount: this.onsetCount, lateDropCount: this.lateDropCount, queuedCount: this.queuedCount, recent: [...this.recent],
      bounds: { pending: MAX_PENDING, voices: 64, objects: 92, receipts: MAX_RECEIPTS, watchdogMs: 500 },
      witness: 'Actual silent control sample, observed process callback wall + sample offset; no audible synth claim' };
  }

  servePage(request: IncomingMessage, response: ServerResponse): boolean {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/clock') return false;
    if (url.searchParams.get('capability') !== this.capability || request.method !== 'GET') {
      response.writeHead(403); response.end(); return true;
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.end(this.html()); return true;
  }

  acceptConnection(socket: WebSocket, request: IncomingMessage): boolean {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/render-clock') return false;
    if (url.searchParams.get('capability') !== this.capability || request.headers.origin !== `http://127.0.0.1:${this.port}` || this.socket || this.closing || this.failed) {
      socket.close(1008, 'Private receiver sink'); return true;
    }
    this.socket = socket; this.lastReceiptAt = performance.now();
    socket.on('message', (data, binary) => {
      if (binary || (Array.isArray(data) ? data.reduce((sum, part) => sum + part.byteLength, 0) : data.byteLength) > MAX_WIRE_BYTES) { this.fail('Invalid render receipt frame'); return; }
      try { this.receive(JSON.parse(data.toString())); } catch { this.fail('Malformed render receipt'); }
    });
    socket.on('error', () => this.fail('Render sink socket error'));
    socket.on('close', () => { this.calibrated = false; this.fail('Render sink disconnected'); });
    return true;
  }

  async start(port: number): Promise<void> {
    if (this.started) throw Error('RenderClock already started');
    this.started = true; this.port = port;
    try {
      const { chromium } = await import('@playwright/test');
      this.browser = await chromium.launch({ executablePath: CHROME, headless: true });
      this.browser.on('disconnected', () => this.fail('Render companion browser disconnected'));
      this.page = await this.browser.newPage();
      this.page.on('pageerror', error => this.fail(`Render companion: ${error.message}`));
      await this.page.goto(`http://127.0.0.1:${port}/clock?capability=${this.capability}`);
      await this.page.waitForFunction(() => (window as unknown as { receiverClock: { socket: globalThis.WebSocket } }).receiverClock.socket.readyState === globalThis.WebSocket.OPEN);
      await this.page.locator('#enable').click();
      const until = performance.now() + 15000;
      while (!this.ready && !this.failed && performance.now() < until) await new Promise(resolve => setTimeout(resolve, 10));
      if (!this.ready) throw Error(this.failed || 'Render clock calibration timed out');
      this.health = setInterval(() => {
        if (performance.now() - this.lastReceiptAt > 500) this.fail('Render clock readback lost');
        this.lastNodeWall = wallPair();
        this.nodeWallDriftMaxMs = Math.max(this.nodeWallDriftMaxMs, Math.abs(this.lastNodeWall.offsetMs - this.initialWall.offsetMs));
        this.updateUncertainty();
      }, 100);
    } catch (error) { this.fail(String(error)); await this.close(); throw error; }
  }

  send(command: ReceiverClockCommand): void {
    if (!this.ready) { this.fail('Command attempted while render clock unready'); return; }
    if (!Number.isSafeInteger(command.commandSequence) || command.commandSequence <= this.lastCommandSequence) {
      this.fail('Render command ordering violated'); return;
    }
    if (this.unacknowledgedCommands.size >= 8192) { this.fail('Render unacknowledged command capacity exceeded'); return; }
    this.lastCommandSequence = command.commandSequence; this.unacknowledgedCommands.add(command.commandSequence);
    this.write({ type: 'command', ...command });
  }

  async close(): Promise<void> {
    this.closing = true; this.calibrated = false;
    if (this.health) clearInterval(this.health);
    this.finalWall = wallPair();
    await this.page?.evaluate(async () => {
      const state = (window as unknown as { receiverClock?: { context?: AudioContext; socket?: globalThis.WebSocket; node?: AudioWorkletNode } }).receiverClock;
      state?.node?.port.postMessage({ type: 'shutdown' });
      state?.socket?.close(); await state?.context?.close();
    }).catch(() => {});
    this.socket?.terminate(); await this.browser?.close();
  }

  private fail(reason: string): void {
    if (this.failed || this.closing) return;
    this.failed = reason; this.calibrated = false;
    if (this.health) clearInterval(this.health);
    if (this.socket?.readyState === WebSocket.OPEN) { try { this.socket.send(JSON.stringify({ type: 'fatal', reason })); } catch { /* failure is already authoritative */ } }
    this.hooks.failure(reason);
  }
  private write(message: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.socket.bufferedAmount > 65536) {
      this.fail('Render sink backpressure/disconnection'); return;
    }
    this.socket.send(JSON.stringify(message));
  }
  private remember(row: unknown): void { this.recent.push(row); if (this.recent.length > 256) this.recent.shift(); }
  private receive(message: any): void {
    if (this.closing || this.failed) return;
    this.lastReceiptAt = performance.now();
    if (message.type === 'fatal') { this.fatalWitness = message; this.remember(message); this.fail(String(message.reason)); return; }
    if (message.type !== 'batch' || !Number.isSafeInteger(message.batchSequence) || message.batchSequence !== this.lastBatchSequence + 1 || !Array.isArray(message.rows) || message.rows.length > 16) {
      this.fail('Render receipt ordering/capacity violated'); return;
    }
    this.lastBatchSequence = message.batchSequence;
    for (const row of message.rows) {
      if (this.failed) break;
      this.remember(row);
      if (row.type === 'clock') this.clock(row);
      else if (row.type === 'mapped') this.calibrated = true;
      else if (row.type === 'queued') this.queuedCount++;
      else if (row.type === 'applied') {
        if (!Number.isSafeInteger(row.commandSequence) || row.commandSequence <= this.appliedCommandSequence || row.commandSequence > this.lastCommandSequence) { this.fail('Invalid render applied command acknowledgement'); break; }
        this.appliedCommandSequence = row.commandSequence;
        for (const sequence of this.unacknowledgedCommands) if (sequence <= row.commandSequence) this.unacknowledgedCommands.delete(sequence);
        this.hooks.applied(row.commandSequence);
      }
      else if (row.type === 'release') this.hooks.release(row.session, row.reason);
      else if (row.type === 'onset' || row.type === 'late-drop') {
        const receipt = { ...row, uncertaintyMs: Math.max(row.uncertaintyMs, this.uncertaintyMs) } as ReceiverOnset;
        if (![receipt.intended, receipt.actual, receipt.errorMs, receipt.currentFrame, receipt.currentTime, receipt.blockIndex, receipt.sampleOffset, receipt.callbackWallMs, receipt.uncertaintyMs].every(Number.isFinite) || !this.calibrated || !Array.isArray(receipt.position) || receipt.position.length !== 3 || !receipt.position.every(value => Number.isFinite(value) && Math.abs(value) <= 1)) {
          this.fail('Invalid render onset witness'); break;
        }
        if (row.type === 'onset') this.onsetCount++; else this.lateDropCount++;
        this.maximumWorkletUncertaintyMs = Math.max(this.maximumWorkletUncertaintyMs, receipt.uncertaintyMs);
        this.hooks.onset(receipt);
      }
    }
    if (!this.failed) this.write({ type: 'ack', batchSequence: message.batchSequence });
  }
  private clock(row: ClockRow): void {
    if (![row.currentFrame, row.currentTime, row.sampleRate, row.quantum, row.callbackWallMs, row.blockIndex].every(Number.isFinite) || row.sampleRate <= 0 || row.quantum <= 0 || (this.lastClock && row.currentFrame <= this.lastClock.currentFrame)) {
      this.fail('Invalid/stalled render clock'); return;
    }
    this.lastClock = row;
    // Discard96 actual startup quanta (~0.256s at48kHz), then observe
    // every phase before fixing the independent all-quantum interval center.
    if (this.warmupCallbacks++ < 96) return;
    const offset = row.callbackWallMs - row.currentFrame * 1000 / row.sampleRate;
    if (this.samples.length < 256) {
      this.samples.push(row);
      if (this.samples.length !== 256) return;
      if (Array.from({length:8},(_,phase)=>this.samples.filter(sample=>sample.blockIndex%8===phase).length).some(count=>count!==32)) { this.fail('Incomplete render startup phase coverage'); return; }
      const offsets = this.samples.map(s => s.callbackWallMs - s.currentFrame * 1000 / s.sampleRate).sort((a,b) => a-b);
      this.frameWallOffset = (offsets[0]+offsets[offsets.length-1])/2;
      this.residualMaxMs = Math.max(...offsets.map(value => Math.abs(value - this.frameWallOffset)));
      this.uncertaintyMs = this.baseUncertainty() + this.residualMaxMs;
      if (this.uncertaintyMs > 10) { this.fail('Render startup calibration uncertainty exceeds 10ms'); return; }
      this.write({ type: 'map', frameWallOffset: this.frameWallOffset, nodeWallOffset: this.initialWall.offsetMs, uncertaintyMs: this.uncertaintyMs, baseUncertaintyMs: this.baseUncertainty(), residualMaxMs: this.residualMaxMs, nodeWallPairUncertaintyMs: this.initialWall.uncertaintyMs, nodeWallDriftMaxMs: this.nodeWallDriftMaxMs });
    } else {
      const runtime=row as ClockRow & {maximumFrameWallResidualMs?:number;uncertaintyMs?:number};
      this.residualMaxMs = Math.max(this.residualMaxMs, Math.abs(offset - this.frameWallOffset), runtime.maximumFrameWallResidualMs??0);
      this.maximumWorkletUncertaintyMs=Math.max(this.maximumWorkletUncertaintyMs,runtime.uncertaintyMs??0);this.updateUncertainty();
    }
  }
  private baseUncertainty(): number {
    const row = this.lastClock;
    return this.initialWall.uncertaintyMs + this.nodeWallDriftMaxMs + 1 + (row ? row.quantum * 1000 / row.sampleRate : 0);
  }
  private updateUncertainty(): void {
    if (this.samples.length < 256 || this.failed) return;
    this.uncertaintyMs = this.baseUncertainty() + this.residualMaxMs;
    if (this.uncertaintyMs > 10) { this.fail('Runtime render/wall uncertainty exceeds 10ms'); return; }
    this.write({ type: 'budget', baseUncertaintyMs: this.baseUncertainty(), nodeWallDriftMaxMs: this.nodeWallDriftMaxMs });
  }
  private html(): string {
    return `<!doctype html><meta charset="utf-8"><title>Bongo Planet receiver render clock</title><button id="enable">Enable receiver control clock</button><script>
const state=window.receiverClock={socket:new WebSocket(location.origin.replace('http:','ws:')+'/render-clock'+location.search),node:null,context:null,failed:false};
function fail(reason){if(state.failed)return;state.failed=true;state.node?.port.postMessage({type:'shutdown'});if(state.socket.readyState===WebSocket.OPEN)state.socket.send(JSON.stringify({type:'fatal',reason}));state.context?.close();}
state.socket.onclose=()=>fail('Companion socket closed');state.socket.onerror=()=>fail('Companion socket failed');
state.socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.type==='fatal'){fail(m.reason);return;}if(!state.node){fail('Command before processor startup');return;}state.node.port.postMessage(m);};
document.querySelector('#enable').onclick=async()=>{try{
state.context=new AudioContext({latencyHint:'interactive'});await state.context.resume();
const blob=new Blob([${JSON.stringify(PROCESSOR)}],{type:'text/javascript'}),url=URL.createObjectURL(blob);await state.context.audioWorklet.addModule(url);URL.revokeObjectURL(url);
state.node=new AudioWorkletNode(state.context,'bongo-render-clock',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
const silent=state.context.createGain();silent.gain.value=0;state.node.connect(silent).connect(state.context.destination);
state.context.onstatechange=()=>{if(state.context.state!=='running'&&!state.failed)fail('Receiver AudioContext suspended/closed');};
state.node.onprocessorerror=()=>fail('Receiver processor failed');
state.node.port.onmessage=({data})=>{if(state.socket.readyState!==WebSocket.OPEN||state.socket.bufferedAmount>65536){fail('Companion receipt backpressure');return;}state.socket.send(JSON.stringify(data));};
}catch(e){fail(String(e));}};
</script>`;
  }
}
