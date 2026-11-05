import * as THREE from 'three';
import { Starship } from './ship';

export type DockingStatus = 'UNDOCKED' | 'APPROACH' | 'DOCKING' | 'DOCKED' | 'UNDOCKING';

export interface StationData {
  id: string;
  name: string;
  faction: string;
  position: THREE.Vector3;
  dockingBayPos: THREE.Vector3;
  dockingRadius: number;
  status: DockingStatus;
  ringRotationSpeed: number;
}

export class SpaceStation {
  public data: StationData;
  public mesh: THREE.Group;

  private habitationRing: THREE.Group;
  private dockingRingMesh: THREE.Mesh;
  private beaconGlowTimer = 0;

  constructor(
    name = 'STARBASE HORIZON-9',
    faction = 'THE SOLAR ALLIANCE',
    position = new THREE.Vector3(0, 45, -280)
  ) {
    const dockingBayPos = position.clone().add(new THREE.Vector3(0, 0, 35));

    this.data = {
      id: 'station-horizon-9',
      name,
      faction,
      position: position.clone(),
      dockingBayPos,
      dockingRadius: 48.0,
      status: 'UNDOCKED',
      ringRotationSpeed: 0.12 // rad/s
    };

    const { group, ring, dockingRing } = this.buildStationMesh();
    this.mesh = group;
    this.habitationRing = ring;
    this.dockingRingMesh = dockingRing;

    this.mesh.position.copy(this.data.position);
  }

