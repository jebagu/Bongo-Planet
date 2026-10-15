import {defineConfig} from '@playwright/test';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=process.env.BONGO_MOVEMENT_SUCCESSOR_EVIDENCE_DIR;
const runner=process.env.BONGO_MOVEMENT_SUCCESSOR_PLAYWRIGHT_OUTPUT;
assert(typeof output==='string'&&path.isAbsolute(output),'Require absolute fresh successor evidence directory');
assert(typeof runner==='string'&&path.isAbsolute(runner),'Require absolute separate successor runner directory');
assert(output!==runner&&!output.startsWith(runner+path.sep)&&!runner.startsWith(output+path.sep),'Require disjoint successor outputs');
export default defineConfig({testDir:path.resolve('scripts'),testMatch:'movement-backpressure-successor.spec.ts',outputDir:runner,workers:1,retries:0,timeout:90000,globalTimeout:100000,reporter:[['list'],['json',{outputFile:path.join(runner,'runner.json')}]]});
