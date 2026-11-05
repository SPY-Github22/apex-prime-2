import * as THREE from 'three';
import { CombatSystem } from './combat';

export type PhantomState = 'CLOAKED_PATROL' | 'AMBUSH_STRIKE' | 'EVASIVE_CLOAK';

export interface PhantomData {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  state: PhantomState;
  health: number;
  maxHealth: number;
  shields: number;
  maxShields: number;
  bounty: number;
  isAlive: boolean;
  isCloaked: boolean;
  cloakAlpha: number; // 0.12 (cloaked) to 1.0 (decloaked)
  fireTimer: number;
  cloakCooldown: number;
  respawnTimer: number;
}

export class CyberPhantom {
  public data: PhantomData;
  public mesh: THREE.Group;

  public maxSpeed = 68.0;
  public acceleration = 46.0;
  public turnSpeed = 2.8;
  public ambushRadius = 120.0;
  public fireInterval = 0.8;

  private materials: THREE.MeshStandardMaterial[] = [];
  private leftMuzzle!: THREE.Mesh;
  private rightMuzzle!: THREE.Mesh;

  constructor(id: number, initialPos = new THREE.Vector3(0, 0, -1100)) {
    this.data = {
      id,
      position: initialPos.clone(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      state: 'CLOAKED_PATROL',
      health: 75,
      maxHealth: 75,
      shields: 60,
      maxShields: 60,
      bounty: 750,
      isAlive: true,
      isCloaked: true,
      cloakAlpha: 0.15,
      fireTimer: 0,
      cloakCooldown: 0,
      respawnTimer: 0
    };

    this.mesh = this.buildPhantomMesh();
    this.mesh.position.copy(this.data.position);
    this.applyCloakOpacity(this.data.cloakAlpha);
  }

  private buildPhantomMesh(): THREE.Group {
    const group = new THREE.Group();

    // Materials with transparency enabled for phase cloaking
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.15
    });
    this.materials.push(chassisMat);

