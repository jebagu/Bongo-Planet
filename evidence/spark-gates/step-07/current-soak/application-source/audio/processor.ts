import { Engine } from '../core/engine';
import type { EngineEvent } from '../core/contracts';
import { MonoSynth } from './synth';
import type { AudioCommand, AudioMessage } from './protocol';
// AudioWorklet globals are absent from the browser DOM type library.
declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(); }
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

const MAX_CLOCK_LAG = 0.02;
const CLOCK_EPSILON = 0.01 / sampleRate;

class BongoProcessor extends AudioWorkletProcessor {
  private engine = new Engine();
  private synth = new MonoSynth(sampleRate);
  private telemetry: EngineEvent[] = [];
  private telemetryDrops = 0;
  private lastTelemetry = -Infinity;
  private inFlight = false;
  private eventsInFlight = false;
  private pendingPlay = false;
  private previousEnd: number | null = null;
  private stableSince = 0;
  private failed = false;
  private epoch=0;
  constructor() {
    super();
    this.port.onmessage = ({ data }: MessageEvent<AudioCommand>) => {
      try {
        if (data.type === 'ack') { this.inFlight = false; return; }
        if (data.type === 'ackEvents') { this.eventsInFlight = false; this.flushEvents(); return; }
        if (this.failed) return;
        const now = this.clockTime(currentTime);
        if (data.type === 'samples') { this.synth.setSamples(data.bank); return; }
        if (data.type === 'scene') {
          if (data.mode === 'edit') this.engine.update(data.scene, now);
          else { this.pendingPlay = false;this.epoch=data.epoch??this.epoch;this.telemetry=[]; this.engine.replace(data.scene, now, data.mode); }
        } else if (data.type === 'play') { if (!this.engine.running) { this.pendingPlay = true; this.stableSince = now; } }
        else if (data.type === 'pause') { this.pendingPlay = false;this.epoch=data.epoch??this.epoch;this.telemetry=[];this.engine.pause(now, data.reason); }
        this.consume(now,data.type==='pause'||(data.type==='scene'&&data.mode!=='edit'));
        if (this.failed) return;
        if (data.type === 'pause' || data.type === 'scene') {
          const message: AudioMessage = { type: 'telemetry',epoch:this.epoch, status: { ...this.engine.snapshot(), ...this.synth.counters, telemetryDrops: this.telemetryDrops } };
          this.port.postMessage(message);
        }
      } catch (error) { this.fail(error); }
    };
  }
  private clockTime(raw: number): number {
    if (!Number.isFinite(raw)) throw Error('Audio clock must be finite.');
    const floor = Math.max(this.previousEnd ?? 0, this.engine.now);
    if (floor - raw > MAX_CLOCK_LAG + CLOCK_EPSILON) throw Error('Audio clock moved backward more than20ms.');
    // Browser globals can repeat across fresh callbacks. Advance audio by every
    // processed block, including double repeats, without moving command time backward.
    return Math.max(raw, floor);
  }
  private consume(start: number,discardMusic=false): void {
    const drained=this.engine.drain();const events=discardMusic?drained.filter(e=>e.type==='reset'||e.type==='cancel'||e.type==='edit-accepted'):drained;
    this.synth.apply(events, start);
    if (this.telemetry.length + events.length > 2048) {
      this.telemetryDrops += events.length;
      this.fail(Error('Audio event consumer stalled: reliable backlog exceeded 2048 records.'));
      return;
    }
    this.telemetry.push(...events);
    this.flushEvents();
  }
  private flushEvents(): void {
    if (this.eventsInFlight || !this.telemetry.length) return;
    const message: AudioMessage = { type: 'events',epoch:this.epoch, events: this.telemetry };
    this.telemetry = [];
    this.eventsInFlight = true;
    this.port.postMessage(message);
  }
  private fail(error: unknown): void {
    if (this.failed) return;
    this.failed = true;
    this.pendingPlay = false;
    const raw = currentTime;
    const now = Math.max(Number.isFinite(raw) ? raw : 0, this.previousEnd ?? 0, this.engine.now);
    this.synth.releaseAll(now);
    try { this.engine.pause(now, 'processor error'); } catch { /* Failed engine must stop producing audio. */ }
    this.telemetry = this.engine.drain().filter(event => event.type === 'reset' || event.type === 'cancel');
    this.flushEvents();
    const status: AudioMessage = { type: 'telemetry',epoch:this.epoch, status: { ...this.engine.snapshot(), ...this.synth.counters, telemetryDrops: this.telemetryDrops } };
    this.port.postMessage(status);
    const message: AudioMessage = { type: 'error', message: `${error instanceof Error ? error.message : String(error)} Reload to recover.` };
    this.port.postMessage(message);
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channels = outputs[0];
    if (!channels?.[0]) return true;
    if (this.failed) { for (const channel of channels) channel.fill(0); return true; }
    try {
      const start = this.clockTime(currentTime), end = start + channels[0].length / sampleRate;
      if (this.previousEnd === null) this.stableSince = start;
      else if (start - this.previousEnd > 0.1) {
        this.stableSince = start;
        if (this.engine.running) this.pendingPlay = false;
      }
      if (this.pendingPlay && start - this.stableSince >= 0.25) {
        this.pendingPlay = false;
        this.engine.play(start);
      }
      this.engine.advance(end,channels[0].length/sampleRate);
      this.previousEnd = end;
      this.consume(start);
      if (this.failed) { for (const channel of channels) channel.fill(0); return true; }
      for (let channel = 0; channel < channels.length; channel++) this.synth.render(channels[channel], start, this.engine.scene.settings.volume, channel, channel === channels.length - 1);
      if (!this.inFlight && start - this.lastTelemetry >= 0.05) {
        this.lastTelemetry = start;
        this.inFlight = true;
        const message: AudioMessage = { type: 'telemetry',epoch:this.epoch, status: { ...this.engine.snapshot(), ...this.synth.counters, telemetryDrops: this.telemetryDrops } };
        this.port.postMessage(message);
      }
    } catch (error) { this.fail(error); for (const channel of channels) channel.fill(0); }
    return true;
  }
}
registerProcessor('bongo-planet-audio', BongoProcessor);
