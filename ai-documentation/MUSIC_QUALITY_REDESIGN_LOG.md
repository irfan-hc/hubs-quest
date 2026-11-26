# Music Quality Redesign — Recursive Soundscapes

**Date:** 2026-11-26  
**Scope:** Focused music-engine refinement (`musicMapper.ts`, `audioEngine.ts`, `wavExporter.ts`) without altering the recursion engine, visualization, or adding external dependencies.

---

## Complete Prompt

> # Music Quality Redesign — Recursive Soundscapes
>
> The current procedural music does not sound soothing. I want to improve the musical quality substantially.
>
> This is a music-engine refinement task, not a UI redesign.
>
> Inspect the existing music engine, recursive event mapping, scheduler, synthesis and playback implementation before making changes.
>
> ## Goal
>
> Create a genuinely relaxing, ambient, coherent musical experience generated from the actual recursive event data.
>
> The result should feel like ambient generative music rather than random notes or a sequence of sound effects.
>
> ## 1. Musical composition
>
> Improve the composition rules.
>
> Use musical principles to make the result more coherent:
>
> - Use a musically compatible scale.
> - Prefer harmonic relationships.
> - Avoid excessive dissonance.
> - Avoid random pitch jumps that sound unnatural.
> - Introduce sparse musical phrases.
> - Allow silence and breathing space.
> - Avoid constantly triggering notes.
> - Use controlled note density.
> - Avoid chaotic overlapping sounds.
> - Create subtle musical variation without losing harmony.
>
> Consider suitable ambient approaches such as pentatonic or other compatible scales supported by the existing engine.
>
> ## 2. Tempo and rhythm
>
> Create a relaxing default tempo.
>
> Consider approximately 60–75 BPM for a calm default experience, but choose a value that actually works with the composition.
>
> - Use gentle pacing.
> - Avoid overly busy rhythms.
> - Avoid harsh or abrupt rhythmic patterns.
> - Allow longer sustained notes.
> - Use subtle variation in timing where appropriate.
> - Preserve the tempo control.
>
> ## 3. Instrument and synthesis design
>
> Improve the synthesized sounds.
>
> Prioritize:
>
> - Soft warm pads.
> - Gentle rounded mallet tones.
> - Subtle bell-like tones.
> - Smooth sustained notes.
> - Soft attack.
> - Natural decay.
> - Gentle release.
> - Controlled reverb, if supported.
> - Subtle stereo space, if supported.
>
> Avoid:
>
> - Sharp metallic attacks.
> - Harsh high frequencies.
> - Excessive bass.
> - Abrupt note endings.
> - Excessive reverb.
> - Constant high-frequency activity.
> - Overly loud or aggressive sounds.
>
> Use the existing audio architecture where practical.
>
> Do not introduce unnecessary dependencies.
>
> ## 4. Recursive musical mapping
>
> The music must continue to be generated from the actual recursive event data.
>
> Refine the mapping so that:
>
> - Recursion depth contributes meaningfully to musical layers.
> - Event timing contributes to musical timing.
> - Branch properties contribute to musical characteristics.
> - Musical density remains controlled.
> - Different recursive configurations produce distinct but harmonious compositions.
> - The mapping is understandable and maintainable.
>
> Do not make the music unrelated to recursion.
>
> Do not simply play a prerecorded track.
>
> ## 5. Composition structure
>
> Where practical, improve the musical structure by incorporating:
>
> - Background harmonic layers.
> - Sparse melodic events.
> - Gentle variation.
> - Natural spacing between events.
> - Controlled layering.
> - Smooth transitions.
> - A coherent ambient character.
>
> Do not add unnecessary complexity.
>
> ## 6. Audio quality and reliability
>
> Preserve:
>
> - Play.
> - Pause and Resume.
> - Stop.
> - Replay.
> - Tempo.
> - Volume.
> - Musical scale selection, where supported.
> - Branch synchronization.
> - WAV export.
>
> Prevent duplicate playback.
>
> Clean up scheduled events.
>
> Avoid clipping and excessively loud output.
>
> Ensure the audio remains audible and is not accidentally silent.
>
> ## 7. Testing
>
> Actually listen to the generated composition where practical.
>
> Test multiple recursion configurations.
>
> Evaluate:
>
> - Audible output.
> - Musical coherence.
> - Note density.
> - Harmony.
> - Tempo.
> - Sound quality.
> - Volume.
> - Stop and replay.
> - Branch synchronization.
> - WAV export.
>
> Do not claim the music sounds soothing merely because the code was changed.
>
> If actual listening is unavailable, clearly report that limitation.
>
> ## 8. Documentation
>
> Preserve the complete prompt and actual response in ai-documentation.
>
> Document:
>
> - Musical changes.
> - Mapping changes.
> - Synthesis changes.
> - Files modified.
> - Actual tests.
> - Listening verification.
> - Remaining limitations.
>
> Do not automatically push to GitHub.
> Do not redesign the visualization during this task.
> Do not rewrite the recursion engine.
>
> This is a focused musical-quality improvement.

