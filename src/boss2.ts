import * as THREE from 'three';
import { CombatSystem } from './combat';
import { Starship } from './ship';

export type Boss2Phase = 'PHASE_TEMPORAL' | 'PHASE_HYPER_DILATION' | 'DEFEATED';

export interface Boss2DamageResult {
  shieldDamage: number;
  hullDamage: number;
  didChronoDash: boolean;
  isDestroyed: boolean;
}

export interface Boss2Data {
  id: string;
  name: string;
  title: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  shields: number;
  maxShields: number;
  phase: Boss2Phase;
  isAlive: boolean;
  isActive: boolean;
  bountyCredits: number;
  dropsWarpKey: boolean;
  recentDamageAccumulator: number;
  chronoDashCooldown: number;
  temporalFieldRadius: number;
  isTemporalFieldActive: boolean;
}

export class ChronoPhantomBoss {
  public data: Boss2Data;
  public mesh: THREE.Group;

  private chronoRings: THREE.Mesh[] = [];
  private singularityCore!: THREE.Mesh;
  private leftLanceMuzzle!: THREE.Mesh;
  private rightLanceMuzzle!: THREE.Mesh;
  private fireTimer = 0;
  private fireInterval = 0.95;
  private alternateLance = false;
  private ringSpinTimer = 0;

  constructor(initialPosition = new THREE.Vector3(0, 40, -1250)) {
    this.data = {
      id: 'archon-02-chrono-phantom',
      name: 'ARCHON 02 // THE CHRONO PHANTOM',
      title: 'Precursor Temporal Dreadnought',
      position: initialPosition.clone(),
      velocity: new THREE.Vector3(),
      health: 1200,
      maxHealth: 1200,
      shields: 600,
      maxShields: 600,
      phase: 'PHASE_TEMPORAL',
      isAlive: true,
      isActive: false,
      bountyCredits: 8000,
      dropsWarpKey: false,
      recentDamageAccumulator: 0,
      chronoDashCooldown: 0,
      temporalFieldRadius: 85.0,
      isTemporalFieldActive: true
    };

    this.mesh = this.buildBossMesh();
    this.mesh.position.copy(this.data.position);
    this.mesh.visible = false;
  }

