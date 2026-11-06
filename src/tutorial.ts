export interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  summary: string;
  bullets: Array<{
    icon: string;
    label: string;
    description: string;
    keybind?: string;
  }>;
  proTip: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step-welcome',
    badge: 'STAGE 01 // OVERVIEW',
    title: 'WELCOME PILOT // MISSION OBJECTIVES',
    subtitle: 'APEX PRIME 2: A 3D OPEN-WORLD SPACE SAGA',
    summary:
      'You are pilot Vesper-01 at the helm of an advanced void interceptor. Your mission is to explore open-world sectors, trade and upgrade at orbital space stations, mine asteroid belts, and liberate the cosmos from the rogue Sovereign Archons.',
    bullets: [
      {
        icon: '🚀',
        label: 'Open-World Flight',
        description: 'Explore massive 3D sectors populated by space stations, asteroid belts, pirate wings, and ancient warp gates.'
      },
      {
        icon: '🛰️',
        label: 'Orbital Stations & NPCs',
        description: 'Dock at Starbase Horizon-9 ahead to repair, accept faction quests, and upgrade your weapons, shields, and thrusters.'
      },
      {
        icon: '🪨',
        label: 'Mine Asteroids for Credits',
        description: 'Shatter titanium asteroids with your cannons to harvest minerals and earn currency for ship upgrades.'
      },
      {
        icon: '🌀',
        label: 'Archon Bosses & Hyperspace Gates',
        description: 'Each sector harbors a colossal Archon boss. Defeat it to claim the Warp Key and jump through the Stargate to the next Act!'
      }
    ],
    proTip: 'Look straight ahead right now: that massive glowing facility is Starbase Horizon-9. Dock there to begin your contracts!'
  },
  {
    id: 'step-flight',
    badge: 'STAGE 02 // PROPULSION',
    title: '6-DOF FLIGHT CONTROLS // HOW TO PILOT',
    subtitle: 'MASTER 3D SPACE FLIGHT DYNAMICS',
    summary:
      'Your starship features full 6-degrees-of-freedom inertial navigation with automatic aerodynamic yaw-banking.',
    bullets: [
      {
        icon: '⬆️',
        label: 'Forward Throttle',
        keybind: 'W',
        description: 'Engages forward sub-light ion engines to accelerate through the void.'
      },
      {
        icon: '↕️',
        label: 'Pitch Nose Up / Down',
        keybind: 'S / ARROWS',
        description: 'Press [S] or [Down Arrow] to pitch nose up; [Up Arrow] to pitch nose down.'
      },
      {
        icon: '↔️',
        label: 'Yaw Steering',
        keybind: 'A / D',
        description: 'Turn left or right. The flight computer automatically rolls into turns for cinematic banking.'
      },
      {
        icon: '🔄',
        label: 'Precision Barrel Roll',
        keybind: 'Q / E',
        description: 'Perform axial counter-clockwise [Q] or clockwise [E] evasion rolls.'
      },
      {
        icon: '⚡',
        label: 'Afterburner Boost',
        keybind: 'SHIFT / SPACE',
        description: 'Supercharges thrust for 2x velocity. Consumes boost energy capacitor.'
      },
      {
        icon: '🛑',
        label: 'Reverse Space Brake',
        keybind: 'C / X',
        description: 'Fires retro-thrusters to rapidly decelerate starship to a full hover stop.'
      }
    ],
    proTip: 'Use [W] for cruising speed, and hold [Shift] or [Space] when traveling long distances between sectors or stations!'
  },
  {
    id: 'step-combat-mining',
    badge: 'STAGE 03 // COMBAT & MINING',
    title: 'BALLISTICS, DOGFIGHTING & RESOURCE MINING',
    subtitle: 'EARN CREDITS AND PURGE OBSIDIAN PIRATES',
    summary:
      'Your starship is armed with dual wingtip alternating plasma cannons. Asteroids and hostile drones are your primary source of credits.',
    bullets: [
      {
        icon: '💥',
        label: 'Fire Plasma Cannons',
        keybind: 'LMB / F',
        description: 'Click Left Mouse Button or press [F] to fire high-velocity energy bolts.'
      },
      {
        icon: '🪨',
        label: 'Mining Asteroid Belts',
        description: 'Aim and fire at rust-brown asteroids. They fracture into titanium ore giving +100 to +250 Credits.'
      },
      {
        icon: '🛸',
        label: 'Dogfighting Hostile Drones',
        description: 'Red radar indicators mark hostile stealth drones. Destroy them to earn +350 CR bounties.'
      },
      {
        icon: '🛡️',
        label: 'Kinetic Shielding',
        description: 'Shields absorb 100% of incoming damage before hull is touched. Shields regenerate after 3s without hits.'
      }
    ],
    proTip: 'Mine 5-10 asteroids at the start of the game to quickly earn 1,000+ Credits for instant weapon & shield upgrades!'
  },
  {
    id: 'step-stations-upgrades',
    badge: 'STAGE 04 // UPGRADE WORKSHOP',
    title: 'SPACE STATIONS, DOCKING & UPGRADES',
    subtitle: 'STARBASE HORIZON-9 // HARBOR & WORKSHOP',
    summary:
      'Starbase Horizon-9 is located at coordinates (0, 45, -280). It provides automated starship repairs and a high-tech equipment market.',
    bullets: [
      {
        icon: '🧲',
        label: 'Engage Tractor Docking',
        keybind: 'E',
        description: 'Fly within 70m of the station docking ring and press [E]. The tractor beam docks your ship safely.'
      },
      {
        icon: '💻',
        label: 'Open Station Terminal',
        keybind: 'T',
        description: 'While docked, press [T] to open the interactive Station Terminal modal.'
      },
      {
        icon: '⚡',
        label: 'Upgrade Workshop (4 Categories)',
        description: 'Upgrade Dual Plasma Cannons (Tier I-V), Kinetic Shields, Carbon Hull, and Sub-Light Thrusters.'
      },
      {
        icon: '📜',
        label: 'Mission Board (NPCs)',
        description: 'Accept contracts from Belter Kaelen Voss, Commander Vance, and AURA for huge credit bonuses.'
      }
    ],
    proTip: 'Docking automatically repairs your hull and shields to 100% at zero cost. Retreat to the station if damaged in combat!'
  },
  {
    id: 'step-bosses-warpgates',
    badge: 'STAGE 05 // SAGA PROGRESSION',
    title: 'ARCHON BOSS FIGHTS & SECTOR JUMP GATES',
    subtitle: 'LIBERATE 7 SECTORS ACROSS THE GRAND SPACE OPERA',
    summary:
      'The galaxy is divided into 7 distinct sectors, each protected by an ancient Archon Boss and connected by hyper-tachyon jump gates.',
    bullets: [
      {
        icon: '👾',
        label: 'Archon 01: The Iron Colossus',
        description: 'Located at (150, 0, -450). Shoot its rear thermal exhaust nacelles for 1.4x bonus damage!'
      },
      {
        icon: '🔑',
        label: 'Claim the Sector Warp Key',
        description: 'Defeating the sector boss awards a +5,000 CR bounty and unlocks the hyper-tachyon jump gate.'
      },
      {
        icon: '🌀',
        label: 'Hyperspace Transit Gate',
        keybind: 'G',
        description: 'Fly to the massive rotating Stargate at (0, 0, -800) and press [G] to warp to Sector 2: The Neon Graveyard.'
      },
      {
        icon: '📖',
        label: 'Flight Manual Anytime',
        keybind: 'H',
        description: 'Press [H] or click "FLIGHT MANUAL" in the HUD whenever you need a refresher on controls or objectives.'
      }
    ],
    proTip: 'You are now ready to fly, Commander! Click "LAUNCH STARSHIP" below to start your voyage.'
  }
];

