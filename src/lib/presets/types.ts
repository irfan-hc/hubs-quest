import type { RecursionConfig } from "../recursion/types";
import type { InstrumentId, MusicalScale } from "../audio/types";

export type PresetId = "forest" | "cosmic" | "zen" | "dream";

export interface PresetDefinition {
  id: PresetId;
  name: string;
  tagline: string;
  description: string;
  accentColor: string; // Tailwind color class or hex for badge/border
  config: RecursionConfig;
  audio: {
    scale: MusicalScale;
    tempo: number;
    reverb: number;
    volume: number;
    primaryInstrument: InstrumentId;
    secondaryInstrument: InstrumentId | null;
    primaryVolume: number;
    secondaryVolume: number;
  };
}
