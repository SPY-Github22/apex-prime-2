import * as THREE from 'three';

export interface AsteroidData {
  id: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  radius: number;
  maxHealth: number;
  health: number;
  minerals: number;
  isDestroyed: boolean;
}

export interface AsteroidFieldConfig {
  count: number;
  minRadius: number;
  maxRadius: number;
  beltInnerRadius: number;
  beltOuterRadius: number;
  beltHeight: number;
}

export const DEFAULT_BELT_CONFIG: AsteroidFieldConfig = {
  count: 350,
  minRadius: 4.0,
  maxRadius: 28.0,
  beltInnerRadius: 180.0,
  beltOuterRadius: 1200.0,
  beltHeight: 140.0
};

export class AsteroidFieldManager {
  public mesh: THREE.InstancedMesh;
  public asteroids: AsteroidData[] = [];
  public config: AsteroidFieldConfig;

  private dummy = new THREE.Object3D();
  private colorArray: Float32Array;

  constructor(config = DEFAULT_BELT_CONFIG) {
    this.config = config;

    // 1. Procedural Geometry & Material
    const baseGeometry = new THREE.DodecahedronGeometry(1.0, 1);
    this.deformAsteroidGeometry(baseGeometry);

    const material = new THREE.MeshStandardMaterial({
      color: 0x5a636e,
      roughness: 0.88,
      metalness: 0.22,
      flatShading: true
    });

    this.mesh = new THREE.InstancedMesh(baseGeometry, material, this.config.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.colorArray = new Float32Array(this.config.count * 3);
    this.generateAsteroids();
  }

  private deformAsteroidGeometry(geom: THREE.BufferGeometry): void {
    const posAttr = geom.getAttribute('position');
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      // Pseudo-random noise displacement per vertex
      const noise = 1.0 + (Math.sin(vertex.x * 5.0) * Math.cos(vertex.y * 5.0) * Math.sin(vertex.z * 5.0)) * 0.22;
      vertex.multiplyScalar(noise);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
  }

  public generateAsteroids(): void {
    this.asteroids = [];
    const colorAttr = new THREE.InstancedBufferAttribute(this.colorArray, 3);
    this.mesh.instanceColor = colorAttr;

    const palette = [
      new THREE.Color(0x4a5059), // basalt grey
      new THREE.Color(0x6b4c38), // iron rich rust
      new THREE.Color(0x3e454f), // carbonaceous dark
      new THREE.Color(0x7c7365), // silicate chondrite
      new THREE.Color(0x99773d)  // rare gold-mineral vein
    ];

    for (let i = 0; i < this.config.count; i++) {
      const radius = this.config.minRadius + Math.random() * (this.config.maxRadius - this.config.minRadius);

      // Rejection sampling for natural non-overlapping asteroid dispersion
      let x = 0;
      let y = 0;
      let z = 0;
      let attempts = 0;
      let tooClose = true;

      while (tooClose && attempts < 20) {
        attempts++;
        const angle = Math.random() * Math.PI * 2;
        const distance = this.config.beltInnerRadius + Math.random() * (this.config.beltOuterRadius - this.config.beltInnerRadius);
        const height = (Math.random() - 0.5) * this.config.beltHeight;

        x = Math.cos(angle) * distance;
        y = height;
        z = Math.sin(angle) * distance;

        tooClose = false;
        for (let j = 0; j < this.asteroids.length; j++) {
          const other = this.asteroids[j];
          const distSq = (x - other.position.x) ** 2 + (y - other.position.y) ** 2 + (z - other.position.z) ** 2;
          const minSep = radius + other.radius + 16.0;
          if (distSq < minSep * minSep) {
            tooClose = true;
            break;
          }
        }
      }

      const health = Math.round(radius * 12);
      const minerals = Math.round(radius * 25);

      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );

      const asteroid: AsteroidData = {
        id: i,
        position: new THREE.Vector3(x, y, z),
        rotation,
        rotationSpeed,
        radius,
        maxHealth: health,
        health,
        minerals,
        isDestroyed: false
      };

      this.asteroids.push(asteroid);

      // Set initial instance transformation
      this.dummy.position.copy(asteroid.position);
      this.dummy.rotation.copy(asteroid.rotation);
      this.dummy.scale.set(radius, radius * (0.85 + Math.random() * 0.3), radius);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      // Pick instance color from mineral palette
      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      chosenColor.toArray(this.colorArray, i * 3);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public update(dt: number): void {
    // Tumble asteroids in 3D
    let updatedAny = false;

    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      if (ast.isDestroyed) continue;

      ast.rotation.x += ast.rotationSpeed.x * dt;
      ast.rotation.y += ast.rotationSpeed.y * dt;
      ast.rotation.z += ast.rotationSpeed.z * dt;

      this.dummy.position.copy(ast.position);
      this.dummy.rotation.copy(ast.rotation);
      this.dummy.scale.set(ast.radius, ast.radius, ast.radius);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
      updatedAny = true;
    }

    if (updatedAny) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public checkCollision(entityPos: THREE.Vector3, entityRadius: number): AsteroidData | null {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      if (ast.isDestroyed) continue;

      const combinedRadius = ast.radius + entityRadius;
      const distSq = ast.position.distanceToSquared(entityPos);

      if (distSq <= combinedRadius * combinedRadius) {
        return ast;
      }
    }
    return null;
  }

  public damageAsteroid(id: number, amount: number): { destroyed: boolean; mineralsYielded: number } {
    if (id < 0 || id >= this.asteroids.length) {
      return { destroyed: false, mineralsYielded: 0 };
    }

    const ast = this.asteroids[id];
    if (ast.isDestroyed) {
      return { destroyed: false, mineralsYielded: 0 };
    }

    ast.health = Math.max(0, ast.health - amount);

    if (ast.health <= 0) {
      ast.isDestroyed = true;
      // Scale instance to 0 to hide it without reallocating buffers
      this.dummy.position.copy(ast.position);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(id, this.dummy.matrix);
      this.mesh.instanceMatrix.needsUpdate = true;

      return { destroyed: true, mineralsYielded: ast.minerals };
    }

    return { destroyed: false, mineralsYielded: 0 };
  }

  public getActiveCount(): number {
    return this.asteroids.filter((a) => !a.isDestroyed).length;
  }

  public reset(): void {
    this.generateAsteroids();
  }
}