---

## Summary of Changes

### 1. Musical Composition & Voice-Leading (`src/lib/audio/musicMapper.ts`)
- **Spacious Pacing & Breathing Room:** Increased default `baseDuration` to `14.0s` (at 60 BPM, scaling proportionally with `tempoMultiplier`) so notes sustain and breathe naturally rather than rushing.
- **Layer-by-Layer Musical Phrasing:** Grouped branches by recursion depth and selected a restrained, musical subset per layer (`1` root drone at depth 0, up to `4` harmonic chord pads at depths 1–2, up to `7` melodic bell/mallet notes at depths 3–4, and up to `6` delicate high accents at depth 5+).
- **Smooth Voice-Leading & Consonant Register:** Capped scale table at **Octave 5** (eliminating piercing Octave 6 frequencies). Depths 1–2 outline consonant chord degrees (`root`, `third`/`fourth`, `fifth`), while depths 3+ move via **stepwise voice-leading** guided by branch angle and pan instead of jarring octave/interval leaps.
- **Restrained Polyphony & Stereo Width:** Lowered default `maxSimultaneousVoices` cap to `6` and restrained stereo panning to `[-0.6, +0.6]` for a cohesive, calm mix.

### 2. Warm Synthesis & Anti-Harshness (`src/lib/audio/audioEngine.ts` & `src/lib/audio/wavExporter.ts`)
- **Master Warmth Filter & Limiter:** Added a `3600 Hz` lowpass warmth filter (`Q = 0.5`) ahead of a gentler dynamics limiter (`-6 dB` threshold, `10:1` ratio) to smooth upper harmonics and prevent digital clipping.
- **Warm Ambient Delay Bus:** Tuned delay to `0.42s` with a warmer `1150 Hz` lowpass feedback filter (`0.35` feedback, `0.42` wet scale).
- **Warm Pad (`renderPadVoice`):** Detuned `sine` + soft `triangle` (`1.0018x`) through a `<= 880 Hz` lowpass filter with a `0.65s` soft fade-in, smooth `linearRampToValueAtTime` sustain (removing the previous abrupt `setValueAtTime` volume step), and `1.1s` exponential release.
- **Rounded Bell (`renderBellVoice`):** Replaced the clangorous `2.76x` inharmonic partial with a gentle `2.0x` octave `sine` overtone (`0.14` ratio) through a `<= 2400 Hz` lowpass filter with a softer `32ms` attack.
- **Felt-Mallet Pluck (`renderPluckVoice`):** Blended `sine` + `triangle` through a sweeping lowpass filter (`2.6x` → `1.05x`) with a soft `25ms` mallet attack.
- **1:1 Offline WAV Parity:** Mirrored all synthesis, envelope, warmth filter, and delay updates in both `renderBrowserOffline` and `renderProceduralOffline` in `src/lib/audio/wavExporter.ts`.

---

## Verification & Results

- **TypeScript (`npx.cmd tsc --noEmit`):** 0 errors.
- **Final Audit Suite (`scripts/verify-final-audit.ts`):** 100% pass across all 7 audit sections (scale conformance, depth layering, polyphony cap, pause/resume timeline, 1:1 branch sync, tempo scaling, and 16-bit Stereo PCM WAV export).
- **Live Browser Verification (`http://localhost:3000/`):** Verified across presets, parameter changes, `Play`/`Pause`/`Resume`/`Stop`/`Replay`, `Sync: Active` branch highlighting, `Scale`/`Tempo`/`Volume`/`Space Reverb`, and `Export WAV` with 0 console errors.

---

## Remaining Limitations

- **Live Speaker / `AnalyserNode` Audibility:** The `webview_browser` automation environment isolates scripts in a Web Worker without guest-JS `AudioContext` access or hardware speaker capture; live speaker listening should be confirmed directly by clicking **Play Soundscape** in your browser (while offline WAV rendering confirms non-zero, non-clipping 16-bit PCM synthesis).
