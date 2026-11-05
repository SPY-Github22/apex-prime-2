import { Starship } from './ship';

export type UpgradeCategory = 'weapons' | 'shields' | 'hull' | 'engines';

export interface UpgradeTier {
  level: number;
  name: string;
  cost: number;
  description: string;
  bonusValue: number; // e.g. +10 damage, +50 shields, +60 hull, +25 speed
}

export interface UpgradeCatalog {
  weapons: UpgradeTier[];
  shields: UpgradeTier[];
  hull: UpgradeTier[];
  engines: UpgradeTier[];
}

export const UPGRADE_CATALOG: UpgradeCatalog = {
  weapons: [
    { level: 1, name: 'Dual Plasma Blasters Mk I', cost: 0, description: 'Standard dual-barrel thermal blasters (Base: 25 DMG).', bonusValue: 0 },
    { level: 2, name: 'Overcharged Pulse Cannons Mk II', cost: 800, description: 'Superheated ionized gas pulses (+15 DMG, 40 total).', bonusValue: 15 },
    { level: 3, name: 'Twin Tachyon Accelerators Mk III', cost: 2200, description: 'Subatomic particle stream (+35 DMG, 60 total).', bonusValue: 35 },
    { level: 4, name: 'Heavy Antimatter Lances Mk IV', cost: 5000, description: 'Compressed antimatter bolts with armor penetration (+60 DMG, 85 total).', bonusValue: 60 },
    { level: 5, name: 'Void Singularity Core Mk V', cost: 12000, description: 'Micro-singularity warheads with devastation blast (+100 DMG, 125 total).', bonusValue: 100 }
  ],
  shields: [
    { level: 1, name: 'Kevlar Deflector Grid Mk I', cost: 0, description: 'Standard energy barrier (Base: 100 SP).', bonusValue: 0 },
    { level: 2, name: 'Reinforced Phase Bulwark Mk II', cost: 750, description: 'Dual-phase crystalline emitter (+50 Shield Capacity).', bonusValue: 50 },
    { level: 3, name: 'Magnetic Aegis Array Mk III', cost: 2000, description: 'High-frequency harmonic deflector (+120 Shield Capacity).', bonusValue: 120 },
    { level: 4, name: 'Chronoshift Barrier Mk IV', cost: 4500, description: 'Temporal field that dissipates kinetic impacts (+200 Shield Capacity).', bonusValue: 200 },
    { level: 5, name: 'Titan Archon Bulwark Mk V', cost: 10500, description: 'Unbreakable stellar shielding matrix (+320 Shield Capacity).', bonusValue: 320 }
  ],
  hull: [
    { level: 1, name: 'Titanium-Alloy Plating Mk I', cost: 0, description: 'Standard reinforced aerospace hull (Base: 100 HP).', bonusValue: 0 },
    { level: 2, name: 'Duranium Honeycomb Core Mk II', cost: 600, description: 'Impact-absorbing composite armor (+40 Hull Integrity).', bonusValue: 40 },
    { level: 3, name: 'Carbon-Nanotube Matrix Mk III', cost: 1800, description: 'Self-stabilizing crystalline lattice (+100 Hull Integrity).', bonusValue: 100 },
    { level: 4, name: 'Adamantine Composite Mk IV', cost: 4000, description: 'Heavy ballistic plating with auto-sealant (+180 Hull Integrity).', bonusValue: 180 },
    { level: 5, name: 'Living Dark-Matter Hull Mk V', cost: 9500, description: 'Bio-synthetic regenerative armor plating (+280 Hull Integrity).', bonusValue: 280 }
  ],
  engines: [
    { level: 1, name: 'Sub-Light Ion Thrusters Mk I', cost: 0, description: 'Standard dual-vector reaction drives (Base: 75 m/s).', bonusValue: 0 },
    { level: 2, name: 'Plasma Injector Turbines Mk II', cost: 700, description: 'Enhanced magnetic flow regulators (+25 m/s Max Speed).', bonusValue: 25 },
    { level: 3, name: 'Hyper-Vector Warp Drives Mk III', cost: 2100, description: 'Multi-axis gimbaled ion nozzles (+60 m/s Max Speed, +0.4x boost).', bonusValue: 60 },
    { level: 4, name: 'Graviton Propulsion Matrix Mk IV', cost: 4800, description: 'Gravitational wave compression drive (+100 m/s Max Speed, +0.8x boost).', bonusValue: 100 },
    { level: 5, name: 'Singularity Slipstream Drive Mk V', cost: 11000, description: 'Zero-point fold engine (+160 m/s Max Speed, +1.2x boost).', bonusValue: 160 }
  ]
};

