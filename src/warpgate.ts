import * as THREE from 'three';
import { Starship } from './ship';

export type GateStatus = 'DORMANT' | 'ONLINE' | 'WARPING';

export interface WarpGateData {
  id: string;
  name: string;
  targetSector: string;
  position: THREE.Vector3;
  radius: number;
  status: GateStatus;
  rotationSpeed: number;
}

export class SectorWarpGate {
  public data: WarpGateData;
  public mesh: THREE.Group;

  private outerRing: THREE.Mesh;
  private innerRing: THREE.Mesh;
  private vortexMesh: THREE.Mesh;
  private pulseTimer = 0;
  private warpSequenceTimer = 0;

  constructor(
    targetSector = 'SECTOR 02 // THE NEON GRAVEYARD',
    position = new THREE.Vector3(0, 0, -800)
  ) {
    this.data = {
      id: 'warp-gate-sector-1',
      name: 'HYPER-TACHYON JUMP GATE',
      targetSector,
      position: position.clone(),
      radius: 40.0,
      status: 'DORMANT',
      rotationSpeed: 0.25 // rad/s
    };

    const { group, outer, inner, vortex } = this.buildGateMesh();
    this.mesh = group;
    this.outerRing = outer;
    this.innerRing = inner;
    this.vortexMesh = vortex;

    this.mesh.position.copy(this.data.position);
  }

  private buildGateMesh(): {
    group: THREE.Group;
    outer: THREE.Mesh;
    inner: THREE.Mesh;
    vortex: THREE.Mesh;
  } {
    const group = new THREE.Group();

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      metalness: 0.9,
      roughness: 0.25
    });

    const energyMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });

    // 1. Massive Outer Torus (Radius 44, Tube 3.5)
    const outerGeom = new THREE.TorusGeometry(44, 3.5, 12, 48);
    const outer = new THREE.Mesh(outerGeom, metalMat);
    group.add(outer);

    // 2. Counter-Rotating Inner Accelerator Ring (Radius 36, Tube 2.0)
    const innerGeom = new THREE.TorusGeometry(36, 2.0, 10, 36);
    const inner = new THREE.Mesh(innerGeom, energyMat);
    group.add(inner);

    // 3. 4 Accelerator Field Pylons
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const pylonGeom = new THREE.BoxGeometry(4.0, 14.0, 3.0);
      const pylon = new THREE.Mesh(pylonGeom, metalMat);
      pylon.position.set(Math.cos(angle) * 44, Math.sin(angle) * 44, 0);
      pylon.rotation.z = angle;
      group.add(pylon);
    }

    // 4. Central Hyperspace Vortex Disc (Radius 34)
    const vortexGeom = new THREE.CircleGeometry(34, 32);
    const vortex = new THREE.Mesh(vortexGeom, vortexMat);
    group.add(vortex);

    return { group, outer, inner, vortex };
  }

  public activate(): void {
    if (this.data.status === 'DORMANT') {
      this.data.status = 'ONLINE';
      (this.vortexMesh.material as THREE.MeshBasicMaterial).color.setHex(0x00ffaa);
      (this.vortexMesh.material as THREE.MeshBasicMaterial).opacity = 0.75;
    }
  }

  public checkProximity(shipPos: THREE.Vector3): { canWarp: boolean; distance: number } {
    const dist = shipPos.distanceTo(this.data.position);
    const canWarp = this.data.status === 'ONLINE' && dist <= this.data.radius;
    return { canWarp, distance: dist };
  }

  public engageWarp(): boolean {
    if (this.data.status !== 'ONLINE') return false;
    this.data.status = 'WARPING';
    this.warpSequenceTimer = 0;
    return true;
  }

  public update(
    dt: number,
    ship: Starship
  ): { status: GateStatus; warpCompleted: boolean } {
    // Rotate rings in opposing directions
    this.outerRing.rotation.z += this.data.rotationSpeed * dt;
    this.innerRing.rotation.z -= this.data.rotationSpeed * 1.5 * dt;

    // Pulse vortex
    this.pulseTimer += dt * 4.0;
    const pulseScale = 1.0 + Math.sin(this.pulseTimer) * 0.05;
    this.vortexMesh.scale.set(pulseScale, pulseScale, 1.0);

    let warpCompleted = false;

    if (this.data.status === 'WARPING') {
      this.warpSequenceTimer += dt;

      // Accelerated draw into gate center
      ship.position.lerp(this.data.position, Math.min(1.0, 3.0 * dt));
      ship.velocity.set(0, 0, -250); // Hyperspace forward boost

      if (this.warpSequenceTimer >= 2.0) {
        warpCompleted = true;
        this.data.status = 'ONLINE';
      }
    }

    return { status: this.data.status, warpCompleted };
  }
}
