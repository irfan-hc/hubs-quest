import type { PresetDefinition, PresetId } from "./types";

export const PRESETS: Record<PresetId, PresetDefinition> = {
  forest: {
    id: "forest",
    name: "Forest",
    tagline: "Organic & Earthy",
    description: "Natural organic branching, gentle variation, relaxed tempo, and reflective Dorian harmonics.",
    accentColor: "emerald",
    config: {
      patternType: "organic",
      maxDepth: 6,
      branchAngle: 24,
      initialLength: 105,
      lengthRatio: 0.74,
      angleVariation: 0.18,
      lengthVariation: 0.12,
      seed: 40401,
    },
    audio: {
      scale: "dorian",
      tempo: 56,
      reverb: 55,
      volume: 80,
      primaryInstrument: "flute",
      secondaryInstrument: "harp",
      primaryVolume: 85,
      secondaryVolume: 75,
    },
  },
  cosmic: {
    id: "cosmic",
    name: "Cosmic",
    tagline: "Expansive & Luminous",
    description: "Wide spatial exploration, deep branching filaments, sparkling Lydian celestial tones, and lush reverb.",
    accentColor: "cyan",
    config: {
      patternType: "spiral",
      maxDepth: 6,
      branchAngle: 38,
      initialLength: 115,
      lengthRatio: 0.68,
      angleVariation: 0.22,
      lengthVariation: 0.15,
      seed: 77707,
    },
    audio: {
      scale: "lydian",
      tempo: 68,
      reverb: 75,
      volume: 80,
      primaryInstrument: "warm_strings",
      secondaryInstrument: "piano",
      primaryVolume: 80,
      secondaryVolume: 75,
    },
  },
  zen: {
    id: "zen",
    name: "Zen",
    tagline: "Balanced & Minimal",
    description: "Harmonious balanced geometry, reduced visual density, slow tranquil pacing, and pure pentatonic bells.",
    accentColor: "teal",
    config: {
      patternType: "crystal",
      maxDepth: 5,
      branchAngle: 22,
      initialLength: 110,
      lengthRatio: 0.70,
      angleVariation: 0.08,
      lengthVariation: 0.06,
      seed: 10808,
    },
    audio: {
      scale: "pentatonic",
      tempo: 46,
      reverb: 60,
      volume: 80,
      primaryInstrument: "piano",
      secondaryInstrument: "celesta",
      primaryVolume: 85,
      secondaryVolume: 65,
    },
  },
  dream: {
    id: "dream",
    name: "Dream",
    tagline: "Flowing & Ethereal",
    description: "Soft expressive curves, ethereal organic drift, and meditative 432Hz ambient chordal textures.",
    accentColor: "purple",
    config: {
      patternType: "coral",
      maxDepth: 6,
      branchAngle: 32,
      initialLength: 112,
      lengthRatio: 0.72,
      angleVariation: 0.26,
      lengthVariation: 0.18,
      seed: 91919,
    },
    audio: {
      scale: "ambient",
      tempo: 50,
      reverb: 80,
      volume: 80,
      primaryInstrument: "violin",
      secondaryInstrument: "warm_strings",
      primaryVolume: 85,
      secondaryVolume: 70,
    },
  },
};

export const PRESET_LIST: PresetDefinition[] = [
  PRESETS.zen,
  PRESETS.forest,
  PRESETS.cosmic,
  PRESETS.dream,
];

/**
 * Checks if current parameters match a preset definition exactly.
 */
export function matchActivePreset(
  config: {
    patternType?: string;
    maxDepth: number;
    branchAngle: number;
    initialLength: number;
    lengthRatio: number;
    angleVariation?: number;
    lengthVariation?: number;
    seed?: number | string;
  },
  audio: {
    scale: string;
    tempo: number;
    reverb: number;
  }
): PresetId | "custom" {
  for (const preset of PRESET_LIST) {
    const pc = preset.config;
    const pa = preset.audio;

    const configMatches =
      (pc.patternType ?? "binary") === (config.patternType ?? "binary") &&
      pc.maxDepth === config.maxDepth &&
      pc.branchAngle === config.branchAngle &&
      pc.initialLength === config.initialLength &&
      Math.abs(pc.lengthRatio - config.lengthRatio) < 0.001 &&
      Math.abs((pc.angleVariation ?? 0) - (config.angleVariation ?? 0)) < 0.001 &&
      Math.abs((pc.lengthVariation ?? 0) - (config.lengthVariation ?? 0)) < 0.001 &&
      String(pc.seed) === String(config.seed);

    const audioMatches =
      pa.scale === audio.scale &&
      pa.tempo === audio.tempo &&
      Math.abs(pa.reverb - audio.reverb) < 1;

    if (configMatches && audioMatches) {
      return preset.id;
    }
  }

  return "custom";
}
