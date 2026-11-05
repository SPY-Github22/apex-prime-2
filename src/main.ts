import * as THREE from 'three';
import { ShipTelemetry } from './types';
import { Starship, FlightInput } from './ship';
import { AsteroidFieldManager } from './asteroids';

export class ApexPrimeGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private clock = new THREE.Clock();

  public ship: Starship;
  public asteroidField: AsteroidFieldManager;

  // Flight input state
  private input: FlightInput = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    throttle: 0,
    boost: false,
    brake: false
  };

  private keysDown: Set<string> = new Set();

  // DOM HUD Elements
  private hudSector: HTMLElement;
  private hudCoords: HTMLElement;
  private hudShields: HTMLElement;
  private hudHull: HTMLElement;
  private hudCredits: HTMLElement;
  private hudSpeed: HTMLElement;
  private hudBoostFill: HTMLElement;

  private telemetry: ShipTelemetry;

  constructor() {
    this.container = document.getElementById('webgl-canvas-container')!;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020409, 0.0003);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      12000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // Initialize HUD references
    this.hudSector = document.getElementById('hud-sector')!;
    this.hudCoords = document.getElementById('hud-coords')!;
    this.hudShields = document.getElementById('hud-shields')!;
    this.hudHull = document.getElementById('hud-hull')!;
    this.hudCredits = document.getElementById('hud-credits')!;
    this.hudSpeed = document.getElementById('hud-speed')!;
    this.hudBoostFill = document.getElementById('hud-boost-fill')!;

    // Initialize Starship
    this.ship = new Starship(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.ship.mesh);

    // Initialize Asteroid Field (Sector 1: Valles Asteroid Rim)
    this.asteroidField = new AsteroidFieldManager();
    this.scene.add(this.asteroidField.mesh);

    this.telemetry = {
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      speed: 0,
      maxSpeed: this.ship.maxSpeed,
      boostMultiplier: this.ship.boostMultiplier,
      isBoosting: false,
      shields: this.ship.shields,
      maxShields: this.ship.maxShields,
      hull: this.ship.hull,
      maxHull: this.ship.maxHull,
      credits: 2500,
      currentSector: 'SECTOR 01 // VALLES ASTEROID RIM'
    };

    this.initLights();
    this.initStarfield();
    this.setupControls();
    this.setupWindowResize();

    // Position camera initially behind ship
    this.camera.position.set(0, 6, 20);

    requestAnimationFrame((t) => this.loop(t));
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0x223344, 1.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 3.2);
    sunLight.position.set(500, 400, 250);
    this.scene.add(sunLight);

    // Subtle blue fill light from below
    const fillLight = new THREE.DirectionalLight(0x0044aa, 1.0);
    fillLight.position.set(-300, -200, -100);
    this.scene.add(fillLight);
  }

  private initStarfield(): void {
    const starCount = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const radius = 1200 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.82) {
        colors[idx] = 0.4; colors[idx + 1] = 0.8; colors[idx + 2] = 1.0; // Cyan
      } else if (tint > 0.65) {
        colors[idx] = 1.0; colors[idx + 1] = 0.7; colors[idx + 2] = 0.3; // Amber
      } else if (tint > 0.55) {
        colors[idx] = 1.0; colors[idx + 1] = 0.3; colors[idx + 2] = 0.8; // Magenta
      } else {
        colors[idx] = 0.95; colors[idx + 1] = 0.98; colors[idx + 2] = 1.0; // White
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    const starfield = new THREE.Points(geometry, material);
    this.scene.add(starfield);
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });
  }

  private pollInput(): void {
    // Forward Throttle
    const throttleKey = this.keysDown.has('KeyW') || this.keysDown.has('ShiftLeft') || this.keysDown.has('ArrowUp');
    this.input.throttle = throttleKey ? 1.0 : 0.0;

    // Pitch (W/S or Up/Down)
    let pitch = 0;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) pitch += 1.0; // nose up
    if (this.keysDown.has('KeyW') && !this.keysDown.has('ShiftLeft')) pitch -= 0.6; // subtle nose down on pure W
    this.input.pitch = pitch;

    // Yaw (A/D or Left/Right)
    let yaw = 0;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) yaw -= 1.0;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) yaw += 1.0;
    this.input.yaw = yaw;

    // Roll (Q/E)
    let roll = 0;
    if (this.keysDown.has('KeyQ')) roll -= 1.0;
    if (this.keysDown.has('KeyE')) roll += 1.0;
    this.input.roll = roll;

    // Afterburner Boost (Space or Tab)
    this.input.boost = this.keysDown.has('Space') || this.keysDown.has('Tab');

    // Space Brake (KeyX or ControlLeft)
    this.input.brake = this.keysDown.has('KeyX') || this.keysDown.has('ControlLeft');
  }

  private updateCamera(dt: number): void {
    const forward = this.ship.getForwardVector();
    const up = this.ship.getUpVector();

    // 3rd person chase camera offset: 15.5 units behind, 4.5 units above ship plane
    const desiredPos = this.ship.position.clone()
      .addScaledVector(forward, -15.5)
      .addScaledVector(up, 4.5);

    // Smooth camera lag lerp
    this.camera.position.lerp(desiredPos, Math.min(1.0, 10.0 * dt));

    // Look slightly ahead of ship forward vector
    const lookTarget = this.ship.position.clone().addScaledVector(forward, 25.0);
    this.camera.lookAt(lookTarget);

    // Align camera up vector with ship's local up vector for cinematic banking
    this.camera.up.lerp(up, Math.min(1.0, 8.0 * dt));
  }

  private handleAsteroidCollisions(): void {
    const hit = this.asteroidField.checkCollision(this.ship.position, 3.2);
    if (hit) {
      const bounceNormal = this.ship.position.clone().sub(hit.position);
      if (bounceNormal.lengthSq() === 0) {
        bounceNormal.set(0, 1, 0);
      } else {
        bounceNormal.normalize();
      }

      // Push ship safely outside asteroid radius
      this.ship.position.copy(hit.position).addScaledVector(bounceNormal, hit.radius + 3.4);

      // Reflect and damp velocity
      const currentSpeed = this.ship.velocity.length();
      this.ship.velocity.reflect(bounceNormal).multiplyScalar(0.55);

      // Apply kinetic impact damage
      const impactDamage = Math.max(12, currentSpeed * 0.45);
      const res = this.ship.takeDamage(impactDamage);

      if (res.isDestroyed) {
        // Reset ship safely in harbor after critical hull rupture
        this.ship.reset(new THREE.Vector3(0, 0, 0));
      }
    }
  }

  private updateHUD(): void {
    const curSpeed = this.ship.velocity.length();
    this.hudSpeed.innerText = curSpeed.toFixed(1);

    const boostPct = Math.round((this.ship.boostEnergy / this.ship.maxBoostEnergy) * 100);
    this.hudBoostFill.style.width = `${boostPct}%`;
    if (this.ship.isBoosting) {
      this.hudBoostFill.style.boxShadow = '0 0 16px #ff00aa';
    } else {
      this.hudBoostFill.style.boxShadow = '0 0 8px #00f3ff';
    }

    const shieldPct = Math.round((this.ship.shields / this.ship.maxShields) * 100);
    this.hudShields.innerText = `${shieldPct}%`;

    const hullPct = Math.round((this.ship.hull / this.ship.maxHull) * 100);
    this.hudHull.innerText = `${hullPct}%`;

    this.hudCoords.innerText = `${Math.round(this.ship.position.x)}, ${Math.round(this.ship.position.y)}, ${Math.round(this.ship.position.z)}`;
    this.hudSector.innerText = this.telemetry.currentSector;
    this.hudCredits.innerText = `${this.telemetry.credits.toLocaleString()} CR`;
  }

  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private loop(_timestamp: number): void {
    const dt = Math.min(0.1, this.clock.getDelta());

    this.pollInput();
    this.ship.update(dt, this.input);
    this.asteroidField.update(dt);
    this.handleAsteroidCollisions();
    this.updateCamera(dt);
    this.updateHUD();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this.loop(t));
  }

  public getTelemetry(): ShipTelemetry {
    this.telemetry.pos = { x: this.ship.position.x, y: this.ship.position.y, z: this.ship.position.z };
    this.telemetry.vel = { x: this.ship.velocity.x, y: this.ship.velocity.y, z: this.ship.velocity.z };
    this.telemetry.speed = this.ship.velocity.length();
    this.telemetry.isBoosting = this.ship.isBoosting;
    this.telemetry.shields = this.ship.shields;
    this.telemetry.hull = this.ship.hull;
    return this.telemetry;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ApexPrimeGame();
});
