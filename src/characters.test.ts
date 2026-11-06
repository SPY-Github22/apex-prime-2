import { describe, it, expect } from 'vitest';
import { CharacterVisualizer, CHARACTERS } from './characters';

describe('CharacterVisualizer & Procedural Hologram Systems', () => {
  it('defines detailed metadata and visual themes for all 4 story characters', () => {
    expect(CHARACTERS.aura).toBeDefined();
    expect(CHARACTERS.voss).toBeDefined();
    expect(CHARACTERS.vance).toBeDefined();
    expect(CHARACTERS.archon).toBeDefined();

    Object.values(CHARACTERS).forEach((char) => {
      expect(char.name.length).toBeGreaterThan(3);
      expect(char.title.length).toBeGreaterThan(5);
      expect(char.faction.length).toBeGreaterThan(3);
      expect(char.themeColor.startsWith('#')).toBe(true);
      expect(char.accentColor.startsWith('#')).toBe(true);
      expect(char.badge.length).toBeGreaterThan(2);
    });
  });

  it('switches character definitions dynamically', () => {
    const viz = new CharacterVisualizer();
    expect(viz.getCharacter().id).toBe('aura');

    viz.setCharacter('voss');
    expect(viz.getCharacter().id).toBe('voss');
    expect(viz.getCharacter().name).toBe('KAELEN VOSS');

    viz.setCharacter('vance');
    expect(viz.getCharacter().id).toBe('vance');

    viz.setCharacter('archon');
    expect(viz.getCharacter().id).toBe('archon');
  });

  it('safely handles update and render cycles without bound canvas', () => {
    const viz = new CharacterVisualizer();
    expect(() => viz.updateAndRender(0.016)).not.toThrow();
    expect(() => viz.render()).not.toThrow();
  });

  it('handles mock canvas binding and renders without errors', () => {
    const mockContext: any = {
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      closePath: () => {},
      arc: () => {},
      strokeRect: () => {},
      save: () => {},
      restore: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {}
      })
    };

    const mockCanvas: any = {
      width: 200,
      height: 200,
      getContext: () => mockContext
    };

    const viz = new CharacterVisualizer(mockCanvas);
    viz.setSpeaking(true);

    expect(() => {
      viz.setCharacter('aura');
      viz.updateAndRender(0.016);

      viz.setCharacter('voss');
      viz.updateAndRender(0.016);

      viz.setCharacter('vance');
      viz.updateAndRender(0.016);

      viz.setCharacter('archon');
      viz.updateAndRender(0.016);
    }).not.toThrow();
  });
});
