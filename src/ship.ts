import * as THREE from 'three';

export interface FlightInput {
  pitch: number;    // -1 (pitch up) to 1 (pitch down)
  yaw: number;      // -1 (yaw left) to 1 (yaw right)
  roll: number;     // -1 (roll left) to 1 (roll right)
  throttle: number; // 0 to 1 forward thrust
  boost: boolean;   // afterburner engaged
  brake: boolean;   // reverse thrusters / space brake
}

export interface ShipDamageResult {
  shieldAbsorbed: number;
  hullDamage: number;
  isDestroyed: boolean;
}

export class Starship {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public quaternion: THREE.Quaternion;

  // Flight dynamics configuration
  public maxSpeed = 75.0;
  public boostMultiplier = 2.0;
  public acceleration = 45.0;
  public brakeFactor = 30.0;
  public linearDamping = 0.985;
  public turnSpeed = 1.6; // rad/s
  public rollSpeed = 2.4; // rad/s
  public bankFactor = 0.65; // auto-banking roll into yaw turns

  // Stats
  public shields = 100;
  public maxShields = 100;
  public hull = 100;
  public maxHull = 100;
  public boostEnergy = 100;
  public maxBoostEnergy = 100;
  public isBoosting = false;
  public shieldRegenDelay = 3.0; // seconds before shield starts regenerating
  private timeSinceLastHit = 999.0;

  // Visual engine plume meshes for dynamic scaling
  private leftEnginePlume!: THREE.Mesh;
  private rightEnginePlume!: THREE.Mesh;

  constructor(initialPosition = new THREE.Vector3(0, 0, 0)) {
    this.position = initialPosition.clone();
    this.velocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.mesh = this.buildProceduralMesh();
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
  }

