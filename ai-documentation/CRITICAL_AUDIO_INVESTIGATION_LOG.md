# Critical Audio Investigation — Recursive Soundscapes

**Date:** 2026-11-26  
**Status:** Root cause identified & fixed; live UI/transport/WAV export verified in browser; hardware speaker output requires user confirmation (see Limitations).

---

## Prompt Preserved

> # Critical Audio Investigation — Recursive Soundscapes
>
> I cannot hear any music when using Recursive Soundscapes.
>
> This is a critical issue because procedural music is a mandatory part of the hackathon project.
>
> Do not redesign the interface or add new features during this investigation.
>
> ## 1. Investigate the complete audio pipeline
> Trace the complete flow:
> Recursive event data → Musical event mapping → Generated musical events → Audio scheduling → Audio synthesis → Master output → Browser audio output
>
> ## 2. Verify musical event generation
> Confirm that recursive event data exists, musical events are actually generated, sequence is nonempty, pitches/timing/durations/tempo are valid, and events correspond to recursive event data.
>
> ## 3. Verify the audio engine
> Inspect AudioContext state, browser audio initialization, resume, synthesizer initialization, instrument connections, master gain, volume mapping, scheduling, timing, note triggering, duration, cleanup, stop, pause/resume, replay, duplicate playback prevention.
>
> ## 4. Verify actual audio output
> Verify actual audio output where practical; if unavailable, clearly report that audio output could not be verified.
>
> ## 5. Fix the actual problem
> Identify root cause and fix without rewriting unrelated functionality.
>
> ## 6. Retest
> Test Play, Stop, Replay, Volume, Tempo, Pause/Resume, Regeneration, Audio synchronization, WAV export.
>
> ## 7. Documentation
> Preserve complete prompt and response in `ai-documentation`.

---

## 1. Root Cause Analysis

### The Bug: `stopAudioNodesOnly()` Race Condition in `src/lib/audio/audioEngine.ts`

In `WebAudioSynthesizer.playComposition()` (`src/lib/audio/audioEngine.ts`, lines 130–159):

1. `await this.ensureAudioContext()` creates `this.ctx` and `this.masterGain` (via `setupAudioGraph()`) and resumes `this.ctx` if suspended.
2. Immediately on line 137, `playComposition()` calls `this.stopAudioNodesOnly()` to prevent duplicate overlapping playback.
3. Previously, `stopAudioNodesOnly()` did:
   ```ts
   if (this.ctx && this.masterGain) {
     // ... fade out this.activeGainNodes ...
     setTimeout(() => {
       for (const osc of this.activeOscillators) {
         try {
           osc.stop();
           osc.disconnect();
         } catch {}
       }
       this.activeOscillators = [];
       this.activeGainNodes = [];
     }, 40);
   }
   ```
