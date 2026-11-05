import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CyberPhantom, CyberPhantomFleetManager } from './phantoms';
import { CombatSystem } from './combat';

describe('CyberPhantom AI & Cloaked Fleet Dogfighting Engine', () => {
  it('initializes phantom with full shields, health, and cloaked patrol state', () => {
    const phantom = new CyberPhantom(0, new THREE.Vector3(0, 0, -1100));
    expect(phantom.data.id).toBe(0);
    expect(phantom.data.health).toBe(75);
    expect(phantom.data.shields).toBe(60);
    expect(phantom.data.bounty).toBe(750);
    expect(phantom.data.state).toBe('CLOAKED_PATROL');
    expect(phantom.data.isCloaked).toBe(true);
    expect(phantom.data.cloakAlpha).toBeCloseTo(0.15);
    expect(phantom.mesh.children.length).toBeGreaterThan(0);
  });

  it('transitions state from CLOAKED_PATROL to AMBUSH_STRIKE on player proximity', () => {
    const phantom = new CyberPhantom(0, new THREE.Vector3(0, 0, -1100));
    const combat = new CombatSystem();

    // Player far away (-800 units, distance 300 > 120) -> Remains cloaked patrol
    phantom.update(0.1, new THREE.Vector3(0, 0, -800), combat);
    expect(phantom.data.state).toBe('CLOAKED_PATROL');
    expect(phantom.data.isCloaked).toBe(true);

    // Player enters ambush strike zone (-1050 units, distance 50 <= 120) -> Decloaks & ambushes
    phantom.update(0.1, new THREE.Vector3(0, 0, -1050), combat);
    expect(phantom.data.state).toBe('AMBUSH_STRIKE');
    expect(phantom.data.isCloaked).toBe(false);
  });

  it('force-decloaks and absorbs damage in kinetic shields on laser hit', () => {
    const phantom = new CyberPhantom(0, new THREE.Vector3(0, 0, -1100));
    expect(phantom.data.isCloaked).toBe(true);

    // Hit with 35 damage
    const res1 = phantom.takeDamage(35);
    expect(res1.isDead).toBe(false);
    expect(phantom.data.isCloaked).toBe(false);
    expect(phantom.data.cloakAlpha).toBe(1.0);
    expect(phantom.data.shields).toBe(25); // 60 - 35
    expect(phantom.data.health).toBe(75);

    // Fatal damage (25 shields + 75 health = 100)
    const res2 = phantom.takeDamage(120);
    expect(res2.isDead).toBe(true);
    expect(res2.bounty).toBe(750);
    expect(phantom.data.isAlive).toBe(false);
  });

  it('manages phantom fleet squad, collisions, and respawning after timer', () => {
    const origin = new THREE.Vector3(0, 0, -1100);
    const fleet = new CyberPhantomFleetManager(3, origin);
    const combat = new CombatSystem();

    expect(fleet.phantoms.length).toBe(3);
    expect(fleet.getActiveCount()).toBe(3);

    // Fire laser at target phantom
    const target = fleet.phantoms[0];
    combat.fire(
      { left: target.data.position.clone(), right: target.data.position.clone() },
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(),
      false
    );

    const hitRes = fleet.checkPlayerLaserHits(combat);
    expect(hitRes.hits).toBe(1);
    expect(target.data.shields).toBeLessThan(60);

    // Destroy target
    target.takeDamage(200);
    expect(fleet.getActiveCount()).toBe(2);

    // Update fleet for 26 seconds to trigger respawn
    fleet.update(26.0, new THREE.Vector3(0, 0, 0), combat);
    expect(fleet.getActiveCount()).toBe(3);
    expect(target.data.isAlive).toBe(true);
  });
});
