# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-voice-stealing-browser.spec.ts >> actual F08 stealing is counted in visible instrument diagnostics
- Location: scripts/ui-voice-stealing-browser.spec.ts:26:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "completed-visible-counter-witness"
Received: "failed"
```

# Test source

```ts
  20  |   if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
  21  |   if(value.output.connected)throw Error('Bridge unexpectedly connected');
  22  |   if(['error','interrupted'].includes(value.audioState))throw Error(`Audio ${value.audioState}: ${value.caption}`);
  23  |   if(value.status&&(value.status.telemetryDrops!==0||value.status.lateDrops!==0||value.status.lateDropsAudio!==0))throw Error('Audio/drop counters are nonzero');
  24  | }
  25  | 
  26  | test('actual F08 stealing is counted in visible instrument diagnostics',async({browser})=>{
  27  |   test.setTimeout(26000);
  28  |   const output=process.env.BONGO_VISIBLE_STEAL_OUTPUT;
  29  |   const expectedMain=process.env.BONGO_VISIBLE_STEAL_MAIN_SHA;
  30  |   const expectedProcessor=process.env.BONGO_VISIBLE_STEAL_PROCESSOR_SHA;
  31  |   if(!output||!expectedMain?.match(/^[a-f0-9]{64}$/)||!expectedProcessor?.match(/^[a-f0-9]{64}$/))throw Error('Require new evidence output directory and frozen main/processor SHA256 environment bindings');
  32  |   if(fs.existsSync(output))throw Error(`Refusing existing evidence directory ${output}`);
  33  |   fs.mkdirSync(output,{recursive:true});
  34  |   const fixtureBytes=fs.readFileSync('public/fixtures/F08.json'),fixture=JSON.parse(fixtureBytes.toString()) as Scene;
  35  |   const sources=Object.fromEntries(['scripts/ui-voice-stealing-browser.spec.ts','src/main.ts','src/audio/AudioAdapter.ts','src/audio/processor.ts','src/audio/synth.ts'].map(name=>[name,sha(fs.readFileSync(name))]));
  36  |   fs.copyFileSync('scripts/ui-voice-stealing-browser.spec.ts',path.join(output,'harness-source.ts'));
  37  |   fs.writeFileSync(path.join(output,'F08.json'),fixtureBytes);
  38  |   const report:any={title:'Bongo Planet visible stealing witness',status:'preparing',startedUtc:new Date().toISOString(),url:URL,qualificationPassed:false,atom:'S01-A30',sources,fixtureSha256:sha(fixtureBytes),expectedMain,expectedProcessor,errors:[],observations:[],networkModules:[],cleanup:{pauseAcknowledged:false,audioDisposed:false,audioContextClosed:false,contextClosed:false,browserClosed:false}};
  39  |   const started=performance.now();let context:BrowserContext|undefined,page:Page|undefined,playStarted:number|undefined;
  40  |   const save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  41  |   save();
  42  |   try{
  43  |     report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();
  44  |     page.setDefaultTimeout(2000);page.setDefaultNavigationTimeout(4000);page.on('pageerror',error=>report.errors.push(error.message));
  45  |     // Retain module hashes from actual browser responses, including the loaded
  46  |     // worklet. No AudioAdapter callback or worklet message is replaced.
  47  |     const pendingResponses:Promise<void>[]=[];
  48  |     page.on('response',response=>{
  49  |       if(!response.url().startsWith(URL+'assets/')||!response.url().endsWith('.js'))return;
  50  |       if(pendingResponses.length>=16){report.errors.push('Module response retention cap exceeded');return;}
  51  |       pendingResponses.push((async()=>{try{report.networkModules.push({url:response.url(),status:response.status(),sha256:sha(await response.body())});}catch(error){report.errors.push(`Module retention: ${String(error)}`);}})());
  52  |     });
  53  |     const htmlResponse=await page.request.get(URL,{timeout:2000});if(!htmlResponse.ok())throw Error('Production HTML request failed');
  54  |     const html=await htmlResponse.text(),assets=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]);
  55  |     if(assets.length!==1||!assets[0].startsWith('/BongoPlanet/assets/index-'))throw Error('Expected frozen production main, not Vite development module');
  56  |     const asset=new globalThis.URL(assets[0],URL).href,mainResponse=await page.request.get(asset,{timeout:2000});
  57  |     if(!mainResponse.ok())throw Error('Main asset request failed');
  58  |     report.servedBefore={asset,sha256:sha(await mainResponse.body()),htmlSha256:sha(html)};expect(report.servedBefore.sha256).toBe(expectedMain);
  59  |     const servedFixture=await page.request.get(URL+'fixtures/F08.json',{timeout:2000});if(!servedFixture.ok())throw Error('Served F08 request failed');
  60  |     expect(sha(await servedFixture.body())).toBe(report.fixtureSha256);
  61  |     await page.goto(URL);await page.waitForFunction(()=>(window as any).__bongo,undefined,{timeout:2000});
  62  |     await page.evaluate(value=>(window as any).__bongo.load(value),fixture);await page.locator('details.diagnostics summary').click();
  63  |     const before=await observe(page);report.before=before;assertHealthy(before,report.errors);expect(before.scene).toEqual(fixture);expect(before.status?.running??false).toBe(false);
  64  |     playStarted=performance.now();report.playRequestedUtc=new Date().toISOString();await page.locator('#play').click();
  65  |     report.status='observing';let matched:Observation|undefined;
  66  |     // Reserve three seconds inside the20second Play bound for screenshots and
  67  |     // the actual pause acknowledgement; a late acknowledgement fails below.
  68  |     while(performance.now()-playStarted<17000&&performance.now()-started<18000){
  69  |       const value=await observe(page);report.observations.push(value);assertHealthy(value,report.errors);
  70  |       if(report.observations.length>200)throw Error('Observation cap exceeded');
  71  |       if(value.audioState==='running'&&value.contextState==='running'&&value.status?.running===true&&Number.isInteger(value.status.stolenVoices)&&value.status.stolenVoices>0&&value.detailsOpen&&JSON.stringify(value.statsAudio)===JSON.stringify(value.status)){
  72  |         matched=value;break;
  73  |       }
  74  |       await page.waitForTimeout(100);
  75  |     }
  76  |     if(!matched)throw Error('No current running nonzero visible-counter/status agreement within bounded observation');
  77  |     report.matched=matched;expect(matched.scene).toEqual(fixture);expect(matched.statsAudio!.stolenVoices).toBe(matched.status!.stolenVoices);
  78  |     await page.locator('#stats').scrollIntoViewIfNeeded();
  79  |     report.visibleLine=await page.locator('#stats').evaluate(element=>{
  80  |       const text=element.textContent??'',offset=text.indexOf('"stolenVoices"');if(offset<0||!element.firstChild)throw Error('Steal counter line missing');
  81  |       const style=getComputedStyle(element),height=parseFloat(style.lineHeight),line=text.slice(0,offset).split('\n').length-1;
  82  |       if(!Number.isFinite(height))throw Error('Counter line height unavailable');
  83  |       element.scrollTop=Math.max(0,line*height-element.clientHeight/2);
  84  |       const range=document.createRange();range.setStart(element.firstChild,offset);range.setEnd(element.firstChild,text.indexOf('\n',offset));
  85  |       const rect=range.getBoundingClientRect(),outer=element.getBoundingClientRect();
  86  |       return {text:range.toString(),rect:{top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right},outer:{top:outer.top,bottom:outer.bottom,left:outer.left,right:outer.right},visible:rect.top>=outer.top&&rect.bottom<=outer.bottom&&rect.top>=0&&rect.bottom<=innerHeight};
  87  |     });
  88  |     expect(report.visibleLine.visible).toBe(true);expect(report.visibleLine.text).toMatch(/"stolenVoices":\s*[1-9]\d*/);
  89  |     report.screenshotBefore=await observe(page);assertHealthy(report.screenshotBefore,report.errors);
  90  |     await page.locator('#stats').screenshot({path:path.join(output,'visible-counter.png'),timeout:2000});
  91  |     await page.screenshot({path:path.join(output,'visible-page.png'),timeout:2000});
  92  |     report.screenshotAfter=await observe(page);assertHealthy(report.screenshotAfter,report.errors);
  93  |     if(performance.now()-playStarted>20000)throw Error('Twenty-second Play bound exceeded');
  94  |     report.pauseRequestedUtc=new Date().toISOString();report.playToPauseRequestSeconds=(performance.now()-playStarted)/1000;
  95  |     await page.locator('#play').click();
  96  |     await page.waitForFunction(()=>(window as any).__bongo.status?.running===false,undefined,{timeout:2000});
  97  |     report.playToPauseAcknowledgementSeconds=(performance.now()-playStarted)/1000;
  98  |     if(report.playToPauseAcknowledgementSeconds>20)throw Error('Twenty-second Play-to-pause bound exceeded');
  99  |     report.cleanup.pauseAcknowledged=true;report.paused=await observe(page);assertHealthy(report.paused,report.errors);
  100 |     await Promise.all(pendingResponses);
  101 |     const loadedMain=report.networkModules.filter((value:any)=>value.url===asset),processors=report.networkModules.filter((value:any)=>/\/processor-[^/]+\.js$/.test(value.url));
  102 |     expect(loadedMain).toHaveLength(1);expect(loadedMain[0].sha256).toBe(expectedMain);expect(processors).toHaveLength(1);expect(processors[0].sha256).toBe(expectedProcessor);
  103 |     const servedAfter=await page.request.get(asset,{timeout:2000});report.servedAfter={asset,status:servedAfter.status(),sha256:sha(await servedAfter.body())};expect(report.servedAfter.sha256).toBe(expectedMain);
  104 |     report.visibleCounterObserved=true;report.status='observed-pending-cleanup';
  105 |   }catch(error){report.errors.push(String(error));report.status='failed';throw error;}
  106 |   finally{
  107 |     report.playRequestToFinallySeconds=playStarted===undefined?null:(performance.now()-playStarted)/1000;
  108 |     if(page&&!page.isClosed()){
  109 |       try{
  110 |         const result=await page.evaluate(async()=>{const b=(window as any).__bongo;if(!b)return {audioDisposed:false,audioContextClosed:false};b.audio.pause();await b.audio.dispose();return {audioDisposed:true,audioContextClosed:b.audio.context?.state==='closed'||!b.audio.context};});
  111 |         Object.assign(report.cleanup,result);
  112 |       }catch(error){report.errors.push(`Audio cleanup: ${String(error)}`);}
  113 |     }
  114 |     try{if(context){await context.close();report.cleanup.contextClosed=true;}}catch(error){report.errors.push(`Context cleanup: ${String(error)}`);}
  115 |     try{await browser.close();report.cleanup.browserClosed=!browser.isConnected();}catch(error){report.errors.push(`Browser cleanup: ${String(error)}`);}
  116 |     report.elapsedMonotonicSeconds=(performance.now()-started)/1000;report.finishedUtc=new Date().toISOString();
  117 |     if(report.errors.length||!report.cleanup.audioDisposed||!report.cleanup.audioContextClosed||!report.cleanup.contextClosed||!report.cleanup.browserClosed||report.elapsedMonotonicSeconds>30){report.status='failed';report.visibleCounterObserved=false;}
  118 |     else if(report.status==='observed-pending-cleanup')report.status='completed-visible-counter-witness';
  119 |     save();
> 120 |     expect(report.status).toBe('completed-visible-counter-witness');
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  121 |   }
  122 | });
  123 | 
```