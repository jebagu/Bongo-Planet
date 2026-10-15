import {defineConfig} from '@playwright/test';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=process.env.BONGO_MOVEMENT_LIVE_OUTPUT;
const playwrightOutput=process.env.BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT;
assert(typeof playwrightOutput==='string'&&playwrightOutput.length>0&&path.isAbsolute(playwrightOutput),
  'Require absolute BONGO_MOVEMENT_PLAYWRIGHT_OUTPUT; no default artifact directory');
export default defineConfig({
  outputDir:playwrightOutput,
  testDir:path.resolve('scripts'),testMatch:'movement-backpressure-live.spec.ts',
  workers:1,retries:0,timeout:90000,globalTimeout:100000,
  reporter:[['list'],['json',{outputFile:output?path.join(output,'runner-results.json'):undefined}]],
});
