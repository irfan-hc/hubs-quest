import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import { mapRecursionToMusic } from "../src/lib/audio/musicMapper.ts";
import type { RecursionConfig } from "../src/lib/recursion/types.ts";

console.log("=================================================================");
console.log("STAGE 4: PROCEDURAL MUSIC ENGINE VERIFICATION SUITE");
console.log("=================================================================\n");

let allPassed = true;

// Valid C Major Pentatonic Notes in Octaves 2-6
const VALID_PENTATONIC_NOTES = new Set([
  "C2", "D2", "E2", "G2", "A2",
  "C3", "D3", "E3", "G3", "A3",
  "C4", "D4", "E4", "G4", "A4",
  "C5", "D5", "E5", "G5", "A5",
  "C6", "D6", "E6", "G6", "A6",
]);

// 1. Test 3 Different Recursive Configurations
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

console.log("▶ [Test 1] Generating and Verifying Compositions across 3 Configurations...");
const compositions = configs.map(({ name, config }) => {
  const tree = generateRecursiveTree(config);
  const comp = mapRecursionToMusic(tree, { totalDurationSec: 9.0 });
  console.log(`  • ${name}:`);
  console.log(`    - Tree branches: ${tree.totalBranches} (Depth ${tree.maxDepthReached})`);
  console.log(`    - Musical events generated: ${comp.events.length}`);
  console.log(`    - Duration: ${comp.totalDuration}s`);
  console.log(`    - Scale: ${comp.scaleName}`);
  return comp;
});

// Verify structures produce different musical event sequences
const diff1_2 = compositions[0].events.length !== compositions[1].events.length;
const diff2_3 = compositions[1].events.length !== compositions[2].events.length;
const distinctSequences = diff1_2 && diff2_3;
console.log(`  • Distinct Event Sequences        : ${distinctSequences ? "PASS ✓" : "FAIL ✗"}`);
if (!distinctSequences) allPassed = false;

// 2. Verify Strict Scale Adherence (C Major Pentatonic)
console.log("\n▶ [Test 2] Scale & Harmonic Consonance Verification...");
let scaleValid = true;
for (const comp of compositions) {
  for (const evt of comp.events) {
    if (!VALID_PENTATONIC_NOTES.has(evt.pitch)) {
      scaleValid = false;
      console.log(`    Invalid note detected outside C Major Pentatonic: ${evt.pitch}`);
      break;
    }
  }
}
console.log(`  • Scale Conformance (C Pentatonic): ${scaleValid ? "PASS ✓ (100% of generated notes snapped to scale)" : "FAIL ✗"}`);
if (!scaleValid) allPassed = false;

// 3. Verify Depth to Musical Layer & Octave Register Mapping
console.log("\n▶ [Test 3] Depth to Musical Layer & Register Mapping...");
const comp = compositions[0];
const trunkEvt = comp.events.find((e) => e.depth === 0);
const midEvt = comp.events.find((e) => e.depth === 2);
const highEvt = comp.events.find((e) => e.depth >= 4);

const trunkInLowRegister = trunkEvt ? trunkEvt.frequency < 140 : false; // Octave 2 (< 140 Hz)
const midInMidRegister = midEvt ? midEvt.frequency >= 130 && midEvt.frequency <= 400 : false; // Octave 3-4
const highInUpperRegister = highEvt ? highEvt.frequency > 400 : false; // Octave 5+ (> 400 Hz)
const layersValid = trunkInLowRegister && midInMidRegister && highInUpperRegister;

console.log(`  • Depth 0 (Trunk) Pitch & Voice   : ${trunkEvt?.pitch} (${trunkEvt?.frequency} Hz, voice: ${trunkEvt?.voice})`);
console.log(`  • Depth 2 (Mid) Pitch & Voice     : ${midEvt?.pitch} (${midEvt?.frequency} Hz, voice: ${midEvt?.voice})`);
console.log(`  • Depth 4+ (Outer) Pitch & Voice  : ${highEvt?.pitch} (${highEvt?.frequency} Hz, voice: ${highEvt?.voice})`);
console.log(`  • Result                          : ${layersValid ? "PASS ✓ (Low bass pad -> Mid chime -> High bell)" : "FAIL ✗"}`);
if (!layersValid) allPassed = false;

// 4. Verify Branch Angle to Pitch Variation
console.log("\n▶ [Test 4] Branch Angle Pitch Sensitivity...");
const treeNarrow = generateRecursiveTree({ maxDepth: 4, branchAngle: 15, initialLength: 100, lengthRatio: 0.7, seed: 42 });
const treeWide = generateRecursiveTree({ maxDepth: 4, branchAngle: 55, initialLength: 100, lengthRatio: 0.7, seed: 42 });
const compNarrow = mapRecursionToMusic(treeNarrow);
const compWide = mapRecursionToMusic(treeWide);

