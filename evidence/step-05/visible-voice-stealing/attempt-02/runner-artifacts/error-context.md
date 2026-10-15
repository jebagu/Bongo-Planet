# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-voice-stealing-browser-v2.spec.ts >> actual F08 stealing is counted in visible instrument diagnostics
- Location: scripts/ui-voice-stealing-browser-v2.spec.ts:27:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "completed-visible-counter-witness"
Received: "failed"
```

# Test source

```ts
  44  |   try{
  45  |     report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();
  46  |     page.setDefaultTimeout(2000);page.setDefaultNavigationTimeout(4000);page.on('pageerror',error=>report.errors.push(error.message));
  47  |     // The public page response is main-module corroboration only. Processor
  48  |     // loaded-body ownership is mandatory in the independent raw CDP join.
  49  |     const pendingResponses:Promise<void>[]=[];
  50  |     page.on('response',response=>{
  51  |       if(!response.url().startsWith(URL+'assets/')||!response.url().endsWith('.js'))return;
  52  |       if(pendingResponses.length>=16){report.errors.push('Module response retention cap exceeded');return;}
  53  |       pendingResponses.push((async()=>{try{report.networkModules.push({url:response.url(),status:response.status(),sha256:sha(await response.body())});}catch(error){report.errors.push(`Module retention: ${String(error)}`);}})());
  54  |     });
  55  |     const htmlResponse=await page.request.get(URL,{timeout:2000});if(!htmlResponse.ok())throw Error('Production HTML request failed');
  56  |     const html=await htmlResponse.text(),assets=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]);
  57  |     if(assets.length!==1||!assets[0].startsWith('/BongoPlanet/assets/index-'))throw Error('Expected frozen production main, not Vite development module');
  58  |     const asset=new globalThis.URL(assets[0],URL).href,mainResponse=await page.request.get(asset,{timeout:2000});
  59  |     if(!mainResponse.ok())throw Error('Main asset request failed');
  60  |     const mainBytes=await mainResponse.body();
  61  |     report.servedBefore={asset,sha256:sha(mainBytes),htmlSha256:sha(html)};expect(report.servedBefore.sha256).toBe(expectedMain);
  62  |     const processorPaths=[...new Set([...mainBytes.toString('utf8').matchAll(/\/BongoPlanet\/assets\/processor-[^\"\s]+?\.js/g)].map(match=>match[0]))];
  63  |     if(processorPaths.length!==1)throw Error('Expected one frozen processor URL in main bundle');
  64  |     const processorAsset=new globalThis.URL(processorPaths[0],URL).href;report.expectedProcessorAsset=processorAsset;
  65  |     const servedFixture=await page.request.get(URL+'fixtures/F08.json',{timeout:2000});if(!servedFixture.ok())throw Error('Served F08 request failed');
  66  |     expect(sha(await servedFixture.body())).toBe(report.fixtureSha256);
  67  |     cdp=await context.newCDPSession(page);
  68  |     observer=new LoadedModuleObserver({[asset]:expectedMain,[processorAsset]:expectedProcessor},id=>cdp!.send('Network.getResponseBody',{requestId:id}));
  69  |     for(const kind of ['requestWillBeSent','responseReceived','loadingFinished','loadingFailed'] as const)cdp.on(`Network.${kind}`,event=>{try{observer!.receive(kind,event,performance.now());}catch(error){report.errors.push(`Raw CDP: ${String(error)}`);}});
  70  |     await cdp.send('Network.enable',{maxTotalBufferSize:3*1024*1024,maxResourceBufferSize:1024*1024});
  71  |     await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});report.cdpEnabledBeforeNavigation=true;
  72  |     await page.goto(URL);await page.waitForFunction(()=>(window as any).__bongo,undefined,{timeout:2000});
  73  |     await page.evaluate(value=>(window as any).__bongo.load(value),fixture);await page.locator('details.diagnostics summary').click();
  74  |     const before=await observe(page);report.before=before;assertHealthy(before,report.errors);expect(before.scene).toEqual(fixture);expect(before.status?.running??false).toBe(false);
  75  |     playStarted=performance.now();report.playRequestedUtc=new Date().toISOString();await page.locator('#play').click();
  76  |     report.status='observing';let matched:Observation|undefined;
  77  |     // Reserve three seconds inside the20second Play bound for screenshots and
  78  |     // the actual pause acknowledgement; a late acknowledgement fails below.
  79  |     while(performance.now()-playStarted<17000&&performance.now()-started<18000){
  80  |       const value=await observe(page);report.observations.push(value);assertHealthy(value,report.errors);
  81  |       if(observer.snapshot.failure)throw Error(`Raw CDP body failure: ${observer.snapshot.failure}`);
  82  |       if(report.observations.length>200)throw Error('Observation cap exceeded');
  83  |       if(value.audioState==='running'&&value.contextState==='running'&&value.status?.running===true&&Number.isInteger(value.status.stolenVoices)&&value.status.stolenVoices>0&&value.detailsOpen&&JSON.stringify(value.statsAudio)===JSON.stringify(value.status)){
  84  |         matched=value;break;
  85  |       }
  86  |       await page.waitForTimeout(100);
  87  |     }
  88  |     if(!matched)throw Error('No current running nonzero visible-counter/status agreement within bounded observation');
  89  |     report.matched=matched;expect(matched.scene).toEqual(fixture);expect(matched.statsAudio!.stolenVoices).toBe(matched.status!.stolenVoices);
  90  |     await page.locator('#stats').scrollIntoViewIfNeeded();
  91  |     report.visibleLine=await page.locator('#stats').evaluate(element=>{
  92  |       const text=element.textContent??'',offset=text.indexOf('"stolenVoices"');if(offset<0||!element.firstChild)throw Error('Steal counter line missing');
  93  |       const style=getComputedStyle(element),height=parseFloat(style.lineHeight),line=text.slice(0,offset).split('\n').length-1;
  94  |       if(!Number.isFinite(height))throw Error('Counter line height unavailable');
  95  |       element.scrollTop=Math.max(0,line*height-element.clientHeight/2);
  96  |       const range=document.createRange();range.setStart(element.firstChild,offset);range.setEnd(element.firstChild,text.indexOf('\n',offset));
  97  |       const rect=range.getBoundingClientRect(),outer=element.getBoundingClientRect();
  98  |       return {text:range.toString(),rect:{top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right},outer:{top:outer.top,bottom:outer.bottom,left:outer.left,right:outer.right},visible:rect.top>=outer.top&&rect.bottom<=outer.bottom&&rect.top>=0&&rect.bottom<=innerHeight};
  99  |     });
  100 |     expect(report.visibleLine.visible).toBe(true);expect(report.visibleLine.text).toMatch(/"stolenVoices":\s*[1-9]\d*/);
  101 |     report.screenshotBefore=await observe(page);assertHealthy(report.screenshotBefore,report.errors);
  102 |     await page.locator('#stats').screenshot({path:path.join(output,'visible-counter.png'),timeout:2000});
  103 |     await page.screenshot({path:path.join(output,'visible-page.png'),timeout:2000});
  104 |     report.screenshotAfter=await observe(page);assertHealthy(report.screenshotAfter,report.errors);
  105 |     if(performance.now()-playStarted>20000)throw Error('Twenty-second Play bound exceeded');
  106 |     report.pauseRequestedUtc=new Date().toISOString();report.playToPauseRequestSeconds=(performance.now()-playStarted)/1000;
  107 |     await page.locator('#play').click();
  108 |     await page.waitForFunction(()=>(window as any).__bongo.status?.running===false,undefined,{timeout:2000});
  109 |     report.playToPauseAcknowledgementSeconds=(performance.now()-playStarted)/1000;
  110 |     if(report.playToPauseAcknowledgementSeconds>20)throw Error('Twenty-second Play-to-pause bound exceeded');
  111 |     report.cleanup.pauseAcknowledged=true;report.paused=await observe(page);assertHealthy(report.paused,report.errors);
  112 |     await observer.finish(1500);
  113 |     let responseTimer:ReturnType<typeof setTimeout>|undefined;
  114 |     try{await Promise.race([Promise.all(pendingResponses),new Promise<never>((_,reject)=>{responseTimer=setTimeout(()=>reject(Error('Unresolved Playwright corroboration response')),1500);})]);}finally{clearTimeout(responseTimer);}
  115 |     const loadedMain=report.networkModules.filter((value:any)=>value.url===asset);
  116 |     expect(loadedMain).toHaveLength(1);expect(loadedMain[0].sha256).toBe(expectedMain);
  117 |     report.loadedBodyBinding=observer.snapshot;
  118 |     const servedAfter=await page.request.get(asset,{timeout:2000});report.servedAfter={asset,status:servedAfter.status(),sha256:sha(await servedAfter.body())};expect(report.servedAfter.sha256).toBe(expectedMain);
  119 |     report.visibleCounterObserved=true;report.status='observed-pending-cleanup';
  120 |   }catch(error){report.errors.push(String(error));report.status='failed';throw error;}
  121 |   finally{
  122 |     report.playRequestToFinallySeconds=playStarted===undefined?null:(performance.now()-playStarted)/1000;
  123 |     if(page&&!page.isClosed()){
  124 |       try{
  125 |         const result=await page.evaluate(async()=>{const b=(window as any).__bongo;if(!b)return {audioDisposed:false,audioContextClosed:false};b.audio.pause();await b.audio.dispose();return {audioDisposed:true,audioContextClosed:b.audio.context?.state==='closed'||!b.audio.context};});
  126 |         Object.assign(report.cleanup,result);
  127 |       }catch(error){report.errors.push(`Audio cleanup: ${String(error)}`);}
  128 |     }
  129 |     if(cdp){try{await cdp.detach();report.cleanup.cdpDetached=true;}catch(error){report.errors.push(`CDP detach: ${String(error)}`);}}
  130 |     if(observer){
  131 |       report.loadedBodyBinding=observer.snapshot;
  132 |       try{
  133 |         fs.writeFileSync(path.join(output,'network-events.json'),JSON.stringify(observer.snapshot,null,2)+'\n');
  134 |         observer.bodies.forEach((body,index)=>fs.writeFileSync(path.join(output,`loaded-module-${index}.js`),body.bytes));
  135 |       }catch(error){report.errors.push(`CDP artifact persistence: ${String(error)}`);}
  136 |       if(observer.snapshot.failure||observer.snapshot.pendingBodies!==0)report.errors.push(`Incomplete CDP observer: ${observer.snapshot.failure??'unresolved body'}`);
  137 |     }
  138 |     try{if(context){await context.close();report.cleanup.contextClosed=true;}}catch(error){report.errors.push(`Context cleanup: ${String(error)}`);}
  139 |     try{await browser.close();report.cleanup.browserClosed=!browser.isConnected();}catch(error){report.errors.push(`Browser cleanup: ${String(error)}`);}
  140 |     report.elapsedMonotonicSeconds=(performance.now()-started)/1000;report.finishedUtc=new Date().toISOString();
  141 |     if(report.errors.length||!report.cleanup.audioDisposed||!report.cleanup.audioContextClosed||!report.cleanup.contextClosed||!report.cleanup.browserClosed||!report.cleanup.cdpDetached||report.elapsedMonotonicSeconds>30){report.status='failed';report.visibleCounterObserved=false;}
  142 |     else if(report.status==='observed-pending-cleanup')report.status='completed-visible-counter-witness';
  143 |     save();
> 144 |     expect(report.status).toBe('completed-visible-counter-witness');
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  145 |   }
  146 | });
  147 | 
```