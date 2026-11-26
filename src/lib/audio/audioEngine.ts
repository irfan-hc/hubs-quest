import { CacheStorage, Soundfont } from "smplr";
import { INSTRUMENT_CATALOG } from "./instruments";
import type {
  Composition,
  InstrumentId,
  InstrumentLoadState,
  MusicalEvent,
  PlaybackState,
} from "./types";

/**
 * WebAudioSynthesizer
 * Hybrid Sampled-Instrument & Web Audio Synthesis Engine:
 * - Lazy-loads real General MIDI SoundFont instruments via `smplr` (MusyngKite)
 * - Supports independent Primary + Secondary instruments & volumes (with disable option)
 * - Falls back gracefully to built-in Web Audio synthesis if sample loading fails
 * - Supports Play, Pause, Resume, Stop, Replay, live instrument switching, and 1:1 branch sync
 */
export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private primaryBusGain: GainNode | null = null;
  private secondaryBusGain: GainNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  // Reverb & delay bus
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private wetGain: GainNode | null = null;

  // Active fallback voice nodes for clean cancellation
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private scheduleTimerId: NodeJS.Timeout | null = null;

  // Sampled Soundfont instances (cached lazily by role + instrumentId)
  private storage: ReturnType<typeof CacheStorage> | null = null;
  private primaryInstrumentId: InstrumentId = "piano";
  private secondaryInstrumentId: InstrumentId | null = "celesta";
  private primaryVolume: number = 0.85;
  private secondaryVolume: number = 0.65;

  private primarySampler: Soundfont | null = null;
  private secondarySampler: Soundfont | null = null;
  private primaryLoadedId: InstrumentId | null = null;
  private secondaryLoadedId: InstrumentId | null = null;
  private loadGeneration: number = 0;

  // Playback state & timeline tracking
  private state: PlaybackState = "idle";
  private currentComposition: Composition | null = null;
  private playbackStartTime: number = 0;
  private pausedAtSec: number = 0;
  private currentVolume: number = 0.8;
  private currentReverb: number = 0.65;

  // Callbacks
  private onActiveBranchesChange: ((branchIds: Set<string>) => void) | null = null;
  private onStateChange: ((state: PlaybackState) => void) | null = null;
  private onInstrumentStatusChange:
    | ((state: InstrumentLoadState, message: string) => void)
    | null = null;
  private syncRafId: number | null = null;

  constructor() {
    this.syncLoop = this.syncLoop.bind(this);
  }

  public setOnActiveBranchesChange(cb: (branchIds: Set<string>) => void): void {
    this.onActiveBranchesChange = cb;
  }

  public setOnStateChange(cb: (state: PlaybackState) => void): void {
    this.onStateChange = cb;
  }

  public setOnInstrumentStatusChange(
    cb: (state: InstrumentLoadState, message: string) => void
  ): void {
    this.onInstrumentStatusChange = cb;
  }

  private updateState(newState: PlaybackState): void {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  private updateInstrumentStatus(state: InstrumentLoadState, message: string): void {
    if (this.onInstrumentStatusChange) {
      this.onInstrumentStatusChange(state, message);
    }
  }

  /**
   * Initializes and resumes AudioContext in accordance with browser autoplay policies.
   */
  public async ensureAudioContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      this.ctx = new AudioCtxClass();
      this.setupAudioGraph();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  private setupAudioGraph(): void {
    if (!this.ctx) return;

    // 1. Master Output Limiter
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-6, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(14, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(10, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.18, this.ctx.currentTime);
    this.limiter.connect(this.ctx.destination);

    // 2. Master Warmth Lowpass Filter
    this.warmthFilter = this.ctx.createBiquadFilter();
    this.warmthFilter.type = "lowpass";
    this.warmthFilter.frequency.setValueAtTime(4800, this.ctx.currentTime);
    this.warmthFilter.Q.setValueAtTime(0.5, this.ctx.currentTime);
    this.warmthFilter.connect(this.limiter);

    // 3. Master Gain Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.warmthFilter);

    // 4. Warm Ambient Space Delay / Reverb Bus
    this.delayNode = this.ctx.createDelay(1.5);
    this.delayNode.delayTime.setValueAtTime(0.42, this.ctx.currentTime);

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.32, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = "lowpass";
    this.delayFilter.frequency.setValueAtTime(1350, this.ctx.currentTime);

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.setValueAtTime(this.currentReverb * 0.4, this.ctx.currentTime);

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.wetGain);
    this.wetGain.connect(this.masterGain);

    // 5. Dedicated Primary & Secondary Instrument Buses
    this.primaryBusGain = this.ctx.createGain();
    this.primaryBusGain.gain.setValueAtTime(this.primaryVolume, this.ctx.currentTime);
    this.primaryBusGain.connect(this.masterGain);
    this.primaryBusGain.connect(this.delayNode);

    this.secondaryBusGain = this.ctx.createGain();
    this.secondaryBusGain.gain.setValueAtTime(this.secondaryVolume, this.ctx.currentTime);
    this.secondaryBusGain.connect(this.masterGain);
    this.secondaryBusGain.connect(this.delayNode);
  }

  /**
   * Lazily loads only the currently selected primary & secondary Soundfont instruments.
   */
  public async ensureInstrumentsLoaded(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!this.primaryBusGain || !this.secondaryBusGain) return;

    if (!this.storage && typeof window !== "undefined") {
      try {
        this.storage = CacheStorage("recursive-soundscapes-sf");
      } catch {
        this.storage = null;
      }
    }

    const gen = ++this.loadGeneration;
    const tasks: Promise<void>[] = [];
    const loadingNames: string[] = [];

    if (this.primaryLoadedId !== this.primaryInstrumentId || !this.primarySampler) {
      if (this.primarySampler) {
        try {
          this.primarySampler.stop();
          this.primarySampler.disconnect();
        } catch {}
        this.primarySampler = null;
        this.primaryLoadedId = null;
      }
      const def = INSTRUMENT_CATALOG[this.primaryInstrumentId];
      loadingNames.push(def.name);
      const sampler = new Soundfont(ctx, {
        instrument: def.soundfontName,
        kit: def.kit,
        destination: this.primaryBusGain,
        volume: 100,
        ...(this.storage ? { storage: this.storage } : {}),
      });
      tasks.push(
        sampler.load.then(() => {
          if (this.loadGeneration !== gen) {
            try {
              sampler.disconnect();
            } catch {}
            return;
          }
          this.primarySampler = sampler;
          this.primaryLoadedId = def.id;
        })
      );
    }

    if (this.secondaryInstrumentId === null) {
      if (this.secondarySampler) {
        try {
          this.secondarySampler.stop();
          this.secondarySampler.disconnect();
        } catch {}
        this.secondarySampler = null;
        this.secondaryLoadedId = null;
      }
    } else if (
      this.secondaryLoadedId !== this.secondaryInstrumentId ||
      !this.secondarySampler
    ) {
      if (this.secondarySampler) {
        try {
          this.secondarySampler.stop();
          this.secondarySampler.disconnect();
        } catch {}
        this.secondarySampler = null;
        this.secondaryLoadedId = null;
      }
      const def = INSTRUMENT_CATALOG[this.secondaryInstrumentId];
      loadingNames.push(def.name);
      const sampler = new Soundfont(ctx, {
        instrument: def.soundfontName,
        kit: def.kit,
        destination: this.secondaryBusGain,
        volume: 100,
        ...(this.storage ? { storage: this.storage } : {}),
      });
      tasks.push(
        sampler.load.then(() => {
          if (this.loadGeneration !== gen) {
            try {
              sampler.disconnect();
            } catch {}
            return;
          }
          this.secondarySampler = sampler;
          this.secondaryLoadedId = def.id;
        })
      );
    }

    if (tasks.length === 0) {
      this.updateInstrumentStatus("ready", "Samples Ready");
      return;
    }

    this.updateInstrumentStatus("loading", `Loading ${loadingNames.join(" & ")}...`);
    try {
      await Promise.all(tasks);
      if (this.loadGeneration === gen) {
        const activeList = [
          INSTRUMENT_CATALOG[this.primaryInstrumentId].name,
          this.secondaryInstrumentId
            ? INSTRUMENT_CATALOG[this.secondaryInstrumentId].name
            : null,
        ]
          .filter(Boolean)
          .join(" + ");
        this.updateInstrumentStatus("ready", `${activeList} Ready`);
      }
    } catch (err) {
      console.warn("Sample loading failed, falling back to Web Audio synth:", err);
      if (this.loadGeneration === gen) {
        this.updateInstrumentStatus("fallback", "Using Synth Fallback (Offline)");
      }
    }
  }

  public async setInstruments(
    primary: InstrumentId,
    secondary: InstrumentId | null
  ): Promise<void> {
    const changed =
      this.primaryInstrumentId !== primary ||
      this.secondaryInstrumentId !== secondary;
    this.primaryInstrumentId = primary;
    this.secondaryInstrumentId = secondary;

    if (!changed) return;

    const wasPlaying = this.state === "playing";
    const resumeOffset = wasPlaying ? this.getCurrentTime() : 0;

    if (wasPlaying) {
      this.stopAudioNodesOnly();
    }

    if (this.ctx) {
      await this.ensureInstrumentsLoaded();
    }

    if (wasPlaying && this.currentComposition) {
      this.pausedAtSec = resumeOffset;
      this.state = "paused";
      await this.resume();
    }
  }

  public setPrimaryVolume(volNorm: number): void {
    this.primaryVolume = Math.max(0, Math.min(1, volNorm));
    if (this.ctx && this.primaryBusGain) {
      this.primaryBusGain.gain.setValueAtTime(this.primaryVolume, this.ctx.currentTime);
    }
  }

  public setSecondaryVolume(volNorm: number): void {
    this.secondaryVolume = Math.max(0, Math.min(1, volNorm));
    if (this.ctx && this.secondaryBusGain) {
      this.secondaryBusGain.gain.setValueAtTime(
        this.secondaryVolume,
        this.ctx.currentTime
      );
    }
  }

  /**
   * Starts or restarts playback of a composition from 0.0 seconds.
   * Prevents duplicate instances.
   */
  public async playComposition(
    composition: Composition,
    onComplete?: () => void
  ): Promise<void> {
    const ctx = await this.ensureAudioContext();
    await this.ensureInstrumentsLoaded();

    this.stopAudioNodesOnly();

    this.currentComposition = composition;
    this.pausedAtSec = 0;
    this.updateState("playing");

    const now = ctx.currentTime + 0.08;
    this.playbackStartTime = now;

    for (const evt of composition.events) {
      const scheduledStart = now + evt.startTime;
      this.scheduleEvent(ctx, evt, scheduledStart);
    }

    this.startSyncLoop();

    const remainingSec = composition.totalDuration + 0.8;
    this.scheduleTimerId = setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, remainingSec * 1000);
  }

  public pause(): void {
    if (this.state !== "playing" || !this.ctx || !this.currentComposition) {
      return;
    }

    const elapsed = Math.max(0, this.ctx.currentTime - this.playbackStartTime);
    this.pausedAtSec = Math.min(elapsed, this.currentComposition.totalDuration);

    this.stopAudioNodesOnly();
    this.stopSyncLoop();
    this.updateState("paused");
  }

  public async resume(onComplete?: () => void): Promise<void> {
    if (this.state !== "paused" || !this.currentComposition) {
      return;
    }

    const ctx = await this.ensureAudioContext();
    await this.ensureInstrumentsLoaded();
    this.updateState("playing");

    const now = ctx.currentTime + 0.06;
    this.playbackStartTime = now - this.pausedAtSec;

    for (const evt of this.currentComposition.events) {
      if (evt.startTime + evt.duration > this.pausedAtSec) {
        const delayOffset = Math.max(0, evt.startTime - this.pausedAtSec);
        const scheduledStart = now + delayOffset;
        this.scheduleEvent(ctx, evt, scheduledStart);
      }
    }

    this.startSyncLoop();

    const remainingSec = Math.max(
      0.5,
      this.currentComposition.totalDuration - this.pausedAtSec + 0.8
    );
    this.scheduleTimerId = setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, remainingSec * 1000);
  }

  public stop(): void {
    this.stopAudioNodesOnly();
    this.stopSyncLoop();
    this.pausedAtSec = 0;
    this.updateState("stopped");
  }

  public async replay(onComplete?: () => void): Promise<void> {
    if (!this.currentComposition) return;
    this.stop();
    await this.playComposition(this.currentComposition, onComplete);
  }

  private stopAudioNodesOnly(): void {
    if (this.scheduleTimerId) {
      clearTimeout(this.scheduleTimerId);
      this.scheduleTimerId = null;
    }

    if (this.primarySampler) {
      try {
        this.primarySampler.stop();
      } catch {}
    }
    if (this.secondarySampler) {
      try {
        this.secondarySampler.stop();
      } catch {}
    }

    const oldOscillators = this.activeOscillators;
    const oldGainNodes = this.activeGainNodes;
    this.activeOscillators = [];
    this.activeGainNodes = [];

    if (oldOscillators.length === 0 && oldGainNodes.length === 0) {
      return;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      for (const g of oldGainNodes) {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.linearRampToValueAtTime(0.0001, now + 0.03);
        } catch {}
      }

      setTimeout(() => {
        for (const osc of oldOscillators) {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }
      }, 40);
    }
  }

  private startSyncLoop(): void {
    if (this.syncRafId) {
      cancelAnimationFrame(this.syncRafId);
    }
    this.syncRafId = requestAnimationFrame(this.syncLoop);
  }

  private stopSyncLoop(): void {
    if (this.syncRafId) {
      cancelAnimationFrame(this.syncRafId);
      this.syncRafId = null;
    }
    if (this.onActiveBranchesChange) {
      this.onActiveBranchesChange(new Set());
    }
  }

  private syncLoop(): void {
    if (this.state !== "playing" || !this.ctx || !this.currentComposition) {
      return;
    }

    const curTime = this.ctx.currentTime - this.playbackStartTime;
    const activeSet = new Set<string>();

    for (const evt of this.currentComposition.events) {
      if (curTime >= evt.startTime && curTime < evt.startTime + evt.duration) {
        activeSet.add(evt.branchId);
      }
    }

    if (this.onActiveBranchesChange) {
      this.onActiveBranchesChange(activeSet);
    }

    this.syncRafId = requestAnimationFrame(this.syncLoop);
  }

  /**
   * Schedules a single MusicalEvent onto the selected sampled Soundfont instrument,
   * or falls back to built-in Web Audio synthesis if samples could not be loaded.
   */
  private scheduleEvent(
    ctx: AudioContext,
    evt: MusicalEvent,
    startTime: number
  ): void {
    const role = evt.role ?? "primary";

    // If secondary instrument is disabled, skip secondary-only accompaniment notes
    if (role === "secondary" && this.secondaryInstrumentId === null) {
      return;
    }

    const sampler =
      role === "secondary" ? this.secondarySampler : this.primarySampler;

    if (sampler) {
      const midiVelocity = Math.max(12, Math.min(120, Math.round(evt.velocity * 115)));
      sampler.start({
        note: evt.pitch,
        velocity: midiVelocity,
        time: startTime,
        duration: Math.max(0.4, evt.duration),
      });
      return;
    }

    // Fallback to built-in synthesis if Soundfont samples failed to load
    const targetBus =
      role === "secondary"
        ? this.secondaryBusGain || this.masterGain
        : this.primaryBusGain || this.masterGain;
    if (!targetBus) return;

    let panner: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(evt.pan, startTime);
      panner.connect(targetBus);
    }

    const dest: AudioNode = panner || targetBus;
    this.renderFallbackSynthVoice(ctx, evt, startTime, dest);
  }

  private renderFallbackSynthVoice(
    ctx: AudioContext,
    evt: MusicalEvent,
    t: number,
    dest: AudioNode
  ): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(evt.frequency, t);
    osc2.frequency.setValueAtTime(evt.frequency * 2.0006, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(3200, evt.frequency * 3.0), t);

    const dur = Math.max(evt.duration, 1.0);
    const peakGain = evt.velocity * 0.36;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.08);
    osc2.stop(t + dur + 0.08);

    this.activeOscillators.push(osc1, osc2);
    this.activeGainNodes.push(gain);
  }

  public setVolume(volumeNorm: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volumeNorm));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public setReverb(reverbNorm: number): void {
    this.currentReverb = Math.max(0, Math.min(1, reverbNorm));
    if (this.ctx && this.wetGain) {
      this.wetGain.gain.setValueAtTime(this.currentReverb * 0.4, this.ctx.currentTime);
    }
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public getCurrentTime(): number {
    if (this.state === "paused") {
      return this.pausedAtSec;
    }
    if (this.state === "playing" && this.ctx) {
      return Math.max(0, this.ctx.currentTime - this.playbackStartTime);
    }
    return 0;
  }
}

export const audioEngine =
  typeof window !== "undefined" ? new WebAudioSynthesizer() : (null as any);
