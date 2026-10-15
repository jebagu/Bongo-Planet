/** Pure successor admission/correspondence; no runtime imports. */
export const SEND_PHASE_CAPS={startup:1024,pressure:10240,tail:4096,cleanup:1024} as const;
export type SendPhase=keyof typeof SEND_PHASE_CAPS;
export function admitSend(counts:Record<SendPhase,number>,phase:SendPhase,caps=SEND_PHASE_CAPS):void {
 const values=Object.values(counts);if(values.some(v=>!Number.isSafeInteger(v)||v<0)||!Object.hasOwn(caps,phase)||counts[phase]>=caps[phase]||values.reduce((a,b)=>a+b,0)>=16384)throw Error('Producer send phase/global cap');
}
export function requireStage(now:number,end:number,label:string):void {
 if(!Number.isFinite(now)||!Number.isFinite(end)||now>=end)throw Error(label+' deadline expired/unknown');
}
export function nativeLeaseAdmission(observation:{readerUpperHrNs:string;observedHrNs:string;lastHeartbeatHrNs:string;session:string;expectedSession:string;incarnation:string;expectedIncarnation:string;voices:number},drain:boolean):{ageMs:number;remainingMs:number;parentMargin:null} {
 const o=observation;if(o.session!==o.expectedSession||!o.session||o.incarnation!==o.expectedIncarnation||!o.incarnation||o.voices!==1)throw Error('Native session/incarnation/sole voice lost');
 const now=BigInt(o.readerUpperHrNs),observed=BigInt(o.observedHrNs),heartbeat=BigInt(o.lastHeartbeatHrNs);
 if(now<observed||observed<heartbeat||now-observed>50000000n||now-heartbeat>500000000n)throw Error('Native state stale/lease expired');
 const ageMs=Number(now-heartbeat)/1e6,remainingMs=500-ageMs;
 if(drain&&remainingMs<150)throw Error('Native-only150ms admission exhausted');
 return{ageMs,remainingMs,parentMargin:null};
}
export function requirePositionTriples(wires:any[],receiver:any[],decoded:any[]):void {
 if(wires.length!==receiver.length||wires.length!==decoded.length)throw Error('Position wire/receiver/raw denominator mismatch');
 for(let i=0;i<wires.length;i++){const w=wires[i],r=receiver[i],d=decoded[i];if(w.nodeId!==r.nodeId||w.objectId!==r.objectId||d.objectId!==w.objectId||!Array.isArray(w.position)||w.position.length!==3||w.position.some((v:number,j:number)=>!Number.isFinite(v)||v!==r.position[j]||v!==d.position[j]))throw Error('Position ordinal identity/XYZ mismatch');}
}
export function requireLatestSnapshot(expected:{nodeId:string;objectId:number;position:number[]}[],positions:any[],receiver:any[]):void {
 if(expected.length!==91||new Set(expected.map(v=>v.nodeId)).size!==91||new Set(expected.map(v=>v.objectId)).size!==91)throw Error('Independent91-object denominator absent/duplicate');
 for(const e of expected){const w=positions.filter(v=>v.nodeId===e.nodeId).at(-1),r=receiver.find(v=>v.nodeId===e.nodeId);if(!w||!r||w.objectId!==e.objectId||r.objectId!==e.objectId||e.position.length!==3||e.position.some((v,j)=>!Number.isFinite(v)||Math.abs(v-w.position[j])>1e-12||Math.abs(v-r.position[j])>1e-12))throw Error('Latest full snapshot/sentinel/ID mismatch');}
}