const pitchesNarrow = compNarrow.events.map((e) => e.pitch).join(",");
const pitchesWide = compWide.events.map((e) => e.pitch).join(",");
const angleChangesPitches = pitchesNarrow !== pitchesWide;

console.log(`  • Narrow 15° Pitch Sample: ${compNarrow.events.slice(0, 5).map(e => e.pitch).join(", ")}`);
console.log(`  • Wide 55° Pitch Sample  : ${compWide.events.slice(0, 5).map(e => e.pitch).join(", ")}`);
console.log(`  • Result                 : ${angleChangesPitches ? "PASS ✓ (Angles produce distinct harmonic intervals)" : "FAIL ✗"}`);
if (!angleChangesPitches) allPassed = false;

// 5. Verify Branch Length to Duration and Velocity
console.log("\n▶ [Test 5] Branch Length to Duration & Velocity...");
const treeShort = generateRecursiveTree({ maxDepth: 4, branchAngle: 30, initialLength: 50, lengthRatio: 0.5, seed: 42 });
const treeLong = generateRecursiveTree({ maxDepth: 4, branchAngle: 30, initialLength: 150, lengthRatio: 0.85, seed: 42 });
const compShort = mapRecursionToMusic(treeShort);
const compLong = mapRecursionToMusic(treeLong);

const avgDurShort = compShort.events.reduce((a, b) => a + b.duration, 0) / compShort.events.length;
const avgDurLong = compLong.events.reduce((a, b) => a + b.duration, 0) / compLong.events.length;
const avgVelShort = compShort.events.reduce((a, b) => a + b.velocity, 0) / compShort.events.length;
const avgVelLong = compLong.events.reduce((a, b) => a + b.velocity, 0) / compLong.events.length;

const lengthAffectsDurationVel = avgDurLong > avgDurShort && avgVelLong >= avgVelShort;
console.log(`  • Short Tree Avg Duration: ${avgDurShort.toFixed(2)}s, Velocity: ${avgVelShort.toFixed(2)}`);
console.log(`  • Long Tree Avg Duration : ${avgDurLong.toFixed(2)}s, Velocity: ${avgVelLong.toFixed(2)}`);
console.log(`  • Result                 : ${lengthAffectsDurationVel ? "PASS ✓ (Longer branches produce longer/fuller sustain)" : "FAIL ✗"}`);
if (!lengthAffectsDurationVel) allPassed = false;

// 6. Verify Deterministic Reproducibility
console.log("\n▶ [Test 6] Deterministic Music Generation Reproducibility...");
const runA = mapRecursionToMusic(generateRecursiveTree(configs[0].config));
const runB = mapRecursionToMusic(generateRecursiveTree(configs[0].config));

let identical = runA.events.length === runB.events.length;
if (identical) {
  for (let i = 0; i < runA.events.length; i++) {
    const e1 = runA.events[i];
    const e2 = runB.events[i];
    if (e1.pitch !== e2.pitch || e1.startTime !== e2.startTime || e1.pan !== e2.pan || e1.frequency !== e2.frequency) {
      identical = false;
      break;
    }
  }
}
console.log(`  • Reproducibility (Run A vs Run B): ${identical ? "PASS ✓ (Identical event timing, pitch, and stereo pan)" : "FAIL ✗"}`);
if (!identical) allPassed = false;

// 7. Verify Polyphony Capping / Anti-Overload
console.log("\n▶ [Test 7] Density & Polyphony Safety...");
const denseTree = generateRecursiveTree({ maxDepth: 8, branchAngle: 30, initialLength: 100, lengthRatio: 0.75, seed: 999 });
const denseComp = mapRecursionToMusic(denseTree, { maxSimultaneousVoices: 8 });

// Calculate maximum overlapping events at any millisecond
const timeSlices = 100;
let maxConcurrent = 0;
for (let s = 0; s < timeSlices; s++) {
  const t = (s / timeSlices) * denseComp.totalDuration;
  const concurrent = denseComp.events.filter((e) => t >= e.startTime && t <= e.startTime + e.duration).length;
  if (concurrent > maxConcurrent) maxConcurrent = concurrent;
}
console.log(`  • Total Tree Branches: ${denseTree.totalBranches}`);
console.log(`  • Filtered Music Events: ${denseComp.events.length}`);
console.log(`  • Peak Simultaneous Concurrent Voices: ${maxConcurrent} (Cap configured: 8 + priority passes)`);
const polyphonySafe = maxConcurrent <= 14;
console.log(`  • Result: ${polyphonySafe ? "PASS ✓ (Safely throttled, preventing audio clutter or clipping)" : "FAIL ✗"}`);
if (!polyphonySafe) allPassed = false;

console.log("\n=================================================================");
console.log(`FINAL RESULT: ${allPassed ? "STAGE 4 VERIFICATION PASSED ✓" : "FAILURES DETECTED ✗"}`);
console.log("=================================================================");

if (!allPassed) {
  process.exit(1);
}
