# Music Engine Transformation — Progressive Piano Composition

**Date:** 2026-11-26  
**Scope:** Focused music-engine transformation (`types.ts`, `musicMapper.ts`, `audioEngine.ts`, `wavExporter.ts`) into a 4-phase progressive acoustic-style piano composition driven by Stage 2 recursive event data.

---

## Complete Prompt

> # Music Engine Transformation — Progressive Piano Composition
>
> I am not satisfied with the current soundtrack.
>
> I want to transform the music engine into a piano-led generative composition that begins peacefully and gradually develops into an emotionally rich and intense musical experience before naturally settling down.
>
> This is a focused music-engine redesign.
>
> Inspect the existing music engine, recursive event mapping, scheduler, synthesis, playback state and audio architecture before making changes.
>
> ## 1. Musical vision
> The primary instrument should be piano.
> The composition should begin with soft, peaceful piano playing sparse notes and gentle chords.
> As the composition progresses, it should gradually become more expressive, fuller and emotionally intense.
> The intensity should come from musical development rather than simply increasing volume.
> The composition should feel coherent, intentional, emotional and musical, rather than like randomly generated piano notes.
>
> ## 2. Musical progression
> Create a gradual musical progression.
>
> ### Phase A — Peaceful opening
> - Soft piano notes.
> - Sparse melody.
> - Gentle chords.
> - Slow, comfortable tempo.
> - Large gaps between notes.
> - Soft dynamics.
> - Minimal layering.
> - Peaceful and contemplative atmosphere.
>
> ### Phase B — Musical development
> Gradually introduce:
> - A more developed melody.
> - Gentle arpeggios.
> - More harmonic movement.
> - Slightly more rhythmic activity.
> - Subtle dynamic variation.
> - Wider melodic range where appropriate.
> The transition should be gradual and natural.
>
> ### Phase C — Emotional intensity
> As the recursive process develops, the music may become more intense.
> Use musical techniques such as:
> - Fuller chord voicings.
> - More expressive melodic movement.
> - Greater note density, controlled carefully.
> - Wider register.
> - Stronger dynamics.
> - More developed arpeggios.
> - Harmonic tension and resolution.
> - Additional piano layers where appropriate.
> Do not simply increase volume.
> Avoid harsh, chaotic or excessively fast music.
> The intense phase should still sound beautiful and coherent.
>
> ### Phase D — Release and resolution
> Where appropriate, allow the composition to settle:
> - Reduce note density.
> - Soften dynamics.
> - Simplify the melody.
> - Resolve harmonic tension.
> - Allow sustained notes to decay naturally.
> - Return to a peaceful musical atmosphere.
>
> ## 3. Piano synthesis
> Prioritize a convincing and pleasant synthesized piano sound using the existing architecture.
> Investigate whether the existing audio engine supports suitable piano synthesis.
> If a piano soundfont or piano sample is available and practical, consider using it.
> Otherwise, create or improve a piano-like synthesis implementation using the existing audio engine.
> The sound should aim for:
> - Soft and rounded attacks when playing gently.
> - Expressive dynamics.
> - Natural note decay.
> - Pleasant harmonic characteristics.
> - Avoiding harsh high frequencies.
> - Avoiding artificial notification-like sounds.
> - Avoiding excessive metallic tones.
> - Avoiding abrupt note cutoffs.
> The piano should be the dominant instrument.
> Supporting sounds should remain secondary and only be introduced where they genuinely improve the composition.
> Do not add unnecessary dependencies or large assets without considering performance, compatibility and project constraints.
>
> ## 4. Composition and harmony
> Improve the musical logic.
> Use:
> - Musically compatible scales.
> - Coherent chord progressions.
> - Melodic motifs.
> - Motif variation.
> - Harmonic relationships.
> - Appropriate melodic range.
> - Musical phrasing.
> - Controlled rhythm.
> - Intentional pauses.
> Avoid:
> - Random notes without musical relationships.
> - Excessive dissonance.
> - Unpredictable pitch jumps.
> - Constant playing.
> - Excessive note density.
> - Repetitive mechanical patterns.
> - Abrupt musical transitions.
> Allow the composition to breathe.
>
> ## 5. Recursive music mapping
> The music must still be genuinely generated from the existing recursive event data.
> Do not replace recursion-driven composition with prerecorded music.
> Inspect and improve the mapping between recursion and composition.
> Where appropriate:
> - Recursion depth influences musical layers and register.
> - Branch properties influence musical characteristics.
> - Event creation order contributes to musical progression.
> - Event timing influences composition timing.
> - Branch relationships contribute to melodic or harmonic relationships.
> - Recursive density influences musical development.
> - Event properties contribute to intensity progression.
> The recursive data should influence the actual musical composition, not just the visualization.
> The music should be reproducible from the same configuration and seed where practical.
>
> ## 6. Intensity progression
> Create a controlled progression from calm to expressive intensity.
> Intensity should be influenced by the actual composition and recursive process where appropriate.
> Use a combination of:
> - Musical activity.
> - Dynamics.
> - Harmonic development.
> - Register.
> - Note density.
> - Chord richness.
> - Rhythmic activity.
> - Supporting layers.
> Do not equate intensity with loudness alone.
> The progression should not suddenly become intense.
> The transition should be gradual and musical.
>
> ## 7. User controls
> Preserve the existing playback interface and controls.
> Preserve:
> - Play.
> - Pause and Resume.
> - Stop.
> - Replay.
> - Tempo.
> - Volume.
> - Musical scale selection where supported.
> - Regenerate composition.
> - WAV export.
> - Music-to-visual synchronization.
> If an intensity control is already present, inspect whether it should be improved.
> Do not add unnecessary controls or redesign the entire interface.
>
> ## 8. Audio reliability
> Ensure:
> - No duplicate playback.
> - Correct AudioContext initialization.
> - Correct scheduling.
> - Correct stop behavior.
> - Correct replay behavior.
> - Proper audio cleanup.
> - No uncontrolled scheduling.
> - No clipping.
> - Audible piano output.
> - Browser audio restrictions handled properly.
>
> ## 9. Testing
> Actually listen to the generated composition where practical.
> Test:
> - Peaceful opening.
> - Musical progression.
> - Intense phase.
> - Release phase.
> - Harmonic coherence.
> - Piano sound quality.
> - Dynamics.
> - Tempo.
> - Regeneration.
> - Playback.
> - Stop and replay.
> - Audio synchronization.
> - WAV export.
> Do not claim the composition is musically improved if it has not actually been listened to.
> If actual listening verification is unavailable, explicitly report that limitation.
>
> ## 10. Documentation
> Preserve the complete prompt and actual response in ai-documentation.
> Document:
> - Musical design.
> - Piano synthesis approach.
> - Recursive mapping.
> - Intensity progression.
> - Files modified.
> - Actual tests performed.
> - Listening verification.
> - Remaining limitations.
>
> Do not automatically push to GitHub.
> Do not modify the visualization during this task.
> Do not rewrite the recursion engine.
> Do not add unnecessary dependencies.
>
> This is a focused transformation of the soundtrack into a progressive, piano-led generative composition.

