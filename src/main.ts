import * as THREE from 'three';
import { ShipTelemetry } from './types';
import { Starship, FlightInput } from './ship';
import { AsteroidFieldManager } from './asteroids';
import { CombatSystem } from './combat';
import { EnemyFleetManager } from './enemies';
import { SpaceStation } from './station';
import { StarbaseShop } from './shop';
import { QuestManager } from './quests';
import { TerminalUI } from './terminal_ui';
import { IronColossusBoss } from './boss';
import { SectorWarpGate } from './warpgate';
import { DerelictFieldManager } from './derelicts';
import { CyberPhantomFleetManager } from './phantoms';
import { ChronoPhantomBoss } from './boss2';
import { TutorialManager } from './tutorial';

export class ApexPrimeGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private clock = new THREE.Clock();

  public ship: Starship;
  public asteroidField: AsteroidFieldManager;
  public combat: CombatSystem;
  public enemyFleet: EnemyFleetManager;
  public station: SpaceStation;
  public shop: StarbaseShop;
  public quests: QuestManager;
  public terminalUI: TerminalUI;
  public boss: IronColossusBoss;
  public boss2: ChronoPhantomBoss;
  public warpGate: SectorWarpGate;
  public derelicts: DerelictFieldManager;
  public phantoms: CyberPhantomFleetManager;
  public tutorial: TutorialManager;

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
  private isMouseDown = false;

  // DOM HUD Elements
  private hudSector: HTMLElement;
  private hudCoords: HTMLElement;
  private hudShields: HTMLElement;
  private hudHull: HTMLElement;
  private hudHostiles: HTMLElement;
  private hudCredits: HTMLElement;
  private hudSpeed: HTMLElement;
  private hudBoostFill: HTMLElement;
  private hudDockingPrompt: HTMLElement;
  private hudStationDockBanner: HTMLElement;
  private btnUndock: HTMLElement;
  private hudBoss: HTMLElement;
  private hudBossTitle: HTMLElement;
  private hudBossPhaseTag: HTMLElement;
  private hudBossShieldsFill: HTMLElement;
  private hudBossHullFill: HTMLElement;
  private hudWarpPrompt: HTMLElement;
  private hudSalvagePrompt: HTMLElement;
  private hudTemporalWarning: HTMLElement;
  private hudBeaconText: HTMLElement | null;
  private btnOpenTutorial: HTMLElement | null;

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
    this.renderer.toneMappingExposure = 1.45;
    this.container.appendChild(this.renderer.domElement);

    // Initialize HUD references
    this.hudSector = document.getElementById('hud-sector')!;
    this.hudCoords = document.getElementById('hud-coords')!;
    this.hudShields = document.getElementById('hud-shields')!;
    this.hudHull = document.getElementById('hud-hull')!;
    this.hudHostiles = document.getElementById('hud-hostiles')!;
    this.hudCredits = document.getElementById('hud-credits')!;
    this.hudSpeed = document.getElementById('hud-speed')!;
    this.hudBoostFill = document.getElementById('hud-boost-fill')!;
    this.hudDockingPrompt = document.getElementById('docking-prompt')!;
    this.hudStationDockBanner = document.getElementById('station-dock-banner')!;
    this.btnUndock = document.getElementById('btn-undock')!;
    this.hudBoss = document.getElementById('boss-hud')!;
    this.hudBossTitle = document.getElementById('boss-title')!;
    this.hudBossPhaseTag = document.getElementById('boss-phase-tag')!;
    this.hudBossShieldsFill = document.getElementById('boss-shields-fill')!;
    this.hudBossHullFill = document.getElementById('boss-hull-fill')!;
    this.hudWarpPrompt = document.getElementById('warp-prompt')!;
    this.hudSalvagePrompt = document.getElementById('salvage-prompt')!;
    this.hudTemporalWarning = document.getElementById('temporal-warning')!;

    if (this.btnUndock) {
      this.btnUndock.addEventListener('click', () => {
        if (this.station.data.status === 'DOCKED') {
          this.terminalUI.close();
          this.station.undock(this.ship);
        }
      });
    }

    // Initialize Starship
    this.ship = new Starship(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.ship.mesh);

    // Initialize Asteroid Field (Sector 1: Valles Asteroid Rim)
    this.asteroidField = new AsteroidFieldManager();
    this.scene.add(this.asteroidField.mesh);

    // Initialize Combat & Particle Systems
    this.combat = new CombatSystem();
    this.scene.add(this.combat.laserMesh);
    this.scene.add(this.combat.particleMesh);

    // Initialize Autonomous Enemy AI Fleet
    this.enemyFleet = new EnemyFleetManager(8);
    this.scene.add(this.enemyFleet.squadGroup);

    // Initialize Orbital Space Station (Starbase Horizon-9)
    this.station = new SpaceStation('STARBASE HORIZON-9', 'THE SOLAR ALLIANCE', new THREE.Vector3(0, 45, -280));
    this.scene.add(this.station.mesh);

    // Initialize Archon 01 Boss Vehicle (The Iron Colossus)
    this.boss = new IronColossusBoss(new THREE.Vector3(150, 0, -450));
    this.scene.add(this.boss.mesh);

    // Initialize Sector Warp Star-Gate
    this.warpGate = new SectorWarpGate('SECTOR 02 // THE NEON GRAVEYARD', new THREE.Vector3(0, 0, -800));
    this.scene.add(this.warpGate.mesh);

    // Initialize Sector 2: Derelict Cyber-Debris Field
    this.derelicts = new DerelictFieldManager();
    this.scene.add(this.derelicts.group);

    // Initialize Sector 2: Syndicate Cyber-Phantom Interceptors
    this.phantoms = new CyberPhantomFleetManager(6, new THREE.Vector3(0, 0, -1100));
    this.scene.add(this.phantoms.squadGroup);

    // Initialize Archon 02 Boss Vehicle (The Chrono Phantom)
    this.boss2 = new ChronoPhantomBoss(new THREE.Vector3(0, 40, -1250));
    this.scene.add(this.boss2.mesh);

    // Initialize Starbase Shop & Quest Engine
    this.shop = new StarbaseShop();
    this.quests = new QuestManager();
    this.terminalUI = new TerminalUI({
      shop: this.shop,
      quests: this.quests,
      ship: this.ship,
      getCredits: () => this.telemetry.credits,
      setCredits: (cr: number) => {
        this.telemetry.credits = cr;
      }
    });

    const btnOpenTerminal = document.getElementById('btn-open-terminal');
    if (btnOpenTerminal) {
      btnOpenTerminal.addEventListener('click', () => {
        if (this.station.data.status === 'DOCKED') {
          this.terminalUI.open();
        }
      });
    }

    this.hudBeaconText = document.getElementById('beacon-text');
    this.btnOpenTutorial = document.getElementById('btn-open-tutorial');

    this.tutorial = new TutorialManager(() => {
      this.terminalUI.showHUDToast('AURA: Systems initialized. Starbase Horizon-9 is directly ahead (Press E to dock)!', 6000);
    });

    if (this.btnOpenTutorial) {
      this.btnOpenTutorial.addEventListener('click', () => {
        this.tutorial.open();
      });
    }

    if (this.tutorial.shouldAutoShow()) {
      this.tutorial.open(0);
    } else {
      setTimeout(() => {
        this.terminalUI.showHUDToast('AURA: Welcome Pilot Vesper-01. Starbase Horizon-9 is ahead (Press E to dock, or H for manual).', 5000);
      }, 600);
    }

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

    (window as any).__APEX_GAME__ = this;

    requestAnimationFrame((t) => this.loop(t));
  }

  private initLights(): void {
    // 1. Balanced sky/ground hemisphere light providing full-spectrum fill illumination
    const hemiLight = new THREE.HemisphereLight(0xbadfff, 0x223355, 2.2);
    this.scene.add(hemiLight);

    // 2. Powerful primary solar directional light with crisp highlights
    const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
    sunLight.position.set(450, 600, 300);
    this.scene.add(sunLight);

    // 3. Forward fill & rim light illuminating approaching space stations, asteroids, and targets
    const forwardRimLight = new THREE.DirectionalLight(0x00f3ff, 2.2);
    forwardRimLight.position.set(0, 200, -700);
    this.scene.add(forwardRimLight);

    // 4. Counter fill light for deep space shadow softening
    const counterFillLight = new THREE.DirectionalLight(0x5577bb, 1.8);
    counterFillLight.position.set(-350, -250, 100);
    this.scene.add(counterFillLight);

    // 5. Cinematic ship key light mounted above the hull
    const shipKeyLight = new THREE.PointLight(0xffffff, 3.5, 60, 1.1);
    shipKeyLight.position.set(0, 4.0, 5.0);
    this.ship.mesh.add(shipKeyLight);

    // 6. High-power tactical starship searchlight illuminating space ahead
    const shipHeadlight = new THREE.SpotLight(0xaae8ff, 6.0, 220, Math.PI / 4, 0.35);
    shipHeadlight.position.set(0, 0, -2.5);
    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0, -60);
    this.ship.mesh.add(headlightTarget);
    shipHeadlight.target = headlightTarget;
    this.ship.mesh.add(shipHeadlight);
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

      // Station docking / undocking interaction
      if (e.code === 'KeyE') {
        if (this.station.data.status === 'APPROACH') {
          this.station.data.status = 'DOCKING';
        } else if (this.station.data.status === 'DOCKED') {
          this.terminalUI.close();
          this.station.undock(this.ship);
        }
      }

      // Open/close station terminal when docked
      if (e.code === 'KeyT') {
        if (this.station.data.status === 'DOCKED') {
          this.terminalUI.toggle();
        }
      }

      // Derelict Salvage Operation
      if (e.code === 'KeyR') {
        const wreck = this.derelicts.checkSalvageProximity(this.ship.position, 35.0);
        if (wreck) {
          const sRes = this.derelicts.salvage(wreck.id);
          if (sRes.success) {
            this.telemetry.credits += sRes.creditsYield;
            this.combat.spawnExplosion(wreck.position, 30, new THREE.Color(0xfacc15), 35);
            this.terminalUI.showHUDToast(`SALVAGED: ${wreck.name} (+${sRes.creditsYield.toLocaleString()} CR)${sRes.relicFound ? ' [PRECURSOR RELIC EXTRACTED]' : ''}`);
            const qRes = this.quests.onDerelictSalvaged();
            if (qRes.newlyReady.length > 0) {
              this.terminalUI.showHUDToast(`MISSION READY: ${qRes.newlyReady[0].title} (Dock at Station)`);
            }
            this.terminalUI.updateHUDMissionTracker();
          }
        }
      }

      // Sector Warp Gate Transit
      if (e.code === 'KeyG') {
        const prox = this.warpGate.checkProximity(this.ship.position);
        if (prox.canWarp) {
          this.warpGate.engageWarp();
          this.terminalUI.showHUDToast('HYPERSPACE JUMP ENGAGED // TRANSITING TO SECTOR 02...');
        }
      }

      // Flight Academy & Tutorial Manual toggle
      if (e.code === 'KeyH') {
        if (this.tutorial.isOpen()) {
          this.tutorial.close();
        } else {
          this.tutorial.open();
        }
      }

      // Close modal on Escape
      if (e.code === 'Escape') {
        if (this.tutorial.isOpen()) {
          this.tutorial.close();
        }
        if (this.terminalUI.isOpen()) {
          this.terminalUI.close();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.modal-overlay') || target?.closest('#station-dock-banner') || target?.closest('button')) {
        return;
      }
      if (e.button === 0) {
        this.isMouseDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });
  }

  private pollInput(): void {
    if (this.tutorial.isOpen() || this.terminalUI.isOpen()) {
      this.input.throttle = 0;
      this.input.pitch = 0;
      this.input.yaw = 0;
      this.input.roll = 0;
      this.input.boost = false;
      this.input.brake = true;
      return;
    }

    // Forward Throttle
    const throttleKey = this.keysDown.has('KeyW') || this.keysDown.has('ShiftLeft');
    this.input.throttle = throttleKey ? 1.0 : 0.0;

    // Pitch (ArrowDown / KeyS = nose up, ArrowUp = nose down)
    let pitch = 0;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) pitch += 1.0;
    if (this.keysDown.has('ArrowUp')) pitch -= 1.0;
    this.input.pitch = pitch;

    // Yaw (A/D or Left/Right)
    let yaw = 0;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) yaw -= 1.0;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) yaw += 1.0;
    this.input.yaw = yaw;

    // Roll (Q/E) - suppress KeyE roll if station docking interaction is active
    let roll = 0;
    if (this.keysDown.has('KeyQ')) roll -= 1.0;
    if (this.keysDown.has('KeyE') && this.station.data.status === 'UNDOCKED') roll += 1.0;
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

      // Spawn collision impact sparks
      this.combat.spawnExplosion(this.ship.position, 15, new THREE.Color(0xff4400), 20);

      if (res.isDestroyed) {
        // Reset ship safely in harbor after critical hull rupture
        this.ship.reset(new THREE.Vector3(0, 0, 0));
      }
    }
  }

  private handleEnemyLaserCollisions(): void {
    for (const laser of this.combat.lasers) {
      if (!laser.isAlive || !laser.isEnemy) continue;

      const dist = laser.position.distanceTo(this.ship.position);
      if (dist <= laser.radius + 2.8) {
        laser.isAlive = false;
        this.combat.spawnExplosion(laser.position, 16, new THREE.Color(0xff0044), 30);
        const damageRes = this.ship.takeDamage(laser.damage);

        if (damageRes.isDestroyed) {
          this.ship.reset(new THREE.Vector3(0, 0, 0));
        }
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

    this.hudHostiles.innerText = (this.enemyFleet.getActiveCount() + this.phantoms.getActiveCount()).toString();
    this.hudCoords.innerText = `${Math.round(this.ship.position.x)}, ${Math.round(this.ship.position.y)}, ${Math.round(this.ship.position.z)}`;
    this.hudSector.innerText = this.telemetry.currentSector;
    this.hudCredits.innerText = `${this.telemetry.credits.toLocaleString()} CR`;

    if (this.hudBeaconText) {
      if (this.station.data.status === 'DOCKED') {
        this.hudBeaconText.innerText = 'STATUS: DOCKED AT HORIZON-9 [T TERMINAL / E UNDOCK]';
      } else {
        const dist = Math.round(this.ship.position.distanceTo(this.station.data.position));
        this.hudBeaconText.innerText = `OBJECTIVE: STARBASE HORIZON-9 [E DOCK] • ${dist}M`;
      }
    }
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

    // Normal flight controls active unless locked in tractor dock
    if (this.station.data.status !== 'DOCKED' && this.station.data.status !== 'DOCKING') {
      this.ship.update(dt, this.input);
    }

    // Space Station & Tractor Docking System Update
    const stationRes = this.station.update(dt, this.ship, false);
    if (stationRes.status === 'APPROACH') {
      this.hudDockingPrompt.innerHTML = '<span class="prompt-key">[E]</span> ENGAGE TRACTOR DOCKING BEAM';
      this.hudDockingPrompt.classList.remove('hidden');
    } else if (stationRes.status === 'DOCKING') {
      this.hudDockingPrompt.innerHTML = '<span class="prompt-key" style="color: #00ff88; border-color: #00ff88;">TRACTOR ACTIVE</span> CAPTURING STARSHIP...';
      this.hudDockingPrompt.classList.remove('hidden');
    } else {
      this.hudDockingPrompt.classList.add('hidden');
    }

    if (stationRes.status === 'DOCKED') {
      this.hudStationDockBanner.classList.remove('hidden');
    } else {
      this.hudStationDockBanner.classList.add('hidden');
      if (this.terminalUI.isOpen()) {
        this.terminalUI.close();
      }
    }

    // Combat: Laser Firing (Click or KeyF or KeyJ) - disabled while docked or inside terminal
    const isFiring = (this.isMouseDown || this.keysDown.has('KeyF') || this.keysDown.has('KeyJ') || this.keysDown.has('Enter'))
      && this.station.data.status !== 'DOCKED'
      && !this.terminalUI.isOpen();
    if (isFiring) {
      const extraDamage = this.shop.getWeaponDamageBonus();
      this.combat.fire(
        this.ship.getLaserMuzzlePositions(),
        this.ship.getForwardVector(),
        this.ship.velocity,
        false,
        extraDamage
      );
    }

    this.combat.update(dt);

    // Check laser collisions with asteroids
    const combatHits = this.combat.checkAsteroidCollisions(this.asteroidField);
    if (combatHits.mineralsEarned > 0) {
      this.telemetry.credits += combatHits.mineralsEarned;
    }
    if (combatHits.destroyedAsteroids > 0) {
      for (let i = 0; i < combatHits.destroyedAsteroids; i++) {
        const qRes = this.quests.onAsteroidMined();
        if (qRes.newlyReady.length > 0) {
          this.terminalUI.showHUDToast(`MISSION READY: ${qRes.newlyReady[0].title} (Dock at Station)`);
        }
      }
      this.terminalUI.updateHUDMissionTracker();
    }

    // Update enemy AI drones and dogfighting
    this.enemyFleet.update(dt, this.ship.position, this.combat);

    // Check player lasers hitting enemy drones
    const enemyHits = this.enemyFleet.checkPlayerLaserHits(this.combat);
    if (enemyHits.totalBounty > 0) {
      this.telemetry.credits += enemyHits.totalBounty;
    }
    if (enemyHits.killed > 0) {
      for (let i = 0; i < enemyHits.killed; i++) {
        const qRes = this.quests.onEnemyDestroyed();
        if (qRes.newlyReady.length > 0) {
          this.terminalUI.showHUDToast(`MISSION READY: ${qRes.newlyReady[0].title} (Dock at Station)`);
        }
      }
      this.terminalUI.updateHUDMissionTracker();
    }

    // Check navigation coordinate waypoints
    const navRes = this.quests.onPositionUpdate(this.ship.position);
    if (navRes.newlyReady.length > 0) {
      this.terminalUI.showHUDToast(`BEACON REACHED: ${navRes.newlyReady[0].title} (Dock at Station)`);
      this.terminalUI.updateHUDMissionTracker();
    }

    // Sector 2: Derelict Cyber-Debris Field Collision & Salvage Detection
    this.derelicts.update(dt);
    const nearbyWreck = this.derelicts.checkSalvageProximity(this.ship.position, 38.0);
    if (nearbyWreck) {
      this.hudSalvagePrompt.innerHTML = `<span class="prompt-key">[R]</span> SALVAGE ${nearbyWreck.name} (+${nearbyWreck.salvageValue.toLocaleString()} CR)`;
      this.hudSalvagePrompt.classList.remove('hidden');
    } else {
      this.hudSalvagePrompt.classList.add('hidden');
    }

    const derelictHit = this.derelicts.checkCollision(this.ship.position, 3.2);
    if (derelictHit) {
      const bNorm = this.ship.position.clone().sub(derelictHit.position);
      if (bNorm.lengthSq() === 0) bNorm.set(0, 1, 0);
      bNorm.normalize();
      this.ship.position.copy(derelictHit.position).addScaledVector(bNorm, derelictHit.radius + 3.4);
      this.ship.velocity.reflect(bNorm).multiplyScalar(0.5);
      this.ship.takeDamage(16);
      this.combat.spawnExplosion(this.ship.position, 16, new THREE.Color(0x00f3ff), 20);
    }

    // Sector 2: Cyber-Phantom Squad Dogfights
    this.phantoms.update(dt, this.ship.position, this.combat);
    const phantomHits = this.phantoms.checkPlayerLaserHits(this.combat);
    if (phantomHits.totalBounty > 0) {
      this.telemetry.credits += phantomHits.totalBounty;
    }
    if (phantomHits.killed > 0) {
      for (let i = 0; i < phantomHits.killed; i++) {
        const qRes = this.quests.onPhantomDestroyed();
        if (qRes.newlyReady.length > 0) {
          this.terminalUI.showHUDToast(`MISSION READY: ${qRes.newlyReady[0].title} (Dock at Station)`);
        }
      }
      this.terminalUI.updateHUDMissionTracker();
    }

    // Archon 01 Boss Spawning Check
    if (!this.boss.data.isActive && this.boss.data.phase !== 'DEFEATED') {
      const distToSpawn = this.ship.position.distanceTo(new THREE.Vector3(150, 0, -450));
      if (distToSpawn <= 130) {
        this.boss.spawn(new THREE.Vector3(150, 0, -450));
        this.terminalUI.showHUDToast('WARNING: CAPITAL CLASS WARSHIP DETECTED // ARCHON 01 ENGAGED!');
      }
    }

    // Archon 01 Boss Combat & Laser Hits
    if (this.boss.data.isActive && this.boss.data.isAlive) {
      this.hudBoss.classList.remove('hidden');
      this.hudBossTitle.innerText = this.boss.data.name;
      const sPct = Math.round((this.boss.data.shields / this.boss.data.maxShields) * 100);
      const hPct = Math.round((this.boss.data.health / this.boss.data.maxHealth) * 100);
      this.hudBossShieldsFill.style.width = `${sPct}%`;
      this.hudBossHullFill.style.width = `${hPct}%`;
      this.hudBossPhaseTag.innerText = this.boss.data.phase === 'PHASE_ENRAGED'
        ? 'PHASE 2 // ENRAGED CORE'
        : 'PHASE 1 // SHIELDED CORE';

      this.boss.update(dt, this.ship.position, this.combat);

      // Check player lasers colliding with Archon 01
      for (const laser of this.combat.lasers) {
        if (!laser.isAlive || laser.isEnemy) continue;
        const dist = laser.position.distanceTo(this.boss.data.position);
        if (dist <= 16.0) {
          laser.isAlive = false;
          const shotDir = laser.velocity.clone().normalize();
          const dmgRes = this.boss.takeDamage(laser.damage, shotDir);
          const sparkColor = dmgRes.isExhaustHit ? new THREE.Color(0xffff00) : new THREE.Color(0xff0044);
          this.combat.spawnExplosion(laser.position, dmgRes.isExhaustHit ? 24 : 12, sparkColor, 25);

          if (dmgRes.isDestroyed) {
            this.combat.spawnExplosion(this.boss.data.position, 60, new THREE.Color(0xff2200), 75);
            this.telemetry.credits += this.boss.data.bountyCredits;
            this.warpGate.activate();
            this.terminalUI.showHUDToast('ARCHON 01 DEFEATED! +5,000 CR BOUNTY // SECTOR GATE ONLINE!');
          }
        }
      }
    } else if (!this.boss2.data.isActive || !this.boss2.data.isAlive) {
      this.hudBoss.classList.add('hidden');
    }

    // Archon 02 Boss (The Chrono Phantom) Spawning Check
    if (!this.boss2.data.isActive && this.boss2.data.phase !== 'DEFEATED') {
      const distToB2 = this.ship.position.distanceTo(new THREE.Vector3(0, 40, -1250));
      if (distToB2 <= 140) {
        this.boss2.spawn(new THREE.Vector3(0, 40, -1250));
        this.terminalUI.showHUDToast('WARNING: TEMPORAL ANOMALY DETECTED // ARCHON 02 ENGAGED!');
      }
    }

    // Archon 02 Combat Loop & Temporal Mechanics
    if (this.boss2.data.isActive && this.boss2.data.isAlive) {
      this.hudBoss.classList.remove('hidden');
      this.hudBossTitle.innerText = this.boss2.data.name;
      const sPct = Math.round((this.boss2.data.shields / this.boss2.data.maxShields) * 100);
      const hPct = Math.round((this.boss2.data.health / this.boss2.data.maxHealth) * 100);
      this.hudBossShieldsFill.style.width = `${sPct}%`;
      this.hudBossHullFill.style.width = `${hPct}%`;
      this.hudBossPhaseTag.innerText = this.boss2.data.phase === 'PHASE_HYPER_DILATION'
        ? 'PHASE 2 // HYPER DILATION'
        : 'PHASE 1 // TEMPORAL WEAVE';

      const b2Res = this.boss2.update(dt, this.ship, this.combat);
      if (b2Res.inSlowField) {
        this.hudTemporalWarning.classList.remove('hidden');
      } else {
        this.hudTemporalWarning.classList.add('hidden');
      }

      // Check player lasers colliding with Archon 02
      for (const laser of this.combat.lasers) {
        if (!laser.isAlive || laser.isEnemy) continue;
        const dist = laser.position.distanceTo(this.boss2.data.position);
        if (dist <= 18.0) {
          laser.isAlive = false;
          const dmgRes = this.boss2.takeDamage(laser.damage, laser.velocity.clone().normalize());

          if (dmgRes.didChronoDash) {
            this.combat.spawnExplosion(laser.position, 35, new THREE.Color(0x00ffff), 40);
            this.terminalUI.showHUDToast('ARCHON 02 EXECUTED TEMPORAL DISPLACEMENT JUMP!');
          } else {
            this.combat.spawnExplosion(laser.position, 14, new THREE.Color(0xfacc15), 25);
          }

          if (dmgRes.isDestroyed) {
            this.combat.spawnExplosion(this.boss2.data.position, 75, new THREE.Color(0x00ffff), 90);
            this.telemetry.credits += this.boss2.data.bountyCredits;
            this.terminalUI.showHUDToast('ARCHON 02 DEFEATED! +8,000 CR BOUNTY // CHRONO WARP KEY ACQUIRED!');
            this.hudBoss.classList.add('hidden');
            this.hudTemporalWarning.classList.add('hidden');
          }
        }
      }
    }

    // Sector Warp Gate Logic & Transit
    const gateRes = this.warpGate.update(dt, this.ship);
    const gateProx = this.warpGate.checkProximity(this.ship.position);
    if (gateProx.canWarp) {
      this.hudWarpPrompt.classList.remove('hidden');
    } else {
      this.hudWarpPrompt.classList.add('hidden');
    }

    if (gateRes.warpCompleted) {
      this.telemetry.currentSector = 'SECTOR 02 // THE NEON GRAVEYARD';
      this.hudSector.innerText = this.telemetry.currentSector;
      this.terminalUI.showHUDToast('WARP JUMP COMPLETE // ARRIVED AT SECTOR 02: THE NEON GRAVEYARD');
    }

    // Check enemy lasers hitting player starship
    this.handleEnemyLaserCollisions();

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
