import { describe, it, expect, vi } from 'vitest';
import { CutsceneDirector, PROLOGUE_CUTSCENE, BOSS1_INTRO_CUTSCENE } from './cutscene';
import { AudioSynthesizer } from './audio_synth';
import { CharacterVisualizer } from './characters';

describe('CutsceneDirector & Narrative Sequencing', () => {
  it('defines structured sequences with multi-character dialogues and cinematic directives', () => {
    expect(PROLOGUE_CUTSCENE.lines.length).toBeGreaterThanOrEqual(4);
    expect(PROLOGUE_CUTSCENE.title).toBeDefined();

    // Verify Prologue features AURA, Voss, and Vance
    const speakers = PROLOGUE_CUTSCENE.lines.map((l) => l.speaker);
    expect(speakers).toContain('aura');
    expect(speakers).toContain('voss');
    expect(speakers).toContain('vance');

    // Verify Boss 1 Intro features Archon Ferrum
    expect(BOSS1_INTRO_CUTSCENE.lines.map((l) => l.speaker)).toContain('archon');
  });

  it('plays sequences and transitions active state', () => {
    const audio = new AudioSynthesizer();
    const viz = new CharacterVisualizer();
    const director = new CutsceneDirector(audio, viz);

    expect(director.isActive()).toBe(false);

    director.play(PROLOGUE_CUTSCENE);
    expect(director.isActive()).toBe(true);
    expect(director.getCurrentLineIndex()).toBe(0);
    expect(director.getCurrentLine()?.speaker).toBe('aura');
  });

  it('handles typewriter completion and line advancement', () => {
    const audio = new AudioSynthesizer();
    const viz = new CharacterVisualizer();
    const director = new CutsceneDirector(audio, viz);

    director.play(PROLOGUE_CUTSCENE);
    expect(director.getCurrentLineIndex()).toBe(0);

    // First advance: completes typewriter line 0
    director.handleAdvanceOrNext();
    expect(director.getCurrentLineIndex()).toBe(0);

    // Second advance: steps to line 1
    director.handleAdvanceOrNext();
    expect(director.getCurrentLineIndex()).toBe(1);

    // Advance to line 2 (Kaelen Voss)
    director.handleAdvanceOrNext(); // finish typewriter
    director.handleAdvanceOrNext(); // next line
    expect(director.getCurrentLineIndex()).toBe(2);
    expect(director.getCurrentLine()?.speaker).toBe('voss');
  });

  it('triggers onComplete callback upon sequence end or skip', () => {
    const audio = new AudioSynthesizer();
    const viz = new CharacterVisualizer();
    const director = new CutsceneDirector(audio, viz);

    const onComplete = vi.fn();
    director.play(BOSS1_INTRO_CUTSCENE, onComplete);
    expect(director.isActive()).toBe(true);

    director.skip();
    expect(director.isActive()).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('advances typewriter during update loop', () => {
    const audio = new AudioSynthesizer();
    const viz = new CharacterVisualizer();
    const director = new CutsceneDirector(audio, viz);

    director.play(PROLOGUE_CUTSCENE);

    // Calling update with dt should process without throwing
    expect(() => {
      director.update(0.1);
      director.update(0.1);
    }).not.toThrow();
  });
});
