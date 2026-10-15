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

  it('keeps every connection sample above the sphere and preserves endpoints', () => {
    for (const [a, b] of topology.edges) {
      const samples = surfaceArc(topology.vertices[a], topology.vertices[b], 24, 1.018);
      expect(samples[0]).toEqual(toRenderPoint(topology.vertices[a], 1.018));
      expect(samples.at(-1)).toEqual(toRenderPoint(topology.vertices[b], 1.018));
      for (const sample of samples) expect(Math.hypot(...sample)).toBeCloseTo(1.018, 10);
    }
  });

  it('uses finite deterministic surface paths for poles and antipodal cases', () => {
    const pairs: [Vec3, Vec3][] = [
      [[0, 0, 1], [0, 0, -1]],
      [[1, 0, 0], [-1, 0, 0]],
      [[1, 0, 0], [-Math.sqrt(1 - 1e-12), 1e-6, 0]],
      [[0, 0, 1], [0, 0, 1]],
    ];
    for (const [a, b] of pairs) {
      expect(surfacePoint(a, b, 0)).toEqual(a);
      expect(surfacePoint(a, b, 1)).toEqual(b);
      expect(surfaceArc(a, b)).toEqual(surfaceArc(a, b));
      for (let i = 0; i <= 100; i++) {
        const p = surfacePoint(a, b, i / 100);
        expect(p.every(Number.isFinite)).toBe(true);
        expect(Math.hypot(...p)).toBeCloseTo(1, 10);
      }
    }
    expect(angle([0, 0, 1], surfacePoint([0, 0, 1], [0, 0, -1], 0.5))).toBeCloseTo(Math.PI / 2, 10);
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
