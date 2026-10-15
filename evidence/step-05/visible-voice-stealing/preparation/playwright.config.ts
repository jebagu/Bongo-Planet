import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({testDir:path.resolve('scripts'),testMatch:'ui-voice-stealing-browser.spec.ts',workers:1,retries:0,timeout:26000,globalTimeout:30000,reporter:[['list']],use:{browserName:'chromium',launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']}}});
