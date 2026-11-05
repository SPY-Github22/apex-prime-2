import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SpaceStation } from './station';
import { Starship } from './ship';

describe('SpaceStation & Tractor Docking System', () => {
  it('initializes space station with default attributes, geometry, and UNDOCKED status', () => {
    const station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 45, -280));
    expect(station.data.name).toBe('STARBASE HORIZON-9');
    expect(station.data.faction).toBe('THE SOLAR ALLIANCE');
    expect(station.data.status).toBe('UNDOCKED');
    expect(station.data.dockingRadius).toBe(48.0);
    expect(station.mesh.children.length).toBeGreaterThan(0);
    expect(station.data.position.x).toBe(0);
    expect(station.data.position.y).toBe(45);
    expect(station.data.position.z).toBe(-280);
    expect(station.data.dockingBayPos.z).toBe(-245); // -280 + 35
  });

  it('updates ring rotation over time', () => {
    const station = new SpaceStation();
    const ship = new Starship();
    ship.position.set(0, 0, 500); // Far away

    const res = station.update(1.0, ship, false);
    expect(res.status).toBe('UNDOCKED');
    expect(res.canDock).toBe(false);
  });

  it('detects starship proximity and transitions to APPROACH status', () => {
    const station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 0, 0));
    const ship = new Starship();

    // Place ship outside docking bay (docking bay is at 0, 0, 35; radius is 48)
    ship.position.set(0, 0, 100);
    let res = station.update(0.1, ship, false);
    expect(res.status).toBe('UNDOCKED');
    expect(res.canDock).toBe(false);

    // Move ship into docking radius (distance to 0,0,35 is 15 <= 48)
    ship.position.set(0, 0, 50);
    res = station.update(0.1, ship, false);
    expect(res.status).toBe('APPROACH');
    expect(res.canDock).toBe(true);

    // Ship flies away again
    ship.position.set(0, 0, 120);
    res = station.update(0.1, ship, false);
    expect(res.status).toBe('UNDOCKED');
    expect(res.canDock).toBe(false);
  });

  it('engages tractor beam docking sequence and docks starship safely', () => {
    const station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 0, 0));
    const ship = new Starship();

    // Move into APPROACH radius
    ship.position.set(0, 0, 40);
    station.update(0.1, ship, false);
    expect(station.data.status).toBe('APPROACH');

    // Trigger docking key
    let res = station.update(0.1, ship, true);
    expect(station.data.status).toBe('DOCKING');
    expect(res.status).toBe('DOCKING');

    // Simulate tractor beam pulling ship toward target docking port (0, 0, 43)
    for (let i = 0; i < 60; i++) {
      station.update(0.1, ship, false);
      if (station.data.status === 'DOCKED') break;
    }

    expect(station.data.status).toBe('DOCKED');
    expect(ship.velocity.length()).toBe(0);
  });

  it('repairs damaged shields and hull while docked', () => {
    const station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 0, 0));
    const ship = new Starship();
    ship.shields = 20;
    ship.hull = 40;

    const rep1 = station.repairShip(ship, 1.0);
    expect(rep1.repairedShields).toBe(true);
    expect(rep1.repairedHull).toBe(true);
    expect(ship.shields).toBe(55); // 20 + 35
    expect(ship.hull).toBe(60);    // 40 + 20

    // Full repair clamps to max values
    const rep2 = station.repairShip(ship, 10.0);
    expect(ship.shields).toBe(ship.maxShields);
    expect(ship.hull).toBe(ship.maxHull);
    expect(rep2.repairedShields).toBe(true);

    // When already at max, repair flags return false
    const rep3 = station.repairShip(ship, 0.1);
    expect(rep3.repairedShields).toBe(false);
    expect(rep3.repairedHull).toBe(false);
  });

  it('executes undocking maneuver and clears station radius', () => {
    const station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 0, 0));
    const ship = new Starship();
    ship.position.set(0, 0, 43);
    station.data.status = 'DOCKED';

    station.undock(ship);
    expect(station.data.status).toBe('UNDOCKING');
    expect(ship.velocity.z).toBe(20);

    // Undock step update pushes ship outward
    for (let i = 0; i < 30; i++) {
      const res = station.update(0.1, ship, false);
      if (res.status === 'UNDOCKED') break;
    }

    expect(station.data.status).toBe('UNDOCKED');
  });
});
