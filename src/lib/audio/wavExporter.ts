import type { Composition, MusicalEvent } from "./types";

export interface WavMetadata {
  chunkId: string;
  chunkSize: number;
  format: string;
  subchunk1Id: string;
  subchunk1Size: number;
  audioFormat: number; // 1 = Linear PCM
  numChannels: number; // 2 = Stereo
  sampleRate: number; // e.g. 44100 Hz
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number; // 16
  subchunk2Id: string;
  subchunk2Size: number;
  totalSamples: number;
  durationSec: number;
  rmsAmplitude: number;
  peakAmplitude: number;
}

export interface WavExportOptions {
  sampleRate?: number; // default: 44100
  volume?: number; // 0.0 to 1.0 (default: 0.8)
  reverb?: number; // 0.0 to 1.0 (default: 0.65)
  filename?: string; // default: "recursive-soundscapes.wav"
}

export interface WavExportResult {
  wavBytes: Uint8Array;
  filename: string;
  durationSec: number;
  sizeBytes: number;
  metadata: WavMetadata;
}

/**
 * Encodes two Float32Array stereo channels into a 16-bit PCM WAV byte buffer.
 */
export function encodeWav16Bit(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number = 44100
): Uint8Array {
  const numSamples = Math.min(leftChannel.length, rightChannel.length);
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalFileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. RIFF Header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, "WAVE");

  // 2. "fmt " Subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat: 1 = Linear PCM
  view.setUint16(22, numChannels, true); // NumChannels: 2
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample: 16

  // 3. "data" Subchunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // 4. Interleaved 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Left channel
    let left = leftChannel[i];
    left = Math.max(-1.0, Math.min(1.0, left));
    const leftInt16 = left < 0 ? Math.round(left * 0x8000) : Math.round(left * 0x7fff);
    view.setInt16(offset, leftInt16, true);
    offset += 2;

    // Right channel
    let right = rightChannel[i];
    right = Math.max(-1.0, Math.min(1.0, right));
    const rightInt16 = right < 0 ? Math.round(right * 0x8000) : Math.round(right * 0x7fff);
    view.setInt16(offset, rightInt16, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Parses and inspects a WAV binary buffer, returning detailed audio metrics.
 */
export function inspectWavHeader(wavBytes: Uint8Array): WavMetadata {
  if (wavBytes.length < 44) {
    throw new Error("Invalid WAV file: buffer is shorter than 44 bytes header");
  }

  const view = new DataView(
    wavBytes.buffer,
    wavBytes.byteOffset,
    wavBytes.byteLength
  );

  const readString = (offset: number, length: number) => {
    let str = "";
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  };

  const chunkId = readString(0, 4);
  const chunkSize = view.getUint32(4, true);
  const format = readString(8, 4);
  const subchunk1Id = readString(12, 4);
  const subchunk1Size = view.getUint32(16, true);
  const audioFormat = view.getUint16(20, true);
  const numChannels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const byteRate = view.getUint32(28, true);
  const blockAlign = view.getUint16(32, true);
  const bitsPerSample = view.getUint16(34, true);
  const subchunk2Id = readString(36, 4);
  const subchunk2Size = view.getUint32(40, true);

  if (chunkId !== "RIFF" || format !== "WAVE") {
    throw new Error(`Invalid WAV format: chunkId=${chunkId}, format=${format}`);
  }

  const totalSamples = Math.floor(subchunk2Size / (numChannels * (bitsPerSample / 8)));
  let sumSquares = 0;
  let peak = 0;

  const dataOffset = 44;
  const sampleCountToInspect = Math.min(totalSamples, 200000);

  for (let i = 0; i < sampleCountToInspect; i++) {
    const byteIndex = dataOffset + i * 4;
    if (byteIndex + 4 <= wavBytes.length) {
      const leftInt = view.getInt16(byteIndex, true);
      const rightInt = view.getInt16(byteIndex + 2, true);
      const l = leftInt / 0x8000;
      const r = rightInt / 0x8000;

      const mag = Math.max(Math.abs(l), Math.abs(r));
      if (mag > peak) peak = mag;

      sumSquares += l * l + r * r;
    }
  }

  const rms =
    sampleCountToInspect > 0
      ? Math.sqrt(sumSquares / (sampleCountToInspect * 2))
      : 0;
  const durationSec = totalSamples / sampleRate;

  return {
    chunkId,
    chunkSize,
    format,
    subchunk1Id,
    subchunk1Size,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    subchunk2Id,
    subchunk2Size,
    totalSamples,
    durationSec: Number(durationSec.toFixed(3)),
    rmsAmplitude: Number(rms.toFixed(4)),
    peakAmplitude: Number(peak.toFixed(4)),
  };
}

/**
 * Procedural Offline DSP Renderer (Headless & Fallback Engine)
 * Synthesizes the exact same instruments, panning, and delay reverb into Float32Array channels.
 */
function renderProceduralOffline(
  composition: Composition,
  options: WavExportOptions = {}
): { left: Float32Array; right: Float32Array; sampleRate: number; durationSec: number } {
  const sampleRate = options.sampleRate || 44100;
  const volume = Math.max(0, Math.min(1, options.volume ?? 0.8));
  const reverb = Math.max(0, Math.min(1, options.reverb ?? 0.65));

  // Add tail for reverb decay
  const durationSec = composition.totalDuration + 1.2;
  const totalFrames = Math.ceil(durationSec * sampleRate);

  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  // Delay/reverb buffer
  const delaySec = 0.38;
  const delaySamples = Math.floor(delaySec * sampleRate);
  const delayLeft = new Float32Array(totalFrames);
  const delayRight = new Float32Array(totalFrames);
  const feedback = 0.32;
  const wetGain = reverb * 0.42;

  // Synthesize each musical event
  for (const evt of composition.events) {
    const startFrame = Math.floor(evt.startTime * sampleRate);
    const eventFrames = Math.floor(Math.max(0.2, evt.duration) * sampleRate);
    const endFrame = Math.min(totalFrames, startFrame + eventFrames);

    // Constant-power stereo panning
    const panNorm = (evt.pan + 1) * 0.5;
    const gainL = Math.cos(panNorm * Math.PI * 0.5);
    const gainR = Math.sin(panNorm * Math.PI * 0.5);

    const freq = evt.frequency;
    const voice = evt.voice;
    const vel = evt.velocity;

    for (let f = startFrame; f < endFrame; f++) {
      const t = (f - startFrame) / sampleRate;
      let sample = 0;

      if (voice === "piano") {
        // Acoustic-style piano: fundamental + velocity-scaled 2x/3x harmonics + natural string decay
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * freq * 2.0006 * t);
        const osc3 = Math.sin(2 * Math.PI * freq * 3.0 * t);

        const attackSec = vel < 0.4 ? 0.022 : 0.013;
        const attackEnv = Math.min(1.0, t / attackSec);
        const harmDecay = Math.exp(-t * 3.6);
        const bodyDecay = Math.exp(-t * 1.35);

        const wave =
          osc1 * 0.76 +
          osc2 * (0.22 + vel * 0.14) * harmDecay +
          osc3 * (0.04 + vel * 0.08) * harmDecay * harmDecay;

        sample = wave * attackEnv * vel * 0.54 * bodyDecay;
      } else if (voice === "pad") {
        // Warm detuned sine + soft triangle blend
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = 2 * Math.abs(2 * ((freq * 1.0018 * t) % 1) - 1) - 1;
        const rawWave = osc1 * 0.75 + osc2 * 0.25;

        const attack = Math.min(0.65, evt.duration * 0.25);
        let env = 0;
        if (t < attack) {
          env = (t / attack) * vel * 0.46;
        } else {
          const decayT = t - attack;
          env = vel * 0.46 * Math.exp(-decayT * 0.65);
        }
        sample = rawWave * env;
      } else if (voice === "bell") {
        // Warm rounded bell: sine fundamental + gentle 2.0x octave overtone
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * freq * 2.0 * t);

        const softAttack = Math.min(1.0, t / 0.03);
        const envFund = softAttack * vel * 0.42 * Math.exp(-t * 1.9);
        const envHarm = softAttack * vel * 0.08 * Math.exp(-t * 4.2);

        sample = osc1 * envFund + osc2 * envHarm;
      } else {
        // Soft felt-mallet tone: sine + muted triangle with 25ms attack
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const phase = (freq * t) % 1;
        const tri = 2 * Math.abs(2 * phase - 1) - 1;
        const softAttack = Math.min(1.0, t / 0.025);
        const env = softAttack * vel * 0.3 * Math.exp(-t * 3.4);
        sample = (osc1 * 0.65 + tri * 0.35) * env;
      }

      // Dry accumulation
      left[f] += sample * gainL * volume;
      right[f] += sample * gainR * volume;

      // Wet delay feed
      delayLeft[f] += sample * gainL;
      delayRight[f] += sample * gainR;
    }
  }

  // Process Delay & Ambient Space Reverb Loop
  for (let f = delaySamples; f < totalFrames; f++) {
    const prevL = delayLeft[f - delaySamples];
    const prevR = delayRight[f - delaySamples];

    const filteredL = prevL * 0.85;
    const filteredR = prevR * 0.85;

    delayLeft[f] += filteredL * feedback;
    delayRight[f] += filteredR * feedback;

    left[f] += filteredL * wetGain * volume;
    right[f] += filteredR * wetGain * volume;
  }

  // Master Dynamics Soft-Limiter / Clipper Prevention
  for (let f = 0; f < totalFrames; f++) {
    left[f] = Math.tanh(left[f]);
    right[f] = Math.tanh(right[f]);
  }

  return { left, right, sampleRate, durationSec };
}

