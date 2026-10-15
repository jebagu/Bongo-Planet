import {loadFixture,clearPlanet,connectOutput,disconnectOutput,renderFPS,appScene} from './browser-support';
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const destination='evidence/step-07/gesture-history';
const scene=(page:Page)=>page.evaluate(()=>(window as any).__bongo.scene);

test.beforeEach(async({page})=>{
  fs.mkdirSync(destination,{recursive:true});
  await page.goto('http://127.0.0.1:5417/BongoPlanet/');await page.waitForFunction(()=>(window as any).__bongo?.slots.length===92);
  await loadFixture(page,'F07');await expect.poll(async()=>(await scene(page)).pieces.length).toBe(6);
});

for(const scope of ['global-volume','note-level'] as const){
  test(`one native ${scope} slider gesture changes several input values and makes one Undo/Redo entry`,async({page})=>{
    let nodeId:string|undefined;
    if(scope==='note-level'){
      const pick=await page.evaluate(()=>{const b=(window as any).__bongo;const piece=b.scene.pieces.find((p:any)=>b.slots[p.vertex].visible&&b.slots[p.vertex].y>180&&b.slots[p.vertex].y<760);return {id:piece.id,slot:b.slots[piece.vertex]};});
      nodeId=pick.id;await page.mouse.click(pick.slot.x,pick.slot.y);
    }
    const selector=scope==='global-volume'?'#volume':'[data-field=level]';
    const control=page.locator(selector);await control.scrollIntoViewIfNeeded();await expect(control).toBeInViewport();const box=await control.boundingBox();expect(box).toBeTruthy();
    const range=await control.evaluate(el=>{const input=el as HTMLInputElement;return {min:Number(input.min),max:Number(input.max),value:Number(input.value)};});
    const before=await scene(page),preFraction=(range.value-range.min)/(range.max-range.min);
    await page.evaluate(selector=>{(window as any).__gestureInput=[];document.addEventListener('input',event=>{const el=event.target as HTMLInputElement;if(el.matches(selector))(window as any).__gestureInput.push({trusted:event.isTrusted,value:Number(el.value),time:performance.now()});});},selector);
    const x=(fraction:number)=>box!.x+8+(box!.width-16)*fraction,y=box!.y+box!.height/2;
    await page.mouse.move(x(preFraction),y);await page.mouse.down();
    const intermediate=[];
    for(const fraction of [.2,.4,.8,.55]){await page.mouse.move(x(fraction),y,{steps:4});intermediate.push(await scene(page));}
    await page.mouse.up();const after=await scene(page),inputs=await page.evaluate(()=>(window as any).__gestureInput);
    await page.locator('#undo').click();const afterUndo=await scene(page);await page.locator('#redo').click();const afterRedo=await scene(page);
    fs.writeFileSync(`${destination}/${scope}.json`,JSON.stringify({date:new Date().toISOString(),scope,nodeId,before,intermediate,after,afterUndo,afterRedo,actualInputEvents:inputs},null,2)+'\n');
    const value=(s:any)=>scope==='global-volume'?s.settings.volume:s.pieces.find((p:any)=>p.id===nodeId).level;
    expect(inputs.filter((e:any)=>e.trusted).length).toBeGreaterThanOrEqual(3);
    expect(new Set(inputs.filter((e:any)=>e.trusted).map((e:any)=>e.value)).size,'Actual native slider must traverse several distinct values').toBeGreaterThanOrEqual(3);
    expect(value(after)).toBe(inputs.at(-1).value);
    const expected=structuredClone(before);if(scope==='global-volume')expected.settings.volume=value(after);else expected.pieces.find((p:any)=>p.id===nodeId).level=value(after);expect(after).toEqual(expected);
    expect(after).not.toEqual(before);expect(afterUndo,'One Undo must restore the whole pre-gesture scene').toEqual(before);expect(afterRedo,'One Redo must restore the whole final gesture scene').toEqual(after);
    await page.screenshot({path:`${destination}/${scope}-after-redo.png`});
  });
}

test('actual piece drag through several destinations commits one integrated relocation history entry',async({page})=>{
  const before=await scene(page),slots=await page.evaluate(()=>(window as any).__bongo.slots);
  const piece=before.pieces.find((p:any)=>slots[p.vertex].visible&&slots[p.vertex].y>180&&slots[p.vertex].y<760),from=slots[piece.vertex];
  const destinations=slots.filter((s:any)=>s.visible&&s.y>180&&s.y<760&&!before.pieces.some((p:any)=>p.vertex===s.vertex)&&Math.hypot(s.x-from.x,s.y-from.y)>80).slice(0,3);
  expect(destinations).toHaveLength(3);
  await page.mouse.move(from.x,from.y);await page.mouse.down();const intermediate=[];
  for(const slot of destinations){await page.mouse.move(slot.x,slot.y,{steps:8});intermediate.push(await scene(page));}
  await page.mouse.up();const after=await scene(page);
  await page.locator('#undo').click();const afterUndo=await scene(page);await page.locator('#redo').click();const afterRedo=await scene(page);
  fs.writeFileSync(`${destination}/piece-drag.json`,JSON.stringify({date:new Date().toISOString(),pieceId:piece.id,destinations,before,intermediate,after,afterUndo,afterRedo},null,2)+'\n');
  expect(intermediate.every(s=>JSON.stringify(s)===JSON.stringify(before))).toBe(true);
  const expected=structuredClone(before);expected.pieces.find((p:any)=>p.id===piece.id).vertex=destinations.at(-1).vertex;
  expect(after).toEqual(expected);expect(afterUndo).toEqual(before);expect(afterRedo).toEqual(after);
  await page.screenshot({path:`${destination}/piece-drag-after-redo.png`});
});
