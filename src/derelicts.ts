import * as THREE from 'three';

export type DerelictType = 'CRUISER_HULK' | 'SOLAR_SAIL' | 'RELIC_CACHE';

export interface DerelictData {
  id: number;
  type: DerelictType;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  radius: number;
  salvaged: boolean;
  salvageValue: number;
  containsRelic: boolean;
}

export interface DerelictFieldConfig {
  count: number;
  origin: THREE.Vector3;
  spreadRadius: number;
}

export const DEFAULT_DERELICT_CONFIG: DerelictFieldConfig = {
  count: 24,
  origin: new THREE.Vector3(0, 0, -1100), // Sector 2 core coordinates
  spreadRadius: 650
};

export class DerelictFieldManager {
  public group: THREE.Group;
  public derelicts: DerelictData[] = [];
  private meshMap: Map<number, THREE.Object3D> = new Map();
  private neonMaterials: THREE.MeshStandardMaterial[] = [];
  private pulseTimer = 0;

  constructor(config: DerelictFieldConfig = DEFAULT_DERELICT_CONFIG) {
    this.group = new THREE.Group();
    this.initDerelicts(config);
  }

  private initDerelicts(config: DerelictFieldConfig): void {
    // Reusable Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      metalness: 0.9,
      roughness: 0.35
    });

    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00aacc,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });
    this.neonMaterials.push(neonCyanMat);

    const neonMagentaMat = new THREE.MeshStandardMaterial({
      color: 0xff00aa,
      emissive: 0xcc0088,
      emissiveIntensity: 0.75,
      metalness: 0.8,
      roughness: 0.2
    });
    this.neonMaterials.push(neonMagentaMat);

    const goldCacheMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0x997700,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.1
    });

    for (let i = 0; i < config.count; i++) {
      const typeRoll = i % 3;
      let type: DerelictType = 'CRUISER_HULK';
      let radius = 18.0;
      let salvageValue = 850;
      let name = `DERELICT CRUISER // HULK-${100 + i}`;
      let containsRelic = false;

      if (typeRoll === 1) {
        type = 'SOLAR_SAIL';
        radius = 12.0;
        salvageValue = 600;
        name = `NEON SOLAR SAIL FRAGMENT #${i}`;
      } else if (typeRoll === 2) {
        type = 'RELIC_CACHE';
        radius = 6.0;
        salvageValue = 1200;
        containsRelic = true;
        name = `ENCRYPTED DATA VAULT #${i}`;
      }

      // Distribute in a spherical/cylindrical spread around origin
      const angle = (i / config.count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 140 + Math.random() * (config.spreadRadius - 140);
      const x = config.origin.x + Math.cos(angle) * dist;
      const y = config.origin.y + (Math.random() - 0.5) * 120;
      const z = config.origin.z + Math.sin(angle) * dist;

      const position = new THREE.Vector3(x, y, z);
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      );

      const data: DerelictData = {
        id: i,
        type,
        name,
        position,
        rotation,
        rotationSpeed,
        radius,
        salvaged: false,
        salvageValue,
        containsRelic
      };

      this.derelicts.push(data);

      // Build 3D mesh for derelict
      const mesh = this.buildMesh(type, radius, darkMetalMat, neonCyanMat, neonMagentaMat, goldCacheMat);
      mesh.position.copy(position);
      mesh.rotation.copy(rotation);
      this.meshMap.set(i, mesh);
      this.group.add(mesh);
    }
  }

  private buildMesh(
    type: DerelictType,
    radius: number,
    darkMetal: THREE.Material,
    cyanNeon: THREE.Material,
    magentaNeon: THREE.Material,
    goldMat: THREE.Material
  ): THREE.Group {
    const root = new THREE.Group();

    if (type === 'CRUISER_HULK') {
      // Shattered capital ship bow
      const bodyGeom = new THREE.BoxGeometry(radius * 1.8, radius * 0.6, radius * 2.2);
      const body = new THREE.Mesh(bodyGeom, darkMetal);
      root.add(body);

      // Exposed structural ribbing
      for (let r = -2; r <= 2; r++) {
        const ribGeom = new THREE.TorusGeometry(radius * 0.7, 0.6, 6, 16);
        const rib = new THREE.Mesh(ribGeom, darkMetal);
        rib.position.set(0, 0, r * (radius * 0.4));
        root.add(rib);
      }

      // Blown engine nacelle with neon magenta plasma leak
      const nacelleGeom = new THREE.CylinderGeometry(radius * 0.25, radius * 0.35, radius * 0.8, 8);
      nacelleGeom.rotateX(Math.PI / 2);
      const nacelle = new THREE.Mesh(nacelleGeom, magentaNeon);
      nacelle.position.set(radius * 0.6, 0, radius * 0.9);
      root.add(nacelle);

      // Neon cyan navigation stripe
      const stripeGeom = new THREE.BoxGeometry(radius * 1.85, 0.4, 0.4);
      const stripe = new THREE.Mesh(stripeGeom, cyanNeon);
      stripe.position.set(0, radius * 0.32, 0);
      root.add(stripe);

    } else if (type === 'SOLAR_SAIL') {
      // Hexagonal / triangular iridescent solar sail panel
      const sailGeom = new THREE.ConeGeometry(radius, 0.4, 6);
      sailGeom.rotateX(Math.PI / 2);
      const sail = new THREE.Mesh(sailGeom, cyanNeon);
      root.add(sail);

      // Wireframe border
      const frameGeom = new THREE.TorusGeometry(radius, 0.35, 6, 6);
      const frame = new THREE.Mesh(frameGeom, darkMetal);
      root.add(frame);

    } else {
      // RELIC_CACHE: Highly reflective golden octahedron data vault with cyan sensor rings
      const vaultGeom = new THREE.OctahedronGeometry(radius, 1);
      const vault = new THREE.Mesh(vaultGeom, goldMat);
      root.add(vault);

      const haloGeom = new THREE.TorusGeometry(radius * 1.4, 0.2, 8, 24);
      const halo = new THREE.Mesh(haloGeom, cyanNeon);
      root.add(halo);
    }

    return root;
  }

  public update(dt: number): void {
    this.pulseTimer += dt * 3.0;
    const pulse = 0.7 + Math.sin(this.pulseTimer) * 0.3;
    for (const mat of this.neonMaterials) {
      mat.emissiveIntensity = pulse;
    }

    for (const d of this.derelicts) {
      if (d.salvaged) continue;

      d.rotation.x += d.rotationSpeed.x * dt;
      d.rotation.y += d.rotationSpeed.y * dt;
      d.rotation.z += d.rotationSpeed.z * dt;

      const mesh = this.meshMap.get(d.id);
      if (mesh) {
        mesh.rotation.copy(d.rotation);
      }
    }
  }

  public checkCollision(entityPos: THREE.Vector3, entityRadius: number): DerelictData | null {
    for (const d of this.derelicts) {
      if (d.salvaged) continue;

      const totalRadius = d.radius + entityRadius;
      const distSq = d.position.distanceToSquared(entityPos);
      if (distSq <= totalRadius * totalRadius) {
        return d;
      }
    }
    return null;
  }

  public checkSalvageProximity(
    shipPos: THREE.Vector3,
    salvageRadius = 35.0
  ): DerelictData | null {
    let closest: DerelictData | null = null;
    let closestDistSq = salvageRadius * salvageRadius;

    for (const d of this.derelicts) {
      if (d.salvaged) continue;

      const distSq = d.position.distanceToSquared(shipPos);
      if (distSq <= closestDistSq) {
        closestDistSq = distSq;
        closest = d;
      }
    }

    return closest;
  }

  public salvage(id: number): { success: boolean; data?: DerelictData; creditsYield: number; relicFound: boolean } {
    const d = this.derelicts.find(item => item.id === id);
    if (!d || d.salvaged) {
      return { success: false, creditsYield: 0, relicFound: false };
    }

    d.salvaged = true;

    // Shrink and hide mesh
    const mesh = this.meshMap.get(id);
    if (mesh) {
      mesh.visible = false;
    }

    return {
      success: true,
      data: d,
      creditsYield: d.salvageValue,
      relicFound: d.containsRelic
    };
  }

  public getActiveCount(): number {
    return this.derelicts.filter(d => !d.salvaged).length;
  }
}
