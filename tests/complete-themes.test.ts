import { describe, expect, it } from 'vitest';
import { ARCHIVED_COMPLETE_THEMES, COMPLETE_THEMES, applyCompleteTheme, isArchivedThemePreset, isThemeExperiment, refreshSavedTheme } from '../src/view/art/completeThemes';
import { DEFAULT_APPEARANCE, validateAppearance } from '../src/view/art/appearance';
import { exportCompositionFile, importCompositionFile } from '../src/compositionFile';
import { gatedExample } from '../src/core/gatedExamples';
import capturedOriginal from '../assets/theme-experiment-original.json';
import previousCatalog from '../assets/theme-engine/catalog-v1.json';
import previousSkyCatalog from '../assets/theme-engine/catalog-v2.json';
import previousSceneryCatalog from '../assets/theme-engine/catalog-v3.json';
import previousClearCatalog from '../assets/theme-engine/catalog-v4.json';
import { ThemeAtmosphere } from '../src/view/art/ThemeAtmosphere';
import { protectFromScenery, SCENERY_MASK_LAYER } from '../src/view/art/SceneryMask';
import { createToy } from '../src/view/art/toys';
import * as THREE from 'three';

describe('complete theme experiment', () => {
  it('protects the full instrument including its eyes without turning an invisible selection halo into an occluder', () => {
    const toy = createToy('note', { ...DEFAULT_APPEARANCE }, 'guitar');
    protectFromScenery(toy.group);
    const layer = new THREE.Layers(); layer.set(SCENERY_MASK_LAYER);
    toy.group.traverse(object => {
      if (object instanceof THREE.Mesh) expect(object.layers.test(layer)).toBe(object.name !== 'Selection halo');
    });
    expect(toy.group.getObjectByName('Eyes')!.children.every(eye => eye.layers.test(layer))).toBe(true);
  });
  it.each([...previousCatalog, ...previousSkyCatalog, ...previousSceneryCatalog, ...previousClearCatalog])('refreshes the untouched $theme.id browser preset while retaining explicit file values', previous => {
    const old = validateAppearance(previous), scene = gatedExample('chain');
    expect(refreshSavedTheme(old)).toEqual(applyCompleteTheme(old.theme!.id, old));
    expect(importCompositionFile(exportCompositionFile(scene, old)).appearance).toEqual(old);
  });
  it('keeps the approved lineup and archives the removed designs without changing the accepted palettes', () => {
    expect(COMPLETE_THEMES.map(theme => theme.id)).toEqual(['nebula-space', 'firefly-garden']);
    expect(ARCHIVED_COMPLETE_THEMES.map(theme => theme.id)).toEqual(['deep-space', 'sunday-picnic', 'cloud-pudding']);
    const previousNebula = validateAppearance(previousSceneryCatalog.find(look => look.theme.id === 'nebula-space'));
    expect(COMPLETE_THEMES[0].look).toEqual({ ...previousNebula, theme: { ...previousNebula.theme!, atmosphere: { ...previousNebula.theme!.atmosphere, decoration: 'distant-nebula', backgroundBlur: .6 } } });
    expect(COMPLETE_THEMES[1].look).toEqual(validateAppearance(previousSceneryCatalog.find(look => look.theme.id === 'firefly-garden')));
    for (const archived of ARCHIVED_COMPLETE_THEMES) {
      expect(archived.look).toEqual(validateAppearance(previousSceneryCatalog.find(look => look.theme.id === archived.id)));
      expect(isArchivedThemePreset(archived.look)).toBe(true);
      expect(isArchivedThemePreset({ ...archived.look, piano: '#123456' })).toBe(false);
    }
  });
  it('preserves Original and customized stored looks during the preset refresh', () => {
    const original = validateAppearance(capturedOriginal);
    expect(refreshSavedTheme(original)).toBe(original);
    const custom = validateAppearance({ ...previousCatalog[0], piano: '#123456' });
    expect(refreshSavedTheme(custom)).toBe(custom);
  });
  it('keeps the distant clouds behind the planet and outside the instrument area while orbiting', () => {
    const atmosphere = new ThemeAtmosphere();
    atmosphere.apply(ARCHIVED_COMPLETE_THEMES.find(theme => theme.id === 'sunday-picnic')!.look.theme);
    const clouds = atmosphere.getObjectsByProperty('name', 'Theme cloud');
    expect(clouds).toHaveLength(3);
    for (const euler of [new THREE.Euler(), new THREE.Euler(.6, 1.4, .2), new THREE.Euler(-1, -2, .9)]) {
      const rotation = new THREE.Quaternion().setFromEuler(euler), facing = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation);
      atmosphere.tick(0, true, rotation); atmosphere.updateMatrixWorld(true);
      for (const cloud of clouds) {
        const point = cloud.getWorldPosition(new THREE.Vector3());
        const depth = point.dot(facing);
        expect(depth).toBeLessThan(-1.1);
        expect(Math.sqrt(point.lengthSq() - depth * depth)).toBeGreaterThan(1.55);
      }
    }
    atmosphere.apply(); expect(atmosphere.visible).toBe(false); atmosphere.dispose();
  });
  it('preserves the archived solid characters and enables only the new distant sky in Nebula Space', () => {
    const atmosphere = new ThemeAtmosphere();
    for (const name of ['Theme cloud', 'Theme hill', 'Theme nebula', 'Theme little planet', 'Theme star']) {
      const characters = atmosphere.getObjectsByProperty('name', name);
      expect(characters.length).toBeGreaterThan(0);
      for (const character of characters) {
        const eyes = character.getObjectByName('Eyes')!;
        expect(eyes.children).toHaveLength(4);
        for (const mesh of character.children.filter(object => object instanceof THREE.Mesh)) {
          const box = new THREE.Box3().setFromObject(mesh);
          expect(box.getSize(new THREE.Vector3()).z).toBeGreaterThan(.01);
        }
      }
    }
    for (const theme of COMPLETE_THEMES) {
      atmosphere.apply(theme.look.theme);
      expect(atmosphere.hasScenery).toBe(theme.id === 'nebula-space');
      expect(atmosphere.getObjectByName('Distant nebula sky')!.visible).toBe(theme.id === 'nebula-space');
      expect(atmosphere.getObjectByName('Theme nebula characters')!.visible).toBe(false);
      expect(atmosphere.getObjectByName('Theme garden characters')!.visible).toBe(false);
    }
    atmosphere.dispose();
  });
  it('keeps the 3D sky twenty world units behind the globe and stable on screen through orbit and zoom', () => {
    const atmosphere = new ThemeAtmosphere();
    atmosphere.apply(COMPLETE_THEMES[0].look.theme);
    const stars = atmosphere.getObjectsByProperty('name', 'Distant star');
    expect(stars).toHaveLength(7);
    expect(atmosphere.getObjectsByProperty('name', 'Distant nebula')).toHaveLength(2);
    for (const star of stars) {
      expect(star.getObjectByName('Eyes')!.children).toHaveLength(4);
      const body = star.children.find(object => object instanceof THREE.Mesh) as THREE.Mesh;
      body.geometry.computeBoundingBox();
      expect(body.geometry.boundingBox!.getSize(new THREE.Vector3()).z).toBeGreaterThan(.04);
    }
    const camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, .1, 30);
    const sample = (position: THREE.Vector3, zoom: number, time: number) => {
      camera.position.copy(position); camera.lookAt(0, 0, 0); camera.zoom = zoom;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      atmosphere.tick(time, true, camera.quaternion, { camera, foreground: [new THREE.Sphere(new THREE.Vector3(0, 0, -4), 2)], viewportHeight: 1000, bufferSize: new THREE.Vector2(1440, 1000) });
      atmosphere.updateMatrixWorld(true);
      return stars.map(star => {
        const world = star.getWorldPosition(new THREE.Vector3()), depth = world.clone().applyMatrix4(camera.matrixWorldInverse).z;
        expect(depth).toBeLessThan(-23);
        expect(depth).toBeGreaterThan(-camera.far + 1);
        return { screen: world.project(camera).toArray(), width: new THREE.Box3().setFromObject(star).getSize(new THREE.Vector3()).length() * zoom };
      });
    };
    const initial = sample(new THREE.Vector3(0, 0, 3.5), 1, 0);
    const zoomed = sample(new THREE.Vector3(0, 0, 3.5), 1.6, 200);
    initial.forEach((star, index) => {
      expect(zoomed[index].screen[0]).toBeCloseTo(star.screen[0], 6);
      expect(zoomed[index].screen[1]).toBeCloseTo(star.screen[1], 6);
      expect(zoomed[index].width).toBeCloseTo(star.width, 6);
    });
    const orbited = sample(new THREE.Vector3(3.5, 0, 0), 1, 300);
    initial.forEach((star, index) => {
      expect(orbited[index].screen[0]).toBeCloseTo(star.screen[0], 6);
      expect(orbited[index].screen[1]).toBeCloseTo(star.screen[1], 6);
    });
    atmosphere.dispose();
  });
  it.each([...COMPLETE_THEMES, ...ARCHIVED_COMPLETE_THEMES])('round-trips every $name presentation value without changing the music', theme => {
    const scene = gatedExample('chain'), before = structuredClone(scene);
    expect(validateAppearance(JSON.parse(JSON.stringify(theme.look)))).toEqual(theme.look);
    expect(importCompositionFile(exportCompositionFile(scene, theme.look))).toEqual({ scene, appearance: theme.look });
    expect(scene).toEqual(before);
  });
  it('restores the captured look exactly and never mutates a theme or the snapshot', () => {
    const original = validateAppearance(capturedOriginal), before = structuredClone(original);
    for (const theme of COMPLETE_THEMES) {
      const applied = applyCompleteTheme(theme.id, original);
      applied.switches.onColor = '#123456';
      applied.theme!.lights.keyPosition[0] = 9;
      expect(applyCompleteTheme(theme.id, original)).toEqual(theme.look);
      expect(applyCompleteTheme('original', original)).toEqual(before);
    }
    expect(original).toEqual(before);
    expect(validateAppearance(DEFAULT_APPEARANCE)).not.toHaveProperty('theme');
    expect(() => applyCompleteTheme('unknown', original)).toThrow();
  });
  it.each([
    { version: 2 }, { id: 'unknown' },
    { lights: { ...COMPLETE_THEMES[0].look.theme!.lights, key: 'url(evil)' } },
    { materials: { roughness: Infinity, clearcoat: 0, texture: 'wood' } },
    { motion: { ...COMPLETE_THEMES[0].look.theme!.motion, wobble: 2 } },
    { sparks: { ...COMPLETE_THEMES[0].look.theme!.sparks, size: 20 } },
    { atmosphere: { ...COMPLETE_THEMES[0].look.theme!.atmosphere, fogNear: 8, fogFar: 3 } },
    { atmosphere: { ...COMPLETE_THEMES[0].look.theme!.atmosphere, backgroundBlur: 10 } },
    { unexpected: true },
  ])('rejects malformed presentation values before applying them: %j', patch => {
    const look = COMPLETE_THEMES[0].look;
    expect(() => validateAppearance({ ...look, theme: { ...look.theme, ...patch } })).toThrow();
  });
  it('enables the experiment only at its dedicated path or explicit flag', () => {
    expect(isThemeExperiment('/BongoPlanet/theme-experiment/')).toBe(true);
    expect(isThemeExperiment('/BongoPlanet/theme-experiment')).toBe(true);
    expect(isThemeExperiment('/BongoPlanet/', '?theme-experiment=1')).toBe(true);
    expect(isThemeExperiment('/BongoPlanet/')).toBe(false);
    expect(isThemeExperiment('/BongoPlanet/other-theme-experiment/')).toBe(false);
  });
});
