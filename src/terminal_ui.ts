import { StarbaseShop, UpgradeCategory } from './shop';
import { QuestManager } from './quests';
import { Starship } from './ship';

export interface TerminalUIOptions {
  shop: StarbaseShop;
  quests: QuestManager;
  ship: Starship;
  getCredits: () => number;
  setCredits: (newCredits: number) => void;
  onShipUpgraded?: (category: UpgradeCategory) => void;
}

export class TerminalUI {
  private shop: StarbaseShop;
  private quests: QuestManager;
  private ship: Starship;
  private getCredits: () => number;
  private setCredits: (newCredits: number) => void;
  private onShipUpgraded?: (category: UpgradeCategory) => void;

  // DOM Elements
  private modal: HTMLElement | null = null;
  private terminalCredits: HTMLElement | null = null;
  private terminalToast: HTMLElement | null = null;
  private hudToast: HTMLElement | null = null;
  private hudMission: HTMLElement | null = null;
  private shopGrid: HTMLElement | null = null;
  private questsContainer: HTMLElement | null = null;

  // Tab buttons and containers
  private tabBtnShop: HTMLElement | null = null;
  private tabBtnQuests: HTMLElement | null = null;
  private tabBtnLore: HTMLElement | null = null;
  private tabContentShop: HTMLElement | null = null;
  private tabContentQuests: HTMLElement | null = null;
  private tabContentLore: HTMLElement | null = null;

  private isTerminalOpen = false;
  private toastTimer: number | null = null;
  private hudToastTimer: number | null = null;

  constructor(options: TerminalUIOptions) {
    this.shop = options.shop;
    this.quests = options.quests;
    this.ship = options.ship;
    this.getCredits = options.getCredits;
    this.setCredits = options.setCredits;
    this.onShipUpgraded = options.onShipUpgraded;

    if (typeof document !== 'undefined') {
      this.bindDOM();
    }
  }

