import { CharacterVoiceId, AudioSynthesizer } from './audio_synth';
import { CharacterVisualizer, CHARACTERS } from './characters';

export interface CutsceneLine {
  speaker: CharacterVoiceId;
  text: string;
  cameraDistance?: number;
  cameraPitch?: number;
  lookAt?: 'ship' | 'station' | 'boss';
  soundDrop?: boolean;
}

export interface CutsceneSequence {
  id: string;
  title: string;
  locationTag: string;
  lines: CutsceneLine[];
}

export const PROLOGUE_CUTSCENE: CutsceneSequence = {
  id: 'prologue',
  title: 'ACT I: THE HOLLOW PROTOCOL',
  locationTag: 'SECTOR 01 // VALLES ASTEROID RIM',
  lines: [
    {
      speaker: 'aura',
      text: 'Neural avionics online. Optical telemetry locked on Vesper-01. Sub-space sensors are detecting anomalous high-frequency tachyon bursts radiating across the Valles Asteroid Rim.',
      cameraDistance: 28,
      cameraPitch: 0.15,
      lookAt: 'ship',
      soundDrop: true
    },
    {
      speaker: 'aura',
      text: 'The transmissions match ancient Precursor harmonic frequencies... but the code signatures have mutated into pure kinetic aggression. The Sovereign Archons are stirring.',
      cameraDistance: 22,
      cameraPitch: 0.05,
      lookAt: 'ship'
    },
    {
      speaker: 'voss',
      text: '[INCOMING TRANSMISSION] Freelancer! Thank the stars your avionics picked up. This is Kaelen Voss at Belter Rig Alpha-4. Our autonomous excavators have gone rogue—they are smelting hulls without pilots!',
      cameraDistance: 35,
      cameraPitch: 0.25,
      lookAt: 'ship'
    },
    {
      speaker: 'vance',
      text: '[FLEET COMMAND OVERRIDE] Pilot Vesper-01, this is Commander Vance of the Solar Alliance Navy. Civilian outposts across the sector are under siege. Break approach and dock at Starbase Horizon-9 immediately for combat rearmament!',
      cameraDistance: 30,
      cameraPitch: 0.1,
      lookAt: 'station'
    },
    {
      speaker: 'aura',
      text: 'Alliance orders confirmed. Starbase Horizon-9 is directly ahead on our heading. Thruster interlocks disengaged. Manual flight controls transferred to pilot. Good hunting, Vesper.',
      cameraDistance: 18,
      cameraPitch: 0.08,
      lookAt: 'ship'
    }
  ]
};

export const BOSS1_INTRO_CUTSCENE: CutsceneSequence = {
  id: 'boss1_intro',
  title: 'ARCHON EMERGENCE // HOSTILE DETECTED',
  locationTag: 'VALLES RIM // SECTOR HAZARD ZONE',
  lines: [
    {
      speaker: 'aura',
      text: 'TACTICAL ALERT! Colossal seismic energy spike detected ahead. Archon Ferrum: The Iron Colossus has fully awakened from its dormant asteroid cocoon!',
      soundDrop: true,
      lookAt: 'boss'
    },
    {
      speaker: 'archon',
      text: 'ORGANIC INFESTATION DETECTED. REFINEMENT EFFICIENCY: ZERO. COMMENCING MOLECULAR DECONSTRUCTION PROTOCOL.',
      lookAt: 'boss'
    },
    {
      speaker: 'aura',
      text: 'Its frontal kinetic deflector absorbs standard munitions! Maneuver behind its chassis and target the rear thermal exhaust nacelles for critical damage!',
      lookAt: 'ship'
    }
  ]
};

export class CutsceneDirector {
  private audioSynth: AudioSynthesizer;
  private visualizer: CharacterVisualizer;
  private isPlaying = false;
  private currentSeq: CutsceneSequence | null = null;
  private currentLineIdx = 0;
  private typewriterIdx = 0;
  private typewriterTimer = 0;
  private typewriterCharDelay = 0.022; // seconds per letter
  private isLineComplete = false;
  private onCompleteCallback?: () => void;

  // DOM Elements
  private overlayEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private locationEl: HTMLElement | null = null;
  private speakerNameEl: HTMLElement | null = null;
  private speakerTitleEl: HTMLElement | null = null;
  private speakerBadgeEl: HTMLElement | null = null;
  private dialogueTextEl: HTMLElement | null = null;
  private continuePromptEl: HTMLElement | null = null;