4. `playComposition()` then synchronously looped over `composition.events` (lines 147–150), scheduling every note starting at `now = ctx.currentTime + 0.08` (80ms in the future) and pushing every newly created `OscillatorNode` into **`this.activeOscillators`**.
5. **40ms later** (40ms *before* the first note was even scheduled to start at +80ms), the `setTimeout` from `stopAudioNodesOnly()` fired, iterated over `this.activeOscillators` (which now contained the *new* playback's oscillators), and called `osc.stop()` and `osc.disconnect()` on **every single oscillator**.
6. Meanwhile, `this.state` remained `"playing"` and `syncLoop()` continued running `requestAnimationFrame`, so the Play button turned to Pause and branches still lit up (`Sounding (N)`), even though **every oscillator had been killed before making a single sound**.

---

## 2. Files Changed

- `src/lib/audio/audioEngine.ts` — Fixed `stopAudioNodesOnly()` to snapshot `oldOscillators` and `oldGainNodes` and immediately reset `this.activeOscillators = []` and `this.activeGainNodes = []` before scheduling the 40ms fade-out cleanup. If there are no old nodes (such as on initial Play), returns immediately without scheduling any timeout.

No other files were modified for this fix.

---

## 3. Pipeline & Musical Event Generation Verification

Verified via `npx.cmd tsc --noEmit`, `scripts/verify-final-audit.ts`, and direct execution of `generateRecursiveTree` + `mapRecursionToMusic`:

- **TypeScript (`npx.cmd tsc --noEmit`):** Exit code 0 (0 errors).
- **Final Audit Suite (`scripts/verify-final-audit.ts`):** 100% pass (all 7 audit sections, including:
  - Audit 1–2: Recursive algorithm termination, non-NaN coordinates, parent-child continuity, determinism.
  - Audit 3: Harmonic scale conformance (100% snapped to scale), depth-to-register layering (e.g., Depth 0 `C2` 65.4 Hz `pad` vs Canopy `A4` 440.0 Hz `bell`), polyphony throttling (<= 8 concurrent voices).
  - Audit 4: Virtual timeline pause/resume, 1:1 `branchId` sync, tempo scaling proportionality (45 BPM = 12.0s, 60 BPM = 9.0s, 90 BPM = 6.0s).
  - Audit 5: Offline WAV export produces valid 16-bit Stereo PCM 44100 Hz RIFF/WAVE with Peak `0.2006` and RMS `0.0594`.)

---

## 4. Browser Retest Results (`http://localhost:3000`)

Tested live in the browser subagent against `http://localhost:3000`:

1. **Play & Branch Sync:** Clicked `Play Soundscape` -> button changed to `Pause`, footer status `Playing • C Major Pentatonic (36 events)`, header `Zen Branching Tableau Sounding (5)` -> `Sounding (1)`.
2. **Volume:** Adjusted `Master Volume` slider (`20%`, `0%`, `80%`) -> readout updated cleanly with no errors.
3. **Pause & Resume:** Clicked `Pause` -> `Resume` button, `Paused • Click Resume to Continue`, branch highlights cleared (`Settled`). Clicked `Resume` -> `Pause`, `Playing • C Major Pentatonic (36 events)`, `Sounding (2)` / `Sounding (1)`.
4. **Stop:** Clicked `Stop` -> `Play Soundscape`, `Standby • C Major Pentatonic Ready`, `Settled`.
5. **Replay:** Clicked `Replay` -> `Pause`, `Playing • C Major Pentatonic (36 events)`, `Sounding (1)`.
6. **Tempo & Regeneration:** Set `Tempo` to `90 BPM` and clicked `Regenerate` -> `Seed` changed from `10808` to `31545`; clicked `Play Soundscape` -> `Playing • C Major Pentatonic (36 events)`, `Sounding (1)`.
7. **WAV Export:** Clicked `Export WAV` -> downloaded `recursive-soundscapes-seed-31545.wav` (`7.2s, 1.21 MB`).
8. **Scroll/Zoom & Presets Sanity Check:** Normal wheel scroll over canvas scrolled page by `350px` while zoom stayed `1.00x`; Zoom In (`1.15x` -> `1.32x`), Zoom Out (`1.12x`), Reset View (`1.00x`); all 4 presets (`Zen`, `Forest`, `Cosmic`, `Dream`) updated selection and visualization titles.
9. **Audio Console Errors:** Zero Web Audio / AudioContext errors across all 20 steps. (One unrelated text-selection `Range.setEnd` `IndexSizeError` occurred on Step 20 during UI interaction.)

---

## 5. Remaining Limitations

- **Hardware / Live `AudioContext` Output Verification:** The `webview_browser` automation environment isolates scripts in a Web Worker and blocks guest-JS injection (`page.evaluate` / `addInitScript` / `window` access are unsupported), and cannot capture system speaker output. Therefore, while the 40ms oscillator-killing race condition is fixed and offline WAV rendering produces verified non-silent audio (Peak `0.2006`, RMS `0.0594`), **actual live speaker audibility in the browser could not be directly sampled via `AnalyserNode` by the agent** and should be confirmed by clicking **Play Soundscape** in your browser.
