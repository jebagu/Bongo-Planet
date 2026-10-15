import fs from 'node:fs';
import {emptyLegacyScene as emptyScene,newPiece,validateScene,type Scene,type Generator} from '../src/core/contracts';
import {topology,angle} from '../src/core/geometry';
fs.mkdirSync('public/fixtures',{recursive:true});fs.mkdirSync('evidence/step-02',{recursive:true});
const scene=(pieces:Scene['pieces'])=>validateScene({...emptyScene(),pieces});
const g=(id:string,vertex:number,period:Generator['period']=4,reach=180)=>({...newPiece('generator',vertex,id),period,reach}) as Generator;
const n=(id:string,vertex:number,degree=0)=>({...newPiece('note',vertex,id),degree});
const ranked=topology.vertices.map((p,v)=>({v,a:angle(topology.vertices[0],p)})).filter(x=>x.v!==0).sort((a,b)=>a.a-b.a||a.v-b.v);
const chord=ranked.filter(x=>Math.abs(x.a-ranked[0].a)<1e-8).slice(0,3);
const phrase=[ranked[0],ranked.find(x=>x.a>0.9)!,ranked.find(x=>x.a>1.3)!];
const fixtures:Record<string,Scene>={
 F00:emptyScene(),
 F01:scene([g('gen',0,4,90),n('near',phrase[0].v,0),n('far',phrase[1].v,2),newPiece('beat',phrase[2].v,'kick')]),
 F02:scene([g('gen',0),...chord.map((p,i)=>n(`chord-${i}`,p.v,i*2))]),
 F03:scene([g('gen',0),...phrase.map((p,i)=>n(`phrase-${i}`,p.v,i*2))]),
 F04:scene([g('gen-3',0,3),g('gen-4',91,4),n('shared-a',1,0),n('shared-b',2,0),newPiece('beat',3,'hat')]),
 F05:scene([g('gen',0,8),n('moving',ranked.at(-1)!.v,3)]),
 F06:scene(topology.vertices.map((_,i)=>i<4?g(`g${i}`,i,1):i<48?{...n(`n${i}`,i,i%7),duration:8}: {...newPiece('beat',i,`b${i}`),decay:4})),
 F08:scene(topology.vertices.map((_,i)=>i<8?g(`g${i}`,i,1):i<50?{...n(`n${i}`,i,i%7),duration:8}: {...newPiece('beat',i,`b${i}`),decay:4})),
 F09:scene(topology.vertices.map((_,i)=>i<8?g(`g${i}`,i,8):{...n(`n${i}`,i,i%7),duration:8})),
};
fixtures.F08.settings.bpm=180;fixtures.F09.settings.bpm=40;
const dirs:[string,[number,number,number]][]=[['right',[1,0,0]],['left',[-1,0,0]],['forward',[0,1,0]],['back',[0,-1,0]],['up',[0,0,1]],['down',[0,0,-1]]];
fixtures.F07=scene(dirs.map(([id,p],i)=>n(id,topology.vertices.map((v,index)=>({index,d:angle(v,p)})).sort((a,b)=>a.d-b.d)[0].index,i)));
let report='# Bongo Planet — fixture coordinates and independent timing reference\n\nBuild: scene-v1 / icosa-3v-v1. Angles measured from geometry. Expected onset delays below calculated directly from the published travel rule, never by importing the engine.\n';
const golden:Record<string,unknown>={};
for(const [id,s] of Object.entries(fixtures)){validateScene(s);fs.writeFileSync(`public/fixtures/${id}.json`,JSON.stringify(s,null,2)+'\n');report+=`\n## ${id}\n\n| Piece | Kind | Vertex | Composition XYZ |\n|---|---|---|---|\n`;for(const p of s.pieces)report+=`|${p.id}|${p.kind}|${p.vertex}|${topology.vertices[p.vertex].map(x=>x.toFixed(6)).join(', ')}|\n`;
 const expect=[];for(const gen of s.pieces)if(gen.kind==='generator')for(const p of s.pieces)if(p.kind!=='generator'){const a=angle(topology.vertices[gen.vertex],topology.vertices[p.vertex]);if(a>gen.reach*Math.PI/180+1e-9)continue;const raw=.75*gen.period*a/Math.PI;const delay=Math.min(Math.floor(raw/.25+.5+1e-10)*.25,gen.period-.25);expect.push({generatorId:gen.id,nodeId:p.id,angle:a,delayBeats:delay,delaySeconds:delay*60/s.settings.bpm});}golden[id]=expect;}
fs.writeFileSync('public/fixtures/expected.json',JSON.stringify(golden,null,2)+'\n');fs.writeFileSync('evidence/step-02/fixture-tables.md',report);
fs.writeFileSync('evidence/step-02/topology.json',JSON.stringify(topology,null,2)+'\n');
const project=(p:number[])=>[160+120*(p[0]+p[1]*.3),160-120*p[2]];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="680" height="360" viewBox="0 0 680 360"><rect width="680" height="360" fill="#101820"/><g fill="#eef" font-family="sans-serif"><text x="20" y="24">Bongo Planet · 3V geometry · 92 vertices / 270 edges / 180 faces</text>';
for(let view=0;view<2;view++){svg+=`<g transform="translate(${view*340} 25)">`;for(const [a,b] of topology.edges){const transform=(v:number[])=>project([v[0]*(view?-1:1),v[1]*(view?-1:1),v[2]]);const x=transform(topology.vertices[a]),y=transform(topology.vertices[b]);svg+=`<path d="M${x}L${y}" stroke="#61748b" stroke-width=".5"/>`;}for(const v of [0,...phrase.map(x=>x.v),...chord.map(x=>x.v)]){const p=topology.vertices[v];const [x,y]=project([p[0]*(view?-1:1),p[1]*(view?-1:1),p[2]]);svg+=`<circle cx="${x}" cy="${y}" r="3" fill="#75e1cc"/><text x="${x+5}" y="${y}" font-size="10">v${v}</text>`;}svg+=`<text x="50" y="315">${view?'Rear':'Front'} · x right / y forward / z up</text></g>`;}
fs.writeFileSync('evidence/step-02/geometry.svg',svg+'</g></svg>');
console.log('Wrote F00–F09 (F07 directions, F08 max workload, F09 overtaking), tables and geometry.');
