import {defineConfig} from '@playwright/test';
import path from 'node:path';
const output=process.env.BONGO_MOVEMENT_LIVE_OUTPUT;
export default defineConfig({
  testDir:path.resolve('scripts'),testMatch:'movement-backpressure-live.spec.ts',
  workers:1,retries:0,timeout:90000,globalTimeout:100000,
  reporter:[['list'],['json',{outputFile:output?path.join(output,'runner-results.json'):undefined}]],
});
