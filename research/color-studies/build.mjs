import { build } from 'vite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
await build({ configFile: false, root, base: './', build: { outDir: 'export', emptyOutDir: true } });
const output = resolve(root, 'export');
const source = readFileSync(resolve(output, 'index.html'), 'utf8');
const jsFiles = readdirSync(resolve(output, 'assets')).filter(file => file.endsWith('.js'));
if (jsFiles.length !== 1) throw Error('Portable HTML must have one self-contained JavaScript bundle.');
const script = readFileSync(resolve(output, 'assets', jsFiles[0]), 'utf8').replace(/<\/script/gi, '<\\/script');
let html = source.replace(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${script}</script>`);
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => {
  let css = readFileSync(resolve(output, href), 'utf8');
  css = css.replace(/url\(([^)]+)\)/g, (all, raw) => {
    const path = raw.replace(/^['"]|['"]$/g, '');
    if (/^(data:|https?:)/.test(path)) return all;
    const extension = path.split('.').at(-1);
    const mime = extension === 'woff2' ? 'font/woff2' : extension === 'woff' ? 'font/woff' : 'application/octet-stream';
    const file = readFileSync(resolve(output, 'assets', path));
    return `url(data:${mime};base64,${file.toString('base64')})`;
  });
  return `<style>${css}</style>`;
});
html = html.replace('href="../../"', 'href="https://bongo-planet.jebagu.chatgpt.site/"');
const target = resolve(root, 'Bongo-Planet-Color-Studies.html');
writeFileSync(target, html);
console.log(`Self-contained HTML: ${target} (${Buffer.byteLength(html)} bytes)`);
