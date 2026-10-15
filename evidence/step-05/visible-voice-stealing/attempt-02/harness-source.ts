import {test,expect,type BrowserContext,type Page,type CDPSession} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import type {Scene} from '../src/core/contracts';
import type {AudioStatus} from '../src/audio/protocol';
import {LoadedModuleObserver} from './loaded-module-observer';

const URL='http://127.0.0.1:5417/BongoPlanet/';
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
type Observation={browserPerformanceMs:number;scene:Scene;audioState:string;contextState:string|null;status:AudioStatus|null;output:{connected:boolean;session:string};statsText:string;stats:Record<string,unknown>|null;statsAudio:AudioStatus|null;detailsOpen:boolean;caption:string|null;playText:string|null};

async function observe(page:Page):Promise<Observation>{return page.evaluate(()=>{
  const b=(window as any).__bongo,text=document.querySelector('#stats')?.textContent??'';
  let stats:any=null;try{stats=JSON.parse(text);}catch{/* Empty pre-start diagnostics are retained. */}
  return {browserPerformanceMs:performance.now(),scene:b.scene,audioState:b.audio.state,contextState:b.audio.context?.state??null,status:b.status,output:b.output,statsText:text,stats,statsAudio:stats?.audio??null,detailsOpen:!!document.querySelector('details.diagnostics')?.hasAttribute('open'),caption:document.querySelector('#audio-state')?.textContent??null,playText:document.querySelector('#play')?.textContent??null};
});}

function assertHealthy(value:Observation,errors:string[]){
  if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
  if(value.output.connected)throw Error('Bridge unexpectedly connected');
  if(['error','interrupted'].includes(value.audioState))throw Error(`Audio ${value.audioState}: ${value.caption}`);
  if(value.status&&(value.status.telemetryDrops!==0||value.status.lateDrops!==0||value.status.lateDropsAudio!==0))throw Error('Audio/drop counters are nonzero');
}

