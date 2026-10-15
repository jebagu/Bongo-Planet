/** Explicitly invoked production UI/model audit; no human or physical-input claim. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium,type Browser,type BrowserServer,type Page,type CDPSession} from '@playwright/test';
import {topology} from '../src/core/geometry';
import type {Scene,Piece,Vec3} from '../src/core/contracts';

const url='http://127.0.0.1:5417/BongoPlanet/';
const expectedMain='d8040f401399d61fddde16e1fcd744f1d85208073bf1dd64f2059bcdcaed2245';
const expectedProcessor='0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793';
const out=path.resolve('evidence/step-04/view-model-invariance/attempt-01');
type Slot={vertex:number;x:number;y:number;visible:boolean};
type Snapshot={scene:Scene;slots:Slot[];view:{camera:number[];selected:string|null;dragging:string|null};audioState:string;running:boolean;output:{connected:boolean};connections:number[][]};
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const save=(name:string,value:unknown)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const render=([x,y,z]:Vec3,radius=1):Vec3=>[x*radius,z*radius,-y*radius];
const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));
// Independent oracle: use topology coordinates, dot/acos and declared reach;
// do not import production angle, movePiece, view picking or engine scheduling.
function relationships(scene:Scene){
 const pairs:{generatorId:string;nodeId:string;from:Vec3;to:Vec3;angle:number}[]=[];
 for(const g of scene.pieces)if(g.kind==='generator'&&g.enabled)for(const p of scene.pieces)if(p.kind!=='generator'){
  const a=topology.vertices[g.vertex],b=topology.vertices[p.vertex],theta=Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
  if(theta<=g.reach*Math.PI/180+1e-9)pairs.push({generatorId:g.id,nodeId:p.id,from:render(a),to:render(b),angle:theta});
 }
 return pairs;
}
function validate(s:Snapshot){
 assert.equal(s.slots.length,92);assert.equal(new Set(s.slots.map(p=>p.vertex)).size,92);
 assert.equal(new Set(s.scene.pieces.map(p=>p.id)).size,s.scene.pieces.length);
 assert.equal(new Set(s.scene.pieces.map(p=>p.vertex)).size,s.scene.pieces.length);
 for(const p of s.scene.pieces)assert(Number.isInteger(p.vertex)&&p.vertex>=0&&p.vertex<92);
 assert.equal(s.running,false,'Audit must remain paused');assert.equal(s.output.connected,false,'Audit must not connect the bridge');
 const oracle=relationships(s.scene),matched=new Set<string>();assert.equal(s.connections.length,oracle.length);
 for(const values of s.connections){
  assert.equal(values.length,49*3);assert(values.every(Number.isFinite));
  const match=oracle.filter(p=>distance(values.slice(0,3),p.from)<=1e-5&&distance(values.slice(-3),p.to)<=1e-5);
  assert.equal(match.length,1,'Each actual rendered connection must match one independent generator/target pair');
  const key=match[0].generatorId+':'+match[0].nodeId;assert(!matched.has(key));matched.add(key);
 }
 return oracle;
}
async function snapshot(page:Page):Promise<Snapshot>{return page.evaluate(()=>{
 const b=(window as any).__bongo,v=b.view;
 return{scene:b.scene,slots:b.slots,view:v.getDiagnostics(),audioState:b.audio.state,running:b.status?.running??false,output:b.output,
  connections:v.connections.children.map((line:any)=>Array.from(line.geometry.attributes.position.array))};
});}
function facing(s:Snapshot,vertex:number){const p=render(topology.vertices[vertex],1.01);return dot(p,s.view.camera)-dot(p,p);}
function sceneMoved(before:Scene,id:string,vertex:number){const next=structuredClone(before);const p=next.pieces.find(p=>p.id===id);assert(p);p.vertex=vertex;return next;}
function defaultPiece(kind:Piece['kind'],vertex:number,id:string):Piece{
 if(kind==='generator')return{id,vertex,kind,period:4,phase:0,reach:90,enabled:true};
 if(kind==='note')return{id,vertex,kind,degree:0,octave:4,timbre:'sine',duration:.6,level:.65};
 return{id,vertex,kind,sound:'kick',decay:.25,level:.7};
}
async function target(page:Page,occupied=false,away?:Slot):Promise<Slot>{
 const s=await snapshot(page),box=await page.locator('canvas').boundingBox();assert(box);
 const choices=s.slots.filter(p=>p.visible&&facing(s,p.vertex)>.25&&p.x>box.x+55&&p.x<box.x+box.width-55&&p.y>box.y+55&&p.y<box.y+box.height-55
  &&s.scene.pieces.some(q=>q.vertex===p.vertex)===occupied&&(!away||Math.hypot(p.x-away.x,p.y-away.y)>90));
 // Verify the supplied UI coordinates resolve uniquely among foreground slots.
 const selected=choices.find(p=>s.slots.filter(q=>q.visible&&q.vertex!==p.vertex).every(q=>Math.hypot(q.x-p.x,q.y-p.y)>14));
 assert(selected,'No unambiguous legal foreground target in this camera state');return selected;
}
async function drag(page:Page,from:{x:number;y:number},to:{x:number;y:number},via?:{x:number;y:number}){
 await page.mouse.move(from.x,from.y);await page.mouse.down();
 if(via)await page.mouse.move(via.x,via.y,{steps:6});
 await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();await page.waitForTimeout(220);
}
async function settledCamera(page:Page){let prior=(await snapshot(page)).view.camera,stable=0;const end=performance.now()+3500;while(performance.now()<end){await page.waitForTimeout(50);const next=(await snapshot(page)).view.camera;stable=distance(prior,next)<1e-6?stable+1:0;if(stable>=2)return;prior=next;}throw Error('Actual camera damping did not settle within3.5s');}
async function touch(cdp:CDPSession,type:'touchStart'|'touchMove'|'touchEnd',points:{x:number;y:number;id:number}[]){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(({x,y,id})=>({x,y,id}))});}

async function main(){
 assert(process.argv.includes('--run'),'Source prepared only; pass --run only after explicit root GO');
 assert(!fs.existsSync(out),'Refusing to overwrite an attempt');fs.mkdirSync(out,{recursive:true});
 const report:any={title:'Bongo Planet production view/model invariance audit',startedUtc:new Date().toISOString(),status:'preparing',cases:[],errors:[],cleanup:{},limits:['Installed Chrome automated native mouse/CDP touch only; no human/physical-touch/Safari claim.','Paused/muted browser; no audio/output/scheduler timing qualification.','Case evidence is scoped, not a blanket acceptance-ledger pass.']};
 function writeReport(){assert(report.cases.length<=24);const text=JSON.stringify(report,null,2)+'\n';assert(Buffer.byteLength(text)<=8*1024*1024,'Bounded report size exceeded');fs.writeFileSync(path.join(out,'report.json'),text);}
 fs.copyFileSync(import.meta.filename,path.join(out,'audit-source.ts'));report.harnessSha256=sha(fs.readFileSync(import.meta.filename));
 report.topology={vertices:topology.vertices,sha256:sha(fs.readFileSync('src/core/geometry.ts'))};assert.equal(topology.vertices.length,92);
 let server:BrowserServer|undefined,browser:Browser|undefined,closing=false,watchdog:ReturnType<typeof setTimeout>|undefined;
 const began=performance.now(),deadline=began+110000;
 async function bounded<T>(work:Promise<T>,ms=5000):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Audit operation deadline')),Math.max(1,Math.min(ms,deadline-performance.now())));})]);}finally{clearTimeout(timer);}}
 async function bytes(u:string){const response=await fetch(u,{signal:AbortSignal.timeout(3000)});assert(response.ok);return Buffer.from(await response.arrayBuffer());}
 async function attest(label:string){const html=await bytes(url),main=html.toString().match(/<script[^>]*src="([^"]+)"/)?.[1];assert(main?.startsWith('/BongoPlanet/assets/'));const bundle=await bytes(new URL(main!,url).href);const processor=bundle.toString().match(/assets\/processor-[A-Za-z0-9_-]+\.js/)?.[0];assert(processor);assert.equal(sha(bundle),expectedMain);assert.equal(sha(await bytes(url+processor)),expectedProcessor);fs.writeFileSync(path.join(out,`served-${label}.html`),html,{flag:'wx'});return{main,mainSha256:sha(bundle),processorSha256:expectedProcessor};}
 async function record(name:string,atoms:string[],before:Snapshot,after:Snapshot,details:unknown={}){const oracle=validate(after);report.cases.push({name,atoms,passed:true,before,after,expectedRelationships:oracle,details});writeReport();}
 try{
  report.servedBefore=await attest('before');const fixture=await bytes(url+'fixtures/F07.json');assert.deepEqual(JSON.parse(fixture.toString()),JSON.parse(fs.readFileSync('public/fixtures/F07.json','utf8')));fs.writeFileSync(path.join(out,'F07.json'),fixture,{flag:'wx'});report.fixtureSha256=sha(fixture);
  const launch=chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,timeout:7000,args:['--enable-unsafe-swiftshader','--mute-audio']}).then(owned=>{if(closing){report.cleanup.lateLaunch=true;owned.process().kill('SIGTERM');void owned.close().catch(()=>{});}return owned;});
  server=await bounded(launch,8000);report.ownedBrowserPid=server.process().pid;watchdog=setTimeout(()=>{report.cleanup.watchdog=true;server?.process().kill('SIGTERM');},120000-(performance.now()-began));browser=await bounded(chromium.connect(server.wsEndpoint()));report.browserVersion=browser.version();
  const context=await bounded(browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}));context.setDefaultTimeout(3500);const page=await bounded(context.newPage());page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(()=>{(window as any).__name=(fn:unknown)=>fn;(window as any).__pointerAudit=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(type,event=>{const e=event as PointerEvent,a=(window as any).__pointerAudit;if(a.length>=2048){(window as any).__pointerAuditTruncated=true;return;}a.push({type,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,isTrusted:e.isTrusted,x:e.clientX,y:e.clientY,target:(e.target as HTMLElement)?.tagName});},true);});
  await bounded(page.goto(url),7000);await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);await page.locator('#fixture').selectOption('F07');await page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===6);const initial=await snapshot(page);assert.deepEqual(initial.scene,JSON.parse(fixture.toString()));validate(initial);await page.screenshot({path:path.join(out,'initial.png')});
  for(const kind of ['generator','note','beat'] as const){
   const to=await target(page),before=await snapshot(page),box=await page.locator(`[data-kind="${kind}"]`).boundingBox();assert(box);
   await drag(page,{x:box.x+box.width/2,y:box.y+box.height/2},to);const after=await snapshot(page),added=after.scene.pieces.filter(p=>!before.scene.pieces.some(q=>q.id===p.id));assert.equal(added.length,1);assert.equal(added[0].kind,kind);assert.equal(added[0].vertex,to.vertex);assert.deepEqual(after.scene,{...before.scene,pieces:[...before.scene.pieces,defaultPiece(kind,to.vertex,added[0].id)]});assert(distance(before.view.camera,after.view.camera)<1e-8);await record(`Palette ${kind} legal drop`,['S04-A1'],before,after,{destination:to,independentDefault:defaultPiece(kind,to.vertex,added[0].id)});
  }
  const from=await target(page,true),selected=(await snapshot(page)).scene.pieces.find(p=>p.vertex===from.vertex)!;const to=await target(page,false,from),canvas=await page.locator('canvas').boundingBox();assert(canvas);const beforeMove=await snapshot(page);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(canvas.x-30,canvas.y+canvas.height*.6,{steps:8});const outsideState=await snapshot(page);assert.equal(outsideState.view.dragging,selected.id);assert.deepEqual(outsideState.scene,beforeMove.scene);assert(distance(outsideState.view.camera,beforeMove.view.camera)<1e-8);await page.mouse.move(to.x,to.y,{steps:8});const held=await snapshot(page);assert.equal(held.view.dragging,selected.id);assert.deepEqual(held.scene,beforeMove.scene);await page.mouse.up();await page.waitForTimeout(220);const moved=await snapshot(page);assert.deepEqual(moved.scene,sceneMoved(beforeMove.scene,selected.id,to.vertex));assert(distance(moved.view.camera,beforeMove.view.camera)<1e-8);await record('Captured relocation through outside canvas', ['S04-A2','S04-A13'],beforeMove,moved,{outsideState,held,destination:to});
  for(const invalid of ['occupied','outside'] as const){
   const occupied=await target(page,true,to),destination=invalid==='occupied'?occupied:{x:canvas.x-30,y:canvas.y+canvas.height*.6};const before=await snapshot(page);await drag(page,to,destination);const after=await snapshot(page);assert.deepEqual(after.scene,before.scene);assert.equal(after.view.dragging,null);assert.match((await page.locator('#notice').innerText()),invalid==='occupied'?/occupied/i:/visible slot/i);await record(`Relocation ${invalid} rejected`,[invalid==='occupied'?'S04-A3':'S04-A4'],before,after,{destination});
   for(const kind of ['generator','note','beat'] as const){const prior=await snapshot(page),box=await page.locator(`[data-kind="${kind}"]`).boundingBox();assert(box);await drag(page,{x:box.x+box.width/2,y:box.y+box.height/2},destination);const next=await snapshot(page);assert.deepEqual(next.scene,prior.scene);assert.equal(next.view.dragging,null);await record(`Palette ${kind} ${invalid} rejected`,[invalid==='occupied'?'S04-A3':'S04-A4'],prior,next,{destination});}
  }
  await page.locator('#deselect').click();const clickFrom=await target(page,true),clickPiece=(await snapshot(page)).scene.pieces.find(p=>p.vertex===clickFrom.vertex)!;await page.mouse.click(clickFrom.x,clickFrom.y);const clicked=await snapshot(page);assert.equal(clicked.view.selected,clickPiece.id);const clickTo=await target(page,false,clickFrom);await page.mouse.click(clickTo.x,clickTo.y);await page.waitForTimeout(220);const clickAfter=await snapshot(page);assert.deepEqual(clickAfter.scene,sceneMoved(clicked.scene,clickPiece.id,clickTo.vertex));await record('Select piece then select slot without drag',['S04-A19','S04-A2'],clicked,clickAfter,{destination:clickTo});
  const cdp=await context.newCDPSession(page);const touchFrom=await target(page,true),touchPiece=(await snapshot(page)).scene.pieces.find(p=>p.vertex===touchFrom.vertex)!;const touchTo=await target(page,false,touchFrom),beforeTouch=await snapshot(page),pointerStart=await page.evaluate(()=>(window as any).__pointerAudit.length);
  await touch(cdp,'touchStart',[{...touchFrom,id:101}]);assert.equal((await snapshot(page)).view.dragging,touchPiece.id);await touch(cdp,'touchMove',[{...touchTo,id:101}]);assert.deepEqual((await snapshot(page)).scene,beforeTouch.scene);await touch(cdp,'touchEnd',[]);await page.waitForTimeout(220);const afterTouch=await snapshot(page);assert.deepEqual(afterTouch.scene,sceneMoved(beforeTouch.scene,touchPiece.id,touchTo.vertex));assert(distance(afterTouch.view.camera,beforeTouch.view.camera)<1e-8);const trustedTouch=await page.evaluate(start=>(window as any).__pointerAudit.slice(start),pointerStart);assert(trustedTouch.some((e:any)=>e.type==='pointerdown'&&e.pointerType==='touch'&&e.isTrusted));assert(trustedTouch.every((e:any)=>e.isTrusted));await record('Trusted browser touch owns node drag',['S04-A16','S04-A2'],beforeTouch,afterTouch,{trustedTouch,destination:touchTo});
  const competeFrom=touchTo,competeTo=await target(page,false,competeFrom),beforeCompete=await snapshot(page);await touch(cdp,'touchStart',[{...competeFrom,id:201}]);assert.equal((await snapshot(page)).view.dragging,touchPiece.id);await touch(cdp,'touchStart',[{...competeFrom,id:201},{...competeTo,id:202}]);const competition=await snapshot(page);assert.equal(competition.view.dragging,null);await touch(cdp,'touchMove',[{...competeTo,id:201},{...competeFrom,id:202}]);await touch(cdp,'touchEnd',[]);const afterCompete=await snapshot(page);assert.deepEqual(afterCompete.scene,beforeCompete.scene);await record('Competing trusted touch cancels without transfer',['S04-A17'],beforeCompete,afterCompete,{competition});
  await page.locator('#deselect').click();const cameraBefore=await snapshot(page),cameraStart={x:canvas.x+10,y:canvas.y+canvas.height*.5},cameraEnd={x:canvas.x+canvas.width*.7,y:canvas.y+canvas.height*.65};assert(cameraBefore.slots.filter(s=>s.visible).every(s=>Math.hypot(s.x-cameraStart.x,s.y-cameraStart.y)>40));await touch(cdp,'touchStart',[{...cameraStart,id:301}]);assert.equal((await snapshot(page)).view.dragging,null);await touch(cdp,'touchMove',[{...cameraEnd,id:301}]);await touch(cdp,'touchEnd',[]);await settledCamera(page);const cameraAfter=await snapshot(page);assert.deepEqual(cameraAfter.scene,cameraBefore.scene);assert(distance(cameraAfter.view.camera,cameraBefore.view.camera)>.02);await record('Trusted touch on empty canvas owns camera',['S04-A16'],cameraBefore,cameraAfter,{cameraStart,cameraEnd});
  const rearBefore=await snapshot(page);const hidden=rearBefore.slots.filter(s=>facing(rearBefore,s.vertex)<-.1&&s.x>canvas.x+10&&s.x<canvas.x+canvas.width-10&&s.y>canvas.y+10&&s.y<canvas.y+canvas.height-10);assert(hidden.length>=20,'Require multiple independent rear candidates');const attempts:any[]=[];
  for(const rear of hidden){const prior=await snapshot(page);await page.locator('[data-kind="note"]').click();await page.mouse.click(rear.x,rear.y);const next=await snapshot(page),added=next.scene.pieces.filter(p=>!prior.scene.pieces.some(q=>p.id===q.id));assert(added.length<=1);if(added.length){const p=added[0];assert(facing(prior,p.vertex)>0,'Hidden hemisphere cannot receive placement');assert.notEqual(p.vertex,rear.vertex);assert.deepEqual(next.scene,{...prior.scene,pieces:[...prior.scene.pieces,defaultPiece('note',p.vertex,p.id)]});}else assert.deepEqual(next.scene,prior.scene);validate(next);attempts.push({rear,priorScene:prior.scene,afterScene:next.scene,added});}
  await record('Hidden hemisphere attempted picks never commit rear vertex',['S04-A18'],rearBefore,await snapshot(page),{attempts});
  await page.locator('#deselect').click();let revealed:Slot|undefined;const orbitRows:any[]=[];
  for(let i=0;i<4&&!revealed;i++){const prior=await snapshot(page);await drag(page,cameraStart,{x:canvas.x+canvas.width*.65,y:canvas.y+canvas.height*.55});await settledCamera(page);const next=await snapshot(page);assert.deepEqual(next.scene,prior.scene);assert(distance(next.view.camera,prior.view.camera)>.02);orbitRows.push({before:prior.view,after:next.view});revealed=next.slots.find(s=>s.visible&&facing(next,s.vertex)>.25&&facing(rearBefore,s.vertex)<-.1&&!next.scene.pieces.some(p=>p.vertex===s.vertex));}
  assert(revealed,'No initial rear vertex exposed by bounded actual camera gestures');await page.locator('[data-kind="beat"]').click();const rearPlaceBefore=await snapshot(page);await page.mouse.click(revealed.x,revealed.y);await page.waitForTimeout(200);const rearPlaced=await snapshot(page),rearAdded=rearPlaced.scene.pieces.filter(p=>!rearPlaceBefore.scene.pieces.some(q=>p.id===q.id));assert.equal(rearAdded.length,1);assert.deepEqual(rearPlaced.scene,{...rearPlaceBefore.scene,pieces:[...rearPlaceBefore.scene.pieces,defaultPiece('beat',revealed.vertex,rearAdded[0].id)]});await record('Previously hidden vertex accepts placement after real orbit',['S04-A18','S04-A1'],rearPlaceBefore,rearPlaced,{orbitRows,originalRearFacing:facing(rearBefore,revealed.vertex),destination:revealed});
  report.pointerTrace=await page.evaluate(()=>({rows:(window as any).__pointerAudit,truncated:!!(window as any).__pointerAuditTruncated}));assert.equal(report.pointerTrace.truncated,false);report.final=await snapshot(page);validate(report.final);assert(await page.evaluate(()=>(window as any).__bongo.events.every((e:any)=>!['emission','trigger','onset'].includes(e.type))),'No musical work may run in this paused audit');assert.deepEqual(report.errors,[]);await page.screenshot({path:path.join(out,'final.png')});await bounded(context.close());report.status='passed-scoped-automated-checks';
 }catch(error){report.errors.push(String(error));report.status='failed-or-incomplete';process.exitCode=1;}
 finally{
  closing=true;try{await bounded(browser?.close()??Promise.resolve());await bounded(server?.close()??Promise.resolve());report.cleanup.browserClosed=true;}catch(error){server?.process().kill('SIGTERM');report.cleanup.browserClosed=false;report.errors.push('Cleanup: '+String(error));process.exitCode=1;}
  if(server){const until=performance.now()+1500;while(server.process().exitCode===null&&server.process().signalCode===null&&performance.now()<until)await new Promise(r=>setTimeout(r,20));report.cleanup.browserProcessClosed=server.process().exitCode!==null||server.process().signalCode!==null;if(!report.cleanup.browserProcessClosed){server.process().kill('SIGKILL');report.errors.push('Owned browser exit unconfirmed; kill sent');process.exitCode=1;}}
  clearTimeout(watchdog);if(report.cleanup.watchdog)report.errors.push('Browser hard deadline triggered');try{report.servedAfter=await attest('after');}catch(error){report.errors.push('Final served binding: '+String(error));process.exitCode=1;}if(report.errors.length)report.status='failed-or-incomplete';report.finishedUtc=new Date().toISOString();report.elapsedMonotonicSeconds=(performance.now()-began)/1000;try{writeReport();}catch(error){report.status='failed-or-incomplete';report.errors.push('Report retention: '+String(error));process.exitCode=1;}save('completion.json',{status:report.status,errors:report.errors,cleanup:report.cleanup});console.log(JSON.stringify({status:report.status,errors:report.errors,cleanup:report.cleanup,output:out}));
 }
}
void main();
