import { BranchEvent, RecursionResult } from "../recursion/types";

export type VoiceType = "piano" | "pad" | "bell" | "pluck";

export type MusicalScale = "pentatonic" | "dorian" | "lydian" | "ambient";

export type PlaybackState = "idle" | "playing" | "paused" | "stopped";

export type ActiveBranchCallback = (branchIds: Set<string>) => void;

export interface MusicalEvent {
  id: string;
  branchId: string;
  depth: number;
  pitch: string; // e.g. "C3", "G4", "A5"
  frequency: number; // in Hz
  startTime: number; // in seconds from composition start
  duration: number; // in seconds
  velocity: number; // 0.0 to 1.0 (gain amplitude)
  pan: number; // -1.0 (left) to +1.0 (right)
  voice: VoiceType; // pad, bell, pluck
}

export interface ScaleDefinition {
  name: string;
  key: MusicalScale;
  description: string;
  intervals: number[]; // semitone offsets from root
  noteNames: string[];
}

export interface MusicMapperOptions {
  scale?: MusicalScale;
  rootMidi?: number; // default: 60 (Middle C)
  totalDurationSec?: number; // total composition duration (e.g., 9.0s)
  tempoBpm?: number; // tempo in BPM (default: 60)
  maxSimultaneousVoices?: number; // voice cap to prevent density clutter (default: 8)
}

export interface Composition {
  events: MusicalEvent[];
  totalDuration: number;
  scaleKey: MusicalScale;
  scaleName: string;
  tempoBpm: number;
  activeVoicesCount: number;
  maxSimultaneousVoices: number;
}