test('actual F08 stealing is counted in visible instrument diagnostics',async({browser})=>{
  test.setTimeout(26000);
  const output=process.env.BONGO_VISIBLE_STEAL_OUTPUT;
  const expectedMain=process.env.BONGO_VISIBLE_STEAL_MAIN_SHA;
  const expectedProcessor=process.env.BONGO_VISIBLE_STEAL_PROCESSOR_SHA;
  if(!output||!expectedMain?.match(/^[a-f0-9]{64}$/)||!expectedProcessor?.match(/^[a-f0-9]{64}$/))throw Error('Require new evidence output directory and frozen main/processor SHA256 environment bindings');
  if(fs.existsSync(output))throw Error(`Refusing existing evidence directory ${output}`);
  fs.mkdirSync(output,{recursive:true});
  const fixtureBytes=fs.readFileSync('public/fixtures/F08.json'),fixture=JSON.parse(fixtureBytes.toString()) as Scene;
  const sources=Object.fromEntries(['scripts/ui-voice-stealing-browser-v2.spec.ts','scripts/loaded-module-observer.ts','src/main.ts','src/audio/AudioAdapter.ts','src/audio/processor.ts','src/audio/synth.ts'].map(name=>[name,sha(fs.readFileSync(name))]));
  fs.copyFileSync('scripts/ui-voice-stealing-browser-v2.spec.ts',path.join(output,'harness-source.ts'));
  fs.copyFileSync('scripts/loaded-module-observer.ts',path.join(output,'observer-source.ts'));
  fs.writeFileSync(path.join(output,'F08.json'),fixtureBytes);
  const report:any={title:'Bongo Planet visible stealing witness',status:'preparing',startedUtc:new Date().toISOString(),url:URL,qualificationPassed:false,atom:'S01-A30',networkBinding:'original page-CDP request bodies; cache disabled; no route/target/API fallback',sources,fixtureSha256:sha(fixtureBytes),expectedMain,expectedProcessor,errors:[],observations:[],networkModules:[],cleanup:{pauseAcknowledged:false,audioDisposed:false,audioContextClosed:false,contextClosed:false,browserClosed:false,cdpDetached:false}};
  const started=performance.now();let context:BrowserContext|undefined,page:Page|undefined,playStarted:number|undefined,cdp:CDPSession|undefined,observer:LoadedModuleObserver|undefined;
  const save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  save();
  try{
    report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();
    page.setDefaultTimeout(2000);page.setDefaultNavigationTimeout(4000);page.on('pageerror',error=>report.errors.push(error.message));
    // The public page response is main-module corroboration only. Processor
    // loaded-body ownership is mandatory in the independent raw CDP join.
    const pendingResponses:Promise<void>[]=[];
    page.on('response',response=>{
      if(!response.url().startsWith(URL+'assets/')||!response.url().endsWith('.js'))return;
      if(pendingResponses.length>=16){report.errors.push('Module response retention cap exceeded');return;}
      pendingResponses.push((async()=>{try{report.networkModules.push({url:response.url(),status:response.status(),sha256:sha(await response.body())});}catch(error){report.errors.push(`Module retention: ${String(error)}`);}})());
    });
    const htmlResponse=await page.request.get(URL,{timeout:2000});if(!htmlResponse.ok())throw Error('Production HTML request failed');
    const html=await htmlResponse.text(),assets=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]);
    if(assets.length!==1||!assets[0].startsWith('/BongoPlanet/assets/index-'))throw Error('Expected frozen production main, not Vite development module');
    const asset=new globalThis.URL(assets[0],URL).href,mainResponse=await page.request.get(asset,{timeout:2000});
    if(!mainResponse.ok())throw Error('Main asset request failed');
    const mainBytes=await mainResponse.body();
    report.servedBefore={asset,sha256:sha(mainBytes),htmlSha256:sha(html)};expect(report.servedBefore.sha256).toBe(expectedMain);
    const processorPaths=[...new Set([...mainBytes.toString('utf8').matchAll(/\/BongoPlanet\/assets\/processor-[^\"\s]+?\.js/g)].map(match=>match[0]))];
    if(processorPaths.length!==1)throw Error('Expected one frozen processor URL in main bundle');
    const processorAsset=new globalThis.URL(processorPaths[0],URL).href;report.expectedProcessorAsset=processorAsset;
    const servedFixture=await page.request.get(URL+'fixtures/F08.json',{timeout:2000});if(!servedFixture.ok())throw Error('Served F08 request failed');
    expect(sha(await servedFixture.body())).toBe(report.fixtureSha256);
    cdp=await context.newCDPSession(page);
    observer=new LoadedModuleObserver({[asset]:expectedMain,[processorAsset]:expectedProcessor},id=>cdp!.send('Network.getResponseBody',{requestId:id}));
    for(const kind of ['requestWillBeSent','responseReceived','loadingFinished','loadingFailed'] as const)cdp.on(`Network.${kind}`,event=>{try{observer!.receive(kind,event,performance.now());}catch(error){report.errors.push(`Raw CDP: ${String(error)}`);}});
    await cdp.send('Network.enable',{maxTotalBufferSize:3*1024*1024,maxResourceBufferSize:1024*1024});
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});report.cdpEnabledBeforeNavigation=true;
    await page.goto(URL);await page.waitForFunction(()=>(window as any).__bongo,undefined,{timeout:2000});
    await page.evaluate(value=>(window as any).__bongo.load(value),fixture);await page.locator('details.diagnostics summary').click();
    const before=await observe(page);report.before=before;assertHealthy(before,report.errors);expect(before.scene).toEqual(fixture);expect(before.status?.running??false).toBe(false);
    playStarted=performance.now();report.playRequestedUtc=new Date().toISOString();await page.locator('#play').click();
    report.status='observing';let matched:Observation|undefined;
    // Reserve three seconds inside the20second Play bound for screenshots and
    // the actual pause acknowledgement; a late acknowledgement fails below.
    while(performance.now()-playStarted<17000&&performance.now()-started<18000){
      const value=await observe(page);report.observations.push(value);assertHealthy(value,report.errors);
      if(observer.snapshot.failure)throw Error(`Raw CDP body failure: ${observer.snapshot.failure}`);
      if(report.observations.length>200)throw Error('Observation cap exceeded');
      if(value.audioState==='running'&&value.contextState==='running'&&value.status?.running===true&&Number.isInteger(value.status.stolenVoices)&&value.status.stolenVoices>0&&value.detailsOpen&&JSON.stringify(value.statsAudio)===JSON.stringify(value.status)){
        matched=value;break;
      }
      await page.waitForTimeout(100);
    }
    if(!matched)throw Error('No current running nonzero visible-counter/status agreement within bounded observation');
    report.matched=matched;expect(matched.scene).toEqual(fixture);expect(matched.statsAudio!.stolenVoices).toBe(matched.status!.stolenVoices);
    await page.locator('#stats').scrollIntoViewIfNeeded();
    report.visibleLine=await page.locator('#stats').evaluate(element=>{
      const text=element.textContent??'',offset=text.indexOf('"stolenVoices"');if(offset<0||!element.firstChild)throw Error('Steal counter line missing');
      const style=getComputedStyle(element),height=parseFloat(style.lineHeight),line=text.slice(0,offset).split('\n').length-1;
      if(!Number.isFinite(height))throw Error('Counter line height unavailable');
      element.scrollTop=Math.max(0,line*height-element.clientHeight/2);
      const range=document.createRange();range.setStart(element.firstChild,offset);range.setEnd(element.firstChild,text.indexOf('\n',offset));
      const rect=range.getBoundingClientRect(),outer=element.getBoundingClientRect();
      return {text:range.toString(),rect:{top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right},outer:{top:outer.top,bottom:outer.bottom,left:outer.left,right:outer.right},visible:rect.top>=outer.top&&rect.bottom<=outer.bottom&&rect.top>=0&&rect.bottom<=innerHeight};
    });
    expect(report.visibleLine.visible).toBe(true);expect(report.visibleLine.text).toMatch(/"stolenVoices":\s*[1-9]\d*/);
    report.screenshotBefore=await observe(page);assertHealthy(report.screenshotBefore,report.errors);
    await page.locator('#stats').screenshot({path:path.join(output,'visible-counter.png'),timeout:2000});
    await page.screenshot({path:path.join(output,'visible-page.png'),timeout:2000});
    report.screenshotAfter=await observe(page);assertHealthy(report.screenshotAfter,report.errors);
    if(performance.now()-playStarted>20000)throw Error('Twenty-second Play bound exceeded');
    report.pauseRequestedUtc=new Date().toISOString();report.playToPauseRequestSeconds=(performance.now()-playStarted)/1000;
    await page.locator('#play').click();
    await page.waitForFunction(()=>(window as any).__bongo.status?.running===false,undefined,{timeout:2000});
    report.playToPauseAcknowledgementSeconds=(performance.now()-playStarted)/1000;
    if(report.playToPauseAcknowledgementSeconds>20)throw Error('Twenty-second Play-to-pause bound exceeded');
    report.cleanup.pauseAcknowledged=true;report.paused=await observe(page);assertHealthy(report.paused,report.errors);
    await observer.finish(1500);
    let responseTimer:ReturnType<typeof setTimeout>|undefined;
    try{await Promise.race([Promise.all(pendingResponses),new Promise<never>((_,reject)=>{responseTimer=setTimeout(()=>reject(Error('Unresolved Playwright corroboration response')),1500);})]);}finally{clearTimeout(responseTimer);}
    const loadedMain=report.networkModules.filter((value:any)=>value.url===asset);
    expect(loadedMain).toHaveLength(1);expect(loadedMain[0].sha256).toBe(expectedMain);
    report.loadedBodyBinding=observer.snapshot;
    const servedAfter=await page.request.get(asset,{timeout:2000});report.servedAfter={asset,status:servedAfter.status(),sha256:sha(await servedAfter.body())};expect(report.servedAfter.sha256).toBe(expectedMain);
    report.visibleCounterObserved=true;report.status='observed-pending-cleanup';
  }catch(error){report.errors.push(String(error));report.status='failed';throw error;}
  finally{
    report.playRequestToFinallySeconds=playStarted===undefined?null:(performance.now()-playStarted)/1000;
    if(page&&!page.isClosed()){
      try{
        const result=await page.evaluate(async()=>{const b=(window as any).__bongo;if(!b)return {audioDisposed:false,audioContextClosed:false};b.audio.pause();await b.audio.dispose();return {audioDisposed:true,audioContextClosed:b.audio.context?.state==='closed'||!b.audio.context};});
        Object.assign(report.cleanup,result);
      }catch(error){report.errors.push(`Audio cleanup: ${String(error)}`);}
    }
    if(cdp){try{await cdp.detach();report.cleanup.cdpDetached=true;}catch(error){report.errors.push(`CDP detach: ${String(error)}`);}}
    if(observer){
      report.loadedBodyBinding=observer.snapshot;
      try{
        fs.writeFileSync(path.join(output,'network-events.json'),JSON.stringify(observer.snapshot,null,2)+'\n');
        observer.bodies.forEach((body,index)=>fs.writeFileSync(path.join(output,`loaded-module-${index}.js`),body.bytes));
      }catch(error){report.errors.push(`CDP artifact persistence: ${String(error)}`);}
      if(observer.snapshot.failure||observer.snapshot.pendingBodies!==0)report.errors.push(`Incomplete CDP observer: ${observer.snapshot.failure??'unresolved body'}`);
    }
    try{if(context){await context.close();report.cleanup.contextClosed=true;}}catch(error){report.errors.push(`Context cleanup: ${String(error)}`);}
    try{await browser.close();report.cleanup.browserClosed=!browser.isConnected();}catch(error){report.errors.push(`Browser cleanup: ${String(error)}`);}
    report.elapsedMonotonicSeconds=(performance.now()-started)/1000;report.finishedUtc=new Date().toISOString();
    if(report.errors.length||!report.cleanup.audioDisposed||!report.cleanup.audioContextClosed||!report.cleanup.contextClosed||!report.cleanup.browserClosed||!report.cleanup.cdpDetached||report.elapsedMonotonicSeconds>30){report.status='failed';report.visibleCounterObserved=false;}
    else if(report.status==='observed-pending-cleanup')report.status='completed-visible-counter-witness';
    save();
    expect(report.status).toBe('completed-visible-counter-witness');
  }
});
