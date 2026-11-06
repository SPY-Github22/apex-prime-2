import { CharacterVoiceId } from './audio_synth';

export interface CharacterDefinition {
  id: CharacterVoiceId;
  name: string;
  title: string;
  faction: string;
  themeColor: string;
  accentColor: string;
  badge: string;
}

export const CHARACTERS: Record<CharacterVoiceId, CharacterDefinition> = {
  aura: {
    id: 'aura',
    name: 'A.U.R.A.',
    title: 'NEURAL CO-PILOT // QUANTUM CORE v4.2',
    faction: 'VESPER-01 AVIONICS',
    themeColor: '#00f3ff',
    accentColor: '#00ffaa',
    badge: 'AI COMPANION'
  },
  voss: {
    id: 'voss',
    name: 'KAELEN VOSS',
    title: 'CHIEF PROSPECTOR // BELTER UNION',
    faction: 'MINERS SYNDICATE',
    themeColor: '#facc15',
    accentColor: '#ff7700',
    badge: 'RIG ALPHA-4'
  },
  vance: {
    id: 'vance',
    name: 'COMMANDER VANCE',
    title: '7TH STRIKE FLOTILLA COMMANDER',
    faction: 'SOLAR ALLIANCE NAVY',
    themeColor: '#38bdf8',
    accentColor: '#818cf8',
    badge: 'AEGIS PRIME'
  },
  archon: {
    id: 'archon',
    name: 'ARCHON FERRUM',
    title: 'THE SOVEREIGN MACHINE GOD',
    faction: 'CORRUPTED PRECURSOR HIVE',
    themeColor: '#ff0055',
    accentColor: '#a855f7',
    badge: 'FIRST ARCHON'
  }
};

