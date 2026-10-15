import type { Engine } from '../core/engine';
import type { EngineEvent, Scene } from '../core/contracts';
import type { VoiceCounters } from './synth';
export type AudioState = 'locked' | 'starting' | 'ready' | 'running' | 'paused' | 'interrupted' | 'error';
export type AudioStatus = ReturnType<Engine['snapshot']> & VoiceCounters & { telemetryDrops: number };
import type { SampleBank } from './samples';
export type AudioCommand =
  | { type: 'samples'; bank: SampleBank }
  | { type: 'scene'; scene: Scene; mode: 'edit' | 'load' | 'clear';epoch?:number }
  | { type: 'play' }
  | { type: 'pause'; reason?: string;epoch?:number }
  | { type: 'ack' }
  | { type: 'ackEvents' };
export type AudioMessage = { type: 'telemetry'; status: AudioStatus;epoch?:number }
  | { type: 'events'; events: EngineEvent[];epoch?:number }
  | { type: 'error'; message: string };
