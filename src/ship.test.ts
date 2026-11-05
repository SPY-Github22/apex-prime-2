import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Starship, FlightInput } from './ship';

describe('Starship 3D Flight Physics & Combat Systems', () => {
  const neutralInput: FlightInput = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    throttle: 0,
    boost: false,
    brake: false
  };

  it('initializes with clean default state and full shield/hull capacitor', () => {
    const ship = new Starship(new THREE.Vector3(0, 10, 0));
    expect(ship.position.x).toBe(0);
    expect(ship.position.y).toBe(10);
    expect(ship.position.z).toBe(0);
    expect(ship.velocity.length()).toBe(0);
    expect(ship.shields).toBe(100);
    expect(ship.hull).toBe(100);
    expect(ship.boostEnergy).toBe(100);
    expect(ship.isBoosting).toBe(false);
  });

  it('accelerates forward in -Z direction under forward throttle', () => {
    const ship = new Starship();
    const input: FlightInput = { ...neutralInput, throttle: 1.0 };

    ship.update(0.1, input);

    // Forward is -Z
    expect(ship.velocity.z).toBeLessThan(0);
    expect(ship.position.z).toBeLessThan(0);
    expect(ship.velocity.length()).toBeGreaterThan(0);
  });

  it('engages afterburner boost multiplying speed and draining capacitor', () => {
    const ship = new Starship();
    const boostInput: FlightInput = { ...neutralInput, throttle: 1.0, boost: true };

    ship.update(0.5, boostInput);

    expect(ship.isBoosting).toBe(true);
    expect(ship.boostEnergy).toBeLessThan(100);

    // Normalizing afterburner throttle allows energy regeneration
    const idleInput: FlightInput = { ...neutralInput, throttle: 0, boost: false };
    const energyAfterDrain = ship.boostEnergy;
    ship.update(0.5, idleInput);
    expect(ship.boostEnergy).toBeGreaterThan(energyAfterDrain);
  });

  it('rotates orientation when pitch and yaw inputs are applied', () => {
    const ship = new Starship();
    const initialForward = ship.getForwardVector();

    const turnInput: FlightInput = { ...neutralInput, yaw: 1.0 };
    ship.update(0.2, turnInput);

    const turnedForward = ship.getForwardVector();
    expect(turnedForward.x).not.toBe(initialForward.x);
  });

  it('absorbs damage in kinetic shields before damaging hull', () => {
    const ship = new Starship();

    // Damage of 40 against 100 shields
    const res1 = ship.takeDamage(40);
    expect(res1.shieldAbsorbed).toBe(40);
    expect(res1.hullDamage).toBe(0);
    expect(res1.isDestroyed).toBe(false);
    expect(ship.shields).toBe(60);
    expect(ship.hull).toBe(100);

    // Further damage of 80 destroys remaining 60 shields and deals 20 hull damage
    const res2 = ship.takeDamage(80);
    expect(res2.shieldAbsorbed).toBe(60);
    expect(res2.hullDamage).toBe(20);
    expect(ship.shields).toBe(0);
    expect(ship.hull).toBe(80);

    // Fatal damage
    const res3 = ship.takeDamage(100);
    expect(res3.isDestroyed).toBe(true);
    expect(ship.hull).toBe(0);
  });

  it('regenerates shields after damage delay threshold', () => {
    const ship = new Starship();
    ship.takeDamage(50);
    expect(ship.shields).toBe(50);

    // Waiting within threshold (< 3.0s) does not regenerate shields
    ship.update(1.0, neutralInput);
    expect(ship.shields).toBe(50);

    // Waiting beyond threshold (total > 3.0s) regenerates shields
    ship.update(2.5, neutralInput);
    expect(ship.shields).toBeGreaterThan(50);
  });

  it('calculates wingtip laser muzzle positions correctly', () => {
    const ship = new Starship(new THREE.Vector3(0, 0, 0));
    const muzzles = ship.getLaserMuzzlePositions();

    expect(muzzles.left.x).toBeLessThan(0);
    expect(muzzles.right.x).toBeGreaterThan(0);
    expect(muzzles.left.z).toBeLessThan(0); // slightly forward of ship center
  });
});
