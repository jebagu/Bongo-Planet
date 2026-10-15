import { Engine } from '../core/engine';
import type { EngineEvent } from '../core/contracts';
import { MonoSynth } from './synth';
import type { AudioCommand, AudioMessage } from './protocol';
// AudioWorklet globals are absent from the browser DOM type library.
declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(); }
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

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
  constructor() {
    super();
    this.port.onmessage = ({ data }: MessageEvent<AudioCommand>) => {
      try {
        if (data.type === 'ack') { this.inFlight = false; return; }
        if (data.type === 'ackEvents') { this.eventsInFlight = false; this.flushEvents(); return; }
        if (data.type === 'scene') {
          if (data.mode === 'edit') this.engine.update(data.scene, currentTime);
          else { this.pendingPlay = false; this.engine.replace(data.scene, currentTime, data.mode); }
        } else if (data.type === 'play') { if (!this.engine.running) { this.pendingPlay = true; this.stableSince = currentTime; } }
        else if (data.type === 'pause') { this.pendingPlay = false; this.engine.pause(currentTime, data.reason); }
        this.consume(currentTime);
        if (data.type === 'pause' || data.type === 'scene') {
          const message: AudioMessage = { type: 'telemetry', status: { ...this.engine.snapshot(), ...this.synth.counters, telemetryDrops: this.telemetryDrops } };
          this.port.postMessage(message);
        }
      } catch (error) { this.fail(error); }
    };
  }
  private consume(start: number): void {
    const events = this.engine.drain();
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
    const message: AudioMessage = { type: 'events', events: this.telemetry };
    this.telemetry = [];
    this.eventsInFlight = true;
    this.port.postMessage(message);
  }
  private fail(error: unknown): void {
    this.pendingPlay = false;
    this.synth.releaseAll(currentTime);
    try { this.engine.pause(Math.max(currentTime, this.engine.now), 'processor error'); } catch { /* Failed engine must stop producing audio. */ }
    this.telemetry = this.engine.drain().filter(event => event.type === 'reset' || event.type === 'cancel');
    this.flushEvents();
    const message: AudioMessage = { type: 'error', message: error instanceof Error ? error.message : String(error) };
    this.port.postMessage(message);
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channels = outputs[0];
    if (!channels?.[0]) return true;
    const start = currentTime, end = start + channels[0].length / sampleRate;
    try {
      if (this.previousEnd === null) this.stableSince = start;
      else if (start - this.previousEnd > 0.1) {
        this.stableSince = start;
        if (this.engine.running) this.pendingPlay = false;
      }
      if (this.pendingPlay && start - this.stableSince >= 0.25) {
        this.pendingPlay = false;
        this.engine.play(start);
      }
      this.engine.advance(end);
      this.previousEnd = end;
      this.consume(start);
      this.synth.render(channels[0], start, this.engine.scene.settings.volume);
      for (let channel = 1; channel < channels.length; channel++) channels[channel].set(channels[0]);
      if (!this.inFlight && start - this.lastTelemetry >= 0.05) {
        this.lastTelemetry = start;
        this.inFlight = true;
        const message: AudioMessage = { type: 'telemetry', status: { ...this.engine.snapshot(), ...this.synth.counters, telemetryDrops: this.telemetryDrops } };
        this.port.postMessage(message);
      }
    } catch (error) { this.fail(error); for (const channel of channels) channel.fill(0); }
    return true;
  }
}
registerProcessor('bongo-planet-audio', BongoProcessor);
