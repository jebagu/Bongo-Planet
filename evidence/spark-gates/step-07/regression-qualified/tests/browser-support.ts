import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {validateScene,type Scene} from '../src/core/contracts';
import {instrumentScene} from '../src/core/instruments';
import {labelPieces} from '../src/core/pieceLabels';
export const appScene=(scene:Scene)=>labelPieces(instrumentScene(validateScene(scene)));
// Research fixtures remain supported through the actual Import action even
// though only prepared musical examples appear in the ordinary Patterns menu.
export async function loadFixture(page:Page,id:string){const buffer=readFileSync(`public/fixtures/${id}.json`);await page.locator('#file').setInputFiles({name:`${id}.json`,mimeType:'application/json',buffer});await page.waitForFunction(scene=>JSON.stringify((window as any).__bongo.scene)===JSON.stringify(scene),appScene(JSON.parse(buffer.toString())));}
export async function clearPlanet(page:Page){await page.locator('#fixture').selectOption('F00');}
export async function connectOutput(page:Page){await page.evaluate(()=>(window as any).__bongo.outputAdapter.connect());}
export async function disconnectOutput(page:Page){await page.evaluate(()=>(window as any).__bongo.outputAdapter.disconnect());}
export async function renderFPS(page:Page,fps:number){await page.evaluate(f=>(window as any).__bongo.view.setFPS(f),fps);}
