import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DEFAULT_APPEARANCE, readAppearance, validateAppearance } from '../src/view/art/appearance';
import { createToy, createFacetedPlanet } from '../src/view/art/toys';
import { topology } from '../src/core/geometry';
import { toRenderPoint } from '../src/view/math';

describe('appearance import boundaries', () => {
  it('round-trips a look independently of composition fields', () => {
    const edited = { ...DEFAULT_APPEARANCE, note: '#AABBCC', style: 'toys' as const };
    expect(validateAppearance(JSON.parse(JSON.stringify(edited)))).toEqual(edited);
    expect(validateAppearance({ ...edited, pieces: ['untrusted'], settings: { bpm: 1 } })).toEqual(edited);
    expect(DEFAULT_APPEARANCE.eyes).toBe(true);
  });
  it.each([
    { glow: Infinity }, { glow: -1 }, { size: 99 }, { lighting: 0 },
    { eyes: 'false' }, { bounce: 'false' }, { planet: 'url(evil)' }, { background: '#123' }, { version: 2 }, { style: 'unknown' }, { pulseEffects: 'invalid' },
  ])('rejects malformed imported settings %j', patch => {
    expect(() => validateAppearance({ ...DEFAULT_APPEARANCE, ...patch })).toThrow();
  });
  it('recovers from corrupt or unavailable storage', () => {
    expect(readAppearance({ getItem: () => '{broken' })).toEqual(DEFAULT_APPEARANCE);
    expect(readAppearance({ getItem: () => { throw Error('Denied'); } })).toEqual(DEFAULT_APPEARANCE);
  });
  it.each(['perspective', 'gentle', 'orthographic'])('ignores the removed %s projection preference in older looks', projection => {
    expect(validateAppearance({ ...DEFAULT_APPEARANCE, projection })).toEqual(DEFAULT_APPEARANCE);
  });
  it('keeps eyes and bounce on when migrating older saved looks', () => {
    expect(readAppearance({ getItem: () => JSON.stringify({ ...DEFAULT_APPEARANCE, eyes: false, bounce: false }) }))
      .toMatchObject({ eyes: true, bounce: true });
    const { eyes: _, bounce: __, ...old } = DEFAULT_APPEARANCE;
    expect(validateAppearance(old)).toMatchObject({ eyes: true, bounce: true });
  });
  it('migrates older looks to the single toy style and accepts new skies', () => {
    const { pulseEffects: _, ...old } = DEFAULT_APPEARANCE;
    expect(validateAppearance(old).pulseEffects).toBe('struts');
    expect(validateAppearance({ ...DEFAULT_APPEARANCE, style:'classic',surface:'curved',pulseEffects: 'legacy' })).toMatchObject({style:'toys',surface:'seams',pulseEffects:'struts',backdrop:'cream'});
    expect(validateAppearance({...DEFAULT_APPEARANCE,backdrop:'stars'}).backdrop).toBe('stars');
    expect(()=>validateAppearance({...DEFAULT_APPEARANCE,backdrop:'unknown'})).toThrow();
  });
});

describe('portable toy art', () => {
  it.each(['generator', 'note', 'beat'] as const)('exports usable %s meshes with optional eyes and no hardware', kind => {
    const toy = createToy(kind, { ...DEFAULT_APPEARANCE, eyes: false });
    expect(toy.eyes.visible).toBe(false);
    const bounds = new THREE.Box3().setFromObject(toy.group);
    expect(bounds.isEmpty()).toBe(false);
    expect(bounds.getSize(new THREE.Vector3()).length()).toBeLessThan(0.5);
    const names: string[] = [];
    toy.group.traverse(object => {
      names.push(object.name);
      if (object instanceof THREE.Mesh) {
        for (const n of object.geometry.attributes.position.array) expect(Number.isFinite(n)).toBe(true);
      }
    });
    expect(names).toContain('Eyes');
    expect(names.some(name => /wind|key|hardware/i.test(name))).toBe(false);
  });
  it('keeps the musical topology and points all planet faces outward', () => {
    const planet = createFacetedPlanet(topology.vertices.map(p => new THREE.Vector3(...toRenderPoint(p))), topology.faces, DEFAULT_APPEARANCE.planet);
    const positions = planet.geometry.attributes.position;
    const normals = planet.geometry.attributes.normal;
    expect(positions.count).toBe(topology.faces.length * 3);
    for (let i = 0; i < positions.count; i += 3) {
      const p = new THREE.Vector3().fromBufferAttribute(positions, i);
      const normal = new THREE.Vector3().fromBufferAttribute(normals, i);
      expect(normal.dot(p)).toBeGreaterThan(0);
    }
  });
});
