import {chromium} from '@playwright/test';
import {access,writeFile,mkdir} from 'node:fs/promises';

// Preserve existing source portraits. New instruments use the actual palette renderer.
const destination='public/art/geometric-toys';
await mkdir(destination,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5417/BongoPlanet/');
 const icons=await page.evaluate(async()=>{
  const iconsUrl='/BongoPlanet/src/view/art/instrumentIcons.ts';
  const appearanceUrl='/BongoPlanet/src/view/art/appearance.ts';
  const {renderInstrumentIcons}=await import(/* @vite-ignore */ iconsUrl);
  const {DEFAULT_APPEARANCE}=await import(/* @vite-ignore */ appearanceUrl);
  return [...renderInstrumentIcons(DEFAULT_APPEARANCE)] as [string,string][];
 });
 const added:string[]=[];
 for(const [id,url] of icons){
  if(!/^[a-z-]+$/.test(id)||!url.startsWith('data:image/png;base64,'))throw Error('Invalid portrait output');
  const path=`${destination}/${id}-portrait.png`;
  try{await access(path);continue;}catch{}
  await writeFile(path,Buffer.from(url.split(',')[1],'base64'));added.push(path);
 }
 console.log(JSON.stringify({added,preserved:icons.length-added.length}));
}finally{await browser.close();}
