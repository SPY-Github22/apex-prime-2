import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { IronColossusBoss } from './boss';
import { CombatSystem } from './combat';

describe('IronColossusBoss (Archon 01) AI & Vehicle Engine', () => {
  it('initializes with full stats, 800 HP, 400 SP, and PHASE_SHIELDED', () => {
    const boss = new IronColossusBoss(new THREE.Vector3(150, 0, -450));
    expect(boss.data.name).toBe('ARCHON 01 // THE IRON COLOSSUS');
    expect(boss.data.health).toBe(800);
    expect(boss.data.shields).toBe(400);
    expect(boss.data.phase).toBe('PHASE_SHIELDED');
    expect(boss.data.isActive).toBe(false);
    expect(boss.data.dropsWarpKey).toBe(false);
    expect(boss.mesh.children.length).toBeGreaterThan(0);
  });

  it('spawns boss into active combat state', () => {
    const boss = new IronColossusBoss();
    boss.spawn(new THREE.Vector3(200, 10, -500));
    expect(boss.data.isActive).toBe(true);
    expect(boss.data.isAlive).toBe(true);
    expect(boss.mesh.visible).toBe(true);
    expect(boss.data.position.x).toBe(200);
    expect(boss.data.position.y).toBe(10);
    expect(boss.data.position.z).toBe(-500);
  });

  it('absorbs frontal kinetic damage into energy shields first', () => {
    const boss = new IronColossusBoss();
    boss.spawn();

    // Frontal shot traveling along +Z towards boss (opposite to boss forward -Z)
    const frontalShotDir = new THREE.Vector3(0, 0, 1);
    const res1 = boss.takeDamage(100, frontalShotDir);

    expect(res1.isExhaustHit).toBe(false);
    expect(res1.shieldDamage).toBe(100);
    expect(res1.hullDamage).toBe(0);
    expect(boss.data.shields).toBe(300);
    expect(boss.data.health).toBe(800);
  });

  it('detects rear thermal exhaust hits, bypasses shields, and applies 1.4x bonus damage', () => {
    const boss = new IronColossusBoss();
    boss.spawn();

    // Shot traveling along -Z hitting boss rear from behind
    const rearShotDir = new THREE.Vector3(0, 0, -1);
    const res = boss.takeDamage(100, rearShotDir);

    expect(res.isExhaustHit).toBe(true);
    // 100 * 1.4 = 140 effective damage.
    // 50% (70) to shields, 50% (70) penetrates directly to hull!
    expect(res.shieldDamage).toBe(70);
    expect(res.hullDamage).toBe(70);
    expect(boss.data.shields).toBe(330); // 400 - 70
    expect(boss.data.health).toBe(730);  // 800 - 70
  });

  it('transitions to PHASE_ENRAGED when shields are depleted', () => {
    const boss = new IronColossusBoss();
    boss.spawn();

    // Break remaining shields (400 SP)
    boss.takeDamage(450);
    expect(boss.data.shields).toBe(0);
    expect(boss.data.phase).toBe('PHASE_ENRAGED');
    expect(boss.data.health).toBe(750); // 800 - 50 overflow
  });

  it('handles lethal damage, triggers DEFEATED phase, and flags dropsWarpKey', () => {
    const boss = new IronColossusBoss();
    boss.spawn();

    // Deplete both shields (400) and hull (800)
    const res = boss.takeDamage(1200);
    expect(res.isDestroyed).toBe(true);
    expect(boss.data.isAlive).toBe(false);
    expect(boss.data.health).toBe(0);
    expect(boss.data.phase).toBe('DEFEATED');
    expect(boss.data.dropsWarpKey).toBe(true);
    expect(boss.mesh.visible).toBe(false);
  });

  it('updates movement and fires artillery when player is in combat range', () => {
    const boss = new IronColossusBoss();
    const combat = new CombatSystem();
    boss.spawn(new THREE.Vector3(0, 0, -100));

    // Player in range at (0, 0, 0) -> dist 100 units <= 280 units
    const updateRes = boss.update(1.3, new THREE.Vector3(0, 0, 0), combat);
    expect(updateRes.bossAlive).toBe(true);
    expect(updateRes.fired).toBe(true);
    expect(combat.getActiveLaserCount()).toBe(1);
  });
});