    const circuitMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00ccee,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.2
    });
    this.materials.push(circuitMat);

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xff00aa,
      emissive: 0xaa0066,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.2
    });
    this.materials.push(trimMat);

    // 1. Sleek Needle Fuselage
    const noseGeom = new THREE.ConeGeometry(0.9, 5.2, 5);
    noseGeom.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeom, chassisMat);
    group.add(nose);

    // 2. Forward Swept Phantom Wings
    const wingGeom = new THREE.BoxGeometry(7.0, 0.12, 1.8);
    const wings = new THREE.Mesh(wingGeom, chassisMat);
    wings.position.set(0, 0, 0.6);
    wings.rotation.y = Math.PI / 8;
    group.add(wings);

    // Wingtip circuit emitters
    const emitterGeom = new THREE.BoxGeometry(0.3, 0.3, 2.0);
    this.leftMuzzle = new THREE.Mesh(emitterGeom, circuitMat);
    this.leftMuzzle.position.set(-3.4, 0, 0.4);
    group.add(this.leftMuzzle);

    this.rightMuzzle = new THREE.Mesh(emitterGeom, circuitMat);
    this.rightMuzzle.position.set(3.4, 0, 0.4);
    group.add(this.rightMuzzle);

    // Central phase disruptor crystal
    const crystalGeom = new THREE.OctahedronGeometry(0.6, 0);
    const crystal = new THREE.Mesh(crystalGeom, trimMat);
    crystal.position.set(0, 0.3, -0.2);
    group.add(crystal);

    return group;
  }

  private applyCloakOpacity(alpha: number): void {
    for (const mat of this.materials) {
      mat.opacity = Math.max(0.12, Math.min(1.0, alpha));
    }
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.data.quaternion);
  }

  public takeDamage(amount: number): { isDead: boolean; bounty: number } {
    if (!this.data.isAlive) return { isDead: false, bounty: 0 };

    // Force decloak on damage hit!
    this.data.isCloaked = false;
    this.data.cloakAlpha = 1.0;
    this.applyCloakOpacity(1.0);
    this.data.cloakCooldown = 4.0; // Prevent re-cloaking immediately

    if (this.data.shields > 0) {
      if (this.data.shields >= amount) {
        this.data.shields -= amount;
      } else {
        const excess = amount - this.data.shields;
        this.data.shields = 0;
        this.data.health = Math.max(0, this.data.health - excess);
      }
    } else {
      this.data.health = Math.max(0, this.data.health - amount);
    }

    if (this.data.health <= 0) {
      this.data.isAlive = false;
      this.mesh.visible = false;
      return { isDead: true, bounty: this.data.bounty };
    }

    return { isDead: false, bounty: 0 };
  }

  public update(dt: number, playerPos: THREE.Vector3, combat: CombatSystem): boolean {
    if (!this.data.isAlive) return false;

    const toPlayer = playerPos.clone().sub(this.data.position);
    const distToPlayer = toPlayer.length();
    let didFire = false;

    // Cooldown management
    if (this.data.fireTimer > 0) this.data.fireTimer -= dt;
    if (this.data.cloakCooldown > 0) this.data.cloakCooldown -= dt;

    // State Transitions
    if (this.data.state === 'CLOAKED_PATROL') {
      if (distToPlayer <= this.ambushRadius) {
        // Decloak and engage ambush!
        this.data.state = 'AMBUSH_STRIKE';
        this.data.isCloaked = false;
      }
    } else if (this.data.state === 'AMBUSH_STRIKE') {
      if (distToPlayer > this.ambushRadius * 1.5 || this.data.shields <= 20) {
        // Disengage into evasive cloaking
        this.data.state = 'EVASIVE_CLOAK';
        this.data.isCloaked = true;
      }
    } else if (this.data.state === 'EVASIVE_CLOAK') {
      if (distToPlayer > 220 && this.data.cloakCooldown <= 0) {
        this.data.state = 'CLOAKED_PATROL';
      }
    }

    // Dynamic Cloak Opacity Lerp
    const targetAlpha = this.data.isCloaked ? 0.15 : 1.0;
    this.data.cloakAlpha = THREE.MathUtils.lerp(this.data.cloakAlpha, targetAlpha, Math.min(1.0, 5.0 * dt));
    this.applyCloakOpacity(this.data.cloakAlpha);

    // AI Flight Navigation
    let desiredVel = new THREE.Vector3();

    if (this.data.state === 'CLOAKED_PATROL') {
      // Stalking approach towards player flank
      const flankTarget = playerPos.clone().add(new THREE.Vector3(
        Math.sin(this.data.id * 2.0) * 80,
        Math.cos(this.data.id) * 25,
        Math.cos(this.data.id * 2.0) * 80
      ));
      desiredVel = flankTarget.sub(this.data.position).normalize().multiplyScalar(this.maxSpeed * 0.6);

    } else if (this.data.state === 'AMBUSH_STRIKE') {
      // High-speed pass towards player
      desiredVel = toPlayer.clone().normalize().multiplyScalar(this.maxSpeed);

      // Aim and fire EMP lasers if aligned
      const forward = this.getForwardVector();
      const aimDir = toPlayer.clone().normalize();
      const dot = forward.dot(aimDir);

      if (dot > 0.85 && this.data.fireTimer <= 0 && combat) {
        const leftPos = new THREE.Vector3();
        const rightPos = new THREE.Vector3();
        this.leftMuzzle.getWorldPosition(leftPos);
        this.rightMuzzle.getWorldPosition(rightPos);

        combat.fire(
          { left: leftPos, right: rightPos },
          aimDir,
          this.data.velocity,
          true,
          10 // +10 EMP bonus damage
        );
        this.data.fireTimer = this.fireInterval;
        didFire = true;
      }

    } else {
      // EVASIVE_CLOAK: Break away at maximum speed
      desiredVel = toPlayer.clone().negate().normalize().multiplyScalar(this.maxSpeed * 1.1);
    }

    // Smooth velocity & orientation
    this.data.velocity.lerp(desiredVel, Math.min(1.0, 3.5 * dt));
    this.data.position.addScaledVector(this.data.velocity, dt);

    if (this.data.velocity.lengthSq() > 1.0) {
      const lookMat = new THREE.Matrix4().lookAt(
        this.data.position,
        this.data.position.clone().add(this.data.velocity),
        new THREE.Vector3(0, 1, 0)
      );
      this.data.quaternion.setFromRotationMatrix(lookMat);
    }

    this.mesh.position.copy(this.data.position);
    this.mesh.quaternion.copy(this.data.quaternion);

    return didFire;
  }

  public respawn(pos: THREE.Vector3): void {
    this.data.position.copy(pos);
    this.data.velocity.set(0, 0, 0);
    this.data.quaternion.identity();
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.isAlive = true;
    this.data.isCloaked = true;
    this.data.state = 'CLOAKED_PATROL';
    this.data.cloakAlpha = 0.15;
    this.data.respawnTimer = 0;
    this.mesh.position.copy(this.data.position);
    this.mesh.visible = true;
    this.applyCloakOpacity(0.15);
  }
}

