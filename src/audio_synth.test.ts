import { describe, it, expect } from 'vitest';
import { AudioSynthesizer, CHARACTER_VOICE_PROFILES } from './audio_synth';

describe('AudioSynthesizer & Procedural Speech Systems', () => {
  it('defines distinct acoustic profiles for all story characters', () => {
    expect(CHARACTER_VOICE_PROFILES.aura).toBeDefined();
    expect(CHARACTER_VOICE_PROFILES.voss).toBeDefined();
    expect(CHARACTER_VOICE_PROFILES.vance).toBeDefined();
    expect(CHARACTER_VOICE_PROFILES.archon).toBeDefined();

    // Verify frequency hierarchy: Archon (sub-bass) < Voss (low baritone) < Vance (tenor) < AURA (high sine)
    expect(CHARACTER_VOICE_PROFILES.archon.baseFreq).toBeLessThan(CHARACTER_VOICE_PROFILES.voss.baseFreq);
    expect(CHARACTER_VOICE_PROFILES.voss.baseFreq).toBeLessThan(CHARACTER_VOICE_PROFILES.vance.baseFreq);
    expect(CHARACTER_VOICE_PROFILES.vance.baseFreq).toBeLessThan(CHARACTER_VOICE_PROFILES.aura.baseFreq);

    // Verify oscillator types match character archetypes
    expect(CHARACTER_VOICE_PROFILES.aura.oscType).toBe('sine');
    expect(CHARACTER_VOICE_PROFILES.voss.oscType).toBe('sawtooth');
    expect(CHARACTER_VOICE_PROFILES.vance.oscType).toBe('triangle');
    expect(CHARACTER_VOICE_PROFILES.archon.oscType).toBe('square');
  });

  it('safely instantiates in headless/Node test environments without crashing', () => {
    const synth = new AudioSynthesizer();
    expect(synth).toBeDefined();
    expect(synth.isMuted()).toBe(false);

    // Methods should be no-ops without throwing when AudioContext is unavailable in pure Node
    expect(() => synth.playVoiceBlip('aura')).not.toThrow();
    expect(() => synth.playVoiceBlip('voss')).not.toThrow();
    expect(() => synth.playVoiceBlip('vance')).not.toThrow();
    expect(() => synth.playVoiceBlip('archon')).not.toThrow();
    expect(() => synth.playTransmissionChime(true)).not.toThrow();
    expect(() => synth.playTransmissionChime(false)).not.toThrow();
    expect(() => synth.playCinematicDrop()).not.toThrow();
  });

  it('manages mute toggle state properly', () => {
    const synth = new AudioSynthesizer();
    expect(synth.isMuted()).toBe(false);

    synth.setMuted(true);
    expect(synth.isMuted()).toBe(true);

    synth.setMuted(false);
    expect(synth.isMuted()).toBe(false);
  });
});
