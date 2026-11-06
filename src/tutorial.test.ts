import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialManager, TUTORIAL_STEPS } from './tutorial';

describe('TutorialManager & Flight Academy Systems', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('defines 5 comprehensive tutorial stages covering all core gameplay loops', () => {
    expect(TUTORIAL_STEPS.length).toBe(5);

    const ids = TUTORIAL_STEPS.map((s) => s.id);
    expect(ids).toContain('step-welcome');
    expect(ids).toContain('step-flight');
    expect(ids).toContain('step-combat-mining');
    expect(ids).toContain('step-stations-upgrades');
    expect(ids).toContain('step-bosses-warpgates');

    // Every step must have valid metadata, bullets, and pro tips
    TUTORIAL_STEPS.forEach((step) => {
      expect(step.title.length).toBeGreaterThan(5);
      expect(step.summary.length).toBeGreaterThan(20);
      expect(step.bullets.length).toBeGreaterThanOrEqual(4);
      expect(step.proTip.length).toBeGreaterThan(10);
    });
  });

  it('navigates forward and backward cleanly across steps', () => {
    const manager = new TutorialManager();
    expect(manager.getCurrentStep()).toBe(0);

    manager.nextStep();
    expect(manager.getCurrentStep()).toBe(1);

    manager.nextStep();
    expect(manager.getCurrentStep()).toBe(2);

    manager.prevStep();
    expect(manager.getCurrentStep()).toBe(1);

    manager.prevStep();
    expect(manager.getCurrentStep()).toBe(0);

    // Should clamp at 0
    manager.prevStep();
    expect(manager.getCurrentStep()).toBe(0);
  });

  it('allows direct step navigation via goToStep with boundary safety', () => {
    const manager = new TutorialManager();
    manager.goToStep(3);
    expect(manager.getCurrentStep()).toBe(3);

    // Out of bounds should be ignored
    manager.goToStep(99);
    expect(manager.getCurrentStep()).toBe(3);

    manager.goToStep(-5);
    expect(manager.getCurrentStep()).toBe(3);

    manager.goToStep(4);
    expect(manager.getCurrentStep()).toBe(4);
  });

  it('manages auto-show persistence with localStorage', () => {
    const manager = new TutorialManager();
    expect(manager.shouldAutoShow()).toBe(true);

    manager.setAutoShow(true);
    expect(manager.shouldAutoShow()).toBe(false);

    manager.setAutoShow(false);
    expect(manager.shouldAutoShow()).toBe(true);
  });

  it('invokes launch callback when tutorial finishes on last step', () => {
    let launched = false;
    const manager = new TutorialManager(() => {
      launched = true;
    });

    // Go to last step
    manager.goToStep(TUTORIAL_STEPS.length - 1);
    expect(manager.getCurrentStep()).toBe(4);

    // Next step triggers finish/close
    manager.nextStep();
    expect(launched).toBe(true);
  });
});
