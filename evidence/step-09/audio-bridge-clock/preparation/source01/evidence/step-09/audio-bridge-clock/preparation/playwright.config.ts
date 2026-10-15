import {defineConfig} from '@playwright/test';
import path from 'node:path';
const output=process.env.BONGO_AUDIO_CLOCK_PLAYWRIGHT_OUTPUT;
if(!output||!path.isAbsolute(output))throw Error('Fresh absolute BONGO_AUDIO_CLOCK_PLAYWRIGHT_OUTPUT directory required');
export default defineConfig({testDir:path.resolve('scripts'),testMatch:'output-audio-clock.spec.ts',outputDir:output,fullyParallel:false,workers:1,retries:0,timeout:280000,globalTimeout:290000,reporter:[['list'],['json',{outputFile:path.join(output,'runner.json')}]]});
