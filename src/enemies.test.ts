import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { EnemyDrone, EnemyFleetManager } from './enemies';
import { CombatSystem } from './combat';

describe('Enemy AI Drones & Fleet Dogfight Engine', () => {
  it('initializes drone with full shields, health, and patrol state', () => {
    const drone = new EnemyDrone(0, new THREE.Vector3(100, 0, 100));
    expect(drone.data.id).toBe(0);
    expect(drone.data.shields).toBe(40);
    expect(drone.data.health).toBe(50);
    expect(drone.data.state).toBe('PATROL');
    expect(drone.data.isAlive).toBe(true);
    expect(drone.data.bounty).toBe(450);
  });

  it('transitions state from PATROL to PURSUIT and ATTACK based on player distance', () => {
    const drone = new EnemyDrone(0, new THREE.Vector3(0, 0, 500));

    // Player far away (500 units > aggroRadius 260) -> PATROL
    drone.update(0.1, new THREE.Vector3(0, 0, 0));
    expect(drone.data.state).toBe('PATROL');

    // Player enters aggro range (200 units <= aggroRadius 260) -> PURSUIT
    drone.update(0.1, new THREE.Vector3(0, 0, 300));
    expect(drone.data.state).toBe('PURSUIT');

    // Player enters close dogfight combat range (100 units <= attackRadius 150) -> ATTACK
    drone.update(0.1, new THREE.Vector3(0, 0, 400));
    expect(drone.data.state).toBe('ATTACK');
  });

  it('absorbs damage in kinetic shields before destroying hull and yields bounty', () => {
    const drone = new EnemyDrone(0, new THREE.Vector3(0, 0, 0));

    // Damage of 30 against 40 shields
    const res1 = drone.takeDamage(30);
    expect(res1.isDead).toBe(false);
    expect(drone.data.shields).toBe(10);
    expect(drone.data.health).toBe(50);

    // Damage of 30 penetrates remaining 10 shields and deals 20 hull damage
    const res2 = drone.takeDamage(30);
    expect(res2.isDead).toBe(false);
    expect(drone.data.shields).toBe(0);
    expect(drone.data.health).toBe(30);

    // Fatal damage of 35
    const res3 = drone.takeDamage(35);
    expect(res3.isDead).toBe(true);
    expect(res3.bounty).toBe(450);
    expect(drone.data.isAlive).toBe(false);
    expect(drone.mesh.visible).toBe(false);
  });

  it('manages fleet squad and registers player laser hits', () => {
    const fleet = new EnemyFleetManager(4);
    expect(fleet.drones.length).toBe(4);
    expect(fleet.getActiveCount()).toBe(4);

    const combat = new CombatSystem();
    const targetDrone = fleet.drones[0];

    // Fire player laser directly at target drone
    combat.fire(
      { left: targetDrone.data.position.clone(), right: targetDrone.data.position.clone() },
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(),
      false // player laser
    );

    const hitRes = fleet.checkPlayerLaserHits(combat);
    expect(hitRes.hits).toBe(1);
    expect(targetDrone.data.shields).toBeLessThan(40);
  });
});