  private buildStationMesh(): { group: THREE.Group; ring: THREE.Group; dockingRing: THREE.Mesh } {
    const group = new THREE.Group();

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      metalness: 0.85,
      roughness: 0.3
    });

    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00aacc,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });

    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      emissive: 0x002244,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });

    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    // 1. Central Core Spire (Vertical axis)
    const spireGeom = new THREE.CylinderGeometry(8.0, 9.5, 90, 16);
    const spire = new THREE.Mesh(spireGeom, metalMat);
    group.add(spire);

    // Spire top antenna array
    const antennaGeom = new THREE.CylinderGeometry(0.5, 0.8, 30, 8);
    const antenna = new THREE.Mesh(antennaGeom, metalMat);
    antenna.position.set(0, 55, 0);
    group.add(antenna);

    // Communication dish
    const dishGeom = new THREE.SphereGeometry(6.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dishGeom.rotateX(Math.PI / 3);
    const dish = new THREE.Mesh(dishGeom, metalMat);
    dish.position.set(4, 45, 4);
    group.add(dish);

    // 2. Rotating Habitation Ring & Connecting Spokes
    const ringGroup = new THREE.Group();

    // Toroidal Ring (outer radius 48, tube 4.5)
    const torusGeom = new THREE.TorusGeometry(48, 4.5, 12, 48);
    torusGeom.rotateX(Math.PI / 2);
    const torus = new THREE.Mesh(torusGeom, metalMat);
    ringGroup.add(torus);

    // 4 Connecting Spokes
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const spokeGeom = new THREE.CylinderGeometry(1.4, 1.4, 48, 8);
      const spoke = new THREE.Mesh(spokeGeom, metalMat);
      spoke.position.set(Math.cos(angle) * 24, 0, Math.sin(angle) * 24);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = -angle;
      ringGroup.add(spoke);
    }

    // Windows on habitation ring
    const windowGeom = new THREE.TorusGeometry(48.2, 0.6, 8, 32);
    windowGeom.rotateX(Math.PI / 2);
    const windows = new THREE.Mesh(windowGeom, lightMat);
    ringGroup.add(windows);

    group.add(ringGroup);

    // 3. Solar Panel Arrays (Left & Right)
    const solarGeom = new THREE.BoxGeometry(45, 0.6, 16);
    const leftSolar = new THREE.Mesh(solarGeom, solarMat);
    leftSolar.position.set(-35, 25, 0);
    group.add(leftSolar);

    const rightSolar = new THREE.Mesh(solarGeom, solarMat);
    rightSolar.position.set(35, 25, 0);
    group.add(rightSolar);

    // 4. Docking Bay & Holographic Tractor Ring (at Z = +35)
    const dockingBayGeom = new THREE.CylinderGeometry(7.0, 7.5, 14, 12);
    dockingBayGeom.rotateX(Math.PI / 2);
    const dockingBay = new THREE.Mesh(dockingBayGeom, metalMat);
    dockingBay.position.set(0, 0, 24);
    group.add(dockingBay);

    // Holographic approach ring
    const beaconGeom = new THREE.TorusGeometry(12.0, 0.6, 8, 24);
    const dockingRing = new THREE.Mesh(beaconGeom, beaconMat);
    dockingRing.position.set(0, 0, 35);
    group.add(dockingRing);

    return { group, ring: ringGroup, dockingRing };
  }

  public update(
    dt: number,
    ship: Starship,
    triggerDockKey: boolean
  ): { status: DockingStatus; canDock: boolean } {
    // 1. Rotate Habitation Ring
    this.habitationRing.rotation.y += this.data.ringRotationSpeed * dt;

    // 2. Pulse Docking Beacon Light
    this.beaconGlowTimer += dt * 3.0;
    const pulse = 0.6 + Math.sin(this.beaconGlowTimer) * 0.4;
    (this.dockingRingMesh.material as THREE.MeshBasicMaterial).opacity = pulse;

    // 3. Proximity Checking against Docking Bay
    const distToDock = ship.position.distanceTo(this.data.dockingBayPos);
    const canDock = distToDock <= this.data.dockingRadius && this.data.status !== 'DOCKED';

    if (this.data.status === 'UNDOCKED') {
      if (distToDock <= this.data.dockingRadius) {
        this.data.status = 'APPROACH';
      }
    } else if (this.data.status === 'APPROACH') {
      if (distToDock > this.data.dockingRadius) {
        this.data.status = 'UNDOCKED';
      } else if (triggerDockKey) {
        this.data.status = 'DOCKING';
      }
    } else if (this.data.status === 'DOCKING') {
      // Tractor beam pulls ship to docking pad and dampens velocity
      const targetPos = this.data.dockingBayPos.clone().add(new THREE.Vector3(0, 0, 8));
      ship.position.lerp(targetPos, Math.min(1.0, 4.0 * dt));
      ship.velocity.multiplyScalar(Math.pow(0.1, dt)); // rapidly kill velocity

      // Align ship to face station core
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      ship.quaternion.slerp(targetQuat, Math.min(1.0, 3.5 * dt));

      if (ship.position.distanceTo(targetPos) < 1.5 && ship.velocity.length() < 1.0) {
        this.data.status = 'DOCKED';
        ship.velocity.set(0, 0, 0);
      }
    } else if (this.data.status === 'DOCKED') {
      // Keep ship locked safely at docking port
      ship.velocity.set(0, 0, 0);
      this.repairShip(ship, dt);
    } else if (this.data.status === 'UNDOCKING') {
      // Push ship forward out of docking bay
      const pushForward = new THREE.Vector3(0, 0, 1);
      ship.position.addScaledVector(pushForward, 25.0 * dt);
      if (ship.position.distanceTo(this.data.dockingBayPos) > this.data.dockingRadius) {
        this.data.status = 'UNDOCKED';
      }
    }

    return { status: this.data.status, canDock };
  }

  public undock(ship: Starship): void {
    this.data.status = 'UNDOCKING';
    ship.velocity.set(0, 0, 20); // forward egress speed
  }

  public repairShip(ship: Starship, dt: number): { repairedShields: boolean; repairedHull: boolean } {
    let repairedShields = false;
    let repairedHull = false;

    if (ship.shields < ship.maxShields) {
      ship.shields = Math.min(ship.maxShields, ship.shields + 35 * dt);
      repairedShields = true;
    }
    if (ship.hull < ship.maxHull) {
      ship.hull = Math.min(ship.maxHull, ship.hull + 20 * dt);
      repairedHull = true;
    }

    return { repairedShields, repairedHull };
  }
}
