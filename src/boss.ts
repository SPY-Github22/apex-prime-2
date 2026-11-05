import * as THREE from 'three';
import { CombatSystem } from './combat';

export type BossPhase = 'PHASE_SHIELDED' | 'PHASE_ENRAGED' | 'DEFEATED';

export interface BossDamageResult {
  shieldDamage: number;
  hullDamage: number;
  isExhaustHit: boolean;
  isDestroyed: boolean;
}

export interface BossData {
  id: string;
  name: string;
  title: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  shields: number;
  maxShields: number;
  phase: BossPhase;
  isAlive: boolean;
  isActive: boolean;
  bountyCredits: number;
  dropsWarpKey: boolean;
}

export class IronColossusBoss {
  public data: BossData;
  public mesh: THREE.Group;

  private coreMesh!: THREE.Mesh;
  private leftTurret!: THREE.Mesh;
  private rightTurret!: THREE.Mesh;
  private fireTimer = 0;
  private fireInterval = 1.2; // seconds between heavy volleys
  private alternateTurret = false;
  private pulseTimer = 0;

  constructor(initialPosition = new THREE.Vector3(150, 0, -450)) {
    this.data = {
      id: 'archon-01-iron-colossus',
      name: 'ARCHON 01 // THE IRON COLOSSUS',
      title: 'Obsidian Dreadnought Carrier',
      position: initialPosition.clone(),
      velocity: new THREE.Vector3(),
      health: 800,
      maxHealth: 800,
      shields: 400,
      maxShields: 400,
      phase: 'PHASE_SHIELDED',
      isAlive: true,
      isActive: false,
      bountyCredits: 5000,
      dropsWarpKey: false
    };

    this.mesh = this.buildBossMesh();
    this.mesh.position.copy(this.data.position);
    this.mesh.visible = false;
  }

