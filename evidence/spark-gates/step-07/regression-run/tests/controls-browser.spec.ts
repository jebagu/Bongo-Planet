import {test,expect,type Page} from '@playwright/test';
import {emptyLegacyScene as emptyScene,newPiece} from '../src/core/contracts';
const scene=(page:Page)=>page.evaluate(()=>(window as any).__bongo.scene);
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);});
test('each inspector and global control changes exactly the selected field',async({page})=>{
 const vertices=await page.evaluate(()=>(window as any).__bongo.slots.filter((p:any)=>p.visible&&p.y>200&&p.y<700).slice(5,8).map((p:any)=>p.vertex));
 const initial=emptyScene();initial.pieces=[newPiece('generator',vertices[0],'g'),newPiece('note',vertices[1],'n'),newPiece('beat',vertices[2],'b')];
 await page.evaluate(s=>(window as any).__bongo.load(s),initial);
 const fields:[string,Record<string,string|number|boolean>][]=[['g',{period:3,phase:.5,reach:180,enabled:false}],['n',{degree:5,octave:5,timbre:'triangle',duration:2,level:.25}],['b',{sound:'snare',decay:.75,level:.3}]];
 for(const [id,changes] of fields){const slot=await page.evaluate(id=>{const b=(window as any).__bongo;return b.slots[b.scene.pieces.find((p:any)=>p.id===id).vertex];},id);await page.mouse.click(slot.x,slot.y);
  for(const [key,value] of Object.entries(changes)){const before=await scene(page),expected=structuredClone(before);Object.assign(expected.pieces.find((p:any)=>p.id===id),{[key]:value});const input=page.locator(`[data-field=${key}]`);
   if(typeof value==='boolean')await input.setChecked(value);else if(await input.evaluate(el=>el.tagName==='SELECT'))await input.selectOption(String(value));else{await input.fill(String(value));await input.dispatchEvent('change');}
   expect(await scene(page)).toEqual(expected);
  }
 }
 for(const [key,value] of Object.entries({bpm:150,key:7,scale:'minor',volume:.35,travel:.5,quantization:.125})){const before=await scene(page),expected=structuredClone(before);Object.assign(expected.settings,{[key]:value});const input=page.locator(`#${key==='bpm'?'tempo':key}`);
  if(await input.evaluate(el=>el.tagName==='SELECT'))await input.selectOption(String(value));else{await input.fill(String(value));await input.dispatchEvent('change');}expect(await scene(page)).toEqual(expected);
 }
});
test('failed local storage preserves both current scene and previous good save',async({page})=>{
 await page.locator('#fixture').selectOption('F01');await expect.poll(async()=>(await scene(page)).pieces.length).toBe(4);await page.locator('#save').click();const saved=await page.evaluate(()=>localStorage.getItem('bongo-planet-scene-v1'));await page.locator('#fixture').selectOption('F02');await expect.poll(async()=>(await scene(page)).pieces[1].id).toBe('chord-0');const current=await scene(page);
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});await page.locator('#save').click();await expect(page.locator('#notice')).toContainText('Save failed');expect(await scene(page)).toEqual(current);expect(await page.evaluate(()=>localStorage.getItem('bongo-planet-scene-v1'))).toBe(saved);
});
test('undo of a loaded same-ID different-kind scene cancels old travel and stays paused',async({page})=>{
 const b=await page.request.get('http://127.0.0.1:5417/BongoPlanet/fixtures/F05.json').then(r=>r.json());const a=structuredClone(b);a.pieces[1]=newPiece('generator',a.pieces[1].vertex,a.pieces[1].id);
 await page.evaluate(s=>(window as any).__bongo.load(s),a);await page.evaluate(s=>(window as any).__bongo.load(s),b);await page.locator('#play').click();await expect.poll(async()=>await page.evaluate(()=>(window as any).__bongo.status?.pending)).toBe(1);
 await page.locator('#undo').click();expect(await scene(page)).toEqual(a);await page.waitForTimeout(3300);expect(await page.evaluate(()=>(window as any).__bongo.status?.running)).toBe(false);expect(await page.evaluate(()=>(window as any).__bongo.events.filter((e:any)=>e.type==='onset').length)).toBe(0);
 await page.locator('#redo').click();expect(await scene(page)).toEqual(b);expect(await page.evaluate(()=>(window as any).__bongo.audio.state)).toBe('paused');
});
