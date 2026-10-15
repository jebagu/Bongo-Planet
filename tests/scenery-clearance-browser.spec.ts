import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import archivedSceneryCatalog from '../assets/theme-engine/catalog-v3.json' with { type: 'json' };
import { COMPLETE_THEMES } from '../src/view/art/completeThemes';

const views = [
  { name: 'desktop', width: 1440, height: 1000, dpr: 1, zoom: 1, camera: [.3, .26, 3.5], up: [0, 1, 0] },
  { name: 'orbit-stacked', width: 1440, height: 1000, dpr: 1, zoom: 1.25, camera: [-2, 1, 2.8], up: [0, 1, 0] },
  { name: 'narrow-retina', width: 825, height: 1000, dpr: 2, zoom: .8, camera: [2, .4, -2.8], up: [1, 0, .2] },
  { name: 'phone-retina', width: 390, height: 844, dpr: 2, zoom: 1, camera: [.3, .26, 3.5], up: [0, 1, 0] },
];

const presentations = [
  { name: 'distant-nebula', current: true, look: COMPLETE_THEMES.find(theme => theme.id === 'nebula-space')!.look },
  ...['nebula-space', 'sunday-picnic', 'cloud-pudding'].map(id => ({ name: id, current: false, look: archivedSceneryCatalog.find(look => look.theme.id === id)! })),
];

for (const presentation of presentations) for (const view of views) {
  test(`${presentation.current ? 'current' : 'archived'} ${presentation.name} keeps musical silhouettes clear at ${view.name}`, async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: view.dpr, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /shader|WebGL|THREE/.test(message.text())) errors.push(message.text()); });
    try {
      await page.goto(`http://127.0.0.1:5417/BongoPlanet/${presentation.current ? '' : 'theme-experiment/'}`);
      await page.locator('#fixture').selectOption('C02');
      await expect.poll(() => page.evaluate(() => (window as any).__bongo.scene.pieces.length)).toBeGreaterThan(5);
      if (presentation.current) await page.locator('#complete-theme').selectOption('nebula-space');
      // Historical file imports remain supported even though these designs are no longer offered.
      else await page.evaluate(look => (window as any).__bongo.look.set(look), presentation.look);
      const frame = await page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames);
      await page.evaluate(view => {
        const app = (window as any).__bongo;
        app.look.set({ ...app.look.get(), size: 1.6 });
        const scene = app.scene, note = scene.pieces.find((piece: any) => piece.kind === 'note');
        const layers = scene.pieces.filter((piece: any) => piece.vertex === note.vertex).length;
        for (let i = layers; i < 4; i++) scene.pieces.push({ ...note, id: `background-stack-${i}` });
        app.edit(scene);
        app.view.camera.position.set(...view.camera); app.view.camera.up.set(...view.up);
        app.view.camera.lookAt(0, 0, 0); app.view.camera.zoom = view.zoom;
        app.view.camera.updateProjectionMatrix();
      }, view);
      await expect.poll(() => page.evaluate(() => (window as any).__bongo.view.getDiagnostics().frames)).toBeGreaterThan(frame + 2);
      const proof = await page.evaluate(() => {
        const app = (window as any).__bongo, view = app.view, renderer = view.renderer, camera = view.camera;
        const scenery = view.world.getObjectByName('Theme scenery'), mask = scenery.mask;
        view.drawWorld();
        const target = mask.target, width = mask.bufferSize.x, height = mask.bufferSize.y;
        const silhouette = new Uint8Array(target.width * target.height * 4);
        renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, silhouette);
        const gl = renderer.getContext(), withScenery = new Uint8Array(width * height * 4), without = new Uint8Array(withScenery.length);
        view.drawWorld(); gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, withScenery);
        try {
          scenery.visible = false;
          view.drawWorld(); gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, without);
        } finally { scenery.visible = true; view.drawWorld(); }
        let protectedPixels = 0, protectedDifference = 0, backgroundPixels = 0, worstPixel = [0, 0];
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const pixel = (y * width + x) * 4;
          const mx = Math.min(target.width - 1, Math.floor((x + .5) / width * target.width));
          const my = Math.min(target.height - 1, Math.floor((y + .5) / height * target.height));
          const coverage = silhouette[(my * target.width + mx) * 4];
          let difference = 0;
          for (let c = 0; c < 4; c++) difference = Math.max(difference, Math.abs(withScenery[pixel + c] - without[pixel + c]));
          if (coverage === 255) { protectedPixels++; if (difference > protectedDifference) { protectedDifference = difference; worstPixel = [x, y]; } }
          else if (difference > 3) backgroundPixels++;
        }
        const foreground = view.sceneryClearance().foreground;
        let nearestBackground = -Infinity;
        scenery.traverseVisible((object: any) => {
          if (!object.isMesh) return;
          const positions = object.geometry.attributes.position;
          const point = camera.position.clone();
          for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
            nearestBackground = Math.max(nearestBackground, point.z);
          }
        });
        return { protectedPixels, protectedDifference, backgroundPixels, worstPixel,
          depthGap: Math.min(...foreground.map((sphere: any) => sphere.center.z - sphere.radius)) - nearestBackground,
          distantSkyVisible: scenery.getObjectByName('Distant nebula sky').visible,
          distantStarsWithEyes: scenery.getObjectsByProperty('name', 'Distant star').filter((star: any) => star.getObjectByName('Eyes')?.children.length === 4).length,
          rearPieces: [...view.pieces.values()].filter((piece: any) => piece.material.opacity < .5).length,
          stackLayers: Math.max(...app.scene.pieces.map((piece: any) => app.scene.pieces.filter((p: any) => p.vertex === piece.vertex).length)),
          overflow: document.documentElement.scrollWidth > innerWidth, diagnostics: view.getDiagnostics() };
      });
      const directory = presentation.current ? 'evidence/theme-engine/distant-nebula' : 'evidence/theme-engine/background-clearance';
      mkdirSync(directory, { recursive: true });
      const name = presentation.current ? view.name : `${presentation.name}-${view.name}`;
      writeFileSync(`${directory}/${name}.json`, JSON.stringify(proof, null, 2));
      await page.screenshot({ path: `${directory}/${name}.png` });
      expect(proof.protectedPixels).toBeGreaterThan(100);
      // Allow two percent channel rounding at multisampled silhouette edges.
      expect(proof.protectedDifference).toBeLessThanOrEqual(5);
      expect(proof.backgroundPixels).toBeGreaterThan(100);
      expect(proof.depthGap).toBeGreaterThan(presentation.current ? 14 : 1.5);
      expect(proof.distantSkyVisible).toBe(presentation.current);
      if (presentation.current) expect(proof.distantStarsWithEyes).toBe(7);
      expect(proof.rearPieces).toBeGreaterThan(0);
      expect(proof.stackLayers).toBe(4);
      expect(proof.overflow).toBe(false);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
