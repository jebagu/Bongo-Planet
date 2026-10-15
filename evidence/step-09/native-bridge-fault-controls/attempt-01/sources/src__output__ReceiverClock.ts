import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WebSocket } from 'ws';
import type { Packet } from './protocol';

/** Internal ordered stream after the bridge has validated producer traffic. */
export type ReceiverClockCommand = {
  commandSequence: number;
  packet: Exclude<Packet, { type: 'sync' }>;
};

interface ReceiverOnsetBase {
  type: 'onset' | 'late-drop';
  session: string;
  id: string;
  generatorId: string;
  nodeId: string;
  objectId: number;
  /** Snapshot at execution, before later position or cancellation commands. */
  position: number[];
  intended: number;
  /** Actual control execution, converted to Node monotonic time. */
  actual: number;
  errorMs: number;
  uncertaintyMs: number;
}

export interface RenderReceiverOnset extends ReceiverOnsetBase {
  /** Omitted by the retained earlier render implementation. */
  clockDomain?: 'render-frame';
  currentFrame: number;
  currentTime: number;
  blockIndex: number;
  sampleOffset: number;
  callbackWallMs: number;
  /** Independent Node wall/monotonic bracket used by the clock witness. */
  nodeWallPair?: {before:number;after:number;wallMs:number;offsetMs:number;uncertaintyMs:number};
  nodeWallPairSequence?: number;
  nodeWallPairAgeMs?: number;
  maximumNodeWallPairUncertaintyMs?: number;
  /** Scheduling displacement, separate from observed-timestamp uncertainty. */
  maximumFrameWallResidualMs?: number;
}

/** Native numerical control witness; no audio frame or sample is implied. */
export interface NativeReceiverOnset extends ReceiverOnsetBase {
  clockDomain: 'native-monotonic';
  workerIncarnation: string;
  intendedHrNs: string;
  actualHrNs: string;
  fixedNodeHrOffsetNs: string;
  mutationHrBeforeNs: string;
  mutationHrAfterNs: string;
  nodeHrPair: {
    beforeHrNs: string; performanceMs: number; afterHrNs: string;
    offsetLowerNs: string; offsetUpperNs: string; widthNs: string;
  };
  clockPairSequence: number;
  clockPairAgeMs: number;
}

export type ReceiverOnset = RenderReceiverOnset | NativeReceiverOnset;

export interface ReceiverClockHooks {
  onset: (receipt: ReceiverOnset) => void;
  /** Invoked after earlier ordered onset receipts, never before them. */
  applied: (commandSequence: number) => void;
  release: (session: string, reason: string) => void;
  failure: (reason: string) => void;
}

/** Node mirrors admission state; this clock owns actual deadline execution. */
export interface ReceiverClock {
  readonly ready: boolean;
  readonly diagnostics: Record<string, unknown>;
  servePage: (request: IncomingMessage, response: ServerResponse) => boolean;
  acceptConnection: (socket: WebSocket, request: IncomingMessage) => boolean;
  start: (port: number) => Promise<void>;
  send: (command: ReceiverClockCommand) => void;
  /** Synchronously prevent further control mutations after invalid evidence. */
  invalidate: (reason: string) => void;
  close: () => Promise<void>;
}
