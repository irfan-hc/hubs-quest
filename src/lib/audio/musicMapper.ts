import type { BranchEvent, RecursionResult } from "../recursion/types";
import type {
  Composition,
  MusicalEvent,
  MusicalScale,
  MusicMapperOptions,
  ScaleDefinition,
} from "./types";

interface NoteInfo {
  name: string;
  midi: number;
  freq: number;
}

function midiToFreq(midi: number): number {
  return Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(2));
}

export const SCALES: Record<MusicalScale, ScaleDefinition> = {
  pentatonic: {
    key: "pentatonic",
    name: "C Major Pentatonic",
    description: "Serene, universally consonant, meditative harmony",
    intervals: [0, 2, 4, 7, 9],
    noteNames: ["C", "D", "E", "G", "A"],
  },
  dorian: {
    key: "dorian",
    name: "Dorian Twilight",
    description: "Deep, reflective and nocturnal harmonic palette",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    noteNames: ["D", "E", "F", "G", "A", "B", "C"],
  },
  lydian: {
    key: "lydian",
    name: "Lydian Celestial",
    description: "Dreamlike, uplifting cosmic overtone harmony",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    noteNames: ["F", "G", "A", "B", "C", "D", "E"],
  },
  ambient: {
    key: "ambient",
    name: "Ambient 432Hz Major 7th",
    description: "Lush, open space harmonic chords",
    intervals: [0, 4, 7, 11, 14],
    noteNames: ["C", "E", "G", "B", "D"],
  },
};

function buildScaleTable(scaleDef: ScaleDefinition): NoteInfo[] {
  const table: NoteInfo[] = [];
  const baseOffsets = scaleDef.intervals;
  const names = scaleDef.noteNames;

  for (let oct = 2; oct <= 5; oct++) {
    const baseMidi = (oct + 1) * 12;
    for (let i = 0; i < baseOffsets.length; i++) {
      const midi = baseMidi + baseOffsets[i];
      table.push({
        name: `${names[i]}${oct}`,
        midi,
        freq: midiToFreq(midi),
      });
    }
  }
  return table;
}

const SCALE_TABLES: Record<MusicalScale, NoteInfo[]> = {
  pentatonic: buildScaleTable(SCALES.pentatonic),
  dorian: buildScaleTable(SCALES.dorian),
  lydian: buildScaleTable(SCALES.lydian),
  ambient: buildScaleTable(SCALES.ambient),
};

function getScaleNote(
  scale: MusicalScale,
  octave: number,
  degreeIndex: number
): NoteInfo {
  const table = SCALE_TABLES[scale] || SCALE_TABLES.pentatonic;
  const scaleDef = SCALES[scale] || SCALES.pentatonic;
  const numDegrees = scaleDef.intervals.length;

  const clampedOctave = Math.max(2, Math.min(5, octave));
  const safeDegree = ((Math.floor(degreeIndex) % numDegrees) + numDegrees) % numDegrees;
  const targetIndex = (clampedOctave - 2) * numDegrees + safeDegree;
  return table[Math.min(targetIndex, table.length - 1)];
}

/**
 * Progressive Piano Composition Engine
 * Transforms Stage 2 BranchEvent data into a 4-phase emotional piano arc:
 *   Phase A (0–25%):  Peaceful opening (sparse piano notes, soft left-hand dyads)
 *   Phase B (25–55%): Musical development (arpeggios, motif growth, warmer movement)
 *   Phase C (55–82%): Emotional intensity (fuller voicings, wider register, expressive dynamics, subtle pad)
 *   Phase D (82–100%): Release & resolution (sparser phrasing, soft dynamics, peaceful tonic decay)
 */
