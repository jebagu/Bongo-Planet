import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {topology} from '../../../../src/core/geometry';
const folder=path.dirname(fileURLToPath(import.meta.url));
const frozen=path.join(folder,'frozen-source');fs.mkdirSync(frozen,{recursive:true});
const hashes:any={};const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
for(const name of ['bridge','NativeClock','RenderClock','ReceiverClock','protocol']){
 const text=fs.readFileSync(`src/output/${name}.ts`);const dest=path.join(frozen,name+'.ts');
 if(fs.existsSync(dest))assert.equal(hash(fs.readFileSync(dest)),hash(text),'Existing frozen source differs');else fs.writeFileSync(dest,text,{flag:'wx'});
 hashes[name]=hash(text);
}
let text=fs.readFileSync(path.join(frozen,'bridge.ts'),'utf8');
function replace(anchor:string,value:string){assert.equal(text.split(anchor).length-1,1,'Nonunique patch anchor');text=text.replace(anchor,value);}
replace("import http from 'node:http';", "import {trace} from './trace';\nimport http from 'node:http';");
text=text.replaceAll("from './", "from './frozen-source/");
text=text.replace("from './frozen-source/trace'", "from './trace'");
replace('applied:sequence=>{for(', 'applied:sequence=>{trace.applied(sequence,clock?.diagnostics);for(');
replace("ws.on('message',data=>{try{const p=packetSchema.parse(JSON.parse(data.toString()));", "ws.on('message',data=>{const diagnosticMessage=trace.beginMessage(Buffer.byteLength(data as Buffer),clock?.diagnostics);try{try{const p=packetSchema.parse(JSON.parse(data.toString()));trace.packet(diagnosticMessage,p);");
replace("record({type:'rejected',reason:String(e)});}});", "record({type:'rejected',reason:String(e)});}}finally{trace.endMessage(diagnosticMessage,clock?.diagnostics);}});");
const anchor='const wss=new WebSocketServer({server,maxPayload:128*1024});';
assert.equal(text.split(anchor).length-1,1);
for(const [mode,option] of [['baseline','true'],['successor','false']] as const){
 const candidate=text.replace(anchor,`const wss=new WebSocketServer({server,maxPayload:128*1024,perMessageDeflate:false,allowSynchronousEvents:${option}});`);
 const dest=path.join(folder,`bridge-${mode}.ts`);assert(!fs.existsSync(dest));fs.writeFileSync(dest,candidate,{flag:'wx'});hashes[mode]=hash(candidate);
}
const session='owned-native-ingress-position-only';
const position=(sequence:number,node:number,vertex:number)=>({version:1,type:'position',session,sequence,nodeId:`ingress-node-${node}`,objectId:node+1,position:topology.vertices[vertex],sent:0});
const initial:any[]=[{version:1,type:'start',session,sequence:1},...Array.from({length:92},(_,i)=>position(i+1,i,i)),{version:1,type:'heartbeat',session}];
const burst:any[]=[];for(let i=0;i<1200;i++){if(i%64===0)burst.push({version:1,type:'heartbeat',session});burst.push(position(i+93,i%92,(i%92+Math.floor(i/92)+1)%92));}
let positionIndex=0;const burstSentOffsetsMs=burst.map(p=>p.type==='position'?Math.floor(positionIndex++/92)*20-260:null);
const fixture={version:1,session,initial,burst,burstSentOffsetsMs,expectedPositions:1292,burstPositions:1200,initialPositions:92,timestampRecipe:'Initial sent0 replaced by initial Node performance seconds epoch; burst original generation offsets -260..0ms in92-position rounds relative to one burst epoch; same recipe in both arms, no timestamp reset/fitted clock/freshness qualification',compression:false};
const fixturePath=path.join(folder,'fixture.json');assert(!fs.existsSync(fixturePath));fs.writeFileSync(fixturePath,JSON.stringify(fixture,null,2)+'\n',{flag:'wx'});hashes.fixture=hash(fs.readFileSync(fixturePath));
fs.writeFileSync(path.join(folder,'candidate-bindings.json'),JSON.stringify({hashes,onlyCandidateOptionDifference:true,nativeSourceUnmodified:true,actualAcquisition:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'source-prepared',hashes,workersStarted:0,socketsStarted:0}));
