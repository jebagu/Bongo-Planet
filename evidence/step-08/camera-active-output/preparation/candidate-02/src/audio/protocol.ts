import type { Engine } from '../core/engine';
import type { EngineEvent, Scene } from '../core/contracts';
import type { VoiceCounters } from './synth';
export type AudioState = 'locked' | 'starting' | 'ready' | 'running' | 'paused' | 'interrupted' | 'error';
export type AudioStatus = ReturnType<Engine['snapshot']> & VoiceCounters & { telemetryDrops: number };
export type AudioCommand =
  | { type: 'scene'; scene: Scene; mode: 'edit' | 'load' | 'clear' }
  | { type: 'play' }
  | { type: 'pause'; reason?: string }
  | { type: 'ack' }
  | { type: 'ackEvents' };
export type AudioMessage = { type: 'telemetry'; status: AudioStatus }
  | { type: 'events'; events: EngineEvent[] }
  | { type: 'error'; message: string };