export class CharacterVisualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentId: CharacterVoiceId = 'aura';
  private isSpeaking = false;
  private animTimer = 0;

  constructor(canvas?: HTMLCanvasElement) {
    if (canvas) {
      this.bindCanvas(canvas);
    }
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  public setCharacter(id: CharacterVoiceId): void {
    this.currentId = id;
  }

  public getCharacter(): CharacterDefinition {
    return CHARACTERS[this.currentId] || CHARACTERS.aura;
  }

  public setSpeaking(speaking: boolean): void {
    this.isSpeaking = speaking;
  }

  public updateAndRender(dt: number): void {
    this.animTimer += dt;
    this.render();
  }

  public render(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const char = this.getCharacter();
    const t = this.animTimer;

    // Clear background with dark tinted cyber-gradient
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Subtle background radar grid
    this.drawHoloGrid(ctx, w, h, char.themeColor);

    // Draw character-specific procedural portrait
    switch (this.currentId) {
      case 'aura':
        this.drawAura(ctx, w, h, t, char);
        break;
      case 'voss':
        this.drawVoss(ctx, w, h, t, char);
        break;
      case 'vance':
        this.drawVance(ctx, w, h, t, char);
        break;
      case 'archon':
        this.drawArchon(ctx, w, h, t, char);
        break;
    }

    // Audio-reactive equalizer spectrum along the bottom
    this.drawAudioSpectrum(ctx, w, h, t, char.themeColor);

    // Overlay holographic scanlines & transmission vignette
    this.drawHoloScanlines(ctx, w, h, char.themeColor);
  }

  private drawHoloGrid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 1;

    const gridSize = 20;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAura(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, char: CharacterDefinition): void {
    const cx = w / 2;
    const cy = h / 2 - 10;
    const speakMultiplier = this.isSpeaking ? 1.5 : 1.0;

    ctx.save();
    // 1. Concentric rotating quantum rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const radius = 35 + i * 18;
      const angle = t * (i % 2 === 0 ? 1 : -1) * (0.8 + i * 0.3);

      ctx.strokeStyle = i === 1 ? char.accentColor : char.themeColor;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.2;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle + Math.PI, angle + Math.PI * 2.4);
      ctx.stroke();
    }

    // 2. Central pulsing AI core iris
    const corePulse = 18 + Math.sin(t * 6) * (3 * speakMultiplier);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, corePulse + 12);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, char.themeColor);
    grad.addColorStop(0.85, char.accentColor);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, corePulse + 12, 0, Math.PI * 2);
    ctx.fill();

    // 3. Four diamond focal points
    for (let j = 0; j < 4; j++) {
      const theta = (j * Math.PI) / 2 + t * 0.5;
      const dist = 60 + Math.sin(t * 4 + j) * 4;
      const dx = cx + Math.cos(theta) * dist;
      const dy = cy + Math.sin(theta) * dist;

      ctx.fillStyle = char.themeColor;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawVoss(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, char: CharacterDefinition): void {
    const cx = w / 2;
    const cy = h / 2 - 10;

    ctx.save();

    // 1. Heavy industrial mining helmet silhouette
    ctx.strokeStyle = char.themeColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 45);
    ctx.lineTo(cx - 50, cy - 10);
    ctx.lineTo(cx - 30, cy - 50);
    ctx.lineTo(cx + 30, cy - 50);
    ctx.lineTo(cx + 50, cy - 10);
    ctx.lineTo(cx + 45, cy + 45);
    ctx.closePath();
    ctx.stroke();

    // 2. Visor plate
    ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
    ctx.fill();

    // 3. Cybernetic bionic eye lens (Right eye)
    const eyeX = cx + 18;
    const eyeY = cy - 12;
    const eyeScanRadius = 8 + Math.sin(t * 5) * 1.5;

    ctx.fillStyle = '#ff3300';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeScanRadius, 0, Math.PI * 2);
    ctx.fill();

    // Crosshairs on cybernetic eye
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eyeX - 12, eyeY);
    ctx.lineTo(eyeX + 12, eyeY);
    ctx.moveTo(eyeX, eyeY - 12);
    ctx.lineTo(eyeX, eyeY + 12);
    ctx.stroke();

    // 4. Respirator collar grill
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 20 + r * 6);
      ctx.lineTo(cx + 20, cy + 20 + r * 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawVance(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, char: CharacterDefinition): void {
    const cx = w / 2;
    const cy = h / 2 - 10;

    ctx.save();

    // 1. Alliance Naval Officer silhouette
    ctx.strokeStyle = char.themeColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;

    // Peak uniform cap
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 25);
    ctx.lineTo(cx, cy - 48);
    ctx.lineTo(cx + 55, cy - 25);
    ctx.lineTo(cx + 40, cy - 15);
    ctx.lineTo(cx - 40, cy - 15);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();

    // 2. High-tech tactical HUD monocle over left eye
    const monoX = cx - 18;
    const monoY = cy - 2;
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(monoX, monoY, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating tactical radar sweep inside monocle
    ctx.beginPath();
    ctx.moveTo(monoX, monoY);
    const radarAngle = t * 3.5;
    ctx.lineTo(monoX + Math.cos(radarAngle) * 14, monoY + Math.sin(radarAngle) * 14);
    ctx.stroke();

    // 3. Solar Alliance delta chevron badge
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35);
    ctx.lineTo(cx - 8, cy - 24);
    ctx.lineTo(cx, cy - 27);
    ctx.lineTo(cx + 8, cy - 24);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private drawArchon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, char: CharacterDefinition): void {
    const cx = w / 2;
    const cy = h / 2 - 10;

    ctx.save();

    // 1. Random glitch horizontal displacement slices
    const isGlitch = Math.sin(t * 12) > 0.4;
    const glitchOffset = isGlitch ? (Math.random() - 0.5) * 16 : 0;

    // 2. Ominous machine-skull monolith
    ctx.strokeStyle = char.themeColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9;

    ctx.beginPath();
    ctx.moveTo(cx - 35 + glitchOffset, cy - 45);
    ctx.lineTo(cx + 35 + glitchOffset, cy - 45);
    ctx.lineTo(cx + 48, cy);
    ctx.lineTo(cx + 25, cy + 45);
    ctx.lineTo(cx - 25, cy + 45);
    ctx.lineTo(cx - 48, cy);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 85, 0.18)';
    ctx.fill();

    // 3. Twin burning crimson ocular conduits
    const eyePulse = 6 + Math.sin(t * 8) * 2;
    ctx.fillStyle = '#ff0033';
    ctx.globalAlpha = 1.0;

    ctx.beginPath();
    ctx.arc(cx - 18 + glitchOffset, cy - 8, eyePulse, 0, Math.PI * 2);
    ctx.arc(cx + 18 + glitchOffset, cy - 8, eyePulse, 0, Math.PI * 2);
    ctx.fill();

    // 4. Central singularity vortex
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx + glitchOffset, cy + 18, 12 + Math.sin(t * 10) * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawAudioSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string): void {
    ctx.save();
    const barCount = 18;
    const barWidth = 6;
    const spacing = 4;
    const totalW = barCount * (barWidth + spacing);
    const startX = (w - totalW) / 2;
    const baseY = h - 14;

    ctx.fillStyle = color;

    for (let i = 0; i < barCount; i++) {
      const activeMult = this.isSpeaking ? 1.0 : 0.25;
      const barH = (4 + Math.abs(Math.sin(t * 8 + i * 0.7)) * 16) * activeMult;
      const x = startX + i * (barWidth + spacing);
      const y = baseY - barH;

      ctx.globalAlpha = 0.4 + (barH / 20) * 0.6;
      ctx.fillRect(x, y, barWidth, barH);
    }

    ctx.restore();
  }

  private drawHoloScanlines(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Outer cyber border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Corner brackets
    const bLen = 14;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.95;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(2, 2 + bLen); ctx.lineTo(2, 2); ctx.lineTo(2 + bLen, 2);
    // Top-right
    ctx.moveTo(w - 2 - bLen, 2); ctx.lineTo(w - 2, 2); ctx.lineTo(w - 2, 2 + bLen);
    // Bottom-left
    ctx.moveTo(2, h - 2 - bLen); ctx.lineTo(2, h - 2); ctx.lineTo(2 + bLen, h - 2);
    // Bottom-right
    ctx.moveTo(w - 2 - bLen, h - 2); ctx.lineTo(w - 2, h - 2); ctx.lineTo(w - 2, h - 2 - bLen);
    ctx.stroke();

    ctx.restore();
  }
}
