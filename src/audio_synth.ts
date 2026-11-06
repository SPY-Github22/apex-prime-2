export type CharacterVoiceId = 'aura' | 'voss' | 'vance' | 'archon';

export interface VoiceProfile {
  oscType: OscillatorType;
  baseFreq: number;
  freqJitter: number;
  duration: number;
  volume: number;
}

export const CHARACTER_VOICE_PROFILES: Record<CharacterVoiceId, VoiceProfile> = {
  aura: {
    oscType: 'sine',
    baseFreq: 960,
    freqJitter: 280,
    duration: 0.038,
    volume: 0.12
  },
  voss: {
    oscType: 'sawtooth',
    baseFreq: 180,
    freqJitter: 60,
    duration: 0.05,
    volume: 0.08
  },
  vance: {
    oscType: 'triangle',
    baseFreq: 420,
    freqJitter: 90,
    duration: 0.042,
    volume: 0.1
  },
  archon: {
    oscType: 'square',
    baseFreq: 85,
    freqJitter: 35,
    duration: 0.07,
    volume: 0.14
  }
};

export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private lastBlipTime = 0;
  private blipThrottleMs = 45; // ms between voice blips to avoid acoustic clipping

  constructor() {
    this.initContext();
  }

  private initContext(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch {
      // AudioContext unavailable or restricted in test/SSR environment
      this.ctx = null;
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public hasAudioContext(): boolean {
    return this.ctx !== null;
  }

  public playVoiceBlip(character: CharacterVoiceId): void {
    if (this.muted || !this.ctx || !this.masterGain) return;

    const now = performance.now();
    if (now - this.lastBlipTime < this.blipThrottleMs) {
      return;
    }
    this.lastBlipTime = now;

    this.resume();

    const profile = CHARACTER_VOICE_PROFILES[character] || CHARACTER_VOICE_PROFILES.aura;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = profile.oscType;

    // Add subtle frequency jitter for natural robotic inflection
    const freq = profile.baseFreq + (Math.random() - 0.5) * profile.freqJitter;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Dynamic envelope: instant attack, quick exponential decay
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(profile.volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + profile.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + profile.duration + 0.01);
  }

  public playTransmissionChime(opening = true): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const freqs = opening ? [587.33, 880, 1174.66] : [1174.66, 880, 587.33]; // D5 - A5 - D6 chord

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      const noteStart = t + idx * 0.06;
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.09, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 0.18);
    });
  }

  public playCinematicDrop(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency drops from 140Hz down to sub-bass 40Hz
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.25);
  }
}
