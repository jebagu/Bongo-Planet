import assert from 'node:assert/strict';
export function summarizeAges(input:readonly number[]){
 assert(input.every(Number.isFinite),'Nonfinite original age');
 if(!input.length)return {count:0,minMs:null,medianMs:null,p95Ms:null,maxMs:null,negativeCount:0,p95Within40ms:false,maxWithin60ms:false};
 const values=[...input].sort((a,b)=>a-b),n=values.length,negativeCount=values.filter(v=>v<0).length;
 const p95Ms=values[Math.ceil(n*.95)-1],maxMs=values[n-1];
 return {count:n,minMs:values[0],medianMs:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,p95Ms,maxMs,negativeCount,p95Within40ms:negativeCount===0&&p95Ms<=40,maxWithin60ms:negativeCount===0&&maxMs<=60};
}
