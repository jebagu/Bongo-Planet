import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
export default defineConfig({testDir:fileURLToPath(new URL('../../../../scripts/',import.meta.url)),testMatch:'camera-output-contract.spec.ts',workers:1,globalTimeout:45000,timeout:30000,reporter:'list',use:{browserName:'chromium'},outputDir:process.env.BONGO_CAMERA_PLAYWRIGHT_OUTPUT??'evidence/step-08/camera-output-contract/unauthorized-output'});