  private buildBossMesh(): THREE.Group {
    const group = new THREE.Group();

    // Dark obsidian alloy material
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      metalness: 0.9,
      roughness: 0.25
    });

    // Crimson Syndicate glow
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xcc0033,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    // Core generator glow
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff2200,
      emissiveIntensity: 1.0,
      roughness: 0.1
    });

    // 1. Heavy Dreadnought Main Hull (Length 32, Width 18, Height 8)
    const hullGeom = new THREE.ConeGeometry(9.0, 32, 6);
    hullGeom.rotateX(-Math.PI / 2); // Point forward along -Z
    hullGeom.scale(1.2, 0.5, 1.0);
    const hullMesh = new THREE.Mesh(hullGeom, armorMat);
    group.add(hullMesh);

    // 2. Command Bridge Tower
    const bridgeGeom = new THREE.BoxGeometry(6.5, 3.5, 10);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, armorMat);
    bridgeMesh.position.set(0, 3.2, 2.0);
    group.add(bridgeMesh);

    // Bridge viewport visor
    const visorGeom = new THREE.BoxGeometry(5.8, 0.8, 1.2);
    const visorMesh = new THREE.Mesh(visorGeom, crimsonMat);
    visorMesh.position.set(0, 3.6, -3.2);
    group.add(visorMesh);

    // 3. Pulsing Void Core (Center)
    const coreGeom = new THREE.OctahedronGeometry(3.0, 1);
    this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.coreMesh.position.set(0, 0, 0);
    group.add(this.coreMesh);

    // 4. Twin Heavy Plasma Turrets
    const turretGeom = new THREE.CylinderGeometry(1.2, 1.6, 6.0, 8);
    turretGeom.rotateX(Math.PI / 2);

    this.leftTurret = new THREE.Mesh(turretGeom, armorMat);
    this.leftTurret.position.set(-8.5, 0.5, -4.0);
    group.add(this.leftTurret);

    this.rightTurret = new THREE.Mesh(turretGeom, armorMat);
    this.rightTurret.position.set(8.5, 0.5, -4.0);
    group.add(this.rightTurret);

    // Turret muzzle tips
    const tipGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    tipGeom.rotateX(Math.PI / 2);
    const leftTip = new THREE.Mesh(tipGeom, crimsonMat);
    leftTip.position.set(-8.5, 0.5, -7.5);
    group.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeom, crimsonMat);
    rightTip.position.set(8.5, 0.5, -7.5);
    group.add(rightTip);

    // 5. Thermal Exhaust Nacelles (Vulnerable Rear Ports)
    const exhaustGeom = new THREE.CylinderGeometry(2.0, 2.4, 5.0, 10);
    exhaustGeom.rotateX(Math.PI / 2);
    const leftExhaust = new THREE.Mesh(exhaustGeom, crimsonMat);
    leftExhaust.position.set(-5.0, 0, 14.5);
    group.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeom, crimsonMat);
    rightExhaust.position.set(5.0, 0, 14.5);
    group.add(rightExhaust);

    return group;
  }

  public spawn(spawnPos = new THREE.Vector3(150, 0, -450)): void {
    this.data.position.copy(spawnPos);
    this.mesh.position.copy(spawnPos);
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.phase = 'PHASE_SHIELDED';
    this.data.isAlive = true;
    this.data.isActive = true;
    this.data.dropsWarpKey = false;
    this.mesh.visible = true;
  }

  public takeDamage(
    incomingDamage: number,
    shotDir?: THREE.Vector3
  ): BossDamageResult {
    if (!this.data.isAlive) {
      return { shieldDamage: 0, hullDamage: 0, isExhaustHit: false, isDestroyed: false };
    }

    // Determine if shot hit rear thermal exhaust port (forward of boss is along -Z, rear is along +Z)
    const bossForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
    let isExhaustHit = false;

    if (shotDir) {
      // If shot was traveling in the same direction as boss forward, it hit from behind!
      const dot = shotDir.dot(bossForward);
      if (dot > 0.45) {
        isExhaustHit = true;
      }
    }

    // Thermal exhaust hit deals 1.4x bonus damage and bypasses 50% shielding
    const effectiveDamage = isExhaustHit ? incomingDamage * 1.4 : incomingDamage;
    let shieldDmg = 0;
    let hullDmg = 0;

    if (isExhaustHit && this.data.shields > 0) {
      // 50% hits shields, 50% penetrates directly to hull
      const shieldPortion = effectiveDamage * 0.5;
      const penetrativePortion = effectiveDamage * 0.5;

      if (this.data.shields >= shieldPortion) {
        this.data.shields -= shieldPortion;
        shieldDmg = shieldPortion;
      } else {
        shieldDmg = this.data.shields;
        hullDmg += (shieldPortion - this.data.shields);
        this.data.shields = 0;
      }

      this.data.health = Math.max(0, this.data.health - (penetrativePortion + hullDmg));
      hullDmg += penetrativePortion;
    } else if (this.data.shields > 0) {
      // Normal shield absorption
      if (this.data.shields >= effectiveDamage) {
        this.data.shields -= effectiveDamage;
        shieldDmg = effectiveDamage;
      } else {
        shieldDmg = this.data.shields;
        hullDmg = effectiveDamage - this.data.shields;
        this.data.shields = 0;
        this.data.health = Math.max(0, this.data.health - hullDmg);
      }
    } else {
      // Pure hull damage
      hullDmg = effectiveDamage;
      this.data.health = Math.max(0, this.data.health - hullDmg);
    }

    // Check phase transitions
    if (this.data.shields <= 0 && this.data.phase === 'PHASE_SHIELDED') {
      this.data.phase = 'PHASE_ENRAGED';
      this.fireInterval = 0.7; // Faster firing when enraged
    }

    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.phase = 'DEFEATED';
      this.data.dropsWarpKey = true;
      this.mesh.visible = false;
      return { shieldDamage: shieldDmg, hullDamage: hullDmg, isExhaustHit, isDestroyed: true };
    }

    return { shieldDamage: shieldDmg, hullDamage: hullDmg, isExhaustHit, isDestroyed: false };
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    combat: CombatSystem
  ): { fired: boolean; bossAlive: boolean } {
    if (!this.data.isActive || !this.data.isAlive) {
      return { fired: false, bossAlive: false };
    }

    // 1. Core pulsing VFX
    this.pulseTimer += dt * 3.5;
    const coreScale = 1.0 + Math.sin(this.pulseTimer) * 0.15;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);

    // 2. Slow tracking turn toward player
    const toPlayer = playerPos.clone().sub(this.data.position);
    const distToPlayer = toPlayer.length();

    if (distToPlayer > 0.1) {
      const targetQuat = new THREE.Quaternion();
      const lookMat = new THREE.Matrix4().lookAt(this.data.position, playerPos, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(lookMat);
      this.mesh.quaternion.slerp(targetQuat, Math.min(1.0, 1.2 * dt));
    }

    // 3. Steady advance towards player (maintain 60-120 range)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
    const speed = distToPlayer > 120 ? 18.0 : (distToPlayer < 60 ? -10.0 : 5.0);
    this.data.velocity.copy(forward).multiplyScalar(speed);
    this.data.position.addScaledVector(this.data.velocity, dt);
    this.mesh.position.copy(this.data.position);

    // 4. Weapons Artillery Barrage
    let fired = false;
    this.fireTimer -= dt;

    if (this.fireTimer <= 0 && distToPlayer <= 280) {
      // Pick turret: left or right
      const turretWorldPos = new THREE.Vector3();
      const activeTurret = this.alternateTurret ? this.leftTurret : this.rightTurret;
      activeTurret.getWorldPosition(turretWorldPos);
      this.alternateTurret = !this.alternateTurret;

      // Heavy plasma velocity toward player with slight predictive lead
      const aimDir = playerPos.clone().sub(turretWorldPos).normalize();
      const dummyMuzzles = { left: turretWorldPos, right: turretWorldPos };

      combat.fire(dummyMuzzles, aimDir, this.data.velocity, true, 20); // 35 base + 20 = 55 heavy damage
      this.fireTimer = this.fireInterval;
      fired = true;
    }

    return { fired, bossAlive: true };
  }

  public reset(): void {
    this.data.health = this.data.maxHealth;
    this.data.shields = this.data.maxShields;
    this.data.phase = 'PHASE_SHIELDED';
    this.data.isAlive = true;
    this.data.isActive = false;
    this.data.dropsWarpKey = false;
    this.mesh.visible = false;
  }
}
