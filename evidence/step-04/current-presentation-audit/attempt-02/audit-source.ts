/** Actual frozen production UI and scheduled-event acceptance; no physical/live-PCM claim. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium, type Page, type BrowserServer, type Browser} from '@playwright/test';

const root=path.resolve('evidence/step-04/current-presentation-audit/attempt-02');
if(fs.existsSync(root))throw Error('Refusing existing evidence');fs.mkdirSync(root,{recursive:true});
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const save=(name:string,x:unknown)=>fs.writeFileSync(path.join(root,name),JSON.stringify(x,null,2)+'\n');
const url='http://127.0.0.1:5417/BongoPlanet/';
const expectedMain='3c46243737f6946ff5f3f489ad1b3313bd38f83cf59d249e96c781681ff72207';
const expectedProcessor='0f0b12c981f6d2aedbbde847bb31d55bc9010a6093f2ea93232f6fe3804a6793';
const report:any={title:'Bongo Planet actual presentation acceptance',startedAt:new Date().toISOString(),status:'preparing',scheduledEventsOnly:true,liveQualificationPassed:false,checks:{},musicalArms:[],errors:[],cleanup:{},limits:['Installed Chrome numerical/automated UI only; no Safari or human/physical-touch acceptance.','Onset events are audio-thread scheduled receipts, not actual PCM timing.','Pointer cancellation controls are synthetic touch events; wheel and mouse interactions use browser input.']};
let server:BrowserServer|undefined,browser:Browser|undefined,closing=false;const begin=performance.now();
let watchdog:ReturnType<typeof setTimeout>|undefined;
const deadline=begin+85000;
async function bounded<T>(p:Promise<T>,ms=4000):Promise<T>{let t:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([p,new Promise<never>((_,reject)=>{t=setTimeout(()=>reject(Error('Operation deadline')),Math.max(1,Math.min(ms,deadline-performance.now())));})]);}finally{clearTimeout(t);}}
async function bytes(u:string){const r=await fetch(u,{signal:AbortSignal.timeout(3000)});assert(r.ok);return Buffer.from(await r.arrayBuffer());}
async function attest(label:string){const html=await bytes(url);const main=html.toString().match(/<script[^>]*src="([^"]+)"/)?.[1];assert(main?.startsWith('/BongoPlanet/assets/'));const mainBytes=await bytes(new URL(main!,url).href);const processor=mainBytes.toString().match(/assets\/processor-[A-Za-z0-9_-]+\.js/)?.[0];assert(processor);assert.equal(sha(mainBytes),expectedMain);assert.equal(sha(await bytes(url+processor)),expectedProcessor);fs.writeFileSync(path.join(root,'served-'+label+'.html'),html);return{main,mainSha256:sha(mainBytes),processor,processorSha256:expectedProcessor};}
const scene=(page:Page)=>page.evaluate(()=>(window as any).__bongo.scene);
const state=(page:Page)=>page.evaluate(()=>{const b=(window as any).__bongo;return{scene:b.scene,status:b.status,audioState:b.audio.state,contextState:b.audio.context?.state,view:b.view.getDiagnostics(),events:structuredClone(b.events),output:b.output};});
async function open(){const context=await bounded(browser!.newContext({viewport:{width:1440,height:1000}}));context.setDefaultTimeout(4000);const page=await bounded(context.newPage());await page.addInitScript('globalThis.__name=fn=>fn;');page.on('pageerror',e=>report.errors.push(String(e)));await bounded(page.goto(url),7000);await bounded(page.waitForFunction(()=>!!(window as any).__bongo?.slots?.length),4000);return{context,page};}
try{
 fs.copyFileSync(import.meta.filename,path.join(root,'audit-source.ts'));report.harnessSha256=sha(fs.readFileSync(import.meta.filename));report.servedBefore=await attest('before');
 for(const name of ['F02']){const b=await bytes(url+'fixtures/'+name+'.json');assert.deepEqual(JSON.parse(b.toString()),JSON.parse(fs.readFileSync('public/fixtures/'+name+'.json','utf8')));fs.writeFileSync(path.join(root,name+'.json'),b);report[name+'Sha256']=sha(b);}
 const launch=chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,timeout:7000,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}).then(owned=>{if(closing){report.cleanup.lateLaunch=true;owned.process().kill('SIGTERM');void owned.close().catch(()=>{});}return owned;});
 server=await bounded(launch,8000);report.ownedBrowserPid=server.process().pid;
 watchdog=setTimeout(()=>{report.cleanup.watchdogTriggered=true;server?.process().kill('SIGTERM');},Math.max(1,90000-(performance.now()-begin)));browser=await bounded(chromium.connect(server.wsEndpoint()));report.browser=browser.version();
 const {context,page}=await open();await page.locator('#fixture').selectOption('F02');await bounded(page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===4));
 const populated=await state(page),fixture=JSON.parse(fs.readFileSync(path.join(root,'F02.json'),'utf8'));assert.deepEqual(populated.scene,fixture);assert.equal(populated.scene.pieces.filter((p:any)=>p.kind==='generator').length,1);assert.equal(populated.scene.pieces.filter((p:any)=>p.kind!=='generator').length,3);
 const box=await page.locator('canvas').boundingBox();assert(box&&box.width>100&&box.height>100);const gestures:any[]=[];
 // Establish a selectable front note through bounded real camera input. Every gesture
 // preserves the entire populated fixture, including IDs, vertices and relationships.
 let pick:any=null;
 for(let i=0;i<6;i++){
  const prior=await state(page);const sx:number=box.x+10,sy:number=box.y+box.height*.5;
  const nearest:number=await page.evaluate(({x,y})=>Math.min(...(window as any).__bongo.slots.filter((s:any)=>s.visible).map((s:any)=>Math.hypot(s.x-x,s.y-y))),{x:sx,y:sy});assert(nearest>40,'Camera gesture must begin on empty canvas');
  await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(box.x+box.width*(i%2?.6:.4),box.y+box.height*(i%3===0?.65:.4),{steps:20});await page.mouse.up();await page.waitForTimeout(350);
  const after=await state(page);assert.deepEqual(after.scene,fixture);assert(Math.hypot(...after.view.camera.map((v:number,j:number)=>v-prior.view.camera[j]))>.01,'Camera gesture must actually orbit');gestures.push({before:prior,after});
  pick=await page.evaluate(()=>{const b=(window as any).__bongo,rect=document.querySelector('canvas')!.getBoundingClientRect();const p=b.scene.pieces.find((p:any)=>p.kind!=='generator'&&b.slots[p.vertex].visible&&b.slots[p.vertex].y>rect.top+50&&b.slots[p.vertex].y<rect.bottom-50&&b.slots[p.vertex].x>rect.left+50&&b.slots[p.vertex].x<rect.right-50);return p?{id:p.id,slot:b.slots[p.vertex]}:null;});if(pick)break;
 }
 report.checks.orbit={passed:true,populated,gestures,atoms:['S04-A7','S04-A8','S04-A9']};save('report.json',report);assert(pick,'No selectable note after six bounded camera gestures');
 await page.mouse.click(pick.slot.x,pick.slot.y);const before=await state(page);assert.equal(before.view.selected,pick.id);assert.deepEqual(before.scene,JSON.parse(fs.readFileSync(path.join(root,'F02.json'),'utf8')));
 await page.mouse.move(pick.slot.x,pick.slot.y);await page.mouse.wheel(0,700);await page.waitForTimeout(600);const zoom=await state(page);
 assert(Math.abs(Math.hypot(...zoom.view.camera)-Math.hypot(...before.view.camera))>.05);assert.deepEqual(zoom.scene,before.scene);report.checks.zoom={passed:true,before,after:zoom,atoms:['S04-A10','S04-A11','S04-A12']};
 await page.setViewportSize({width:1180,height:800});await page.waitForTimeout(300);const resized=await state(page);assert.equal(resized.view.selected,pick.id);assert.deepEqual(resized.scene,before.scene);report.checks.resize={passed:true,before:zoom,after:resized,atoms:['S04-A14','S04-A15']};
 const slots=await page.evaluate(()=>(window as any).__bongo.slots);const from=slots[resized.scene.pieces.find((p:any)=>p.id===pick.id).vertex];const to=slots.find((s:any)=>s.visible&&s.y>220&&s.y<700&&!resized.scene.pieces.some((p:any)=>p.vertex===s.vertex)&&Math.hypot(s.x-from.x,s.y-from.y)>80);assert(from.visible&&to);
 for(const action of ['pointercancel','blur']){
  const prior=await scene(page);await page.locator('canvas').dispatchEvent('pointerdown',{pointerId:31,pointerType:'touch',isPrimary:true,button:0,clientX:from.x,clientY:from.y,bubbles:true});
  await page.locator('canvas').dispatchEvent('pointermove',{pointerId:31,pointerType:'touch',isPrimary:true,button:0,clientX:to.x,clientY:to.y,bubbles:true});
  assert.equal((await state(page)).view.dragging,pick.id);
  if(action==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));else await page.locator('canvas').dispatchEvent('pointercancel',{pointerId:31,pointerType:'touch',isPrimary:true,clientX:to.x,clientY:to.y,bubbles:true});
  await page.locator('canvas').dispatchEvent('pointerup',{pointerId:31,pointerType:'touch',isPrimary:true,button:0,clientX:to.x,clientY:to.y,bubbles:true});const after=await state(page);assert.deepEqual(after.scene,prior);assert.equal(after.view.dragging,null);report.checks[action]={passed:true,before:prior,after,atoms:action==='blur'?['S04-A6']:['S04-A5','S02-A18']};
 }
 await page.screenshot({path:path.join(root,'interaction-after.png')});await bounded(context.close());
 for(const arm of [{fps:60,reduce:false},{fps:15,reduce:false},{fps:2,reduce:false},{fps:60,reduce:true}]){
  const {page,context}=await open();await page.emulateMedia({reducedMotion:arm.reduce?'reduce':'no-preference'});await page.locator('#fixture').selectOption('F02');await bounded(page.waitForFunction(()=>(window as any).__bongo.scene.pieces.length===4));
  const initial=await scene(page);assert.deepEqual(initial,JSON.parse(fs.readFileSync(path.join(root,'F02.json'),'utf8')));await page.locator('summary').click();await page.locator('#fps').selectOption(String(arm.fps));await page.locator('#play').click();const start=performance.now();let snapshot:any;
  while(true){snapshot=await bounded(state(page));if(performance.now()-start>5000)throw Error('Activation deadline');if(report.errors.length||['error','interrupted'].includes(snapshot.audioState))throw Error('Actual browser/audio error');const emission=snapshot.events.find((e:any)=>e.type==='emission');if(emission&&snapshot.status?.running&&snapshot.audioState==='running'&&snapshot.contextState==='running'){assert(typeof snapshot.status.session==='string'&&snapshot.status.session.length);report.musicalArms.push({...arm,session:snapshot.status.session,epoch:emission.time,initial,start:performance.now(),initialState:snapshot});break;}await page.waitForTimeout(20);}
  const row=report.musicalArms.at(-1),end=row.epoch+6;
  while(true){snapshot=await bounded(state(page));if(performance.now()-row.start>9500)throw Error('Six-second scheduled arm deadline');if(snapshot.audioState!=='running'||snapshot.contextState!=='running'||!snapshot.status?.running||snapshot.status.session!==row.session||snapshot.status.lateDrops||snapshot.status.lateDropsAudio||snapshot.status.telemetryDrops||report.errors.length)throw Error('Actual timed arm error');if(snapshot.status.time>=end&&performance.now()-row.start>=6000)break;await page.waitForTimeout(80);}
  const outcomes=snapshot.events.filter((e:any)=>e.type==='onset'&&e.trigger.onset>=row.epoch&&e.trigger.onset<end).map((e:any)=>e.trigger);assert.equal(outcomes.length,9);assert.equal(new Set(outcomes.map((t:any)=>t.id)).size,9);
  for(const t of outcomes){assert.equal(t.session,row.session);assert.equal(t.generatorId,'gen');}for(const id of ['chord-0','chord-1','chord-2']){const found=outcomes.filter((t:any)=>t.nodeId===id).sort((a:any,b:any)=>a.onset-b.onset);assert.equal(found.length,3);for(let i=0;i<3;i++)assert(Math.abs(found[i].onset-(row.epoch+.125+2*i))<=1e-6);}
  assert.deepEqual(snapshot.scene,initial);assert.equal(snapshot.view.fpsLimit,arm.fps);assert.equal(snapshot.view.reducedMotion,arm.reduce);row.final=snapshot;row.outcomes=outcomes;row.passed=true;row.elapsedMonotonicSeconds=(performance.now()-row.start)/1000;
  await page.locator('#play').click();await bounded(page.waitForFunction(()=>(window as any).__bongo.status?.running===false));await bounded(context.close());save('report.json',report);
 }
 report.status='passed-scoped-automated-checks';
}catch(error){report.status='failed-or-incomplete';report.errors.push(String(error));process.exitCode=1;}
finally{
 closing=true;
 try{await bounded(browser?.close()??Promise.resolve());await bounded(server?.close()??Promise.resolve());report.cleanup.browserClosed=true;}catch(error){server?.process().kill('SIGTERM');report.cleanup.forcedTermination=true;report.errors.push('Cleanup: '+String(error));report.cleanup.browserClosed=false;process.exitCode=1;}
 if(server){const until=performance.now()+1500;while(server.process().exitCode===null&&server.process().signalCode===null&&performance.now()<until)await new Promise(r=>setTimeout(r,20));report.cleanup.browserProcessClosed=server.process().exitCode!==null||server.process().signalCode!==null;if(!report.cleanup.browserProcessClosed){server.process().kill('SIGKILL');report.cleanup.forcedTermination=true;report.errors.push('Owned browser exit unconfirmed; forced kill sent');}}
 clearTimeout(watchdog);if(report.cleanup.watchdogTriggered)report.errors.push('Browser hard deadline triggered');if(report.errors.length){report.status='failed-or-incomplete';process.exitCode=1;}try{report.servedAfter=await attest('after');if(sha(await bytes(url+'fixtures/F02.json'))!==report.F02Sha256)throw Error('Final fixture binding changed');}catch(error){report.errors.push('Final binding: '+String(error));report.status='failed-or-incomplete';process.exitCode=1;}
 report.finishedAt=new Date().toISOString();report.elapsedMonotonicSeconds=(performance.now()-begin)/1000;save('report.json',report);console.log(JSON.stringify({status:report.status,errors:report.errors,output:root}));
}
