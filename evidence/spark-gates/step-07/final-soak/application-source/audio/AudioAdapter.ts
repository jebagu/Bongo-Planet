import { loadSamples } from './samples';
import workletUrl from './processor.ts?worker&url';
import { emptyScene, type Scene, type EngineEvent } from '../core/contracts';
import type { AudioCommand, AudioMessage, AudioState, AudioStatus } from './protocol';
export type { AudioState, AudioStatus } from './protocol';

/** Call enable only from a deliberate gesture. Musical scheduling lives in the worklet. */
export class AudioAdapter {
  onEvents?: (events: EngineEvent[]) => void;
  onStatus?: (status: AudioStatus) => void;
  onState?: (state: AudioState, detail?: string) => void;
  private context?: AudioContext;
  private node?: AudioWorkletNode;
  private setup?: Promise<void>;
  private scene = emptyScene();
  private wantedPlay = false;
  private interrupted = false;
  private pendingLimitError: string | null = null;
  private processorFailure: string | null = null;
  private currentState: AudioState = 'locked';
  get state(): AudioState { return this.currentState; }
  get now(): number { return this.context?.currentTime ?? 0; }
  get audibleNow(): number {
    const context = this.context;
    if (!context) return 0;
    const timestamp = context.getOutputTimestamp?.();
    if (timestamp && timestamp.performanceTime !== undefined && timestamp.contextTime !== undefined && timestamp.performanceTime > 0) {
      return Math.min(context.currentTime, Math.max(0, timestamp.contextTime + (performance.now() - timestamp.performanceTime) / 1000));
    }
    return Math.max(0, context.currentTime - (context.outputLatency ?? context.baseLatency ?? 0));
  }
  private stateChanged(state: AudioState, detail?: string): void {
    this.currentState = state;
    this.onState?.(state, detail);
  }
  private send(command: AudioCommand): void { this.node?.port.postMessage(command); }
  enable(): Promise<void> {
    try {
      if (this.processorFailure) throw Error(this.processorFailure);
      if (!this.context) {
        this.context = new AudioContext({ latencyHint: 'interactive' });
        this.context.onstatechange = () => {
          if (!this.processorFailure && this.context?.state !== 'running' && this.node) {
            this.wantedPlay = false;
            this.interrupted = true;
            this.send({ type: 'pause', reason: 'audio interrupted' });
            this.stateChanged('interrupted', 'Audio stopped; press Play or Enable sound to resume.');
          }
        };
      }
      const context = this.context;
      // Request activation synchronously in the gesture, before awaiting module loading.
      const resume = context.resume();
      if (!this.setup) {
        this.setup = Promise.all([context.audioWorklet.addModule(workletUrl), loadSamples(context)]).then(([, bank]) => {
          this.node = new AudioWorkletNode(context, 'bongo-planet-audio', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
          this.node.onprocessorerror = () => { this.wantedPlay = false; this.processorFailure = 'Audio processor failed. Reload to recover.'; this.stateChanged('error', this.processorFailure); };
          this.node.port.onmessage = ({ data }: MessageEvent<AudioMessage>) => {
            if (data.type === 'error') { this.wantedPlay = false; this.processorFailure = data.message; this.stateChanged('error', data.message); return; }
            if (data.type === 'events') {
              this.send({ type: 'ackEvents' });
              if (!this.processorFailure && data.events.some(e => e.type === 'reset' && e.reason === 'interrupted clock')) { this.interrupted = true; this.wantedPlay = false; this.stateChanged('interrupted', 'Audio clock interrupted; press Play to resume.'); }
              const capacity=data.events.find(e=>e.type==='reset'&&(/limit exceeded|backlog exceeded|invalid gated timing/.test(e.reason)));
              if (!this.processorFailure && capacity?.type==='reset') { this.wantedPlay = false; this.pendingLimitError = `${capacity.reason}; playback paused. Simplify the circuit and press Play to resume.`; this.stateChanged('error', this.pendingLimitError); }
              this.onEvents?.(data.events);
              return;
            }
            this.send({ type: 'ack' });
            this.onStatus?.(data.status);
            if (this.currentState !== 'interrupted' && this.currentState !== 'error' && (this.currentState !== 'starting' || data.status.running)) this.stateChanged(data.status.running ? 'running' : 'paused');
          };
          this.node.connect(context.destination);
          this.send({ type: 'samples', bank });
          this.send({ type: 'scene', scene: this.scene, mode: 'load' });
        }).catch(error => { this.setup = undefined; throw error; });
      }
      return Promise.all([resume, this.setup]).then(() => {
        if (this.processorFailure) throw Error(this.processorFailure);
        if (context.state !== 'running') throw Error('Audio activation blocked; use Enable sound.');
        this.interrupted = false;
        this.stateChanged(this.pendingLimitError ? 'error' : 'ready', this.pendingLimitError ?? undefined);
        if (this.wantedPlay) this.play();
      }).catch(error => { this.stateChanged('error', error instanceof Error ? error.message : String(error)); throw error; });
    } catch (error) { this.stateChanged('error', String(error)); return Promise.reject(error); }
  }
  setScene(scene: Scene, mode: 'edit' | 'load' | 'clear' = 'edit'): void {
    this.scene = structuredClone(scene);
    if (this.processorFailure) return;
    if (mode !== 'edit') {
      this.pendingLimitError = null;
      this.wantedPlay = false;
      this.stateChanged(!this.context ? 'locked' : this.interrupted ? 'interrupted' : 'paused');
    }
    this.send({ type: 'scene', scene: this.scene, mode });
  }
  play(): void {
    if (this.processorFailure) return;
    this.pendingLimitError = null;
    this.wantedPlay = true;
    if (this.context?.state === 'running' && !this.interrupted) { this.stateChanged('starting', 'Starting sound…'); this.send({ type: 'play' }); }
  }
  pause(): void { this.wantedPlay = false; if (this.processorFailure) return; this.pendingLimitError = null; this.send({ type: 'pause' }); this.stateChanged('paused'); }
  async dispose(): Promise<void> {
    this.wantedPlay = false;
    this.node?.disconnect();
    if (this.context) { this.context.onstatechange = null; await this.context.close(); }
  }
}
