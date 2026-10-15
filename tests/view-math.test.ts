import { describe, expect, it } from 'vitest';
import { angle, dot, surfacePoint, topology } from '../src/core/geometry';
import type { Vec3 } from '../src/core/contracts';
import { surfaceArc, toRenderPoint, wavefront } from '../src/view/math';

describe('surface presentation geometry', () => {
  it('maps right / forward / up without changing distance or handedness', () => {
    expect(toRenderPoint([1, 2, 3])).toEqual([1, 3, -2]);
    for (const a of topology.vertices) for (const b of topology.vertices) {
      expect(dot(toRenderPoint(a), toRenderPoint(b))).toBeCloseTo(dot(a, b), 12);
    }
  });

  it('supports an explicit display lift and preserves endpoints', () => {
    for (const [a, b] of topology.edges) {
      const samples = surfaceArc(topology.vertices[a], topology.vertices[b], 24, 1.018);
      expect(samples[0]).toEqual(toRenderPoint(topology.vertices[a], 1.018));
      expect(samples.at(-1)).toEqual(toRenderPoint(topology.vertices[b], 1.018));
      for (const sample of samples) expect(Math.hypot(...sample)).toBeCloseTo(1.018, 10);
    }
  });

  it('keeps default arcs finite and within 1e-6 of unit radius for all 92 × 92 vertex pairs', () => {
    expect(topology.vertices).toHaveLength(92);
    for (const [aId, a] of topology.vertices.entries()) for (const [bId, b] of topology.vertices.entries()) {
      const samples = surfaceArc(a, b), pair = `${aId}→${bId}`;
      expect(samples, pair).toHaveLength(49);
      expect(samples[0], pair).toEqual(toRenderPoint(a));
      expect(samples.at(-1), pair).toEqual(toRenderPoint(b));
      expect(samples.every(sample => sample.every(Number.isFinite)), pair).toBe(true);
      expect(samples.every(sample => Math.abs(Math.hypot(...sample) - 1) <= 1e-6), pair).toBe(true);
    }
  });

  it('uses finite deterministic surface paths for poles and antipodal cases', () => {
    const pairs: [Vec3, Vec3][] = [
      [[0, 0, 1], [0, 0, -1]],
      [[1, 0, 0], [-1, 0, 0]],
      [[1, 0, 0], [-Math.sqrt(1 - 1e-12), 1e-6, 0]],
      [[0, 0, 1], [0, 0, 1]],
      [[0, 0, -1], [0, 1, 0]],
    ];
    for (const [a, b] of pairs) {
      expect(surfacePoint(a, b, 0)).toEqual(a);
      expect(surfacePoint(a, b, 1)).toEqual(b);
      const samples = surfaceArc(a, b);
      expect(samples).toEqual(surfaceArc(a, b));
      expect(samples[0]).toEqual(toRenderPoint(a));
      expect(samples.at(-1)).toEqual(toRenderPoint(b));
      expect(samples.every(sample => sample.every(Number.isFinite))).toBe(true);
      expect(samples.every(sample => Math.abs(Math.hypot(...sample) - 1) <= 1e-6)).toBe(true);
      expect(angle(toRenderPoint(a), samples[24])).toBeCloseTo(angle(a, b) / 2, 10);
      for (let i = 0; i <= 100; i++) {
        const p = surfacePoint(a, b, i / 100);
        expect(p.every(Number.isFinite)).toBe(true);
        expect(Math.hypot(...p)).toBeCloseTo(1, 10);
      }
    }
    expect(angle([0, 0, 1], surfacePoint([0, 0, 1], [0, 0, -1], 0.5))).toBeCloseTo(Math.PI / 2, 10);
    const poleArc = surfaceArc([0, 0, 1], [0, 0, -1]);
    expect(angle(toRenderPoint([0, 0, 1]), poleArc[12])).toBeCloseTo(Math.PI / 4, 10);
    expect(angle(toRenderPoint([0, 0, 1]), poleArc[36])).toBeCloseTo(3 * Math.PI / 4, 10);
  });

  it('wavefronts have the requested surface angle across poles and the far side', () => {
    for (const source of [[0, 0, 1], [0, 0, -1], topology.vertices[37]] as Vec3[]) {
      for (const theta of [0, Math.PI / 6, Math.PI / 2, Math.PI * 0.99, Math.PI]) {
        for (const render of wavefront(source, theta, 48, 1)) {
          const composition: Vec3 = [render[0], -render[2], render[1]];
          expect(Math.hypot(...composition)).toBeCloseTo(1, 10);
          expect(dot(source, composition)).toBeCloseTo(Math.cos(theta), 10);
        }
      }
    }
  });
});