export class TutorialManager {
  private currentStepIndex = 0;
  private isTutorialOpen = false;
  private modalEl: HTMLElement | null = null;
  private onLaunchCallback?: () => void;
  public static readonly STORAGE_KEY = 'apex_prime_tutorial_seen';
  private static memoryStorage = new Map<string, string>();

  constructor(onLaunch?: () => void) {
    this.onLaunchCallback = onLaunch;
    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  public initDOM(): void {
    if (typeof document === 'undefined') return;
    this.modalEl = document.getElementById('tutorial-modal');
    this.bindDOMEvents();
  }

  public shouldAutoShow(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(TutorialManager.STORAGE_KEY) !== 'true';
      } catch {
        // Fall back to memory storage
      }
    }
    return TutorialManager.memoryStorage.get(TutorialManager.STORAGE_KEY) !== 'true';
  }

  public setAutoShow(neverShowAgain: boolean): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (neverShowAgain) {
          window.localStorage.setItem(TutorialManager.STORAGE_KEY, 'true');
        } else {
          window.localStorage.removeItem(TutorialManager.STORAGE_KEY);
        }
      } catch {
        // Fall back to memory storage
      }
    }

    if (neverShowAgain) {
      TutorialManager.memoryStorage.set(TutorialManager.STORAGE_KEY, 'true');
    } else {
      TutorialManager.memoryStorage.delete(TutorialManager.STORAGE_KEY);
    }
  }

  public isOpen(): boolean {
    if (this.modalEl) {
      return !this.modalEl.classList.contains('hidden');
    }
    return this.isTutorialOpen;
  }

  public open(stepIndex = 0): void {
    if (!this.modalEl && typeof document !== 'undefined') {
      this.initDOM();
    }
    this.currentStepIndex = Math.max(0, Math.min(stepIndex, TUTORIAL_STEPS.length - 1));
    this.isTutorialOpen = true;
    this.renderCurrentStep();
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  public close(): void {
    this.isTutorialOpen = false;
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
    if (typeof document !== 'undefined') {
      const dontShowCheckbox = document.getElementById('tutorial-dont-show') as HTMLInputElement | null;
      if (dontShowCheckbox && dontShowCheckbox.checked) {
        this.setAutoShow(true);
      }
    }
    if (this.onLaunchCallback) {
      this.onLaunchCallback();
    }
  }

  public nextStep(): void {
    if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
      this.currentStepIndex++;
      this.renderCurrentStep();
    } else {
      this.close();
    }
  }

  public prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderCurrentStep();
    }
  }

  public goToStep(index: number): void {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      this.currentStepIndex = index;
      this.renderCurrentStep();
    }
  }

  public getCurrentStep(): number {
    return this.currentStepIndex;
  }

  public renderCurrentStep(): void {
    if (typeof document === 'undefined') return;

    const step = TUTORIAL_STEPS[this.currentStepIndex];
    if (!step) return;

    const badgeEl = document.getElementById('tutorial-badge');
    const titleEl = document.getElementById('tutorial-title');
    const subtitleEl = document.getElementById('tutorial-subtitle');
    const summaryEl = document.getElementById('tutorial-summary');
    const bulletsGrid = document.getElementById('tutorial-bullets-grid');
    const proTipEl = document.getElementById('tutorial-protip');
    const stepCountEl = document.getElementById('tutorial-step-count');
    const prevBtn = document.getElementById('tutorial-prev-btn') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('tutorial-next-btn') as HTMLButtonElement | null;

    if (badgeEl) badgeEl.innerText = step.badge;
    if (titleEl) titleEl.innerText = step.title;
    if (subtitleEl) subtitleEl.innerText = step.subtitle;
    if (summaryEl) summaryEl.innerText = step.summary;
    if (proTipEl) proTipEl.innerHTML = `<strong>PILOT PRO-TIP:</strong> ${step.proTip}`;
    if (stepCountEl) {
      stepCountEl.innerText = `STEP ${this.currentStepIndex + 1} OF ${TUTORIAL_STEPS.length}`;
    }

    if (prevBtn) {
      prevBtn.style.visibility = this.currentStepIndex === 0 ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (this.currentStepIndex === TUTORIAL_STEPS.length - 1) {
        nextBtn.innerHTML = 'LAUNCH STARSHIP 🚀';
        nextBtn.classList.add('tutorial-btn-launch');
      } else {
        nextBtn.innerHTML = 'NEXT STEP &rarr;';
        nextBtn.classList.remove('tutorial-btn-launch');
      }
    }

    // Render step indicator dots
    const dotsContainer = document.getElementById('tutorial-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      TUTORIAL_STEPS.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `tutorial-dot ${idx === this.currentStepIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => this.goToStep(idx));
        dotsContainer.appendChild(dot);
      });
    }

    // Render cards/bullets
    if (bulletsGrid) {
      bulletsGrid.innerHTML = '';
      step.bullets.forEach((bullet) => {
        const card = document.createElement('div');
        card.className = 'tutorial-card';
        card.innerHTML = `
          <div class="tutorial-card-header">
            <span class="tutorial-card-icon">${bullet.icon}</span>
            <span class="tutorial-card-label">${bullet.label}</span>
            ${bullet.keybind ? `<span class="tutorial-keybind">${bullet.keybind}</span>` : ''}
          </div>
          <p class="tutorial-card-desc">${bullet.description}</p>
        `;
        bulletsGrid.appendChild(card);
      });
    }
  }

  private bindDOMEvents(): void {
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const closeBtn = document.getElementById('tutorial-close-btn');
    const skipBtn = document.getElementById('tutorial-skip-btn');

    prevBtn?.addEventListener('click', () => this.prevStep());
    nextBtn?.addEventListener('click', () => this.nextStep());
    closeBtn?.addEventListener('click', () => this.close());
    skipBtn?.addEventListener('click', () => this.close());

    // Allow keyboard navigation in tutorial
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.prevStep();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
  }
}