  private buildProceduralMesh(): THREE.Group {
    const group = new THREE.Group();

    // Materials
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf4f7fa, // Pristine arctic white hull
      metalness: 0.25,
      roughness: 0.35
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x18202c,
      metalness: 0.8,
      roughness: 0.3
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.2
    });

    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1
    });

    const engineGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.85
    });

    // 1. Central Fuselage (arrowhead stealth interceptor body)
    const fuselageGeom = new THREE.ConeGeometry(1.6, 6.0, 5);
    fuselageGeom.rotateX(-Math.PI / 2); // align along -Z (forward in Three.js)
    const fuselage = new THREE.Mesh(fuselageGeom, hullMat);
    group.add(fuselage);

    // 2. Cockpit Canopy
    const canopyGeom = new THREE.BoxGeometry(0.8, 0.6, 2.0);
    const canopy = new THREE.Mesh(canopyGeom, cockpitMat);
    canopy.position.set(0, 0.5, -0.6);
    canopy.rotation.x = -0.2;
    group.add(canopy);

    // 3. Swept Delta Wings (Left & Right)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(-4.5, -1.8);
    wingShape.lineTo(-4.2, -2.6);
    wingShape.lineTo(0, -1.5);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const leftWingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    leftWingGeom.rotateX(Math.PI / 2);
    const leftWing = new THREE.Mesh(leftWingGeom, hullMat);
    leftWing.position.set(-0.6, 0, 1.0);
    group.add(leftWing);

    // Mirror for right wing
    const rightWingShape = new THREE.Shape();
    rightWingShape.moveTo(0, 0);
    rightWingShape.lineTo(4.5, -1.8);
    rightWingShape.lineTo(4.2, -2.6);
    rightWingShape.lineTo(0, -1.5);
    rightWingShape.closePath();

    const rightWingGeom = new THREE.ExtrudeGeometry(rightWingShape, extrudeSettings);
    rightWingGeom.rotateX(Math.PI / 2);
    const rightWing = new THREE.Mesh(rightWingGeom, hullMat);
    rightWing.position.set(0.6, 0, 1.0);
    group.add(rightWing);

    // 4. Vertical Stabilizers / Winglets
    const wingletGeom = new THREE.BoxGeometry(0.12, 1.2, 1.0);
    const leftWinglet = new THREE.Mesh(wingletGeom, trimMat);
    leftWinglet.position.set(-4.2, 0.5, 0.8);
    leftWinglet.rotation.z = -0.15;
    group.add(leftWinglet);

    const rightWinglet = new THREE.Mesh(wingletGeom, trimMat);
    rightWinglet.position.set(4.2, 0.5, 0.8);
    rightWinglet.rotation.z = 0.15;
    group.add(rightWinglet);

    // 5. Wingtip Plasma Cannon Barrels
    const cannonGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    cannonGeom.rotateX(Math.PI / 2);

    const leftCannon = new THREE.Mesh(cannonGeom, trimMat);
    leftCannon.position.set(-3.8, -0.05, -0.4);
    group.add(leftCannon);

    const rightCannon = new THREE.Mesh(cannonGeom, trimMat);
    rightCannon.position.set(3.8, -0.05, -0.4);
    group.add(rightCannon);

    // 6. Dual Rear Thrusters & Exhaust Plumes
    const thrusterRingGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.6, 12);
    thrusterRingGeom.rotateX(Math.PI / 2);

    const leftThruster = new THREE.Mesh(thrusterRingGeom, darkAccentMat);
    leftThruster.position.set(-0.8, 0, 2.7);
    group.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterRingGeom, darkAccentMat);
    rightThruster.position.set(0.8, 0, 2.7);
    group.add(rightThruster);

    // Exhaust glow cones
    const plumeGeom = new THREE.ConeGeometry(0.35, 2.0, 8);
    plumeGeom.rotateX(Math.PI / 2);

    this.leftEnginePlume = new THREE.Mesh(plumeGeom, engineGlowMat);
    this.leftEnginePlume.position.set(-0.8, 0, 3.8);
    group.add(this.leftEnginePlume);

    this.rightEnginePlume = new THREE.Mesh(plumeGeom, engineGlowMat);
    this.rightEnginePlume.position.set(0.8, 0, 3.8);
    group.add(this.rightEnginePlume);

    return group;
  }

  public update(dt: number, input: FlightInput): void {
    // 1. Boost Capacitor & Throttle handling
    this.isBoosting = false;
    let currentMaxSpeed = this.maxSpeed;
    let currentAcceleration = this.acceleration;

    if (input.boost && this.boostEnergy > 5 && input.throttle > 0) {
      this.isBoosting = true;
      currentMaxSpeed *= this.boostMultiplier;
      currentAcceleration *= 1.8;
      this.boostEnergy = Math.max(0, this.boostEnergy - 32 * dt);
    } else {
      this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + 18 * dt);
    }

    // 2. Rotational Orientation (Pitch, Yaw, Roll, Auto-Banking)
    const pitchDelta = input.pitch * this.turnSpeed * dt;
    const yawDelta = -input.yaw * this.turnSpeed * dt;
    const bankRoll = -input.yaw * this.bankFactor; // automatic banking tilt into turn
    const directRollDelta = -input.roll * this.rollSpeed * dt;

    const rotDelta = new THREE.Quaternion();
    const euler = new THREE.Euler(pitchDelta, yawDelta, directRollDelta + (bankRoll * 0.1), 'YXZ');
    rotDelta.setFromEuler(euler);
    this.quaternion.multiply(rotDelta);

    // 3. Thrust Vector & Forward Acceleration
    // Forward direction in Three.js is -Z
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);

    if (input.throttle > 0) {
      const thrust = forward.clone().multiplyScalar(input.throttle * currentAcceleration * dt);
      this.velocity.add(thrust);
    }

    if (input.brake) {
      const brakeForce = this.velocity.clone().normalize().multiplyScalar(-this.brakeFactor * dt);
      this.velocity.add(brakeForce);
    }

    // Apply linear inertia drag / damping
    this.velocity.multiplyScalar(Math.pow(this.linearDamping, dt * 60));

    // Clamp to max current speed
    const currentSpeed = this.velocity.length();
    if (currentSpeed > currentMaxSpeed) {
      this.velocity.normalize().multiplyScalar(currentMaxSpeed);
    }

    // 4. Update Position
    this.position.addScaledVector(this.velocity, dt);

    // Sync Three.js mesh
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);

    // 5. Dynamic Engine Exhaust Visual Scaling
    const thrustLevel = input.throttle > 0 ? (this.isBoosting ? 2.5 : 1.0) : 0.2;
    this.leftEnginePlume.scale.set(1, 1, thrustLevel);
    this.rightEnginePlume.scale.set(1, 1, thrustLevel);

    // 6. Regenerate Shields
    this.timeSinceLastHit += dt;
    if (this.timeSinceLastHit >= this.shieldRegenDelay && this.shields < this.maxShields) {
      this.shields = Math.min(this.maxShields, this.shields + 14 * dt);
    }
  }

  public takeDamage(amount: number): ShipDamageResult {
    this.timeSinceLastHit = 0;
    let shieldAbsorbed = 0;
    let hullDamage = 0;

    if (this.shields > 0) {
      if (this.shields >= amount) {
        shieldAbsorbed = amount;
        this.shields -= amount;
      } else {
        shieldAbsorbed = this.shields;
        hullDamage = amount - this.shields;
        this.shields = 0;
        this.hull = Math.max(0, this.hull - hullDamage);
      }
    } else {
      hullDamage = amount;
      this.hull = Math.max(0, this.hull - hullDamage);
    }

    return {
      shieldAbsorbed,
      hullDamage,
      isDestroyed: this.hull <= 0
    };
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
  }

  public getRightVector(): THREE.Vector3 {
    return new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
  }

  public getUpVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
  }

  public getLaserMuzzlePositions(): { left: THREE.Vector3; right: THREE.Vector3 } {
    const leftOffset = new THREE.Vector3(-3.8, -0.05, -1.2).applyQuaternion(this.quaternion);
    const rightOffset = new THREE.Vector3(3.8, -0.05, -1.2).applyQuaternion(this.quaternion);

    return {
      left: this.position.clone().add(leftOffset),
      right: this.position.clone().add(rightOffset)
    };
  }

  public reset(pos = new THREE.Vector3(0, 0, 0)): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.quaternion.identity();
    this.shields = this.maxShields;
    this.hull = this.maxHull;
    this.boostEnergy = this.maxBoostEnergy;
    this.timeSinceLastHit = 999;
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
  }
}
