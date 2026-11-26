# Recursive Soundscapes

An interactive creative-coding web application that transforms a deterministic recursive branching algorithm into an evolving **Recursive Harmonic Sculpture** and a **4-Phase Progressive Piano Composition**, complete with real-time audio-visual synchronization and 16-bit Stereo PCM WAV export.

> **Live Demo:** `[Deployment URL Placeholder — Add live link after deployment]`

---

## Features

- **Deterministic Recursion Engine (`src/lib/recursion/branchingEngine.ts`):**
  - Mulberry32 PRNG-seeded recursive generator producing `BranchEvent` trees with configurable **Depth** (`1–9`), **Branching Divergence Angle** (`12°–70°`), **Growth/Decay Ratio** (`0.45–0.85`), **Randomness/Drift** (`0–60%`), and **Seed**.
- **Preset-Specific Generative Visualizations (`src/lib/visualization/canvasRenderer.ts`):**
  - **Zen:** 6-fold **Enchanted Snow Crystal Formation** projected from Stage 2 recursive branches with a 5-stage frost growth sequence on a midnight winter backdrop.
  - **Forest:** **Enchanted Forest Sculpture** with curved organic spirals, leaf/blossom clusters, warm sunlight haze, and floating pollen motes.
  - **Cosmic:** **Cosmic Harmonic Sculpture** with translucent lotus petals, concentric orbital rings, and deep-space illumination.
  - **Dream:** **Dream Crystalline Sculpture** with faceted diamond shards and soft lavender/pink mist.
- **4-Phase Progressive Piano Composition (`src/lib/audio/musicMapper.ts` & `audioEngine.ts`):**
  - Maps recursion depth, branch angles, lengths, creation order, and `branch.id` into a 4-phase emotional arc (**Phase A** peaceful opening → **Phase B** melodic/arpeggio development → **Phase C** fuller voicings & climax → **Phase D** gentle tonic resolution).
  - Synthesizes a multi-partial acoustic-style piano voice with velocity-coupled lowpass hammer filtering, natural string decay, and warm ambient delay.
- **Interactive Studio Workspace:**
  - Full-width desktop `100vh` layout keeping the simulation canvas visible while adjusting any control in the right inspector dock.
  - Drag-to-pan, `Zoom In` / `Zoom Out` / `Ctrl+Scroll` zoom, `Reset View`, `Replay`, and 1:1 `Sync: Active` branch highlighting.
- **Real WAV Audio Export (`src/lib/audio/wavExporter.ts`):**
  - Offline rendering via `OfflineAudioContext` (with pure-TypeScript DSP fallback) to 16-bit Stereo PCM 44.1 kHz `.wav` download.

---

## Technologies Used

- **Next.js 14** (App Router) & **React 18**
- **TypeScript**
- **Tailwind CSS**
- **HTML5 2D Canvas API**
- **Web Audio API** (`AudioContext`, `OfflineAudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`, `DelayNode`, `StereoPannerNode`)

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

### Production Build & Verification
```bash
npx tsc --noEmit
npm run build
node --experimental-strip-types scripts/verify-final-audit.ts
```

---

## Usage Instructions

1. **Choose a Preset** (`Zen`, `Forest`, `Cosmic`, or `Dream`) in the top strip to load a curated recursion + musical configuration.
2. **Customize Parameters** in the right-hand **Recursion Controls** panel (`Recursion Depth`, `Branching Divergence Angle`, `Growth / Decay Ratio`, `Randomness / Drift`, or `Randomize` seed).
3. **Play & Control Audio** in **Audio & Playback**:
   - Click **Play Soundscape** to start the progressive piano composition and watch active crystal/sculpture elements pulse in sync.
   - Use **Pause** / **Resume**, **Stop**, **Replay**, **Regenerate**, **Harmonic Scale**, **Tempo**, **Master Volume**, and **Space Reverb**.
4. **Navigate the Canvas:** Drag to pan, use **Zoom In** / **Zoom Out** (or `Ctrl/Cmd + Scroll`), and click **Reset View** or **Replay** anytime.
5. **Export Audio:** Click **Export WAV** to render and download `recursive-soundscapes-seed-<seed>.wav`.

---

## Project Structure

```text
├── ai-documentation/        # Complete AI prompt-and-response logs & AI_USAGE_INDEX.md
├── public/                  # Pre-rendered demo WAV assets
├── scripts/                 # Automated verification & audit scripts
├── src/
│   ├── app/                 # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/          # Header & studio panels (PresetSelector, VisualizationPanel, PlaybackPanel, ParameterPanel)
│   └── lib/
│       ├── audio/           # musicMapper.ts, audioEngine.ts, wavExporter.ts, types.ts
│       ├── presets/         # 4 preset definitions & active-preset matching
│       ├── recursion/       # Stage 2 branchingEngine.ts & types.ts
│       └── visualization/   # canvasRenderer.ts (Harmonic Sculptures & Zen Snow Crystal)
├── package.json
└── tsconfig.json
```

---

## AI Usage & Documentation

All AI prompts, architectural decisions, refinements, and verification results are documented in [`ai-documentation/`](./ai-documentation/) and indexed in [`ai-documentation/AI_USAGE_INDEX.md`](./ai-documentation/AI_USAGE_INDEX.md).
