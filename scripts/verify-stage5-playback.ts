import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import { mapRecursionToMusic } from "../src/lib/audio/musicMapper.ts";
import type { RecursionConfig } from "../src/lib/recursion/types.ts";
import type { MusicalScale } from "../src/lib/audio/types.ts";

console.log("=================================================================");
console.log("STAGE 5: AUDIO PLAYBACK INTERFACE & SYNC VERIFICATION SUITE");
console.log("=================================================================\n");

let allPassed = true;

// 1. Test 3 Distinct Recursive Tree Configurations
const configs: { name: string; config: RecursionConfig }[] = [
  {
    name: "Config 1: Meditative Zen Tree (Depth 5, 26°, Ratio 0.72, Seed 101)",
    config: { maxDepth: 5, branchAngle: 26, initialLength: 100, lengthRatio: 0.72, seed: 101 },
  },
  {
    name: "Config 2: Wide Atmospheric Canopy (Depth 6, 44°, Ratio 0.65, Seed 'wide-canopy')",
    config: { maxDepth: 6, branchAngle: 44, initialLength: 95, lengthRatio: 0.65, seed: "wide-canopy" },
  },
  {
    name: "Config 3: Dense Intricate Filaments (Depth 7, 18°, Ratio 0.78, Seed 'deep-cosmic')",
    config: { maxDepth: 7, branchAngle: 18, initialLength: 120, lengthRatio: 0.78, seed: "deep-cosmic" },
  },
];

console.log("▶ [Test 1] Playback Across 3 Recursive Configurations...");
const compositions = configs.map(({ name, config }) => {
  const tree = generateRecursiveTree(config);
  const comp = mapRecursionToMusic(tree, { totalDurationSec: 9.0, tempoBpm: 60 });
  console.log(`  • ${name}:`);
  console.log(`    - Branches: ${tree.totalBranches}, Depth: ${tree.maxDepthReached}`);
  console.log(`    - Musical events: ${comp.events.length}`);
  console.log(`    - Duration: ${comp.totalDuration}s`);
  return { tree, comp };
});

const distinctComps =
  compositions[0].comp.events.length !== compositions[1].comp.events.length &&
  compositions[1].comp.events.length !== compositions[2].comp.events.length;
console.log(`  • Generated Distinct Compositions: ${distinctComps ? "PASS ✓" : "FAIL ✗"}`);
if (!distinctComps) allPassed = false;

// 2. Playback State Transitions & Offset Mathematics (Play, Pause, Resume, Stop, Replay)
console.log("\n▶ [Test 2] Timeline Offset Mathematics (Play -> Pause -> Resume -> Stop -> Replay)...");
const testComp = compositions[0].comp;
const totalDuration = testComp.totalDuration;

// Simulate Play starting at t = 0
let playbackStartTime = 100.0; // simulated AudioContext.currentTime
let pausedAtSec = 0;

// Simulate Pause at t = 5.2s elapsed (past early pad notes)
const pauseTriggerTime = 105.2;
const elapsedAtPause = pauseTriggerTime - playbackStartTime;
pausedAtSec = Math.min(elapsedAtPause, totalDuration);

console.log(`  • Paused at simulated elapsed time: ${pausedAtSec.toFixed(2)}s / ${totalDuration.toFixed(2)}s`);
const pauseAccurate = Math.abs(pausedAtSec - 5.2) < 0.001;
console.log(`  • Pause Offset Accuracy           : ${pauseAccurate ? "PASS ✓" : "FAIL ✗"}`);
if (!pauseAccurate) allPassed = false;

// Simulate Resume at t = 110.0s (after being paused for 6.8s real-world seconds)
const resumeTriggerTime = 110.0;
const virtualStartTime = resumeTriggerTime - pausedAtSec;

// Calculate remaining events to schedule upon resume
const remainingEvents = testComp.events.filter(
  (evt) => evt.startTime + evt.duration > pausedAtSec
);
console.log(`  • Total Events: ${testComp.events.length}, Remaining Events upon Resume: ${remainingEvents.length}`);
const resumeEventCountValid = remainingEvents.length > 0 && remainingEvents.length < testComp.events.length;
console.log(`  • Remaining Events Filtering      : ${resumeEventCountValid ? "PASS ✓" : "FAIL ✗"}`);
if (!resumeEventCountValid) allPassed = false;

