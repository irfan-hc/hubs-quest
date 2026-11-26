import type {
  ActiveBranchCallback,
  Composition,
  MusicalEvent,
  PlaybackState,
} from "./types";

/**
 * WebAudioSynthesizer
 * Production-ready Web Audio API procedural synthesis engine with support for:
 * - Play, Pause, Resume, Stop, Replay
 * - Synchronized active branch event tracking
 * - Smooth master gain limiting and anti-clipping
 * - Zero external dependencies
 */
export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  // Reverb & delay bus
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private wetGain: GainNode | null = null;

  // Active voice nodes for clean cancellation
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private scheduleTimerId: NodeJS.Timeout | null = null;

  // Playback state & timeline tracking
  private state: PlaybackState = "idle";
  private currentComposition: Composition | null = null;
  private playbackStartTime: number = 0; // audioCtx.currentTime when playback started
  private pausedAtSec: number = 0; // seconds elapsed into composition when paused
  private currentVolume: number = 0.8;
  private currentReverb: number = 0.65;

  // Callbacks
  private onActiveBranchesChange: ((branchIds: Set<string>) => void) | null = null;
  private onStateChange: ((state: PlaybackState) => void) | null = null;
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

  private updateState(newState: PlaybackState): void {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
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

    // 1. Master Output Limiter to strictly prevent digital clipping
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-6, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(14, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(10, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.18, this.ctx.currentTime);
    this.limiter.connect(this.ctx.destination);

    // 2. Master Warmth Lowpass Filter (softens any harsh upper harmonics)
    this.warmthFilter = this.ctx.createBiquadFilter();
    this.warmthFilter.type = "lowpass";
    this.warmthFilter.frequency.setValueAtTime(3600, this.ctx.currentTime);
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
    this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = "lowpass";
    this.delayFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.setValueAtTime(this.currentReverb * 0.42, this.ctx.currentTime);

    // Feedback loop: delay -> filter -> feedback gain -> delay
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Wet return into master gain
    this.delayFilter.connect(this.wetGain);
    this.wetGain.connect(this.masterGain);
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

    // Prevent duplicate overlapping playback
    this.stopAudioNodesOnly();

    this.currentComposition = composition;
    this.pausedAtSec = 0;
    this.updateState("playing");

    const now = ctx.currentTime + 0.08;
    this.playbackStartTime = now;

    // Schedule events from 0.0s
    for (const evt of composition.events) {
      const scheduledStart = now + evt.startTime;
      this.synthesizeEvent(ctx, evt, scheduledStart);
    }

    this.startSyncLoop();

    const remainingSec = composition.totalDuration + 0.8;
    this.scheduleTimerId = setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, remainingSec * 1000);
  }

  /**
   * Pauses the current composition playback cleanly without restarting.
   */
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

  /**
   * Resumes playback from the exact paused second offset.
   */
  public async resume(onComplete?: () => void): Promise<void> {
    if (this.state !== "paused" || !this.currentComposition) {
      return;
    }

    const ctx = await this.ensureAudioContext();
    this.updateState("playing");

    const now = ctx.currentTime + 0.06;
    this.playbackStartTime = now - this.pausedAtSec;

    // Schedule remaining events whose start time >= pausedAtSec
    for (const evt of this.currentComposition.events) {
      if (evt.startTime + evt.duration > this.pausedAtSec) {
        // If event started before pausedAtSec but sustains past it, or starts after:
        const delayOffset = Math.max(0, evt.startTime - this.pausedAtSec);
        const scheduledStart = now + delayOffset;
        this.synthesizeEvent(ctx, evt, scheduledStart);
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

  /**
   * Stops playback completely, resets timeline to 0, and silences all nodes.
   */
  public stop(): void {
    this.stopAudioNodesOnly();
    this.stopSyncLoop();
    this.pausedAtSec = 0;
    this.updateState("stopped");
  }

  /**
   * Replays composition from the beginning.
   */
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

  /**
   * High-precision synchronization loop tracking active sounding branches.
   */
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
    // Clear all branch highlights
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
   * Synthesizes an individual musical event into appropriate voice timbre.
   */
  private synthesizeEvent(
    ctx: AudioContext,
    evt: MusicalEvent,
    startTime: number
  ): void {
    if (!this.masterGain) return;

    let panner: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(evt.pan, startTime);
      panner.connect(this.masterGain);
      if (this.delayNode) {
        panner.connect(this.delayNode);
      }
    }

    const outputDestination: AudioNode = panner || this.masterGain;

    if (evt.voice === "piano") {
      this.renderPianoVoice(ctx, evt, startTime, outputDestination);
    } else if (evt.voice === "pad") {
      this.renderPadVoice(ctx, evt, startTime, outputDestination);
    } else if (evt.voice === "bell") {
      this.renderBellVoice(ctx, evt, startTime, outputDestination);
    } else {
      this.renderPluckVoice(ctx, evt, startTime, outputDestination);
    }
  }

  /**
   * Acoustic-style synthesized piano voice:
   * - Multi-partial string model (detuned fundamental + 2x octave + subtle 3x harmonic)
   * - Velocity-sensitive hammer lowpass filter envelope (soft notes stay warm, intense notes bloom)
   * - Rounded hammer attack + natural two-stage string decay
   */
  private renderPianoVoice(
    ctx: AudioContext,
    evt: MusicalEvent,
    t: number,
    dest: AudioNode
  ): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const masterNoteGain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    osc3.type = "sine";

    osc1.frequency.setValueAtTime(evt.frequency, t);
    osc2.frequency.setValueAtTime(evt.frequency * 2.0006, t);
    osc3.frequency.setValueAtTime(evt.frequency * 3.0, t);

    // Partial balance
    gain1.gain.setValueAtTime(0.76, t);
    gain2.gain.setValueAtTime(0.22 + evt.velocity * 0.14, t);
    gain3.gain.setValueAtTime(0.04 + evt.velocity * 0.08, t);

    // Velocity-coupled hammer brightness lowpass
    const brightFreq = Math.min(3400, evt.frequency * (2.2 + evt.velocity * 3.6));
    const warmFreq = Math.max(240, Math.min(1400, evt.frequency * 1.55));
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(brightFreq, t);
    filter.frequency.exponentialRampToValueAtTime(warmFreq, t + 0.42);
    filter.Q.setValueAtTime(0.5, t);

    const dur = Math.max(evt.duration, 1.4);
    const attack = evt.velocity < 0.4 ? 0.022 : 0.013;
    const peakGain = evt.velocity * 0.44;

    masterNoteGain.gain.setValueAtTime(0.0001, t);
    masterNoteGain.gain.linearRampToValueAtTime(peakGain, t + attack);
    masterNoteGain.gain.exponentialRampToValueAtTime(peakGain * 0.48, t + Math.min(0.45, dur * 0.3));
    masterNoteGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);
    filter.connect(masterNoteGain);
    masterNoteGain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);
    osc1.stop(t + dur + 0.08);
    osc2.stop(t + dur + 0.08);
    osc3.stop(t + dur + 0.08);

    this.activeOscillators.push(osc1, osc2, osc3);
    this.activeGainNodes.push(masterNoteGain);
  }

  private renderPadVoice(
    ctx: AudioContext,
    evt: MusicalEvent,
    t: number,
    dest: AudioNode
  ): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm detuned sine + soft triangle blend
    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(evt.frequency, t);
    osc2.frequency.setValueAtTime(evt.frequency * 1.0018, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(evt.frequency * 2.4, 880), t);
    filter.Q.setValueAtTime(0.4, t);

    const dur = Math.max(evt.duration, 1.8);
    const attack = Math.min(0.65, dur * 0.25);
    const releaseStart = Math.max(attack + 0.1, dur - Math.min(1.1, dur * 0.35));
    const peakGain = evt.velocity * 0.38;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + attack);
    gain.gain.linearRampToValueAtTime(peakGain * 0.78, t + releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.12);
    osc2.stop(t + dur + 0.12);

    this.activeOscillators.push(osc1, osc2);
    this.activeGainNodes.push(gain);
  }

  private renderBellVoice(
    ctx: AudioContext,
    evt: MusicalEvent,
    t: number,
    dest: AudioNode
  ): void {
    const oscFundamental = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainFund = ctx.createGain();
    const gainHarm = ctx.createGain();

    // Rounded warm bell: pure sine fundamental + gentle 2.0x octave overtone (no harsh metallic partials)
    oscFundamental.type = "sine";
    oscHarmonic.type = "sine";

    oscFundamental.frequency.setValueAtTime(evt.frequency, t);
    oscHarmonic.frequency.setValueAtTime(evt.frequency * 2.0, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(evt.frequency * 3.5, 2400), t);

    const dur = Math.max(evt.duration, 1.1);
    const peakGain = evt.velocity * 0.36;

    gainFund.gain.setValueAtTime(0.0001, t);
    gainFund.gain.linearRampToValueAtTime(peakGain, t + 0.032);
    gainFund.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    gainHarm.gain.setValueAtTime(0.0001, t);
    gainHarm.gain.linearRampToValueAtTime(peakGain * 0.14, t + 0.025);
    gainHarm.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.48);

    oscFundamental.connect(gainFund);
    oscHarmonic.connect(gainHarm);
    gainFund.connect(filter);
    gainHarm.connect(filter);
    filter.connect(dest);

    oscFundamental.start(t);
    oscHarmonic.start(t);
    oscFundamental.stop(t + dur + 0.08);
    oscHarmonic.stop(t + dur + 0.08);

    this.activeOscillators.push(oscFundamental, oscHarmonic);
    this.activeGainNodes.push(gainFund, gainHarm);
  }

  private renderPluckVoice(
    ctx: AudioContext,
    evt: MusicalEvent,
    t: number,
    dest: AudioNode
  ): void {
    // Soft felt-mallet tone: sine + muted triangle through warm lowpass
    const oscSine = ctx.createOscillator();
    const oscTri = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscSine.type = "sine";
    oscTri.type = "triangle";
    oscSine.frequency.setValueAtTime(evt.frequency, t);
    oscTri.frequency.setValueAtTime(evt.frequency, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(evt.frequency * 2.6, 2200), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(evt.frequency * 1.05, 180), t + 0.35);

    const dur = Math.max(evt.duration, 0.75);
    const peakGain = evt.velocity * 0.3;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    oscSine.connect(filter);
    oscTri.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    oscSine.start(t);
    oscTri.start(t);
    oscSine.stop(t + dur + 0.08);
    oscTri.stop(t + dur + 0.08);

    this.activeOscillators.push(oscSine, oscTri);
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
      this.wetGain.gain.setValueAtTime(this.currentReverb * 0.45, this.ctx.currentTime);
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
