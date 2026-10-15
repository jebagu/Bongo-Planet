import {defineConfig} from '@playwright/test';
import path from 'node:path';
const output=process.env.BONGO_RECONNECT_PLAYWRIGHT_OUTPUT;
if(!output||!path.isAbsolute(output))throw Error('Separate absolute BONGO_RECONNECT_PLAYWRIGHT_OUTPUT directory required');
export default defineConfig({testDir:path.resolve('scripts'),testMatch:'output-reconnect-current.spec.ts',outputDir:output,fullyParallel:false,workers:1,retries:0,timeout:30000,globalTimeout:45000,reporter:[['list'],['json',{outputFile:path.join(output,'runner.json')}]]});