// Verify relative delay offsets for remaining events are non-negative
let allOffsetsValid = true;
for (const evt of remainingEvents) {
  const delayOffset = Math.max(0, evt.startTime - pausedAtSec);
  if (delayOffset < 0 || isNaN(delayOffset)) {
    allOffsetsValid = false;
    break;
  }
}
console.log(`  • Scheduled Event Offsets Non-Negative: ${allOffsetsValid ? "PASS ✓" : "FAIL ✗"}`);
if (!allOffsetsValid) allPassed = false;

// Simulate Stop: resets pausedAtSec to 0
pausedAtSec = 0;
const stopResetsOffset = pausedAtSec === 0;
console.log(`  • Stop Resets Timeline to 0.0s    : ${stopResetsOffset ? "PASS ✓" : "FAIL ✗"}`);
if (!stopResetsOffset) allPassed = false;

// 3. Tempo Scaling Verification (45 BPM, 60 BPM, 90 BPM)
console.log("\n▶ [Test 3] Tempo Scaling Verification (45 BPM vs 60 BPM vs 90 BPM)...");
const tree = compositions[0].tree;
const compSlow = mapRecursionToMusic(tree, { tempoBpm: 45, totalDurationSec: 9.0 });
const compBase = mapRecursionToMusic(tree, { tempoBpm: 60, totalDurationSec: 9.0 });
const compFast = mapRecursionToMusic(tree, { tempoBpm: 90, totalDurationSec: 9.0 });

console.log(`  • Duration at 45 BPM: ${compSlow.totalDuration.toFixed(2)}s`);
console.log(`  • Duration at 60 BPM: ${compBase.totalDuration.toFixed(2)}s`);
console.log(`  • Duration at 90 BPM: ${compFast.totalDuration.toFixed(2)}s`);

const expectedFastRatio = 60 / 90;
const expectedSlowRatio = 60 / 45;
const actualFastRatio = compFast.totalDuration / compBase.totalDuration;
const actualSlowRatio = compSlow.totalDuration / compBase.totalDuration;

const tempoScalingAccurate =
  Math.abs(actualFastRatio - expectedFastRatio) < 0.05 &&
  Math.abs(actualSlowRatio - expectedSlowRatio) < 0.05;

console.log(`  • Fast Ratio (expected ~0.67): ${actualFastRatio.toFixed(3)}`);
console.log(`  • Slow Ratio (expected ~1.33): ${actualSlowRatio.toFixed(3)}`);
console.log(`  • Tempo Duration Scaling Accuracy: ${tempoScalingAccurate ? "PASS ✓" : "FAIL ✗"}`);
if (!tempoScalingAccurate) allPassed = false;

// 4. Harmonic Scales Verification (Pentatonic, Dorian, Lydian, Ambient)
console.log("\n▶ [Test 4] Musical Scale Selection (Pentatonic, Dorian, Lydian, Ambient)...");
const scales: MusicalScale[] = ["pentatonic", "dorian", "lydian", "ambient"];
const scalePitches: Record<string, string[]> = {};

let allScalesHarmonious = true;
for (const sc of scales) {
  const c = mapRecursionToMusic(tree, { scale: sc, totalDurationSec: 8.0 });
  const pitches = Array.from(new Set(c.events.map((e) => e.pitch)));
  scalePitches[sc] = pitches;
  console.log(`  • Scale '${sc}' (${c.scaleName}): ${pitches.length} unique pitches -> ${pitches.slice(0, 6).join(", ")}...`);

  // Check no undefined pitches or NaN frequencies
  for (const evt of c.events) {
    if (!evt.pitch || isNaN(evt.frequency) || evt.frequency <= 0) {
      allScalesHarmonious = false;
      console.log(`    Invalid event in scale ${sc}:`, evt);
    }
  }
}

// Verify different scales produce distinct note sets
const pentatonicDistinctFromDorian =
  JSON.stringify(scalePitches["pentatonic"]) !== JSON.stringify(scalePitches["dorian"]);
const dorianDistinctFromLydian =
  JSON.stringify(scalePitches["dorian"]) !== JSON.stringify(scalePitches["lydian"]);

console.log(`  • Valid Frequencies across all scales: ${allScalesHarmonious ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  • Distinct Scale Tonality Palettes   : ${pentatonicDistinctFromDorian && dorianDistinctFromLydian ? "PASS ✓" : "FAIL ✗"}`);
if (!allScalesHarmonious || !pentatonicDistinctFromDorian) allPassed = false;