export function mapRecursionToMusic(
  result: RecursionResult,
  options: MusicMapperOptions = {}
): Composition {
  const scaleKey: MusicalScale = options.scale ?? "pentatonic";
  const scaleDef = SCALES[scaleKey] || SCALES.pentatonic;
  const tempoBpm = options.tempoBpm ?? 60;
  const tempoMultiplier = Math.max(0.4, Math.min(2.5, tempoBpm / 60));

  // 24s base arc at 60 BPM so all 4 phases breathe naturally
  const baseDuration = options.totalDurationSec ? Math.max(options.totalDurationSec, 22.0) : 24.0;
  const scaledTotalDuration = Number((baseDuration / tempoMultiplier).toFixed(2));
  const maxVoices = Math.min(options.maxSimultaneousVoices ?? 8, 8);
  const numDegrees = scaleDef.intervals.length;
  const initialLength = Math.max(result.config.initialLength, 10);

  const branches = result.branches;
  if (branches.length === 0) {
    return {
      events: [],
      totalDuration: scaledTotalDuration,
      scaleKey,
      scaleName: scaleDef.name,
      tempoBpm,
      activeVoicesCount: 0,
      maxSimultaneousVoices: maxVoices,
    };
  }

  // Derive a 4-note melodic motif deterministically from early branches
  const motif: number[] = [];
  for (let i = 0; i < 4; i++) {
    const b = branches[Math.min(i, branches.length - 1)];
    const deg = Math.abs(Math.round((b.angle + Math.PI) * 2 + b.depth)) % numDegrees;
    motif.push(deg);
  }

  // 4-phase harmonic chord roots (scale degrees): I -> IV/iii -> V/iv -> I
  const phaseChordRoots = [
    0,
    Math.min(3, numDegrees - 1),
    Math.min(2, numDegrees - 1),
    Math.min(4, numDegrees - 1),
    0,
  ];

  const rawEvents: MusicalEvent[] = [];

  // Helper to pick a valid BranchEvent deterministically for 1:1 visual sync
  const getBranch = (idx: number): BranchEvent =>
    branches[((idx % branches.length) + branches.length) % branches.length];

  // 1. ROOT OPENING (depth 0 branch): Soft low piano tonic + subtle warm foundation
  const rootBranch = branches[0];
  const rootNote = getScaleNote(scaleKey, 2, 0);
  rawEvents.push({
    id: `audio-evt-${rootBranch.id}-bass`,
    branchId: rootBranch.id,
    depth: 0,
    pitch: rootNote.name,
    frequency: rootNote.freq,
    startTime: 0,
    duration: Number((4.0 / tempoMultiplier).toFixed(3)),
    velocity: 0.50,
    pan: -0.15,
    voice: "piano",
    role: "primary",
  });

  // 2. PHASE-BY-PHASE MUSICAL PHRASING DRIVEN BY RECURSIVE EVENTS
  interface PhraseSlot {
    t: number; // normalized 0..1
    phase: "A" | "B" | "C" | "D";
    chordIndex: number;
    arpeggioCount: number;
    melodyOctave: number;
    velBase: number;
    addPadSwell?: boolean;
  }

  const slots: PhraseSlot[] = [
    // Phase A: Peaceful opening (0.04 .. 0.24)
    { t: 0.04, phase: "A", chordIndex: 0, arpeggioCount: 1, melodyOctave: 4, velBase: 0.30 },
    { t: 0.13, phase: "A", chordIndex: 0, arpeggioCount: 2, melodyOctave: 4, velBase: 0.33 },
    { t: 0.21, phase: "A", chordIndex: 1, arpeggioCount: 2, melodyOctave: 4, velBase: 0.36 },

    // Phase B: Musical development (0.29 .. 0.54)
    { t: 0.29, phase: "B", chordIndex: 1, arpeggioCount: 3, melodyOctave: 4, velBase: 0.44 },
    { t: 0.38, phase: "B", chordIndex: 2, arpeggioCount: 3, melodyOctave: 4, velBase: 0.48 },
    { t: 0.47, phase: "B", chordIndex: 1, arpeggioCount: 4, melodyOctave: 4, velBase: 0.52 },

    // Phase C: Emotional intensity (0.56 .. 0.80)
    { t: 0.56, phase: "C", chordIndex: 3, arpeggioCount: 4, melodyOctave: 4, velBase: 0.64, addPadSwell: true },
    { t: 0.64, phase: "C", chordIndex: 2, arpeggioCount: 5, melodyOctave: 5, velBase: 0.72 },
    { t: 0.72, phase: "C", chordIndex: 3, arpeggioCount: 5, melodyOctave: 5, velBase: 0.76, addPadSwell: true },

    // Phase D: Release & resolution (0.83 .. 0.94)
    { t: 0.83, phase: "D", chordIndex: 1, arpeggioCount: 2, melodyOctave: 4, velBase: 0.42 },
    { t: 0.90, phase: "D", chordIndex: 4, arpeggioCount: 1, melodyOctave: 4, velBase: 0.30 },
  ];

  // Scale richness slightly with recursive complexity (more branches -> slightly fuller Phase B/C)
  const densityBoost = Math.min(1, branches.length / 127);

  for (let sIdx = 0; sIdx < slots.length; sIdx++) {
    const slot = slots[sIdx];
    const slotStartSec = (slot.t * baseDuration) / tempoMultiplier;
    const chordRoot = phaseChordRoots[slot.chordIndex];

    // Pick a branch corresponding to this point in creation order
    const orderIdx = Math.floor(slot.t * (branches.length - 1));
    const anchorBranch = getBranch(orderIdx);
    const lenRatio = Math.max(0.25, Math.min(1.0, anchorBranch.length / initialLength));

    // Left-hand piano chord voicing (root + fifth; Phase C adds octave/third)
    const bassNote = getScaleNote(scaleKey, 2, chordRoot);
    const fifthNote = getScaleNote(scaleKey, 3, chordRoot + Math.min(2, numDegrees - 1));

    rawEvents.push({
      id: `audio-evt-${anchorBranch.id}-lh1-${sIdx}`,
      branchId: anchorBranch.id,
      depth: anchorBranch.depth,
      pitch: bassNote.name,
      frequency: bassNote.freq,
      startTime: Number(slotStartSec.toFixed(3)),
      duration: Number(((slot.phase === "D" ? 3.8 : 2.8) / tempoMultiplier).toFixed(3)),
      velocity: Number((slot.velBase * 0.88).toFixed(3)),
      pan: -0.22,
      voice: "piano",
      role: "secondary",
    });

    if (slot.phase !== "A" || sIdx > 0) {
      rawEvents.push({
        id: `audio-evt-${anchorBranch.id}-lh2-${sIdx}`,
        branchId: anchorBranch.id,
        depth: anchorBranch.depth,
        pitch: fifthNote.name,
        frequency: fifthNote.freq,
        startTime: Number((slotStartSec + 0.08 / tempoMultiplier).toFixed(3)),
        duration: Number((2.5 / tempoMultiplier).toFixed(3)),
        velocity: Number((slot.velBase * 0.76).toFixed(3)),
        pan: -0.1,
        voice: "piano",
        role: "secondary",
      });
    }

    // Subtle secondary warm pad swell ONLY in Phase C to support emotional peak
    if (slot.addPadSwell) {
      const padBranch = getBranch(orderIdx + 1);
      const padNote = getScaleNote(scaleKey, 3, chordRoot);
      rawEvents.push({
        id: `audio-evt-${padBranch.id}-pad-${sIdx}`,
        branchId: padBranch.id,
        depth: padBranch.depth,
        pitch: padNote.name,
        frequency: padNote.freq,
        startTime: Number(slotStartSec.toFixed(3)),
        duration: Number((3.6 / tempoMultiplier).toFixed(3)),
        velocity: 0.24,
        pan: 0,
        voice: "pad",
        role: "secondary",
      });
    }

    // Right-hand piano melody / arpeggio phrase driven by recursive branches
    const noteCount =
      slot.phase === "C"
        ? Math.min(5, slot.arpeggioCount + (densityBoost > 0.5 ? 1 : 0))
        : slot.arpeggioCount;
    const stepGapSec = (slot.phase === "A" ? 0.55 : slot.phase === "C" ? 0.28 : 0.38) / tempoMultiplier;

    for (let n = 0; n < noteCount; n++) {
      const b = getBranch(orderIdx + n + 1);
      // Motif variation guided by branch angle & pan
      const motifBase = motif[(sIdx + n) % motif.length];
      const angleShift = Math.sin(b.angle * 2) > 0.4 ? 1 : Math.sin(b.angle * 2) < -0.4 ? -1 : 0;
      const noteDegree = chordRoot + motifBase + (slot.phase === "D" ? 0 : angleShift);

      // Keep melody in expressive octave 4 (with octave 5 peak on climax notes in Phase C)
      const oct =
        slot.melodyOctave === 5 && (n === noteCount - 1 || n === Math.floor(noteCount / 2))
          ? 5
          : 4;
      const melNote = getScaleNote(scaleKey, oct, noteDegree);

      const noteStart = slotStartSec + (n + 0.5) * stepGapSec;
      if (noteStart >= scaledTotalDuration - 0.8) break;

      const noteDur =
        slot.phase === "D"
          ? (3.2 + lenRatio * 0.8) / tempoMultiplier
          : (1.8 + lenRatio * 0.9) / tempoMultiplier;

      const dynamicCurve =
        slot.phase === "C" && n === noteCount - 1 ? 1.08 : 0.92 + (n % 2) * 0.08;

      rawEvents.push({
        id: `audio-evt-${b.id}-rh-${sIdx}-${n}`,
        branchId: b.id,
        depth: Math.max(3, b.depth),
        pitch: melNote.name,
        frequency: melNote.freq,
        startTime: Number(noteStart.toFixed(3)),
        duration: Number(noteDur.toFixed(3)),
        velocity: Number(Math.min(0.85, slot.velBase * dynamicCurve).toFixed(3)),
        pan: Number(Math.max(-0.45, Math.min(0.45, 0.12 + b.pan * 0.35)).toFixed(2)),
        voice: "piano",
        role: "primary",
      });
    }
  }

  // Sort & enforce polyphony cap
  rawEvents.sort((a, b) => a.startTime - b.startTime);

  const filteredEvents: MusicalEvent[] = [];
  const activeWindows: { start: number; end: number }[] = [];

  for (const evt of rawEvents) {
    const evtEnd = evt.startTime + evt.duration;
    for (let i = activeWindows.length - 1; i >= 0; i--) {
      if (activeWindows[i].end <= evt.startTime) {
        activeWindows.splice(i, 1);
      }
    }
    if (activeWindows.length < maxVoices) {
      filteredEvents.push(evt);
      activeWindows.push({ start: evt.startTime, end: evtEnd });
    }
  }

  return {
    events: filteredEvents,
    totalDuration: scaledTotalDuration,
    scaleKey,
    scaleName: scaleDef.name,
    tempoBpm,
    activeVoicesCount: filteredEvents.length,
    maxSimultaneousVoices: maxVoices,
  };
}
