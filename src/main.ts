import * as THREE from 'three';
import { ShipTelemetry } from './types';

export class ApexPrimeGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private telemetry: ShipTelemetry = {
    pos: { x: 0, y: 0, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    speed: 0,
    maxSpeed: 80,
    boostMultiplier: 2.2,
    isBoosting: false,
    shields: 100,
    maxShields: 100,
    hull: 100,
    maxHull: 100,
    credits: 2500,
    currentSector: 'ALPHA CENTAURI CORE'
  };

  constructor() {
    this.container = document.getElementById('webgl-canvas-container')!;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020409, 0.0004);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.set(0, 15, 35);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.initLights();
    this.initStarfield();
    this.setupWindowResize();

    requestAnimationFrame((t) => this.loop(t));
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0x223344, 1.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.8);
    sunLight.position.set(200, 300, 100);
    this.scene.add(sunLight);
  }

  private initStarfield(): void {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const radius = 800 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.8) {
        colors[idx] = 0.5; colors[idx + 1] = 0.8; colors[idx + 2] = 1.0; // Cyan-blue
      } else if (tint > 0.6) {
        colors[idx] = 1.0; colors[idx + 1] = 0.8; colors[idx + 2] = 0.4; // Amber
      } else {
        colors[idx] = 0.9; colors[idx + 1] = 0.95; colors[idx + 2] = 1.0; // Crisp white
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const starfield = new THREE.Points(geometry, material);
    this.scene.add(starfield);
  }

  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private loop(_timestamp: number): void {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this.loop(t));
  }

  public getTelemetry(): ShipTelemetry {
    return this.telemetry;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ApexPrimeGame();
});