  private bindDOM(): void {
    this.modal = document.getElementById('station-terminal-modal');
    this.terminalCredits = document.getElementById('terminal-credits');
    this.terminalToast = document.getElementById('terminal-toast');
    this.hudToast = document.getElementById('hud-toast');
    this.hudMission = document.getElementById('hud-mission');
    this.shopGrid = document.getElementById('shop-cards-grid');
    this.questsContainer = document.getElementById('quests-container');

    this.tabBtnShop = document.getElementById('tab-btn-shop');
    this.tabBtnQuests = document.getElementById('tab-btn-quests');
    this.tabBtnLore = document.getElementById('tab-btn-lore');

    this.tabContentShop = document.getElementById('tab-content-shop');
    this.tabContentQuests = document.getElementById('tab-content-quests');
    this.tabContentLore = document.getElementById('tab-content-lore');

    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.tabBtnShop) {
      this.tabBtnShop.addEventListener('click', () => this.switchTab('shop'));
    }
    if (this.tabBtnQuests) {
      this.tabBtnQuests.addEventListener('click', () => this.switchTab('quests'));
    }
    if (this.tabBtnLore) {
      this.tabBtnLore.addEventListener('click', () => this.switchTab('lore'));
    }
  }

  public isOpen(): boolean {
    return this.isTerminalOpen;
  }

  public open(): void {
    if (!this.modal) return;
    this.isTerminalOpen = true;
    this.modal.classList.remove('hidden');
    this.refresh();
  }

  public close(): void {
    if (!this.modal) return;
    this.isTerminalOpen = false;
    this.modal.classList.add('hidden');
  }

  public toggle(): void {
    if (this.isTerminalOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public switchTab(tab: 'shop' | 'quests' | 'lore'): void {
    if (!this.tabBtnShop || !this.tabBtnQuests || !this.tabBtnLore) return;
    if (!this.tabContentShop || !this.tabContentQuests || !this.tabContentLore) return;

    this.tabBtnShop.classList.toggle('active', tab === 'shop');
    this.tabBtnQuests.classList.toggle('active', tab === 'quests');
    this.tabBtnLore.classList.toggle('active', tab === 'lore');

    this.tabContentShop.classList.toggle('hidden', tab !== 'shop');
    this.tabContentQuests.classList.toggle('hidden', tab !== 'quests');
    this.tabContentLore.classList.toggle('hidden', tab !== 'lore');

    if (tab === 'shop') this.renderShop();
    if (tab === 'quests') this.renderQuests();
  }

  public refresh(): void {
    const credits = this.getCredits();
    if (this.terminalCredits) {
      this.terminalCredits.innerText = `${credits.toLocaleString()} CR`;
    }
    this.renderShop();
    this.renderQuests();
    this.updateHUDMissionTracker();
  }

  public showToast(msg: string): void {
    if (this.terminalToast) {
      this.terminalToast.innerText = msg;
      this.terminalToast.classList.remove('hidden');
      if (this.toastTimer) window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.terminalToast?.classList.add('hidden');
      }, 3500);
    }
  }

  public showHUDToast(msg: string): void {
    if (this.hudToast) {
      this.hudToast.innerText = msg;
      this.hudToast.classList.remove('hidden');
      if (this.hudToastTimer) window.clearTimeout(this.hudToastTimer);
      this.hudToastTimer = window.setTimeout(() => {
        this.hudToast?.classList.add('hidden');
      }, 4000);
    }
  }

  public updateHUDMissionTracker(): void {
    if (!this.hudMission) return;
    const active = this.quests.getActiveQuests();
    if (active.length === 0) {
      this.hudMission.innerText = 'NONE (DOCK TO ACCEPT)';
      this.hudMission.style.color = '#778899';
    } else {
      const q = active[0];
      if (q.status === 'READY_TO_CLAIM') {
        this.hudMission.innerText = `[READY TO CLAIM] ${q.title} (Dock at Station)`;
        this.hudMission.style.color = '#00ff88';
      } else {
        const progress = q.type === 'NAVIGATE_COORDS'
          ? 'Reach beacon coordinates'
          : `[${q.currentCount} / ${q.requiredCount}]`;
        this.hudMission.innerText = `${q.title} ${progress}`;
        this.hudMission.style.color = '#facc15';
      }
    }
  }

  private renderShop(): void {
    if (!this.shopGrid) return;
    this.shopGrid.innerHTML = '';
    const credits = this.getCredits();

    const categories: { key: UpgradeCategory; label: string }[] = [
      { key: 'weapons', label: 'OFFENSIVE PLASMA WEAPONS' },
      { key: 'shields', label: 'DEFENSIVE ENERGY SHIELDS' },
      { key: 'hull', label: 'TITANIUM COMPOSITE HULL' },
      { key: 'engines', label: 'PROPULSION & AFTERBURNER' }
    ];

    for (const cat of categories) {
      const curTier = this.shop.getCurrentTier(cat.key);
      const nextTier = this.shop.getNextTier(cat.key);

      const card = document.createElement('div');
      card.className = 'shop-card';

      const canAfford = nextTier ? credits >= nextTier.cost : false;

      card.innerHTML = `
        <div class="shop-card-header">
          <div class="shop-card-category">${cat.label}</div>
          <div class="shop-card-level">TIER ${curTier.level} / 5</div>
        </div>
        <div class="shop-card-desc">
          <strong>Current:</strong> ${curTier.name}<br />
          ${curTier.description}
        </div>
        ${nextTier ? `
          <div class="shop-card-next">
            <strong>Next:</strong> ${nextTier.name}<br />
            ${nextTier.description}
          </div>
          <button class="shop-btn" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? `UPGRADE &bull; ${nextTier.cost.toLocaleString()} CR` : `NEED ${nextTier.cost.toLocaleString()} CR`}
          </button>
        ` : `
          <div class="shop-card-next" style="border-color: #facc15; color: #facc15;">
            <strong>STATUS:</strong> MAXIMUM TIER ACHIEVED
          </div>
          <button class="shop-btn" disabled>MAX UPGRADE</button>
        `}
      `;

      if (nextTier) {
        const btn = card.querySelector('button');
        btn?.addEventListener('click', () => {
          const res = this.shop.purchaseUpgrade(cat.key, this.ship, this.getCredits());
          if (res.success) {
            this.setCredits(res.newCredits);
            this.showToast(res.message);
            this.showHUDToast(res.message);
            if (this.onShipUpgraded) this.onShipUpgraded(cat.key);
            this.refresh();
          } else {
            this.showToast(res.message);
          }
        });
      }

      this.shopGrid.appendChild(card);
    }
  }

  private renderQuests(): void {
    if (!this.questsContainer) return;
    this.questsContainer.innerHTML = '';

    for (const q of this.quests.quests) {
      const card = document.createElement('div');
      card.className = 'quest-card';

      let badgeHtml = '';
      let actionBtnHtml = '';

      if (q.status === 'AVAILABLE') {
        badgeHtml = `<span class="quest-badge badge-available">AVAILABLE</span>`;
        actionBtnHtml = `<button class="quest-btn quest-btn-accept">ACCEPT MISSION</button>`;
      } else if (q.status === 'ACTIVE') {
        badgeHtml = `<span class="quest-badge badge-active">ACTIVE &bull; ${q.currentCount}/${q.requiredCount}</span>`;
        actionBtnHtml = `<span style="font-size: 11px; color: #a0c0d8;">IN PROGRESS</span>`;
      } else if (q.status === 'READY_TO_CLAIM') {
        badgeHtml = `<span class="quest-badge badge-ready">READY TO CLAIM</span>`;
        actionBtnHtml = `<button class="quest-btn quest-btn-claim">CLAIM REWARD (+${q.rewardCredits.toLocaleString()} CR)</button>`;
      } else {
        badgeHtml = `<span class="quest-badge badge-completed">COMPLETED</span>`;
        actionBtnHtml = `<span style="font-size: 11px; color: #6a8ba8;">MISSION ACCOMPLISHED</span>`;
      }

      card.innerHTML = `
        <div class="quest-header-row">
          <div class="quest-title">${q.title}</div>
          ${badgeHtml}
        </div>
        <div class="quest-issuer">ISSUER: ${q.issuer} (${q.issuerTitle}) &bull; ACT ${q.act}</div>
        <div class="quest-dialogue">"${q.status === 'COMPLETED' ? q.completionDialogue : q.dialogue}"</div>
        <div class="quest-meta-row">
          <div class="quest-reward">REWARD: ${q.rewardCredits.toLocaleString()} CR + ${q.rewardItem}</div>
          ${actionBtnHtml}
        </div>
      `;

      if (q.status === 'AVAILABLE') {
        const btn = card.querySelector('.quest-btn-accept');
        btn?.addEventListener('click', () => {
          const res = this.quests.acceptQuest(q.id);
          if (res.success) {
            this.showToast(res.message);
            this.showHUDToast(res.message);
            this.refresh();
          }
        });
      } else if (q.status === 'READY_TO_CLAIM') {
        const btn = card.querySelector('.quest-btn-claim');
        btn?.addEventListener('click', () => {
          const res = this.quests.claimReward(q.id, this.getCredits());
          if (res.success) {
            this.setCredits(res.newCredits);
            this.showToast(res.message);
            this.showHUDToast(res.message);
            this.refresh();
          }
        });
      }

      this.questsContainer.appendChild(card);
    }
  }
}
