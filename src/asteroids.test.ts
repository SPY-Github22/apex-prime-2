import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { AsteroidFieldManager, AsteroidFieldConfig } from './asteroids';

describe('AsteroidFieldManager 3D Belt & Collision Engine', () => {
  const testConfig: AsteroidFieldConfig = {
    count: 20,
    minRadius: 5.0,
    maxRadius: 15.0,
    beltInnerRadius: 50.0,
    beltOuterRadius: 200.0,
    beltHeight: 30.0
  };

  it('generates expected asteroid count and spatial distribution', () => {
    const manager = new AsteroidFieldManager(testConfig);
    expect(manager.asteroids.length).toBe(20);
    expect(manager.getActiveCount()).toBe(20);

    for (const ast of manager.asteroids) {
      expect(ast.radius).toBeGreaterThanOrEqual(testConfig.minRadius);
      expect(ast.radius).toBeLessThanOrEqual(testConfig.maxRadius);
      expect(ast.health).toBeGreaterThan(0);
      expect(ast.minerals).toBeGreaterThan(0);
      expect(ast.isDestroyed).toBe(false);

      const horizontalDist = Math.hypot(ast.position.x, ast.position.z);
      expect(horizontalDist).toBeGreaterThanOrEqual(testConfig.beltInnerRadius - 1);
      expect(horizontalDist).toBeLessThanOrEqual(testConfig.beltOuterRadius + 1);
    }
  });

  it('detects 3D bounding-sphere collision accurately', () => {
    const manager = new AsteroidFieldManager(testConfig);
    const targetAst = manager.asteroids[0];

    // Entity positioned directly on the asteroid
    const hit = manager.checkCollision(targetAst.position, 2.0);
    expect(hit).not.toBeNull();
    expect(hit?.id).toBe(targetAst.id);

    // Entity positioned far in empty space
    const farPos = new THREE.Vector3(9999, 9999, 9999);
    const miss = manager.checkCollision(farPos, 5.0);
    expect(miss).toBeNull();
  });

  it('handles damage, destruction, and mineral yielding', () => {
    const manager = new AsteroidFieldManager(testConfig);
    const target = manager.asteroids[0];
    const initialHealth = target.health;

    // Partial damage
    const partialRes = manager.damageAsteroid(target.id, initialHealth * 0.5);
    expect(partialRes.destroyed).toBe(false);
    expect(partialRes.mineralsYielded).toBe(0);
    expect(target.health).toBeLessThan(initialHealth);
    expect(target.isDestroyed).toBe(false);

    // Fatal damage
    const fatalRes = manager.damageAsteroid(target.id, initialHealth);
    expect(fatalRes.destroyed).toBe(true);
    expect(fatalRes.mineralsYielded).toBe(target.minerals);
    expect(target.isDestroyed).toBe(true);
    expect(manager.getActiveCount()).toBe(19);

    // Destroyed asteroid should no longer register collisions
    const hitAfterDestruction = manager.checkCollision(target.position, 5.0);
    expect(hitAfterDestruction).toBeNull();
  });

  it('updates asteroid rotational tumbling over time', () => {
    const manager = new AsteroidFieldManager(testConfig);
    const target = manager.asteroids[0];
    const initialRotX = target.rotation.x;

    manager.update(1.0);

    // If rotation speed was non-zero, rotation must have updated
    if (target.rotationSpeed.x !== 0) {
      expect(target.rotation.x).not.toBe(initialRotX);
    }
  });
});
