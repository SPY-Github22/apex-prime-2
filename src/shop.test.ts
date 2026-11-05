import { describe, it, expect } from 'vitest';
import { StarbaseShop } from './shop';
import { Starship } from './ship';

describe('Starbase Shop & Upgrade Mechanics', () => {
  it('initializes with level 1 in all categories', () => {
    const shop = new StarbaseShop();
    expect(shop.activeUpgrades.weapons).toBe(1);
    expect(shop.activeUpgrades.shields).toBe(1);
    expect(shop.activeUpgrades.hull).toBe(1);
    expect(shop.activeUpgrades.engines).toBe(1);

    const curShield = shop.getCurrentTier('shields');
    expect(curShield.name).toBe('Kevlar Deflector Grid Mk I');
    expect(curShield.cost).toBe(0);

    const nextShield = shop.getNextTier('shields');
    expect(nextShield).not.toBeNull();
    expect(nextShield!.name).toBe('Reinforced Phase Bulwark Mk II');
    expect(nextShield!.cost).toBe(750);
  });

  it('rejects purchase when player has insufficient credits', () => {
    const shop = new StarbaseShop();
    const ship = new Starship();

    const res = shop.purchaseUpgrade('shields', ship, 500); // 500 < 750
    expect(res.success).toBe(false);
    expect(res.newCredits).toBe(500);
    expect(res.message).toContain('Insufficient credits');
    expect(shop.activeUpgrades.shields).toBe(1);
    expect(ship.maxShields).toBe(100);
  });

  it('successfully purchases tier 2 shields, updates credits and ship maxShields', () => {
    const shop = new StarbaseShop();
    const ship = new Starship();

    const res = shop.purchaseUpgrade('shields', ship, 2500);
    expect(res.success).toBe(true);
    expect(res.newCredits).toBe(1750); // 2500 - 750
    expect(shop.activeUpgrades.shields).toBe(2);
    expect(ship.maxShields).toBe(150); // 100 + 50
    expect(ship.shields).toBe(150);
  });

  it('successfully upgrades engine speeds and boost multipliers', () => {
    const shop = new StarbaseShop();
    const ship = new Starship();

    expect(ship.maxSpeed).toBe(75);

    // Purchase Mk II engines (700 CR)
    const res2 = shop.purchaseUpgrade('engines', ship, 5000);
    expect(res2.success).toBe(true);
    expect(ship.maxSpeed).toBe(100); // 75 + 25

    // Purchase Mk III engines (2100 CR)
    const res3 = shop.purchaseUpgrade('engines', ship, res2.newCredits);
    expect(res3.success).toBe(true);
    expect(ship.maxSpeed).toBe(135); // 75 + 60
    expect(ship.boostMultiplier).toBe(2.4);
  });

  it('handles weapons progression and calculates weapon damage bonus', () => {
    const shop = new StarbaseShop();
    const ship = new Starship();

    expect(shop.getWeaponDamageBonus()).toBe(0);

    // Upgrade weapons to Tier 2
    shop.purchaseUpgrade('weapons', ship, 5000);
    expect(shop.getWeaponDamageBonus()).toBe(15);

    // Upgrade weapons to Tier 3
    shop.purchaseUpgrade('weapons', ship, 5000);
    expect(shop.getWeaponDamageBonus()).toBe(35);
  });

  it('prevents purchase beyond max tier 5', () => {
    const shop = new StarbaseShop();
    const ship = new Starship();

    // Fast-track to tier 5
    shop.activeUpgrades.hull = 5;
    expect(shop.getNextTier('hull')).toBeNull();

    const res = shop.purchaseUpgrade('hull', ship, 999999);
    expect(res.success).toBe(false);
    expect(res.message).toContain('maximum tier');
  });
});
