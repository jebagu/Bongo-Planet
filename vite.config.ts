import { defineConfig } from 'vite';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep the asset explorer available in both Vite dev and the built preview.
function composerExplorer() {
  let output = '';
  return {
    name: 'composer-explorer',
    configResolved(config: { root: string; build: { outDir: string } }) {
      output = resolve(config.root, config.build.outDir, 'research/mario-paint');
    },
    closeBundle() {
      const source = resolve('research/mario-paint');
      const manifest = readFileSync(resolve(source, 'assets/manifest.json'), 'utf8');
      const html = readFileSync(resolve(source, 'preview-template.html'), 'utf8').replace('/*MANIFEST*/', manifest.replaceAll('<', '\\u003c'));
      mkdirSync(output, { recursive: true });
      writeFileSync(resolve(output, 'index.html'), html);
      for (const file of ['viewer.js', 'viewer.css', 'README.md', 'Mario-Paint-Composer-Assets.zip', 'assets']) {
        cpSync(resolve(source, file), resolve(output, file), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: '/BongoPlanet/',
  plugins: [composerExplorer()],
  build: {
    rolldownOptions: {
      input: { planet: resolve('index.html'), aiMusic: resolve('ai-music/index.html') },
    },
  },
  server: { host: '127.0.0.1', port: 5417, strictPort: true },
  preview: { host: '127.0.0.1', port: 5417, strictPort: true },
});
