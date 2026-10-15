import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WebSocket } from 'ws';
import type { Packet } from './protocol';

/** Internal ordered stream after the bridge has validated producer traffic. */
export type ReceiverClockCommand = {
  commandSequence: number;
  packet: Exclude<Packet, { type: 'sync' }>;
};

export interface ReceiverOnset {
  type: 'onset' | 'late-drop';
  session: string;
  id: string;
  generatorId: string;
  nodeId: string;
  objectId: number;
  /** Snapshot at execution, before later position or cancellation commands. */
  position: number[];
  intended: number;
  /** Observed process callback wall clock + actual sample offset, converted to Node monotonic time. */
  actual: number;
  errorMs: number;
  currentFrame: number;
  currentTime: number;
  blockIndex: number;
  sampleOffset: number;
  callbackWallMs: number;
  uncertaintyMs: number;
  /** Independent Node wall/monotonic bracket used by the clock witness. */
  nodeWallPair?: {before:number;after:number;wallMs:number;offsetMs:number;uncertaintyMs:number};
  nodeWallPairSequence?: number;
  nodeWallPairAgeMs?: number;
  maximumNodeWallPairUncertaintyMs?: number;
  /** Scheduling displacement, separate from observed-timestamp uncertainty. */
  maximumFrameWallResidualMs?: number;
}

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
  close: () => Promise<void>;
}
