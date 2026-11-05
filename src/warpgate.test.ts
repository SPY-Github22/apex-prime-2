import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SectorWarpGate } from './warpgate';
import { Starship } from './ship';

describe('SectorWarpGate & Hyperspace Transit Engine', () => {
  it('initializes with DORMANT status at target position', () => {
    const gate = new SectorWarpGate('SECTOR 02 // THE NEON GRAVEYARD', new THREE.Vector3(0, 0, -800));
    expect(gate.data.name).toBe('HYPER-TACHYON JUMP GATE');
    expect(gate.data.targetSector).toBe('SECTOR 02 // THE NEON GRAVEYARD');
    expect(gate.data.status).toBe('DORMANT');
    expect(gate.data.radius).toBe(40.0);
    expect(gate.mesh.children.length).toBeGreaterThan(0);
    expect(gate.mesh.position.z).toBe(-800);
  });

  it('activates warp gate with energy signature', () => {
    const gate = new SectorWarpGate();
    expect(gate.data.status).toBe('DORMANT');

    gate.activate();
    expect(gate.data.status).toBe('ONLINE');
  });

  it('checks proximity and verifies warp gate clearance', () => {
    const gate = new SectorWarpGate('SECTOR 02', new THREE.Vector3(0, 0, -800));

    // Ship far away (0, 0, 0)
    let prox = gate.checkProximity(new THREE.Vector3(0, 0, 0));
    expect(prox.canWarp).toBe(false);

    // Ship close (0, 0, -810) but gate still DORMANT
    prox = gate.checkProximity(new THREE.Vector3(0, 0, -810));
    expect(prox.canWarp).toBe(false);

    // Gate activated and ship close (dist 10 <= 40)
    gate.activate();
    prox = gate.checkProximity(new THREE.Vector3(0, 0, -810));
    expect(prox.canWarp).toBe(true);
  });

  it('executes hyperspace warp jump sequence and completes sector transit', () => {
    const gate = new SectorWarpGate('SECTOR 02', new THREE.Vector3(0, 0, -800));
    const ship = new Starship(new THREE.Vector3(0, 0, -810));

    // Cannot engage when dormant
    expect(gate.engageWarp()).toBe(false);

    gate.activate();
    expect(gate.engageWarp()).toBe(true);
    expect(gate.data.status).toBe('WARPING');

    // Simulate 2 seconds of warp sequence
    let completed = false;
    for (let i = 0; i < 25; i++) {
      const res = gate.update(0.1, ship);
      if (res.warpCompleted) {
        completed = true;
        break;
      }
    }

    expect(completed).toBe(true);
    expect(ship.velocity.z).toBe(-250); // Hyperspace boost
  });
});