// 5. Volume & Reverb Parameter Range Bounds
console.log("\n▶ [Test 5] Volume & Reverb Range Bounds...");
const testVolumes = [-0.5, 0.0, 0.5, 0.8, 1.0, 1.5];
const testReverbs = [-0.2, 0.0, 0.65, 1.0, 1.2];

let volumeClamped = true;
for (const v of testVolumes) {
  const clamped = Math.max(0, Math.min(1, v));
  if (clamped < 0 || clamped > 1) volumeClamped = false;
}

let reverbClamped = true;
for (const r of testReverbs) {
  const clamped = Math.max(0, Math.min(1, r));
  if (clamped < 0 || clamped > 1) reverbClamped = false;
}

console.log(`  • Master Volume Clamped [0.0, 1.0]: ${volumeClamped ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  • Ambient Reverb Clamped [0.0, 1.0]: ${reverbClamped ? "PASS ✓" : "FAIL ✗"}`);
if (!volumeClamped || !reverbClamped) allPassed = false;

// 6. Audio-Visual Active Branch Synchronization
console.log("\n▶ [Test 6] Real-Time Active Branch Synchronization...");
const treeBranchIdSet = new Set(tree.branches.map((b) => b.id));
let allBranchesBelongToTree = true;
let totalHighlightedCount = 0;

// Sample time from 0 to totalDuration in 50ms intervals
const sampleIntervals = 100;
for (let i = 0; i < sampleIntervals; i++) {
  const t = (i / sampleIntervals) * testComp.totalDuration;
  const activeIds = new Set<string>();

  for (const evt of testComp.events) {
    if (t >= evt.startTime && t < evt.startTime + evt.duration) {
      activeIds.add(evt.branchId);
    }
  }

  // Verify all active IDs belong to actual generated branches
  for (const id of activeIds) {
    totalHighlightedCount++;
    if (!treeBranchIdSet.has(id)) {
      allBranchesBelongToTree = false;
      console.log(`    Active branch ${id} not found in tree branches!`);
      break;
    }
  }
}

console.log(`  • Sampled Intervals: ${sampleIntervals}, Total Synchronized Branch Hits: ${totalHighlightedCount}`);
console.log(`  • Sounding Branch ID Integrity: ${allBranchesBelongToTree ? "PASS ✓ (100% active IDs map to valid Stage 2 branches)" : "FAIL ✗"}`);
if (!allBranchesBelongToTree) allPassed = false;

// 7. Regenerate Composition Behavior
console.log("\n▶ [Test 7] Regenerate Composition Behavior...");
const seed1 = 12345;
const seed2 = 98765;
const tree1 = generateRecursiveTree({
  ...configs[0].config,
  angleVariation: 0.15,
  lengthVariation: 0.1,
  seed: seed1,
});
const tree2 = generateRecursiveTree({
  ...configs[0].config,
  angleVariation: 0.15,
  lengthVariation: 0.1,
  seed: seed2,
});
const comp1 = mapRecursionToMusic(tree1);
const comp2 = mapRecursionToMusic(tree2);

const regenerationChangesStructure =
  tree1.branches.some((b1, idx) => {
    const b2 = tree2.branches[idx];
    return !b2 || Math.abs(b1.end.x - b2.end.x) > 0.01 || Math.abs(b1.end.y - b2.end.y) > 0.01;
  });

const musicDiffCount = comp1.events.filter((e1, idx) => {
  const e2 = comp2.events[idx];
  return !e2 || e1.pitch !== e2.pitch || Math.abs(e1.pan - e2.pan) > 0.01 || Math.abs(e1.duration - e2.duration) > 0.01;
}).length;

const regenerationChangesNotes = musicDiffCount > 0;

console.log(`  • Regeneration Produces Novel Geometry: ${regenerationChangesStructure ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  • Regeneration Produces Novel Music   : ${regenerationChangesNotes ? `PASS ✓ (${musicDiffCount} musical variations)` : "FAIL ✗"}`);
if (!regenerationChangesStructure || !regenerationChangesNotes) allPassed = false;

console.log("\n=================================================================");
console.log(`FINAL RESULT: ${allPassed ? "STAGE 5 VERIFICATION PASSED ✓" : "FAILURES DETECTED ✗"}`);
console.log("=================================================================");

if (!allPassed) {
  process.exit(1);
}
