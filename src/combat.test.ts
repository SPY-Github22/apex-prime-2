import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CombatSystem } from './combat';
import { AsteroidFieldManager, AsteroidFieldConfig } from './asteroids';

describe('CombatSystem 3D Lasers, Ballistics & Particle Engine', () => {
  const muzzles = {
    left: new THREE.Vector3(-3.8, 0, -1.0),
    right: new THREE.Vector3(3.8, 0, -1.0)
  };

  it('fires alternating laser bolts from wingtip muzzles with velocity addition', () => {
    const combat = new CombatSystem();
    const forward = new THREE.Vector3(0, 0, -1);
    const shipVel = new THREE.Vector3(0, 0, -20);

    // First shot from right muzzle
    const fired1 = combat.fire(muzzles, forward, shipVel);
    expect(fired1).toBe(true);
    expect(combat.getActiveLaserCount()).toBe(1);

    const activeLaser1 = combat.lasers.find((l) => l.isAlive)!;
    expect(activeLaser1.position.x).toBe(muzzles.right.x);
    // Velocity is forward (laserSpeed) + shipVel
    expect(activeLaser1.velocity.z).toBeCloseTo(-combat.laserSpeed - 20);

    // Rapid successive shot is throttled by fireCooldown
    const rapidShot = combat.fire(muzzles, forward, shipVel);
    expect(rapidShot).toBe(false);

    // Advancing time clears cooldown and fires from left muzzle
    combat.update(combat.fireCooldown + 0.01);
    const fired2 = combat.fire(muzzles, forward, shipVel);
    expect(fired2).toBe(true);
    expect(combat.getActiveLaserCount()).toBe(2);

    const activeLaser2 = combat.lasers.filter((l) => l.isAlive)[1];
    expect(activeLaser2.position.x).toBe(muzzles.left.x);
  });

  it('expires lasers when lifetime threshold is exceeded', () => {
    const combat = new CombatSystem();
    const forward = new THREE.Vector3(0, 0, -1);
    const shipVel = new THREE.Vector3(0, 0, 0);

    combat.fire(muzzles, forward, shipVel);
    expect(combat.getActiveLaserCount()).toBe(1);

    // Advance beyond laser lifetime (2.5s)
    combat.update(combat.laserLifetime + 0.1);
    expect(combat.getActiveLaserCount()).toBe(0);
  });

  it('incorporates extra damage from weapon upgrades', () => {
    const combat = new CombatSystem();
    const forward = new THREE.Vector3(0, 0, -1);
    const shipVel = new THREE.Vector3(0, 0, 0);

    combat.fire(muzzles, forward, shipVel, false, 25);
    const laser = combat.lasers.find((l) => l.isAlive)!;
    expect(laser.damage).toBe(combat.laserDamage + 25);
  });

  it('collides with asteroids, damages them, and spawns impact explosions', () => {
    const combat = new CombatSystem();
    const config: AsteroidFieldConfig = {
      count: 5,
      minRadius: 10,
      maxRadius: 10,
      beltInnerRadius: 50,
      beltOuterRadius: 100,
      beltHeight: 0
    };
    const asteroidField = new AsteroidFieldManager(config);
    const targetAst = asteroidField.asteroids[0];

    // Spawn a laser directly at the asteroid
    const forward = new THREE.Vector3(0, 0, -1);
    combat.fire(muzzles, forward, new THREE.Vector3());

    const laser = combat.lasers.find((l) => l.isAlive)!;
    laser.position.copy(targetAst.position); // position laser on asteroid

    const initialHealth = targetAst.health;
    const hitRes = combat.checkAsteroidCollisions(asteroidField);

    expect(hitRes.hits).toBe(1);
    expect(laser.isAlive).toBe(false); // Laser consumed on impact
    expect(targetAst.health).toBe(initialHealth - combat.laserDamage);
    expect(combat.getActiveParticleCount()).toBeGreaterThan(0); // Impact sparks spawned
  });

  it('spawns spherical explosion particles with velocity decay', () => {
    const combat = new CombatSystem();
    expect(combat.getActiveParticleCount()).toBe(0);

    combat.spawnExplosion(new THREE.Vector3(0, 0, 0), 20, new THREE.Color(0xffaa00), 40);
    expect(combat.getActiveParticleCount()).toBe(20);

    // Particles advance and decay over time
    combat.update(0.1);
    const particle = combat.particles.find((p) => p.isAlive)!;
    expect(particle.lifetime).toBeCloseTo(0.1);
    expect(particle.position.length()).toBeGreaterThan(0);

    // After 1.5 seconds, particles expire
    combat.update(1.5);
    expect(combat.getActiveParticleCount()).toBe(0);
  });
});