export class CyberPhantomFleetManager {
  public phantoms: CyberPhantom[] = [];
  public squadGroup = new THREE.Group();

  constructor(count = 6, origin = new THREE.Vector3(0, 0, -1100)) {
    this.initSquad(count, origin);
  }

  private initSquad(count: number, origin: THREE.Vector3): void {
    this.phantoms = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 180 + (i % 2) * 90;
      const spawnPos = new THREE.Vector3(
        origin.x + Math.cos(angle) * dist,
        origin.y + (Math.random() - 0.5) * 40,
        origin.z + Math.sin(angle) * dist
      );

      const phantom = new CyberPhantom(i, spawnPos);
      this.phantoms.push(phantom);
      this.squadGroup.add(phantom.mesh);
    }
  }

  public update(dt: number, playerPos: THREE.Vector3, combat: CombatSystem): { shotsFired: number } {
    let shotsFired = 0;
    for (const p of this.phantoms) {
      if (!p.data.isAlive) {
        p.data.respawnTimer += dt;
        if (p.data.respawnTimer >= 25.0) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 220 + Math.random() * 150;
          p.respawn(new THREE.Vector3(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 40,
            -1100 + Math.sin(angle) * dist
          ));
        }
        continue;
      }

      const fired = p.update(dt, playerPos, combat);
      if (fired) shotsFired++;
    }

    return { shotsFired };
  }

  public checkPlayerLaserHits(combat: CombatSystem): { hits: number; killed: number; totalBounty: number } {
    let hits = 0;
    let killed = 0;
    let totalBounty = 0;

    for (const laser of combat.lasers) {
      if (!laser.isAlive || laser.isEnemy) continue;

      for (const p of this.phantoms) {
        if (!p.data.isAlive) continue;

        // Bounding-sphere test against phantom interceptor (radius ~2.6)
        const distSq = laser.position.distanceToSquared(p.data.position);
        if (distSq <= (laser.radius + 2.6) * (laser.radius + 2.6)) {
          hits++;
          laser.isAlive = false;

          // Electrical sparks on decloak hit
          combat.spawnExplosion(laser.position, 16, new THREE.Color(0x00f3ff), 35);

          const res = p.takeDamage(laser.damage);
          if (res.isDead) {
            killed++;
            totalBounty += res.bounty;
            combat.spawnExplosion(p.data.position, 55, new THREE.Color(0x00aacc), 75);
          }

          break;
        }
      }
    }

    return { hits, killed, totalBounty };
  }

  public getActiveCount(): number {
    return this.phantoms.filter(p => p.data.isAlive).length;
  }
}
