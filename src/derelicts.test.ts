import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DerelictFieldManager, DerelictFieldConfig } from './derelicts';

describe('DerelictFieldManager & Cyber-Debris Field Engine', () => {
  const testConfig: DerelictFieldConfig = {
    count: 6,
    origin: new THREE.Vector3(0, 0, -1000),
    spreadRadius: 300
  };

  it('initializes derelicts with alternating types, geometry, and coordinates', () => {
    const manager = new DerelictFieldManager(testConfig);
    expect(manager.derelicts.length).toBe(6);
    expect(manager.group.children.length).toBe(6);
    expect(manager.getActiveCount()).toBe(6);

    const hulk = manager.derelicts[0];
    expect(hulk.type).toBe('CRUISER_HULK');
    expect(hulk.radius).toBe(18.0);
    expect(hulk.salvaged).toBe(false);

    const sail = manager.derelicts[1];
    expect(sail.type).toBe('SOLAR_SAIL');
    expect(sail.radius).toBe(12.0);

    const relic = manager.derelicts[2];
    expect(relic.type).toBe('RELIC_CACHE');
    expect(relic.containsRelic).toBe(true);
    expect(relic.salvageValue).toBe(1200);
  });

  it('updates rotational tumbling over time', () => {
    const manager = new DerelictFieldManager(testConfig);
    const target = manager.derelicts[0];
    const initialRot = target.rotation.x;

    manager.update(1.0);
    if (target.rotationSpeed.x !== 0) {
      expect(target.rotation.x).not.toBe(initialRot);
    }
  });

  it('detects 3D collisions with starship hull', () => {
    const manager = new DerelictFieldManager(testConfig);
    const target = manager.derelicts[0];

    // Colliding point on target surface
    const hit = manager.checkCollision(target.position, 2.0);
    expect(hit).not.toBeNull();
    expect(hit?.id).toBe(target.id);

    // Far away point
    const miss = manager.checkCollision(new THREE.Vector3(9999, 9999, 9999), 5.0);
    expect(miss).toBeNull();
  });

  it('detects salvage proximity and provides closest wreck', () => {
    const manager = new DerelictFieldManager(testConfig);
    const target = manager.derelicts[1];

    // Close to target
    const nearPos = target.position.clone().add(new THREE.Vector3(5, 0, 5));
    const found = manager.checkSalvageProximity(nearPos, 20.0);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(target.id);

    // Outside range
    const farPos = target.position.clone().add(new THREE.Vector3(100, 0, 100));
    const none = manager.checkSalvageProximity(farPos, 20.0);
    expect(none).toBeNull();
  });

  it('salvages wrecks, yields credits/relics, and disables collisions', () => {
    const manager = new DerelictFieldManager(testConfig);
    const relic = manager.derelicts[2]; // RELIC_CACHE

    const res = manager.salvage(relic.id);
    expect(res.success).toBe(true);
    expect(res.creditsYield).toBe(1200);
    expect(res.relicFound).toBe(true);
    expect(relic.salvaged).toBe(true);
    expect(manager.getActiveCount()).toBe(5);

    // Salvaged derelict no longer triggers collision
    const hitAfter = manager.checkCollision(relic.position, 2.0);
    expect(hitAfter).toBeNull();

    // Re-salvaging fails cleanly
    const reSalvage = manager.salvage(relic.id);
    expect(reSalvage.success).toBe(false);
  });
});
