import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {gatedExample} from '../src/core/gatedExamples';
import {emptyScene,newPiece,validateScene} from '../src/core/contracts';

const destination=resolve(process.argv[2]??'evidence/spark-gates/step-07/soak');await mkdir(destination,{recursive:true});
await cp('dist',`${destination}/source`,{recursive:true});
const bundle=await readFile('dist/index.html','utf8');await writeFile(`${destination}/snapshot.json`,JSON.stringify({started:new Date().toISOString(),indexSha256:createHash('sha256').update(bundle).digest('hex'),durationSeconds:1800,browser:'installed Google Chrome',url:'http://127.0.0.1:5417/BongoPlanet/',source:'immutable production snapshot served by request interception at the permanent URL'},null,2));
const processorFile=(await readdir(`${destination}/source/assets`)).find(file=>file.startsWith('processor-')&&file.endsWith('.js'))!;
const processor=await readFile(`${destination}/source/assets/${processorFile}`,'utf8');
await cp('src',`${destination}/application-source`,{recursive:true});
async function sourceHashes(directory:string,prefix=''):Promise<Record<string,string>>{const result:Record<string,string>={};for(const entry of await readdir(directory,{withFileTypes:true})){const name=`${prefix}${entry.name}`;if(entry.isDirectory())Object.assign(result,await sourceHashes(`${directory}/${entry.name}`,`${name}/`));else result[name]=createHash('sha256').update(await readFile(`${directory}/${entry.name}`)).digest('hex');}return result;}
await writeFile(`${destination}/application-manifest.json`,JSON.stringify({date:new Date().toISOString(),files:await sourceHashes(`${destination}/application-source`),processorSha256:createHash('sha256').update(processor).digest('hex')},null,2));
const finite=emptyScene();finite.pieces=Array.from({length:8},(_,vertex)=>({...newPiece('generator',vertex,`soak-g${vertex}`),travel:3,period:8 as const}));
for(const [i,vertex] of [8,9,10,13,15,22,23,25].entries())finite.pieces.push({...newPiece('note',vertex,`soak-n${vertex}`),degree:i%7,duration:.05});
finite.wiring=([[0,[10]],[1,[10]],[2,[13]],[3,[15]],[4,[22]],[5,[8]],[6,[8]],[7,[8]],[10,[13]],[13,[15]],[22,[23]],[23,[25]],[8,[9]],[9,[]]] as [number,number[]][]).map(([vertex,exits])=>({vertex,exits}));validateScene(finite);
const fixtures=[{name:'eight-source-finite',scene:finite},{name:'controlled-infinite',scene:gatedExample('loop')}];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const pages=[];
try{
 for(const fixture of fixtures){const context=await browser.newContext({viewport:{width:1440,height:1000}});
  // AudioWorklet module fetches bypass Playwright route interception. Load the
  // exact retained production bundle as a same-origin Blob, without Vite HMR.
  await context.addInitScript(code=>{const original=AudioWorklet.prototype.addModule;const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));AudioWorklet.prototype.addModule=function(moduleURL,options){return original.call(this,String(moduleURL).includes('/assets/processor-')?url:moduleURL,options);};},processor);
  // Prevent later source edits and Vite HMR from changing a running qualification.
  await context.route('http://127.0.0.1:5417/BongoPlanet/**',async route=>{const url=new URL(route.request().url()),name=decodeURIComponent(url.pathname.slice('/BongoPlanet/'.length))||'index.html';if(name.includes('..'))throw Error('Invalid snapshot path');const contentType=({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wav':'audio/wav','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml'} as Record<string,string>)[extname(name)]??'application/octet-stream';await route.fulfill({body:await readFile(`${destination}/source/${name}`),contentType});});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo?.view.getDiagnostics().frames>2);await page.evaluate(scene=>{const b=(window as any).__bongo;b.load(scene);b.view.setFPS(15);},fixture.scene);await page.locator('#play').click();try{await page.waitForFunction(()=>(window as any).__bongo.status?.running===true,{},{timeout:10000});}catch(error){await writeFile(`${destination}/launch-failure.json`,JSON.stringify({name:fixture.name,errors,state:await page.evaluate(()=>({notice:document.querySelector('#notice')?.textContent,status:(window as any).__bongo.status,audioState:(window as any).__bongo.audio.state,events:(window as any).__bongo.events.slice(-20)}))},null,2));throw error;}
  if(fixture.name==='controlled-infinite')await page.evaluate(()=>{const b=(window as any).__bongo,s=b.scene;s.pieces.filter((p:any)=>p.kind==='generator').forEach((p:any)=>p.enabled=false);b.edit(s);});
  pages.push({page,name:fixture.name,errors,records:[] as unknown[]});
 }
 const started=Date.now();let failed=false;
 while(Date.now()-started<1800_000){await new Promise(r=>setTimeout(r,15_000));for(const item of pages){const record=await item.page.evaluate(()=>{const b=(window as any).__bongo;return {status:b.status,render:b.view.getDiagnostics(),retainedEvents:b.events.length,audioState:b.audio.state,heap:(performance as any).memory?.usedJSHeapSize};});const elapsed=(Date.now()-started)/1000;item.records.push({elapsed,...record});await writeFile(`${destination}/${item.name}.json`,JSON.stringify({name:item.name,elapsed,errors:item.errors,records:item.records},null,2));if(!record.status?.running||item.errors.length||record.status.pending>5376||record.status.gatedEdges>256||record.status.arrivalWindow>2016||record.status.telemetryDrops>0){failed=true;throw Error(`Soak failed: ${item.name} at ${elapsed}s`);}}
  console.log(JSON.stringify({elapsedSeconds:Math.round((Date.now()-started)/1000),states:pages.map(p=>({name:p.name,samples:p.records.length}))}));
 }
 for(const item of pages){await item.page.locator('#play').click();await item.page.waitForTimeout(150);await item.page.screenshot({path:`${destination}/${item.name}-final.png`});}
 await writeFile(`${destination}/result.json`,JSON.stringify({passed:!failed,elapsedSeconds:(Date.now()-started)/1000,ended:new Date().toISOString(),fixtures:pages.map(p=>({name:p.name,samples:p.records.length,errors:p.errors}))},null,2));
}finally{await browser.close();}