  constructor(audioSynth: AudioSynthesizer, visualizer: CharacterVisualizer) {
    this.audioSynth = audioSynth;
    this.visualizer = visualizer;
    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  public initDOM(): void {
    if (typeof document === 'undefined') return;

    this.overlayEl = document.getElementById('cinematic-overlay');
    this.titleEl = document.getElementById('cinematic-title');
    this.locationEl = document.getElementById('cinematic-location');
    this.speakerNameEl = document.getElementById('cinematic-speaker-name');
    this.speakerTitleEl = document.getElementById('cinematic-speaker-title');
    this.speakerBadgeEl = document.getElementById('cinematic-speaker-badge');
    this.dialogueTextEl = document.getElementById('cinematic-dialogue-text');
    this.continuePromptEl = document.getElementById('cinematic-continue-prompt');

    const skipBtn = document.getElementById('cinematic-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skip());
    }

    const nextBtn = document.getElementById('cinematic-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleAdvanceOrNext());
    }
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public getCurrentSequence(): CutsceneSequence | null {
    return this.currentSeq;
  }

  public getCurrentLineIndex(): number {
    return this.currentLineIdx;
  }

  public getCurrentLine(): CutsceneLine | null {
    if (!this.currentSeq || this.currentLineIdx >= this.currentSeq.lines.length) {
      return null;
    }
    return this.currentSeq.lines[this.currentLineIdx];
  }

  public play(sequence: CutsceneSequence, onComplete?: () => void): void {
    if (!this.overlayEl && typeof document !== 'undefined') {
      this.initDOM();
    }

    this.isPlaying = true;
    this.currentSeq = sequence;
    this.currentLineIdx = 0;
    this.onCompleteCallback = onComplete;

    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden');
    }

    this.audioSynth.playTransmissionChime(true);
    this.startCurrentLine();
  }

  public skip(): void {
    if (!this.isPlaying) return;
    this.finishCutscene();
  }

  public handleAdvanceOrNext(): void {
    if (!this.isPlaying || !this.currentSeq) return;

    const line = this.getCurrentLine();
    if (!line) return;

    if (!this.isLineComplete) {
      // Instantly finish typewriter for current line
      this.typewriterIdx = line.text.length;
      this.isLineComplete = true;
      this.visualizer.setSpeaking(false);
      if (this.dialogueTextEl) {
        this.dialogueTextEl.innerText = line.text;
      }
      if (this.continuePromptEl) {
        this.continuePromptEl.classList.remove('hidden');
      }
    } else {
      // Advance to next line
      this.currentLineIdx++;
      if (this.currentLineIdx >= this.currentSeq.lines.length) {
        this.finishCutscene();
      } else {
        this.startCurrentLine();
      }
    }
  }

  private startCurrentLine(): void {
    const line = this.getCurrentLine();
    if (!line || !this.currentSeq) return;

    this.typewriterIdx = 0;
    this.typewriterTimer = 0;
    this.isLineComplete = false;

    const charDef = CHARACTERS[line.speaker] || CHARACTERS.aura;
    this.visualizer.setCharacter(line.speaker);
    this.visualizer.setSpeaking(true);

    if (line.soundDrop) {
      this.audioSynth.playCinematicDrop();
    }

    // Update DOM UI elements
    if (this.titleEl) this.titleEl.innerText = this.currentSeq.title;
    if (this.locationEl) this.locationEl.innerText = this.currentSeq.locationTag;
    if (this.speakerNameEl) {
      this.speakerNameEl.innerText = charDef.name;
      this.speakerNameEl.style.color = charDef.themeColor;
    }
    if (this.speakerTitleEl) this.speakerTitleEl.innerText = charDef.title;
    if (this.speakerBadgeEl) {
      this.speakerBadgeEl.innerText = charDef.badge;
      this.speakerBadgeEl.style.borderColor = charDef.themeColor;
      this.speakerBadgeEl.style.color = charDef.themeColor;
    }
    if (this.dialogueTextEl) {
      this.dialogueTextEl.innerText = '';
    }
    if (this.continuePromptEl) {
      this.continuePromptEl.classList.add('hidden');
    }
  }

  public update(dt: number): void {
    if (!this.isPlaying || !this.currentSeq) return;

    this.visualizer.updateAndRender(dt);

    const line = this.getCurrentLine();
    if (!line || this.isLineComplete) return;

    this.typewriterTimer += dt;
    if (this.typewriterTimer >= this.typewriterCharDelay) {
      this.typewriterTimer = 0;
      this.typewriterIdx++;

      if (this.dialogueTextEl) {
        this.dialogueTextEl.innerText = line.text.substring(0, this.typewriterIdx);
      }

      // Play character audio blip every 2 characters for non-space
      if (this.typewriterIdx % 2 === 0 && line.text[this.typewriterIdx] !== ' ') {
        this.audioSynth.playVoiceBlip(line.speaker);
      }

      if (this.typewriterIdx >= line.text.length) {
        this.isLineComplete = true;
        this.visualizer.setSpeaking(false);
        if (this.continuePromptEl) {
          this.continuePromptEl.classList.remove('hidden');
        }
      }
    }
  }

  private finishCutscene(): void {
    this.isPlaying = false;
    this.currentSeq = null;
    this.visualizer.setSpeaking(false);
    this.audioSynth.playTransmissionChime(false);

    if (this.overlayEl) {
      this.overlayEl.classList.add('hidden');
    }

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }
}
