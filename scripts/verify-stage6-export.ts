import * as fs from "node:fs";
import * as path from "node:path";
import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import { mapRecursionToMusic } from "../src/lib/audio/musicMapper.ts";
import { renderCompositionToWav, inspectWavHeader } from "../src/lib/audio/wavExporter.ts";
import type { RecursionConfig } from "../src/lib/recursion/types.ts";

console.log("=================================================================");
console.log("STAGE 6: REAL WAV AUDIO EXPORT VERIFICATION SUITE");
console.log("=================================================================\n");

let allPassed = true;

// 1. Two Distinct Configurations for Real WAV Export
const configA: RecursionConfig = {
  maxDepth: 5,
  branchAngle: 28,
  initialLength: 100,
  lengthRatio: 0.72,
  angleVariation: 0.15,
  lengthVariation: 0.1,
  seed: 101,
};

const configB: RecursionConfig = {
  maxDepth: 6,
  branchAngle: 42,
  initialLength: 90,
  lengthRatio: 0.65,
  angleVariation: 0.2,
  lengthVariation: 0.12,
  seed: 909,
};

async function runTests() {
  // Test 1: Render and Verify Configuration A (C Major Pentatonic, 60 BPM)
  console.log("▶ [Test 1] Exporting Configuration A (Zen Tree, Pentatonic, 60 BPM)...");
  const treeA = generateRecursiveTree(configA);
  const compA = mapRecursionToMusic(treeA, {
    scale: "pentatonic",
    tempoBpm: 60,
    totalDurationSec: 9.0,
  });

  const exportA = await renderCompositionToWav(compA, {
    sampleRate: 44100,
    volume: 0.85,
    reverb: 0.65,
    filename: "soundscape-zen-seed-101.wav",
  });

  console.log(`  • Generated Tree Branches   : ${treeA.totalBranches}`);
  console.log(`  • Composition Event Count   : ${compA.events.length}`);
  console.log(`  • Rendered WAV File Size    : ${(exportA.sizeBytes / 1024).toFixed(1)} KB (${exportA.sizeBytes} bytes)`);
  console.log(`  • Audio Duration            : ${exportA.durationSec.toFixed(2)} seconds`);

  // Inspect WAV Header Structure
  const metaA = exportA.metadata;
  console.log("  • Inspecting RIFF/WAVE Header:");
  console.log(`    - ChunkID                 : "${metaA.chunkId}" (Expected: "RIFF")`);
  console.log(`    - Format                  : "${metaA.format}" (Expected: "WAVE")`);
  console.log(`    - Subchunk1ID             : "${metaA.subchunk1Id}" (Expected: "fmt ")`);
  console.log(`    - AudioFormat             : ${metaA.audioFormat} (Expected: 1 = Linear PCM)`);
  console.log(`    - NumChannels             : ${metaA.numChannels} (Expected: 2 = Stereo)`);
  console.log(`    - SampleRate              : ${metaA.sampleRate} Hz (Expected: 44100 Hz)`);
  console.log(`    - ByteRate                : ${metaA.byteRate} bytes/sec (Expected: 176400)`);
  console.log(`    - BlockAlign              : ${metaA.blockAlign} bytes (Expected: 4)`);
  console.log(`    - BitsPerSample           : ${metaA.bitsPerSample} bits (Expected: 16)`);
  console.log(`    - Subchunk2ID             : "${metaA.subchunk2Id}" (Expected: "data")`);
  console.log(`    - DataSize                : ${metaA.subchunk2Size} bytes`);

  const headerValidA =
    metaA.chunkId === "RIFF" &&
    metaA.format === "WAVE" &&
    metaA.subchunk1Id === "fmt " &&
    metaA.audioFormat === 1 &&
    metaA.numChannels === 2 &&
    metaA.sampleRate === 44100 &&
    metaA.byteRate === 176400 &&
    metaA.blockAlign === 4 &&
    metaA.bitsPerSample === 16 &&
    metaA.subchunk2Id === "data" &&
    metaA.subchunk2Size > 0;

  console.log(`  • Header Compliance Result  : ${headerValidA ? "PASS ✓ (100% Valid RIFF/WAVE 16-bit PCM)" : "FAIL ✗"}`);
  if (!headerValidA) allPassed = false;

  // Verify Nonzero Audio Data (RMS and Peak)
  console.log("  • Analyzing Audio Signal:");
  console.log(`    - Peak Amplitude          : ${metaA.peakAmplitude.toFixed(4)} (Expected > 0.15)`);
  console.log(`    - RMS Amplitude           : ${metaA.rmsAmplitude.toFixed(4)} (Expected > 0.02)`);

  const audibleA = metaA.peakAmplitude > 0.15 && metaA.rmsAmplitude > 0.02;
  console.log(`  • Audible Signal Result     : ${audibleA ? "PASS ✓ (Real, non-silent, audible procedural audio)" : "FAIL ✗"}`);
  if (!audibleA) allPassed = false;

  // Test 2: Render and Verify Configuration B (Dorian Twilight, 80 BPM)
  console.log("\n▶ [Test 2] Exporting Configuration B (Canopy Tree, Dorian, 80 BPM)...");
  const treeB = generateRecursiveTree(configB);
  const compB = mapRecursionToMusic(treeB, {
    scale: "dorian",
    tempoBpm: 80,
    totalDurationSec: 8.0,
  });

  const exportB = await renderCompositionToWav(compB, {
    sampleRate: 44100,
    volume: 0.8,
    reverb: 0.7,
    filename: "soundscape-canopy-seed-909.wav",
  });

  console.log(`  • Generated Tree Branches   : ${treeB.totalBranches}`);
  console.log(`  • Composition Event Count   : ${compB.events.length}`);
  console.log(`  • Rendered WAV File Size    : ${(exportB.sizeBytes / 1024).toFixed(1)} KB (${exportB.sizeBytes} bytes)`);
  console.log(`  • Audio Duration            : ${exportB.durationSec.toFixed(2)} seconds`);

  const metaB = exportB.metadata;
  const headerValidB =
    metaB.chunkId === "RIFF" &&
    metaB.format === "WAVE" &&
    metaB.audioFormat === 1 &&
    metaB.numChannels === 2 &&
    metaB.sampleRate === 44100;

  const audibleB = metaB.peakAmplitude > 0.15 && metaB.rmsAmplitude > 0.02;
  console.log(`  • Header Compliance Result  : ${headerValidB ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  • Audible Signal Result     : ${audibleB ? `PASS ✓ (RMS: ${metaB.rmsAmplitude}, Peak: ${metaB.peakAmplitude})` : "FAIL ✗"}`);
  if (!headerValidB || !audibleB) allPassed = false;

  // Test 3: Comparison of Configurations (Novelty of Audio)
  console.log("\n▶ [Test 3] Comparing Export A vs Export B...");
  const differentSizes = exportA.sizeBytes !== exportB.sizeBytes;
  const differentDurations = exportA.durationSec !== exportB.durationSec;

  // Sample comparison of first 1000 PCM bytes
  let samplesDifferent = false;
  for (let i = 44; i < 44 + 2000; i++) {
    if (exportA.wavBytes[i] !== exportB.wavBytes[i]) {
      samplesDifferent = true;
      break;
    }
  }

  console.log(`  • Duration Difference       : ${exportA.durationSec}s vs ${exportB.durationSec}s (${differentDurations ? "PASS ✓" : "FAIL ✗"})`);
  console.log(`  • File Size Difference      : ${exportA.sizeBytes} vs ${exportB.sizeBytes} bytes (${differentSizes ? "PASS ✓" : "FAIL ✗"})`);
  console.log(`  • Audio Waveform Difference : ${samplesDifferent ? "PASS ✓ (Distinct musical audio data)" : "FAIL ✗"}`);

  if (!differentSizes || !differentDurations || !samplesDifferent) allPassed = false;

  // Test 4: Error Handling & Validation
  console.log("\n▶ [Test 4] Error Handling Verification...");
  let emptyRejected = false;
  try {
    await renderCompositionToWav({ events: [] } as any);
  } catch (err: any) {
    emptyRejected = true;
    console.log(`  • Empty composition correctly rejected: "${err.message}" (PASS ✓)`);
  }
  if (!emptyRejected) allPassed = false;

  let truncatedRejected = false;
  try {
    inspectWavHeader(new Uint8Array(20));
  } catch (err: any) {
    truncatedRejected = true;
    console.log(`  • Truncated buffer correctly rejected : "${err.message}" (PASS ✓)`);
  }
  if (!truncatedRejected) allPassed = false;

  // Test 5: Write Audible WAV Artifacts to Disk
  console.log("\n▶ [Test 5] Writing Physical WAV Artifacts to Disk...");
  const outputDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileAPath = path.join(outputDir, "recursive-soundscape-demo-zen.wav");
  const fileBPath = path.join(outputDir, "recursive-soundscape-demo-canopy.wav");

  fs.writeFileSync(fileAPath, Buffer.from(exportA.wavBytes.buffer));
  fs.writeFileSync(fileBPath, Buffer.from(exportB.wavBytes.buffer));

  const writtenAExists = fs.existsSync(fileAPath) && fs.statSync(fileAPath).size === exportA.sizeBytes;
  const writtenBExists = fs.existsSync(fileBPath) && fs.statSync(fileBPath).size === exportB.sizeBytes;

  console.log(`  • Saved: ${fileAPath} (${(fs.statSync(fileAPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`  • Saved: ${fileBPath} (${(fs.statSync(fileBPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`  • Files On Disk Verified    : ${writtenAExists && writtenBExists ? "PASS ✓" : "FAIL ✗"}`);
  if (!writtenAExists || !writtenBExists) allPassed = false;

  console.log("\n=================================================================");
  console.log(`FINAL RESULT: ${allPassed ? "STAGE 6 WAV EXPORT VERIFICATION PASSED ✓" : "FAILURES DETECTED ✗"}`);
  console.log("=================================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
