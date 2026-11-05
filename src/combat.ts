import * as THREE from 'three';
import { AsteroidFieldManager } from './asteroids';

export interface LaserProjectile {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  isAlive: boolean;
  isEnemy: boolean;
}

export interface Particle3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  lifetime: number;
  maxLifetime: number;
  isAlive: boolean;
}

export interface CombatHitResult {
  hits: number;
  mineralsEarned: number;
  destroyedAsteroids: number;
  impactPositions: THREE.Vector3[];
}

export class CombatSystem {
  public maxLasers = 120;
  public lasers: LaserProjectile[] = [];
  public laserMesh: THREE.InstancedMesh;

  public maxParticles = 600;
  public particles: Particle3D[] = [];
  public particleGeometry: THREE.BufferGeometry;
  public particleMesh: THREE.Points;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;

  // Firing mechanics
  public fireCooldown = 0.12; // ~8 shots per second
  private fireTimer = 0;
  private alternateBarrel = false;
  public laserSpeed = 320.0;
  public laserDamage = 35.0;
  public laserLifetime = 2.5;

  private dummy = new THREE.Object3D();

  constructor() {
    // 1. Initialize Laser Instanced Mesh
    const laserGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6);
    laserGeom.rotateX(Math.PI / 2); // align along -Z

    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.95
    });

    this.laserMesh = new THREE.InstancedMesh(laserGeom, laserMat, this.maxLasers);
    this.laserMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize laser pool
    for (let i = 0; i < this.maxLasers; i++) {
      this.lasers.push({
        id: i,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        radius: 0.6,
        damage: this.laserDamage,
        lifetime: 0,
        maxLifetime: this.laserLifetime,
        isAlive: false,
        isEnemy: false
      });

      this.dummy.position.set(0, 0, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.laserMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.laserMesh.instanceMatrix.needsUpdate = true;

    // 2. Initialize Particle System
    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 3);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.particleMesh = new THREE.Points(this.particleGeometry, particleMat);

    // Initialize particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1.0,
        lifetime: 0,
        maxLifetime: 1.0,
        isAlive: false
      });
    }
  }

  public fire(
    muzzles: { left: THREE.Vector3; right: THREE.Vector3 },
    forwardDir: THREE.Vector3,
    shipVelocity: THREE.Vector3,
    isEnemy = false,
    extraDamage = 0
  ): boolean {
    if (this.fireTimer > 0) return false;

    // Pick barrel: alternating left / right
    const spawnPos = this.alternateBarrel ? muzzles.left : muzzles.right;
    this.alternateBarrel = !this.alternateBarrel;

    // Find available projectile slot in pool
    const laser = this.lasers.find((l) => !l.isAlive);
    if (!laser) return false;

    laser.isAlive = true;
    laser.isEnemy = isEnemy;
    laser.position.copy(spawnPos);
    laser.lifetime = 0;
    laser.maxLifetime = this.laserLifetime;
    laser.damage = this.laserDamage + extraDamage;

    // Ballistic velocity = forward vector * laser speed + ship inertia
    laser.velocity.copy(forwardDir).multiplyScalar(this.laserSpeed).add(shipVelocity);

    this.fireTimer = this.fireCooldown;
    return true;
  }

  public update(dt: number): void {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    // 1. Update active lasers
    let lasersUpdated = false;
    for (let i = 0; i < this.lasers.length; i++) {
      const l = this.lasers[i];
      if (!l.isAlive) continue;

      l.lifetime += dt;
      if (l.lifetime >= l.maxLifetime) {
        l.isAlive = false;
        this.dummy.position.set(0, 0, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.laserMesh.setMatrixAt(i, this.dummy.matrix);
        lasersUpdated = true;
        continue;
      }

      // Advance laser position
      l.position.addScaledVector(l.velocity, dt);

      // Align instance mesh with velocity direction
      this.dummy.position.copy(l.position);
      const lookTarget = l.position.clone().add(l.velocity);
      this.dummy.lookAt(lookTarget);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();

      this.laserMesh.setMatrixAt(i, this.dummy.matrix);
      lasersUpdated = true;
    }

    if (lasersUpdated) {
      this.laserMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Update active particles
    let activeParticlesCount = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const idx = i * 3;

      if (!p.isAlive) {
        this.particlePositions[idx] = 0;
        this.particlePositions[idx + 1] = 0;
        this.particlePositions[idx + 2] = 0;
        continue;
      }

      p.lifetime += dt;
      if (p.lifetime >= p.maxLifetime) {
        p.isAlive = false;
        this.particlePositions[idx] = 0;
        this.particlePositions[idx + 1] = 0;
        this.particlePositions[idx + 2] = 0;
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(0.96); // drag

      this.particlePositions[idx] = p.position.x;
      this.particlePositions[idx + 1] = p.position.y;
      this.particlePositions[idx + 2] = p.position.z;

      p.color.toArray(this.particleColors, idx);
      activeParticlesCount++;
    }

    if (activeParticlesCount > 0) {
      const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  }

  public checkAsteroidCollisions(asteroidField: AsteroidFieldManager): CombatHitResult {
    let hits = 0;
    let mineralsEarned = 0;
    let destroyedAsteroids = 0;
    const impactPositions: THREE.Vector3[] = [];

    for (let i = 0; i < this.lasers.length; i++) {
      const l = this.lasers[i];
      if (!l.isAlive) continue;

      const hitAsteroid = asteroidField.checkCollision(l.position, l.radius);
      if (hitAsteroid) {
        hits++;
        l.isAlive = false;
        impactPositions.push(l.position.clone());

        // Spawn hit sparks
        this.spawnExplosion(l.position, 12, new THREE.Color(0xffaa00), 25);

        // Deal damage to asteroid
        const res = asteroidField.damageAsteroid(hitAsteroid.id, l.damage);
        if (res.destroyed) {
          destroyedAsteroids++;
          mineralsEarned += res.mineralsYielded;
          // Massive shatter explosion
          this.spawnExplosion(hitAsteroid.position, 45, new THREE.Color(0x00f3ff), 65);
        }

        // Hide laser instance
        this.dummy.position.set(0, 0, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.laserMesh.setMatrixAt(i, this.dummy.matrix);
        this.laserMesh.instanceMatrix.needsUpdate = true;
      }
    }

    return { hits, mineralsEarned, destroyedAsteroids, impactPositions };
  }

  public spawnExplosion(pos: THREE.Vector3, count: number, color: THREE.Color, maxSpeed = 35): void {
    let spawned = 0;

    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (p.isAlive) continue;

      p.isAlive = true;
      p.position.copy(pos);
      p.color.copy(color);
      p.lifetime = 0;
      p.maxLifetime = 0.4 + Math.random() * 0.6;

      // Random spherical blast velocity
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(Math.random() * 2 - 1);
      const speed = 5 + Math.random() * maxSpeed;

      p.velocity.set(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed,
        Math.cos(theta) * speed
      );

      spawned++;
    }
  }

  public getActiveLaserCount(): number {
    return this.lasers.filter((l) => l.isAlive).length;
  }

  public getActiveParticleCount(): number {
    return this.particles.filter((p) => p.isAlive).length;
  }

  public reset(): void {
    this.fireTimer = 0;
    for (let i = 0; i < this.lasers.length; i++) {
      this.lasers[i].isAlive = false;
      this.dummy.position.set(0, 0, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.laserMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.laserMesh.instanceMatrix.needsUpdate = true;

    for (const p of this.particles) {
      p.isAlive = false;
    }
  }
}