---

## 1. Musical Design & 4-Phase Intensity Progression (`src/lib/audio/musicMapper.ts`)

Over a `24.0s` base arc (at 60 BPM, scaling proportionally with `tempoBpm`):

- **Melodic Motif & Chord Arc:** Extracts a 4-note core motif deterministically from early `BranchEvent` angles and depths, paired with a 4-phase chord progression (`I → IV → iii → V/iv → I`).
- **Phase A (0–25%, Peaceful Opening):** Soft root piano bass (`Octave 2`, `vel 0.30–0.42`) + sparse single/dyad right-hand motif notes (`Octave 4`, `0.55s` spacing, `22ms` soft attack).
- **Phase B (25–55%, Musical Development):** Left-hand root+fifth dyads + 3–4 note rising right-hand arpeggios (`vel 0.44–0.52`, `0.38s` spacing).
- **Phase C (55–82%, Emotional Intensity):** Driven by recursive branch density: fuller arpeggios (4–5 notes), wider register reaching **Octave 5** climax notes, expressive dynamics (`vel 0.64–0.82`), tighter `0.28s` phrasing, plus a subtle secondary warm pad swell (`vel 0.24`) underneath.
- **Phase D (82–100%, Release & Resolution):** Simplifies back to sparse tonic/subdominant motif notes (`Octave 4`, `vel 0.30–0.42`) with long natural sustain (`3.2–3.8s`) decaying peacefully.

Every event remains mapped to a real `BranchEvent.id` (`branchId`) from Stage 2, preserving 1:1 visual synchronization and seed reproducibility.

---

## 2. Piano Synthesis Approach (`src/lib/audio/audioEngine.ts` & `src/lib/audio/wavExporter.ts`)

- **Multi-Partial String Model (`renderPianoVoice`):** Combines fundamental `sine` (`1.0x`), warm `triangle` octave (`2.0006x` slight chorus detune), and subtle `3.0x` harmonic scaled by `velocity`.
- **Velocity-Coupled Hammer Filter:** Lowpass filter sweeps from `freq * (2.2 + velocity * 3.6)` down to `freq * 1.55` over `0.42s`, so soft Phase A notes stay warm/felt-like while Phase C climax notes bloom naturally without harsh highs.
- **Natural Envelope:** `22ms` soft attack for gentle notes / `13ms` for intense notes, decaying smoothly over `1.4s–4.0s` into the `3600 Hz` master warmth filter and `0.42s` (`1150 Hz` lowpass) ambient delay bus.
- **1:1 Offline WAV Parity:** Both `renderBrowserOffline` and `renderProceduralOffline` in `wavExporter.ts` implement the exact same `piano` synthesis.

---

## 3. Files Modified

- `src/lib/audio/types.ts` — Added `"piano"` to `VoiceType`.
- `src/lib/audio/musicMapper.ts` — Replaced layer-dump mapper with the 4-phase progressive piano composition engine.
- `src/lib/audio/audioEngine.ts` — Added `renderPianoVoice()`.
- `src/lib/audio/wavExporter.ts` — Added `piano` synthesis in both offline WAV renderers.

---

## 4. Tests Performed & Limitations

- **TypeScript (`npx.cmd tsc --noEmit`):** 0 errors.
- **Audit Suite (`node --experimental-strip-types scripts/verify-final-audit.ts`):** 100% pass across all 7 audit sections.
- **Live Browser (`http://localhost:3000/`):** Verified presets, `Regenerate`, `Play` / `Pause` / `Resume` / `Stop` / `Replay`, `Sync: Active` branch highlighting, `Tempo` / `Scale` controls, and `Export WAV`.
- **Limitation:** Automated browser verification cannot listen to hardware speakers; subjective listening quality should be confirmed directly by clicking **Play Soundscape** or playing the exported WAV file.
