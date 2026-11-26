# Task: Add a Customizable Instrument System to Recursive Soundscapes

**Date:** 2026-11-26  
**Scope:** Real sampled General MIDI SoundFont instrument system powered by `smplr` (`MIT`) + MusyngKite SoundFont (`CC BY-SA 3.0`), per-preset instrument defaults, Primary/Secondary instrument UI + volumes + disable option + reset, live instrument switching, and 1-vs-2 instrument WAV export compatibility.

---

## Complete Prompt

> # Task: Add a Customizable Instrument System to Recursive Soundscapes
>
> Implement a real instrument-selection system using Option A: generative music with virtual/sample-based instruments.
>
> ## 1. Four preset defaults
> Set these defaults:
> - Zen Snow Crystal: Soft Piano + Celesta
> - Enchanted Forest: Flute + Harp
> - Cosmic Harmonic Sculpture: Ambient Strings + Soft Piano
> - Dream Crystalline Sculpture: Violin + Warm Strings
> These are defaults, not restrictions. Users must be able to change them.
>
> ## 2. Instrument selector UI
> Add a clearly organized Music Instruments section to the existing interface.
> Provide: Primary instrument selector, Secondary instrument selector, Option to disable the secondary instrument, Primary instrument volume, Secondary instrument volume, Reset to Preset Instruments button.
> Support: Piano, Violin, Cello, Flute, Harp, Celesta, Warm Strings, Bell.
>
> ## 3. Real instrument sounds
> Use Tone.js-compatible sampled instruments or another suitable Web Audio instrument system. Use properly licensed samples or libraries, lazy loading, clear loading state, and graceful fallback.
>
> ## 4. Generative music integration
> Preserve recursion-based music generation; changing the instrument must not regenerate or alter the visual recursion structure.
>
> ## 5–7. Playback behaviour, Export compatibility, Testing & Documentation
> Support live instrument switching, WAV export with 1 and 2 instruments, `npx tsc --noEmit` and `npm run build`, and preserve complete prompt and response in AI documentation.

---

## 1. Sample Sources & Licenses

- **Library:** [`smplr`](https://github.com/danigb/smplr) — **MIT License**.
- **Sampled Instruments:** **MusyngKite General MIDI SoundFont** (`acoustic_grand_piano`, `violin`, `cello`, `flute`, `orchestral_harp`, `celesta`, `string_ensemble_1`, `tubular_bells`) — **Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)**, cached in the browser via `smplr`'s `CacheStorage` and loaded lazily only for the active primary/secondary selection.
- **Fallback:** If offline or if a sample fetch fails, `WebAudioSynthesizer` and `wavExporter` fall back cleanly to built-in Web Audio synthesis without crashing.

---

## 2. Files Changed

- `package.json` / `package-lock.json` — Added `smplr`.
- `src/lib/audio/instruments.ts` — Created 8-instrument catalog (`piano`, `violin`, `cello`, `flute`, `harp`, `celesta`, `warm_strings`, `bell`) with SoundFont mappings and license metadata.
- `src/lib/audio/types.ts` — Added `InstrumentId`, `InstrumentRole`, `InstrumentLoadState`, and optional `role?: InstrumentRole` on `MusicalEvent`.
- `src/lib/presets/types.ts` & `src/lib/presets/presets.ts` — Added per-preset default `primaryInstrument`, `secondaryInstrument`, `primaryVolume`, and `secondaryVolume`.
- `src/lib/audio/musicMapper.ts` — Tagged lead/melody/bass events with `role: "primary"` and harmonic chord/pad layers with `role: "secondary"`.
- `src/lib/audio/audioEngine.ts` — Integrated lazy `smplr` `Soundfont` loading, `primaryBusGain` & `secondaryBusGain` buses, loading-state callbacks, graceful synth fallback, and glitch-free live instrument switching.
- `src/lib/audio/wavExporter.ts` — Integrated `smplr` `Soundfont` offline rendering into `OfflineAudioContext` (`renderBrowserOffline`) and role-aware volume/disable support in `renderProceduralOffline`.
- `src/app/page.tsx` & `src/components/panels/PlaybackPanel.tsx` — Added the **Music Instruments** UI section (Primary/Secondary selectors, `None (Disabled)` option, Primary/Secondary volume sliders, `Reset to Preset Instruments`, and sample loading status).

---

## 3. Verification Results & Limitations

- **`npx.cmd tsc --noEmit`:** `0` errors.
- **`npm.cmd run build`:** Exited `0` (`4/4` static pages).
- **`node --experimental-strip-types scripts/verify-final-audit.ts`:** `100%` pass across all 7 audit sections.
- **1-Instrument vs 2-Instrument WAV Export Test (`Forest` preset):**
  - 1-instrument (`flute` + `None`): `26.91s`, `4,746,968` bytes, `RMS: 0.0366`, `Peak: 0.1524`.
  - 2-instrument (`flute` + `harp`): `26.91s`, `4,746,968` bytes, `RMS: 0.0409`, `Peak: 0.1656`.
- **Live Browser (`http://localhost:3000/`):** Verified preset defaults, manual instrument switching, `None (Disabled)`, volume sliders, `Reset to Preset Instruments`, visual invariance across instrument changes, live sample loading/playback, and 1- & 2-instrument `Export WAV` downloads with `0` console errors.
- **Limitation:** Automated browser verification cannot listen to hardware speakers; subjective listening quality should be confirmed directly by clicking **Play Soundscape** or playing the exported WAV files.