export interface ActiveUpgrades {
  weapons: number; // current level (1-5)
  shields: number;
  hull: number;
  engines: number;
}

export class StarbaseShop {
  public activeUpgrades: ActiveUpgrades = {
    weapons: 1,
    shields: 1,
    hull: 1,
    engines: 1
  };

  /**
   * Get the current upgrade tier for a given category.
   */
  public getCurrentTier(category: UpgradeCategory): UpgradeTier {
    const level = this.activeUpgrades[category];
    return UPGRADE_CATALOG[category][level - 1];
  }

  /**
   * Get the next purchasable upgrade tier for a given category, or null if maxed.
   */
  public getNextTier(category: UpgradeCategory): UpgradeTier | null {
    const currentLevel = this.activeUpgrades[category];
    if (currentLevel >= 5) return null;
    return UPGRADE_CATALOG[category][currentLevel];
  }

  /**
   * Attempt to purchase the next tier in a given category.
   */
  public purchaseUpgrade(
    category: UpgradeCategory,
    ship: Starship,
    currentCredits: number
  ): { success: boolean; newCredits: number; message: string; tier?: UpgradeTier } {
    const nextTier = this.getNextTier(category);
    if (!nextTier) {
      return {
        success: false,
        newCredits: currentCredits,
        message: `${category.toUpperCase()} is already upgraded to maximum tier!`
      };
    }

    if (currentCredits < nextTier.cost) {
      return {
        success: false,
        newCredits: currentCredits,
        message: `Insufficient credits for ${nextTier.name}. Need ${nextTier.cost.toLocaleString()} CR (have ${currentCredits.toLocaleString()} CR).`
      };
    }

    // Deduct credits and advance tier
    const newCredits = currentCredits - nextTier.cost;
    this.activeUpgrades[category] = nextTier.level;

    // Apply stat bonuses to ship
    this.applyUpgradeToShip(category, nextTier, ship);

    return {
      success: true,
      newCredits,
      message: `Upgraded to ${nextTier.name}!`,
      tier: nextTier
    };
  }

  /**
   * Apply upgrade modifications onto the Starship's live properties.
   */
  public applyUpgradeToShip(category: UpgradeCategory, tier: UpgradeTier, ship: Starship): void {
    switch (category) {
      case 'shields': {
        const baseShields = 100;
        const newMax = baseShields + tier.bonusValue;
        const shieldDelta = newMax - ship.maxShields;
        ship.maxShields = newMax;
        ship.shields = Math.min(newMax, ship.shields + Math.max(0, shieldDelta));
        break;
      }
      case 'hull': {
        const baseHull = 100;
        const newMax = baseHull + tier.bonusValue;
        const hullDelta = newMax - ship.maxHull;
        ship.maxHull = newMax;
        ship.hull = Math.min(newMax, ship.hull + Math.max(0, hullDelta));
        break;
      }
      case 'engines': {
        const baseSpeed = 75;
        ship.maxSpeed = baseSpeed + tier.bonusValue;
        if (tier.level >= 5) {
          ship.boostMultiplier = 3.2;
        } else if (tier.level >= 4) {
          ship.boostMultiplier = 2.8;
        } else if (tier.level >= 3) {
          ship.boostMultiplier = 2.4;
        } else {
          ship.boostMultiplier = 2.0;
        }
        break;
      }
      case 'weapons': {
        // Weapon bonus is queried by CombatSystem when firing
        break;
      }
    }
  }

  /**
   * Get weapon damage bonus from current upgrade level.
   */
  public getWeaponDamageBonus(): number {
    const currentTier = this.getCurrentTier('weapons');
    return currentTier.bonusValue;
  }
}