/**
 * Browser Web Audio Offline Rendering Engine
 * Uses the native Web Audio OfflineAudioContext when available.
 */
async function renderBrowserOffline(
  composition: Composition,
  options: WavExportOptions = {}
): Promise<{ left: Float32Array; right: Float32Array; sampleRate: number; durationSec: number }> {
  const sampleRate = options.sampleRate || 44100;
  const volume = Math.max(0, Math.min(1, options.volume ?? 0.8));
  const reverb = Math.max(0, Math.min(1, options.reverb ?? 0.65));
  const durationSec = composition.totalDuration + 1.2;
  const totalFrames = Math.ceil(durationSec * sampleRate);

  const OfflineCtxClass =
    (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;

  if (!OfflineCtxClass) {
    return renderProceduralOffline(composition, options);
  }

  const ctx: OfflineAudioContext = new OfflineCtxClass(2, totalFrames, sampleRate);

  // 1. Master Output Limiter
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-6, 0);
  limiter.knee.setValueAtTime(14, 0);
  limiter.ratio.setValueAtTime(10, 0);
  limiter.attack.setValueAtTime(0.005, 0);
  limiter.release.setValueAtTime(0.18, 0);
  limiter.connect(ctx.destination);

  // 2. Master Warmth Lowpass Filter
  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = "lowpass";
  warmthFilter.frequency.setValueAtTime(3600, 0);
  warmthFilter.Q.setValueAtTime(0.5, 0);
  warmthFilter.connect(limiter);

  // 3. Master Gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, 0);
  masterGain.connect(warmthFilter);

  // 4. Warm Delay & Reverb Bus
  const delayNode = ctx.createDelay(1.5);
  delayNode.delayTime.setValueAtTime(0.42, 0);

  const delayFeedback = ctx.createGain();
  delayFeedback.gain.setValueAtTime(0.35, 0);

  const delayFilter = ctx.createBiquadFilter();
  delayFilter.type = "lowpass";
  delayFilter.frequency.setValueAtTime(1150, 0);

  const wetGain = ctx.createGain();
  wetGain.gain.setValueAtTime(reverb * 0.42, 0);

  delayNode.connect(delayFilter);
  delayFilter.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayFilter.connect(wetGain);
  wetGain.connect(masterGain);

  // 4. Synthesize all events
  for (const evt of composition.events) {
    const t = evt.startTime;

    let panner: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(evt.pan, t);
      panner.connect(masterGain);
      panner.connect(delayNode);
    }

    const dest: AudioNode = panner || masterGain;

    if (evt.voice === "piano") {
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

      gain1.gain.setValueAtTime(0.76, t);
      gain2.gain.setValueAtTime(0.22 + evt.velocity * 0.14, t);
      gain3.gain.setValueAtTime(0.04 + evt.velocity * 0.08, t);

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
    } else if (evt.voice === "pad") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

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
    } else if (evt.voice === "bell") {
      const oscFund = ctx.createOscillator();
      const oscHarm = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainFund = ctx.createGain();
      const gainHarm = ctx.createGain();

      oscFund.type = "sine";
      oscHarm.type = "sine";
      oscFund.frequency.setValueAtTime(evt.frequency, t);
      oscHarm.frequency.setValueAtTime(evt.frequency * 2.0, t);

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

      oscFund.connect(gainFund);
      oscHarm.connect(gainHarm);
      gainFund.connect(filter);
      gainHarm.connect(filter);
      filter.connect(dest);

      oscFund.start(t);
      oscHarm.start(t);
      oscFund.stop(t + dur + 0.08);
      oscHarm.stop(t + dur + 0.08);
    } else {
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
    }
  }

  const renderedBuffer = await ctx.startRendering();

  return {
    left: renderedBuffer.getChannelData(0),
    right: renderedBuffer.getChannelData(1),
    sampleRate,
    durationSec,
  };
}