  private buildBossMesh(): THREE.Group {
    const root = new THREE.Group();

    // Materials
    const darkObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e18,
      metalness: 0.95,
      roughness: 0.15
    });

    const chronoGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0x997700,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2
    });

    const tachyonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85
    });

    // 1. Sleek Spire Needle Hull
    const hullGeom = new THREE.ConeGeometry(5.5, 36, 6);
    hullGeom.rotateX(-Math.PI / 2); // Point forward (-Z)
    hullGeom.scale(1.4, 0.6, 1.0);
    const hullMesh = new THREE.Mesh(hullGeom, darkObsidianMat);
    root.add(hullMesh);

    // 2. Dual Tachyon Lance Wings
    const wingGeom = new THREE.BoxGeometry(18.0, 0.4, 6.0);
    const wings = new THREE.Mesh(wingGeom, darkObsidianMat);
    wings.position.set(0, 0, 2.0);
    wings.rotation.y = Math.PI / 10;
    root.add(wings);

    // Lance Muzzle Barrels
    const lanceGeom = new THREE.CylinderGeometry(0.6, 0.9, 8.0, 8);
    lanceGeom.rotateX(Math.PI / 2);

    this.leftLanceMuzzle = new THREE.Mesh(lanceGeom, chronoGoldMat);
    this.leftLanceMuzzle.position.set(-8.5, 0, -4.0);
    root.add(this.leftLanceMuzzle);

    this.rightLanceMuzzle = new THREE.Mesh(lanceGeom, chronoGoldMat);
    this.rightLanceMuzzle.position.set(8.5, 0, -4.0);
    root.add(this.rightLanceMuzzle);

    // 3. Central Singularity Core
    const coreGeom = new THREE.SphereGeometry(3.0, 16, 16);
    this.singularityCore = new THREE.Mesh(coreGeom, tachyonCyanMat);
    this.singularityCore.position.set(0, 0, 0);
    root.add(this.singularityCore);

    // 4. 3 Gyroscopic Chrono Rings
    for (let r = 0; r < 3; r++) {
      const ringGeom = new THREE.TorusGeometry(6.5 + r * 2.2, 0.35, 8, 36);
      const ring = new THREE.Mesh(ringGeom, chronoGoldMat);
      this.chronoRings.push(ring);
      root.add(ring);
    }

    return root;
  }

  public spawn(spawnPos = new THREE.Vector3(0, 40, -1250)): void {
    this.data.position.copy(spawnPos);
    this.mesh.position.copy(spawnPos);
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.phase = 'PHASE_TEMPORAL';
    this.data.isAlive = true;
    this.data.isActive = true;
    this.data.dropsWarpKey = false;
    this.data.recentDamageAccumulator = 0;
    this.data.chronoDashCooldown = 0;
    this.mesh.visible = true;
  }

  public takeDamage(
    amount: number,
    _shotDir?: THREE.Vector3
  ): Boss2DamageResult {
    if (!this.data.isAlive) {
      return { shieldDamage: 0, hullDamage: 0, didChronoDash: false, isDestroyed: false };
    }

    let shieldDmg = 0;
    let hullDmg = 0;

    if (this.data.shields > 0) {
      if (this.data.shields >= amount) {
        this.data.shields -= amount;
        shieldDmg = amount;
      } else {
        shieldDmg = this.data.shields;
        hullDmg = amount - this.data.shields;
        this.data.shields = 0;
        this.data.health = Math.max(0, this.data.health - hullDmg);
      }
    } else {
      hullDmg = amount;
      this.data.health = Math.max(0, this.data.health - hullDmg);
    }

    this.data.recentDamageAccumulator += amount;

    // Check Chrono-Dash Teleport Trigger: 150+ damage taken triggers instant temporal displacement
    let didChronoDash = false;
    if (this.data.recentDamageAccumulator >= 150 && this.data.chronoDashCooldown <= 0 && this.data.health > 0) {
      this.executeChronoDash();
      didChronoDash = true;
      this.data.recentDamageAccumulator = 0;
      this.data.chronoDashCooldown = 3.5;
    }

    // Phase transition when shields break
    if (this.data.shields <= 0 && this.data.phase === 'PHASE_TEMPORAL') {
      this.data.phase = 'PHASE_HYPER_DILATION';
      this.fireInterval = 0.6; // Rapid fire lances in dilation phase
    }

    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.phase = 'DEFEATED';
      this.data.dropsWarpKey = true;
      this.mesh.visible = false;
      return { shieldDamage: shieldDmg, hullDamage: hullDmg, didChronoDash, isDestroyed: true };
    }

    return { shieldDamage: shieldDmg, hullDamage: hullDmg, didChronoDash, isDestroyed: false };
  }

  private executeChronoDash(): void {
    // Jump 70-90 units in a random lateral / vertical vector
    const angle = Math.random() * Math.PI * 2;
    const offset = new THREE.Vector3(
      Math.cos(angle) * 75,
      (Math.random() - 0.5) * 40,
      Math.sin(angle) * 60
    );
    this.data.position.add(offset);
    this.mesh.position.copy(this.data.position);
  }

  public update(
    dt: number,
    ship: Starship,
    combat: CombatSystem
  ): { fired: boolean; inSlowField: boolean; bossAlive: boolean } {
    if (!this.data.isActive || !this.data.isAlive) {
      return { fired: false, inSlowField: false, bossAlive: false };
    }

    // Cooldown decays
    if (this.data.chronoDashCooldown > 0) this.data.chronoDashCooldown -= dt;
    this.data.recentDamageAccumulator = Math.max(0, this.data.recentDamageAccumulator - 40 * dt);

    // 1. Gyroscopic Chrono-Ring Rotations
    this.ringSpinTimer += dt;
    if (this.chronoRings[0]) this.chronoRings[0].rotation.x = this.ringSpinTimer * 2.2;
    if (this.chronoRings[1]) this.chronoRings[1].rotation.y = this.ringSpinTimer * -2.8;
    if (this.chronoRings[2]) this.chronoRings[2].rotation.z = this.ringSpinTimer * 3.4;

    // 2. Turn towards player
    const toPlayer = ship.position.clone().sub(this.data.position);
    const distToPlayer = toPlayer.length();

    if (distToPlayer > 0.1) {
      const targetQuat = new THREE.Quaternion();
      const lookMat = new THREE.Matrix4().lookAt(this.data.position, ship.position, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(lookMat);
      this.mesh.quaternion.slerp(targetQuat, Math.min(1.0, 1.8 * dt));
    }

    // 3. Stalking flight towards player
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
    const targetSpeed = distToPlayer > 140 ? 25.0 : (distToPlayer < 70 ? -12.0 : 8.0);
    this.data.velocity.copy(forward).multiplyScalar(targetSpeed);
    this.data.position.addScaledVector(this.data.velocity, dt);
    this.mesh.position.copy(this.data.position);

    // 4. Temporal Slow-Field Dilation on player starship
    let inSlowField = false;
    if (distToPlayer <= this.data.temporalFieldRadius) {
      inSlowField = true;
      // Damp player velocity while trapped inside temporal distortion bubble
      ship.velocity.multiplyScalar(Math.pow(0.55, dt));
    }

    // 5. Dual Tachyon Lance Artillery Firing
    let fired = false;
    this.fireTimer -= dt;

    if (this.fireTimer <= 0 && distToPlayer <= 300) {
      const muzzlePos = new THREE.Vector3();
      const activeMuzzle = this.alternateLance ? this.leftLanceMuzzle : this.rightLanceMuzzle;
      activeMuzzle.getWorldPosition(muzzlePos);
      this.alternateLance = !this.alternateLance;

      const aimDir = ship.position.clone().sub(muzzlePos).normalize();
      const dummyMuzzles = { left: muzzlePos, right: muzzlePos };

      combat.fire(dummyMuzzles, aimDir, this.data.velocity, true, 28); // 35 base + 28 = 63 damage
      this.fireTimer = this.fireInterval;
      fired = true;
    }

    return { fired, inSlowField, bossAlive: true };
  }

  public reset(): void {
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.phase = 'PHASE_TEMPORAL';
    this.data.isAlive = true;
    this.data.isActive = false;
    this.data.dropsWarpKey = false;
    this.mesh.visible = false;
  }
}
