/** Pure operational clock comparisons; no browser/native/product import or runtime. */
export type ClockSample = [index:number,p0Ms:number,a0Seconds:number,stampContext:number|null,stampPerformanceMs:number|null,a1Seconds:number,p1Ms:number,sampleRate:number,state:string];
export type Passage = {lowerMs:number;upperMs:number;beforeIndex:number;afterIndex:number;gapMs:number;kind:'straddle'|'crossing'};
export function validateSamples(rows:ClockSample[]):void {
 if(!rows.length)throw Error('Missing independent samples');
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(r[0]!==i||![r[1],r[2],r[5],r[6],r[7]].every(Number.isFinite)||r[1]>r[6]||r[2]>r[5]||r[7]<=0||r[8]!=='running')throw Error('Invalid independent sample');
  if(i&&((rows[i-1][6]>r[1])||(rows[i-1][5]>r[2])||rows[i-1][7]!==r[7]))throw Error('Regressed sample clock/order/rate');
 }
}
export function passage(rows:ClockSample[],target:number):Passage|null {
 if(!Number.isFinite(target))throw Error('Invalid immutable target');
 // Called only after validateSamples; deliberately no interpolation across a quantum.
 let lo=-1;
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(r[2]<target&&r[5]>=target)return{lowerMs:r[1],upperMs:r[6],beforeIndex:i,afterIndex:i,gapMs:r[6]-r[1],kind:'straddle'};
  if(r[5]<target)lo=i;
  if(r[2]>=target)return lo<0?null:{lowerMs:rows[lo][1],upperMs:r[6],beforeIndex:lo,afterIndex:i,gapMs:r[1]-rows[lo][6],kind:'crossing'};
 }
 return null;
}
export function handshake(samples:{t0:number;t1:number;server:number;offset:number;uncertaintyMs:number}[]):{offset:number;uncertaintyMs:number} {
 if(samples.length!==8)throw Error('Eight original sync samples required');let best:typeof samples[number]|undefined;
 for(const s of samples){if(![s.t0,s.t1,s.server,s.offset,s.uncertaintyMs].every(Number.isFinite)||s.t1<s.t0||Math.abs(s.offset-(s.server-(s.t0+s.t1)/2))>1e-9||Math.abs(s.uncertaintyMs-((s.t1-s.t0)*500+1))>1e-6)throw Error('Original sync reconstruction mismatch');if(!best||s.uncertaintyMs<best.uncertaintyMs)best=s;}
 return{offset:best!.offset,uncertaintyMs:best!.uncertaintyMs};
}
export function reconstructOffset(deadlineSeconds:number,targetSeconds:number,offsetSeconds:number,callback:{p0Ms:number;a0Seconds:number;a1Seconds:number;p1Ms:number}):number {
 const values=[deadlineSeconds,targetSeconds,offsetSeconds,callback.p0Ms,callback.a0Seconds,callback.a1Seconds,callback.p1Ms];if(!values.every(Number.isFinite)||callback.p0Ms>callback.p1Ms||callback.a0Seconds>callback.a1Seconds)throw Error('Invalid callback/wire clocks');
 const implied=deadlineSeconds-targetSeconds-offsetSeconds;
 // Pure algebra consistency tolerance is 1ns in seconds; this is not clock accuracy.
 if(implied<callback.p0Ms/1000-callback.a1Seconds-1e-9||implied>callback.p1Ms/1000-callback.a0Seconds+1e-9)throw Error('Wire offset outside original callback bracket');return implied;
}
export function comparePassage(predictedMs:number,p:Passage|null,producerU:number,nativeU:number,coarseningU:number|null,effectiveRelationU:number|null):{observedIntervalMs:[number,number]|null;conditionalIntervalMs:[number,number]|null;qualified:boolean;unresolved:string[]} {
 if(![predictedMs,producerU,nativeU].every(Number.isFinite)||producerU<0||nativeU<0)throw Error('Invalid measured clock uncertainty');
 const unresolved:string[]=[];if(!p)unresolved.push('missing crossing bracket');if(coarseningU===null)unresolved.push('unbounded getter/timestamp coarsening');if(effectiveRelationU===null)unresolved.push('unbounded public/effective render relation');
 for(const u of [coarseningU,effectiveRelationU])if(u!==null&&(!Number.isFinite(u)||u<0))throw Error('Invalid additional uncertainty');
 const measured=producerU+nativeU;const observedIntervalMs:[number,number]|null=p?[predictedMs-p.upperMs-measured,predictedMs-p.lowerMs+measured]:null;
 const extra=(coarseningU??0)+(effectiveRelationU??0),conditionalIntervalMs:[number,number]|null=p?[predictedMs-p.upperMs-measured-extra,predictedMs-p.lowerMs+measured+extra]:null;
 return{observedIntervalMs,conditionalIntervalMs,qualified:unresolved.length===0&&!!conditionalIntervalMs&&conditionalIntervalMs[0]>=-10&&conditionalIntervalMs[1]<=10,unresolved};
}
export function requireWholeDenominator(expected:{id:string;onset:number}[],events:{id:string;onset:number}[],outcomes:{id:string;type:string}[]):void {
 if(!expected.length||new Set(expected.map(r=>r.id)).size!==expected.length||new Set(events.map(r=>r.id)).size!==events.length)throw Error('Empty/duplicate original denominator');
 if(events.length!==expected.length||expected.some((r,i)=>events[i]?.id!==r.id||Math.abs(events[i]?.onset-r.onset)>1e-7))throw Error('Original immutable schedule mismatch');
 if(outcomes.length!==expected.length||new Set(outcomes.map(r=>r.id)).size!==outcomes.length||expected.some(r=>outcomes.filter(o=>o.id===r.id&&o.type==='onset').length!==1))throw Error('Missing/duplicate/non-onset native outcome');
}
