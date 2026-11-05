import * as THREE from 'three';
import { CombatSystem } from './combat';

export type DroneState = 'PATROL' | 'PURSUIT' | 'ATTACK' | 'EVADE';

export interface DroneData {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  state: DroneState;
  health: number;
  maxHealth: number;
  shields: number;
  maxShields: number;
  bounty: number;
  isAlive: boolean;
  patrolWaypoint: THREE.Vector3;
  patrolTimer: number;
  fireCooldownTimer: number;
  evadeTimer: number;
}

export class EnemyDrone {
  public data: DroneData;
  public mesh: THREE.Group;

  public maxSpeed = 52.0;
  public acceleration = 38.0;
  public turnSpeed = 2.4;
  public aggroRadius = 260.0;
  public attackRadius = 150.0;
  public fireInterval = 0.55; // fires every 0.55s when in range

  constructor(id: number, initialPos: THREE.Vector3) {
    this.data = {
      id,
      position: initialPos.clone(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      state: 'PATROL',
      health: 50,
      maxHealth: 50,
      shields: 40,
      maxShields: 40,
      bounty: 450,
      isAlive: true,
      patrolWaypoint: this.generateRandomWaypoint(initialPos),
      patrolTimer: 0,
      fireCooldownTimer: 0,
      evadeTimer: 0
    };

    this.mesh = this.buildDroneMesh();
    this.mesh.position.copy(this.data.position);
    this.mesh.quaternion.copy(this.data.quaternion);
  }

  private generateRandomWaypoint(origin: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      origin.x + (Math.random() - 0.5) * 300,
      origin.y + (Math.random() - 0.5) * 60,
      origin.z + (Math.random() - 0.5) * 300
    );
  }

  private buildDroneMesh(): THREE.Group {
    const group = new THREE.Group();

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a24,
      metalness: 0.9,
      roughness: 0.25
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xff0044
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff0022,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });

    // 1. Central Core Fuselage
    const coreGeom = new THREE.OctahedronGeometry(1.2, 0);
    coreGeom.scale(1, 0.75, 1.8);
    const core = new THREE.Mesh(coreGeom, chassisMat);
    group.add(core);

    // 2. Glowing Sensor Eye (front -Z)
    const eyeGeom = new THREE.SphereGeometry(0.35, 8, 8);
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(0, 0.05, -1.6);
    group.add(eye);

    // 3. Forward aggressive blades (Left / Right)
    const bladeGeom = new THREE.ConeGeometry(0.35, 2.2, 4);
    bladeGeom.rotateX(-Math.PI / 2);

    const leftBlade = new THREE.Mesh(bladeGeom, trimMat);
    leftBlade.position.set(-1.4, 0, -0.6);
    leftBlade.rotation.y = 0.25;
    group.add(leftBlade);

    const rightBlade = new THREE.Mesh(bladeGeom, trimMat);
    rightBlade.position.set(1.4, 0, -0.6);
    rightBlade.rotation.y = -0.25;
    group.add(rightBlade);

    // 4. Rear Engine Thruster
    const thrusterGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8);
    thrusterGeom.rotateX(Math.PI / 2);
    const thruster = new THREE.Mesh(thrusterGeom, chassisMat);
    thruster.position.set(0, 0, 1.4);
    group.add(thruster);

    return group;
  }

  public update(dt: number, playerPos: THREE.Vector3, combat?: CombatSystem): boolean {
    if (!this.data.isAlive) return false;

    if (this.data.fireCooldownTimer > 0) {
      this.data.fireCooldownTimer -= dt;
    }

    const distToPlayer = this.data.position.distanceTo(playerPos);
    let targetPos: THREE.Vector3;
    let didFire = false;

    // State Machine Transitions
    if (distToPlayer <= this.attackRadius) {
      this.data.state = 'ATTACK';
    } else if (distToPlayer <= this.aggroRadius) {
      this.data.state = 'PURSUIT';
    } else {
      this.data.state = 'PATROL';
    }

    // State Execution
    if (this.data.state === 'PATROL') {
      this.data.patrolTimer += dt;
      if (this.data.position.distanceTo(this.data.patrolWaypoint) < 30 || this.data.patrolTimer > 15) {
        this.data.patrolWaypoint = this.generateRandomWaypoint(this.data.position);
        this.data.patrolTimer = 0;
      }
      targetPos = this.data.patrolWaypoint;
    } else if (this.data.state === 'PURSUIT') {
      targetPos = playerPos;
    } else {
      // ATTACK: Orbit / flank player and maintain fire range
      const flankOffset = new THREE.Vector3(
        Math.sin(this.data.id * 1.5) * 45,
        Math.cos(this.data.id * 1.2) * 20,
        Math.cos(this.data.id * 1.5) * 45
      );
      targetPos = playerPos.clone().add(flankOffset);

      // Aim and fire at player if lined up
      const forward = this.getForwardVector();
      const dirToPlayer = playerPos.clone().sub(this.data.position).normalize();
      const dot = forward.dot(dirToPlayer);

      if (dot > 0.88 && this.data.fireCooldownTimer <= 0 && combat) {
        // Fire enemy laser
        const muzzles = {
          left: this.data.position.clone().add(new THREE.Vector3(-1.4, 0, -1.0).applyQuaternion(this.data.quaternion)),
          right: this.data.position.clone().add(new THREE.Vector3(1.4, 0, -1.0).applyQuaternion(this.data.quaternion))
        };
        combat.fire(muzzles, forward, this.data.velocity, true);
        this.data.fireCooldownTimer = this.fireInterval;
        didFire = true;
      }
    }

    // Steering Physics: Rotate toward target
    const desiredDir = targetPos.clone().sub(this.data.position).normalize();
    if (desiredDir.lengthSq() > 0) {
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), desiredDir);
      this.data.quaternion.slerp(targetQuat, Math.min(1.0, this.turnSpeed * dt));
    }

    // Thrust acceleration along forward vector
    const forwardVec = this.getForwardVector();
    const thrust = forwardVec.clone().multiplyScalar(this.acceleration * dt);
    this.data.velocity.add(thrust);

    // Linear drag
    this.data.velocity.multiplyScalar(0.98);

    // Speed clamping
    if (this.data.velocity.length() > this.maxSpeed) {
      this.data.velocity.normalize().multiplyScalar(this.maxSpeed);
    }

    // Position advance
    this.data.position.addScaledVector(this.data.velocity, dt);

    // Sync mesh
    this.mesh.position.copy(this.data.position);
    this.mesh.quaternion.copy(this.data.quaternion);

    return didFire;
  }

  public takeDamage(amount: number): { isDead: boolean; bounty: number } {
    if (!this.data.isAlive) return { isDead: false, bounty: 0 };

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

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.data.quaternion);
  }

  public respawn(pos: THREE.Vector3): void {
    this.data.position.copy(pos);
    this.data.velocity.set(0, 0, 0);
    this.data.quaternion.identity();
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.isAlive = true;
    this.data.state = 'PATROL';
    this.mesh.position.copy(this.data.position);
    this.mesh.quaternion.copy(this.data.quaternion);
    this.mesh.visible = true;
  }
}

