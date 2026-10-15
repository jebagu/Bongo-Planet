/** Bongo Planet pure independent oracle controls; no product/receiver imports or launch. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const dir=path.dirname(import.meta.filename),root=process.cwd(),audit=path.join(root,'scripts/receiver-position-invariance-audit-v2.ts'),source=fs.readFileSync(audit,'utf8');
const sha=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex');
assert.equal(sha(source),'bda2e7bc9f47a0064514011833ce0698771094806e0ac9ca86173f626d9b5baf');
const start='  const phi=(1+Math.sqrt(5))/2',end='  const initial=healthy();';
assert.equal(source.split(start).length,2);assert.equal(source.split(end).length,2);
const declarations=source.slice(source.indexOf(start),source.indexOf(end));
const executable=transformSync(declarations+'\nJSON.stringify({phi,small,large,cardinal,expectedVertices})',{loader:'ts',target:'es2023'}).code;
const observed=JSON.parse(vm.runInNewContext(executable,{}, {timeout:1000}));
const golden=JSON.parse(fs.readFileSync(path.join(dir,'Golden-Decimal80.json'),'utf8'));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'public/fixtures/F07.json'),'utf8'));
const axis:Record<string,number[]>={right:[1,0,0],left:[-1,0,0],forward:[0,1,0],back:[0,-1,0],up:[0,0,1],down:[0,0,-1]};
const observations:unknown[]=[];
assert.equal(golden.precisionDigits,80);assert(Math.abs(observed.large-Number(golden.large))<=2*Number.EPSILON);assert(Math.abs(observed.small-Number(golden.small))<=2*Number.EPSILON);
assert.deepEqual(observed.expectedVertices,golden.vertices);assert.equal(Object.keys(observed.cardinal).length,6);assert.equal(fixture.pieces.length,6);
for(const id of Object.keys(axis)){
 const expected:number[]=golden.positions[id].map(Number),actual:number[]=observed.cardinal[id];assert.equal(actual.length,3);
 const error=Math.hypot(...actual.map((value:number,index:number)=>value-expected[index]));assert(error<=2*Number.EPSILON,'JS edge reference differs from independent Decimal80: '+id);
 const literalAxisDistance=Math.hypot(...axis[id].map((value:number,index:number)=>value-expected[index]));assert(literalAxisDistance>1e-6,'Exact axis must be rejected by nearest-axis oracle: '+id);assert(Math.abs(Math.hypot(...actual)-1)<=2*Number.EPSILON);
 assert.equal(fixture.pieces.find((piece:any)=>piece.id===id)?.vertex,golden.vertices[id],'Fixed F07 fixture vertex identity: '+id);
 observations.push({id,expectedVertex:golden.vertices[id],Decimal80Reference:golden.positions[id],evaluatedAuditReference:actual,error,literalAxisDistance,nearAxisAccepted:error<=1e-6,exactAxisRejected:literalAxisDistance>1e-6});
}
const report={status:'passed-pure-oracle-controls',actualChildBrowserReceiverSampleRuns:0,sourceSha256:sha(source),controlSha256:sha(fs.readFileSync(import.meta.filename)),goldenSha256:sha(fs.readFileSync(path.join(dir,'Golden-Decimal80.json'))),fixtureSha256:sha(fs.readFileSync(path.join(root,'public/fixtures/F07.json'))),observations,scope:'Independent source arithmetic and fixed fixture identity only; no actual position/freshness or exact-axis protocol qualification'};
fs.writeFileSync(path.join(dir,'Golden-Control-Results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,directions:observations.length,actualRuns:0}));
