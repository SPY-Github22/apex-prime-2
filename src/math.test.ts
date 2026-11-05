import { describe, it, expect } from 'vitest';
import {
  vec3Create,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Length,
  vec3Normalize,
  vec3Distance,
  vec3Dot,
  vec3Cross,
  vec3Lerp,
  clamp
} from './math';

describe('3D Space Flight Math Engine', () => {
  it('creates vectors with proper default and explicit coordinates', () => {
    const v1 = vec3Create();
    expect(v1).toEqual({ x: 0, y: 0, z: 0 });

    const v2 = vec3Create(10, -5, 25);
    expect(v2).toEqual({ x: 10, y: -5, z: 25 });
  });

  it('performs vector addition and subtraction correctly', () => {
    const a = vec3Create(1, 2, 3);
    const b = vec3Create(4, 5, 6);

    expect(vec3Add(a, b)).toEqual({ x: 5, y: 7, z: 9 });
    expect(vec3Sub(b, a)).toEqual({ x: 3, y: 3, z: 3 });
  });

  it('scales vectors and calculates magnitude', () => {
    const v = vec3Create(2, 3, 6);
    expect(vec3Length(v)).toBe(7); // sqrt(4 + 9 + 36) = sqrt(49) = 7

    const scaled = vec3Scale(v, 2);
    expect(scaled).toEqual({ x: 4, y: 6, z: 12 });
  });

  it('normalizes 3D vectors to unit vectors with zero-division safety', () => {
    const zero = vec3Create(0, 0, 0);
    expect(vec3Normalize(zero)).toEqual({ x: 0, y: 0, z: 0 });

    const v = vec3Create(0, 0, 10);
    const unit = vec3Normalize(v);
    expect(unit).toEqual({ x: 0, y: 0, z: 1 });
    expect(vec3Length(unit)).toBeCloseTo(1.0);
  });

  it('computes Euclidean distance and dot products', () => {
    const a = vec3Create(0, 0, 0);
    const b = vec3Create(3, 4, 0);
    expect(vec3Distance(a, b)).toBe(5);

    const up = vec3Create(0, 1, 0);
    const right = vec3Create(1, 0, 0);
    expect(vec3Dot(up, right)).toBe(0); // orthogonal
    expect(vec3Dot(up, up)).toBe(1); // parallel
  });

  it('computes 3D cross products according to right-hand rule', () => {
    const x = vec3Create(1, 0, 0);
    const y = vec3Create(0, 1, 0);
    const z = vec3Cross(x, y);
    expect(z).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('interpolates linearly and clamps bounds', () => {
    const a = vec3Create(0, 0, 0);
    const b = vec3Create(10, 20, 30);
    const mid = vec3Lerp(a, b, 0.5);
    expect(mid).toEqual({ x: 5, y: 10, z: 15 });

    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(7, 0, 10)).toBe(7);
  });
});
