import type { InstrumentId } from "./types";

export interface InstrumentDefinition {
  id: InstrumentId;
  name: string;
  soundfontName: string;
  kit: "MusyngKite";
  license: string;
  description: string;
}

/**
 * Real sampled General MIDI SoundFont instruments powered by `smplr` (MIT)
 * using MusyngKite SoundFont samples (CC BY-SA 3.0).
 */
export const INSTRUMENT_CATALOG: Record<InstrumentId, InstrumentDefinition> = {
  piano: {
    id: "piano",
    name: "Soft Piano",
    soundfontName: "acoustic_grand_piano",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Warm acoustic grand piano",
  },
  violin: {
    id: "violin",
    name: "Violin",
    soundfontName: "violin",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Expressive bowed solo violin",
  },
  cello: {
    id: "cello",
    name: "Cello",
    soundfontName: "cello",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Deep, resonant acoustic cello",
  },
  flute: {
    id: "flute",
    name: "Flute",
    soundfontName: "flute",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Airy concert flute",
  },
  harp: {
    id: "harp",
    name: "Harp",
    soundfontName: "orchestral_harp",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Delicate plucked orchestral harp",
  },
  celesta: {
    id: "celesta",
    name: "Celesta",
    soundfontName: "celesta",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Crystalline bell-like keyboard",
  },
  warm_strings: {
    id: "warm_strings",
    name: "Warm Strings",
    soundfontName: "string_ensemble_1",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Lush ambient string ensemble",
  },
  bell: {
    id: "bell",
    name: "Bell",
    soundfontName: "tubular_bells",
    kit: "MusyngKite",
    license: "CC BY-SA 3.0 (MusyngKite)",
    description: "Resonant orchestral tubular bells",
  },
};

export const INSTRUMENT_LIST: InstrumentDefinition[] = [
  INSTRUMENT_CATALOG.piano,
  INSTRUMENT_CATALOG.violin,
  INSTRUMENT_CATALOG.cello,
  INSTRUMENT_CATALOG.flute,
  INSTRUMENT_CATALOG.harp,
  INSTRUMENT_CATALOG.celesta,
  INSTRUMENT_CATALOG.warm_strings,
  INSTRUMENT_CATALOG.bell,
];