export class EnemyFleetManager {
  public drones: EnemyDrone[] = [];
  public squadGroup = new THREE.Group();

  constructor(count = 8) {
    this.initFleet(count);
  }

  private initFleet(count: number): void {
    this.drones = [];
    for (let i = 0; i < count; i++) {
      // Spawn drones patrolling inside the asteroid rim (radius 220 to 600)
      const angle = (i / count) * Math.PI * 2;
      const distance = 260 + (i % 3) * 120;
      const spawnPos = new THREE.Vector3(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 50,
        Math.sin(angle) * distance
      );

      const drone = new EnemyDrone(i, spawnPos);
      this.drones.push(drone);
      this.squadGroup.add(drone.mesh);
    }
  }

  public update(dt: number, playerPos: THREE.Vector3, combat: CombatSystem): { shotsFired: number } {
    let shotsFired = 0;
    for (const drone of this.drones) {
      if (!drone.data.isAlive) continue;
      const fired = drone.update(dt, playerPos, combat);
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

      for (const drone of this.drones) {
        if (!drone.data.isAlive) continue;

        // Bounding-sphere test against drone (radius ~ 2.2)
        const distSq = laser.position.distanceToSquared(drone.data.position);
        if (distSq <= (laser.radius + 2.2) * (laser.radius + 2.2)) {
          hits++;
          laser.isAlive = false;

          // Spawn hit sparks
          combat.spawnExplosion(laser.position, 14, new THREE.Color(0xff0044), 30);

          const res = drone.takeDamage(laser.damage);
          if (res.isDead) {
            killed++;
            totalBounty += res.bounty;
            // Massive drone destruction explosion
            combat.spawnExplosion(drone.data.position, 50, new THREE.Color(0xff2200), 70);
          }

          break; // laser consumed
        }
      }
    }

    return { hits, killed, totalBounty };
  }

  public getActiveCount(): number {
    return this.drones.filter((d) => d.data.isAlive).length;
  }
}
