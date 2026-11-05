import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ChronoPhantomBoss } from './boss2';
import { CombatSystem } from './combat';
import { Starship } from './ship';

describe('ChronoPhantomBoss (Archon 02) Temporal Flagship Engine', () => {
  it('initializes with 1200 HP, 600 SP, and PHASE_TEMPORAL', () => {
    const boss = new ChronoPhantomBoss(new THREE.Vector3(0, 40, -1250));
    expect(boss.data.name).toBe('ARCHON 02 // THE CHRONO PHANTOM');
    expect(boss.data.health).toBe(1200);
    expect(boss.data.shields).toBe(600);
    expect(boss.data.phase).toBe('PHASE_TEMPORAL');
    expect(boss.data.isActive).toBe(false);
    expect(boss.data.bountyCredits).toBe(8000);
    expect(boss.mesh.children.length).toBeGreaterThan(0);
  });

  it('spawns boss into active combat state', () => {
    const boss = new ChronoPhantomBoss();
    boss.spawn(new THREE.Vector3(50, 20, -1300));
    expect(boss.data.isActive).toBe(true);
    expect(boss.data.isAlive).toBe(true);
    expect(boss.mesh.visible).toBe(true);
    expect(boss.data.position.x).toBe(50);
  });

  it('absorbs damage in shields and executes chrono-dash on burst damage', () => {
    const boss = new ChronoPhantomBoss();
    boss.spawn();
    const initialPos = boss.data.position.clone();

    // Small damage under 150 threshold
    const res1 = boss.takeDamage(100);
    expect(res1.didChronoDash).toBe(false);
    expect(boss.data.shields).toBe(500);
    expect(boss.data.position.equals(initialPos)).toBe(true);

    // Additional damage pushes over 150 burst threshold -> triggers Chrono-Dash!
    const res2 = boss.takeDamage(60);
    expect(res2.didChronoDash).toBe(true);
    expect(boss.data.position.equals(initialPos)).toBe(false);
    expect(boss.data.shields).toBe(440);
  });

  it('transitions to PHASE_HYPER_DILATION on shield breach', () => {
    const boss = new ChronoPhantomBoss();
    boss.spawn();

    boss.takeDamage(700); // 600 shields + 100 health
    expect(boss.data.shields).toBe(0);
    expect(boss.data.phase).toBe('PHASE_HYPER_DILATION');
    expect(boss.data.health).toBe(1100);
  });

  it('applies temporal slow-field to player starship velocity', () => {
    const boss = new ChronoPhantomBoss(new THREE.Vector3(0, 0, -100));
    boss.spawn(new THREE.Vector3(0, 0, -100));

    const ship = new Starship(new THREE.Vector3(0, 0, -80)); // Dist = 20 <= 85 field radius
    ship.velocity.set(0, 0, -50);
    const combat = new CombatSystem();

    const res = boss.update(0.1, ship, combat);
    expect(res.inSlowField).toBe(true);
    // Velocity must be dampened
    expect(ship.velocity.length()).toBeLessThan(50);
  });

  it('handles lethal damage, triggers DEFEATED, and flags dropsWarpKey', () => {
    const boss = new ChronoPhantomBoss();
    boss.spawn();

    const res = boss.takeDamage(2000);
    expect(res.isDestroyed).toBe(true);
    expect(boss.data.isAlive).toBe(false);
    expect(boss.data.phase).toBe('DEFEATED');
    expect(boss.data.dropsWarpKey).toBe(true);
  });
});
