/**
 * Standard 16-bit PCM RIFF/WAVE Binary Encoder
 * Encodes floating-point stereo audio channels into a canonical, universally compatible WAV file.
 * Zero external dependencies.
 */

export interface WavMetadata {
  chunkId: string;
  chunkSize: number;
  format: string;
  subchunk1Id: string;
  subchunk1Size: number;
  audioFormat: number; // 1 = Linear PCM
  numChannels: number; // 2 = Stereo
  sampleRate: number; // e.g. 44100 Hz
  byteRate: number; // sampleRate * numChannels * bitsPerSample / 8
  blockAlign: number; // numChannels * bitsPerSample / 8
  bitsPerSample: number; // 16
  subchunk2Id: string;
  subchunk2Size: number;
  totalSamples: number;
  durationSec: number;
  rmsAmplitude: number;
  peakAmplitude: number;
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

  // Helper to write ASCII strings
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

  // Calculate RMS and Peak from sample data
  const totalSamples = Math.floor(subchunk2Size / (numChannels * (bitsPerSample / 8)));
  let sumSquares = 0;
  let peak = 0;

  const dataOffset = 44;
  const sampleCountToInspect = Math.min(totalSamples, 200000); // inspect up to ~2-4s of samples for speed

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
