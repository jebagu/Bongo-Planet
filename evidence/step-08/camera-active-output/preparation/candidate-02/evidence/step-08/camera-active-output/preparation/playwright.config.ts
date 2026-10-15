import {defineConfig} from '@playwright/test';
import path from 'node:path';

const output = process.env.BONGO_ACTIVE_CAMERA_PLAYWRIGHT_OUTPUT;
if (!output) throw Error('Separate absolute BONGO_ACTIVE_CAMERA_PLAYWRIGHT_OUTPUT required');
if (!path.isAbsolute(output)) throw Error('Playwright output must be absolute');
export default defineConfig({
  testDir: path.resolve('scripts'),
  testMatch: 'active-camera-output.spec.ts',
  outputDir: output,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  globalTimeout: 45000,
  reporter: [['list']],
});