/**
 * Universal Composition-to-WAV Rendering Pipeline.
 * Renders the composition into uncompressed 16-bit stereo PCM WAV binary data.
 */
export async function renderCompositionToWav(
  composition: Composition,
  options: WavExportOptions = {}
): Promise<WavExportResult> {
  if (!composition || !composition.events || composition.events.length === 0) {
    throw new Error("Cannot export WAV: Composition is empty or has no events");
  }

  const sampleRate = options.sampleRate || 44100;
  let channels: { left: Float32Array; right: Float32Array; durationSec: number };

  if (typeof window !== "undefined" && ((window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext)) {
    try {
      channels = await renderBrowserOffline(composition, options);
    } catch (err) {
      console.warn("Browser OfflineAudioContext failed, falling back to procedural DSP:", err);
      channels = renderProceduralOffline(composition, options);
    }
  } else {
    channels = renderProceduralOffline(composition, options);
  }

  const wavBytes = encodeWav16Bit(channels.left, channels.right, sampleRate);
  const metadata = inspectWavHeader(wavBytes);
  const filename = options.filename || "recursive-soundscapes.wav";

  return {
    wavBytes,
    filename,
    durationSec: metadata.durationSec,
    sizeBytes: wavBytes.byteLength,
    metadata,
  };
}

/**
 * Triggers a browser download of the exported WAV file and cleans up memory immediately.
 */
export function triggerWavDownload(wavBytes: Uint8Array, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("triggerWavDownload must be executed in a browser environment");
  }

  const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}
