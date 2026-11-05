import { Vector3D } from './types';

export function vec3Create(x = 0, y = 0, z = 0): Vector3D {
  return { x, y, z };
}

export function vec3Add(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Sub(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vec3Scale(v: Vector3D, s: number): Vector3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Length(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vec3Normalize(v: Vector3D): Vector3D {
  const len = vec3Length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function vec3Distance(a: Vector3D, b: Vector3D): number {
  return vec3Length(vec3Sub(a, b));
}

export function vec3Dot(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vec3Cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function vec3Lerp(a: Vector3D, b: Vector3D, t: number): Vector3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
