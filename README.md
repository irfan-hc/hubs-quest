# Recursive Soundscapes

An interactive creative-coding web application that transforms deterministic recursive algorithms into evolving generative visualizations and a **4-Phase Progressive Musical Composition** using real General MIDI SoundFont sampled instruments, 1:1 audio-visual branch synchronization, and 16-bit Stereo PCM WAV export.

> **Live Demo:** `[Deployment Link Placeholder — Add live URL after deployment]`

---

## Features

- **5 Recursive Pattern Modes (`src/lib/recursion/branchingEngine.ts`):**
  - `crystal`: Genuine 6-fold hexagonal recursive symmetry (`Zen Snow Crystal`)
  - `organic`: Asymmetric trunk continuation + variable lateral shoots (`Enchanted Forest Sculpture`)
  - `spiral`: 3-arm golden-angle / logarithmic spiral with nested offshoots (`Cosmic Harmonic Sculpture`)
  - `coral`: Irregular clustered reef-like branching (`Dream Crystalline Sculpture`)
  - `binary`: Classic symmetric binary tree (`Binary` fallback mode)
  - Configurable **Recursion Depth** (`1–9`), **Branching Divergence Angle** (`12°–70°`), **Growth/Decay Ratio** (`0.45–0.85`), **Randomness/Drift** (`0–60%`), and deterministic **Mulberry32 PRNG Seed**.

- **4 Curated Presets (`src/lib/presets/presets.ts`):**
  - **Zen Snow Crystal:** `crystal` pattern · `C Major Pentatonic` (`46 BPM`) · **Soft Piano + Celesta**
  - **Enchanted Forest Sculpture:** `organic` pattern · `Dorian Twilight` (`56 BPM`) · **Flute + Harp**
  - **Cosmic Harmonic Sculpture:** `spiral` pattern · `Lydian Celestial` (`68 BPM`) · **Warm Strings + Soft Piano**
  - **Dream Crystalline Sculpture:** `coral` pattern · `Ambient 432Hz Major 7th` (`50 BPM`) · **Violin + Warm Strings**

- **Customizable Sampled Instrument System (`src/lib/audio/instruments.ts` & `audioEngine.ts`):**
  - Powered by [`smplr`](https://github.com/danigb/smplr) (`MIT`) and **MusyngKite General MIDI SoundFont** (`CC BY-SA 3.0`), lazily loaded and browser-cached with automatic Web Audio synthesis fallback.
  - **8 Supported Instruments:** `Soft Piano`, `Violin`, `Cello`, `Flute`, `Harp`, `Celesta`, `Warm Strings`, and `Bell`.
  - Independent **Primary Instrument** + **Primary Volume**, **Secondary Instrument** (`None (Disabled)` option) + **Secondary Volume**, and **Reset to Preset Instruments**.

- **4-Phase Progressive Composition & Playback (`src/lib/audio/musicMapper.ts` & `PlaybackPanel.tsx`):**
  - Maps `BranchEvent` depth, angle, length, creation order, pan, and `branch.id` into a 4-phase arc (**Peaceful Opening** → **Musical Development** → **Emotional Intensity** → **Release & Resolution**).
  - Full transport controls: **Play Soundscape**, **Pause**, **Resume**, **Stop**, **Replay**, **Regenerate**, **Harmonic Scale**, **Tempo** (`35–110 BPM`), **Master Volume**, and **Space Reverb**.
  - **1:1 Branch Synchronization:** Active sounding branches illuminate in real time on the canvas (`Sounding (N)` / `Sync: Active`).

- **Real WAV Audio Export (`src/lib/audio/wavExporter.ts`):**
  - Exports the active composition and selected primary/secondary instruments into a 16-bit Stereo PCM 44.1 kHz `.wav` file via `OfflineAudioContext` (with pure-TypeScript DSP fallback).
  - *(Note: WebM/video export is not implemented; only WAV audio export is provided.)*

---

## Technology Stack

- **Next.js 14** (App Router) & **React 18**
- **TypeScript** & **Tailwind CSS**
- **HTML5 2D Canvas API**
- **Web Audio API** & **`smplr`** (MusyngKite SoundFont)

---

## Installation & Local Development

### Prerequisites
- **Node.js 18+** (Node 22+ recommended for running TypeScript verification scripts with `--experimental-strip-types`)
- **npm**

### Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Type-Check, Build & Verification
```bash
npx tsc --noEmit
npm run build
node --experimental-strip-types scripts/verify-final-audit.ts
```

---

## Controls & Usage

1. **Select a Preset** (`Zen`, `Forest`, `Cosmic`, or `Dream`) in the top strip.
2. **Adjust Recursion Controls** in the right dock (**Recursion Pattern**, **Depth**, **Angle**, **Growth/Decay Ratio**, **Randomness/Drift**, **Randomize** seed, or **Reset to Default**).
3. **Customize Music Instruments** in **Audio & Playback** (**Primary Instrument** & volume, **Secondary Instrument** or `None (Disabled)` & volume, **Reset to Preset Instruments**).
4. **Play & Shape Audio** with **Play Soundscape** / **Pause** / **Resume** / **Stop** / **Replay** / **Regenerate**, **Harmonic Scale**, **Tempo**, **Master Volume**, and **Space Reverb**.
5. **Navigate the Canvas:** Drag to pan, **Zoom In** / **Zoom Out** (or `Ctrl/Cmd + Scroll`), **Reset View**, or **Replay** formation.
6. **Export Audio:** Click **Export WAV** to render and download `recursive-soundscapes-seed-<seed>.wav`.

---

## Project Structure

```text
├── ai-documentation/        # Complete AI prompt-and-response logs & AI_USAGE_INDEX.md
├── public/                  # Pre-rendered demo WAV assets
├── scripts/                 # Automated verification & audit scripts
├── src/
│   ├── app/                 # Next.js App Router (page.tsx, layout.tsx, globals.css, icon.svg)
│   ├── components/          # Header & studio panels (PresetSelector, VisualizationPanel, PlaybackPanel, ParameterPanel)
│   └── lib/
│       ├── audio/           # instruments.ts, musicMapper.ts, audioEngine.ts, wavExporter.ts, types.ts
│       ├── presets/         # 4 preset definitions & active-preset matching
│       ├── recursion/       # branchingEngine.ts (5 pattern modes) & types.ts
│       └── visualization/   # canvasRenderer.ts
├── package.json
└── tsconfig.json
```

---

## AI Usage & Documentation

All AI prompts, architectural decisions, debugging logs, and verification results are preserved in [`ai-documentation/`](./ai-documentation/) and indexed in [`ai-documentation/AI_USAGE_INDEX.md`](./ai-documentation/AI_USAGE_INDEX.md).
