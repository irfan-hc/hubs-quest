import { PRESET_LIST, PRESETS, matchActivePreset } from "../src/lib/presets/presets.ts";
import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import { mapRecursionToMusic } from "../src/lib/audio/musicMapper.ts";
import { renderCompositionToWav } from "../src/lib/audio/wavExporter.ts";
import type { PresetId } from "../src/lib/presets/types.ts";

console.log("=================================================================");
console.log("STAGE 7: PRESETS & FINAL INTERFACE POLISH VERIFICATION SUITE");
console.log("=================================================================\n");

let allPassed = true;

async function runTests() {
  // Test 1: Verify all 4 Presets (Forest, Cosmic, Zen, Dream)
  console.log("▶ [Test 1] Testing All 4 Presets (Geometry, Scale, Pacing & Audio Export)...");

  for (const preset of PRESET_LIST) {
    console.log(`\n  • Evaluating Preset: "${preset.name}" (${preset.tagline})`);
    console.log(`    - Config: Depth ${preset.config.maxDepth}, Angle ${preset.config.branchAngle}°, Length ${preset.config.initialLength}, Ratio ${preset.config.lengthRatio}`);
    console.log(`    - Audio: Scale "${preset.audio.scale}", Tempo ${preset.audio.tempo} BPM, Reverb ${preset.audio.reverb}%`);

    // 1. Generate Tree
    const tree = generateRecursiveTree(preset.config);
    console.log(`    - Generated Branches: ${tree.totalBranches} (Max Depth Reached: ${tree.maxDepthReached})`);

    const treeValid = tree.totalBranches > 0 && tree.maxDepthReached === preset.config.maxDepth;
    if (!treeValid) {
      console.log(`    - Tree Generation: FAIL ✗`);
      allPassed = false;
    } else {
      console.log(`    - Tree Generation: PASS ✓`);
    }

    // 2. Generate Composition from Tree
    const comp = mapRecursionToMusic(tree, {
      scale: preset.audio.scale,
      tempoBpm: preset.audio.tempo,
      totalDurationSec: 9.0,
    });

    console.log(`    - Generated Musical Events: ${comp.events.length} (Duration: ${comp.totalDuration.toFixed(2)}s, Scale: ${comp.scaleName})`);
    const compValid = comp.events.length > 0 && comp.scaleKey === preset.audio.scale;
    if (!compValid) {
      console.log(`    - Composition Generation: FAIL ✗`);
      allPassed = false;
    } else {
      console.log(`    - Composition Generation: PASS ✓`);
    }

    // 3. Verify Active Branch Synchronization Integrity
    const branchIdSet = new Set(tree.branches.map((b) => b.id));
    let allActiveValid = true;
    for (const evt of comp.events) {
      if (!branchIdSet.has(evt.branchId)) {
        allActiveValid = false;
        break;
      }
    }
    console.log(`    - Branch Event ID Mapping: ${allActiveValid ? "PASS ✓ (100% of notes map to valid branches)" : "FAIL ✗"}`);
    if (!allActiveValid) allPassed = false;

    // 4. Render WAV Export
    const exportResult = await renderCompositionToWav(comp, {
      sampleRate: 44100,
      volume: preset.audio.volume / 100,
      reverb: preset.audio.reverb / 100,
      filename: `soundscape-${preset.id}.wav`,
    });

    const meta = exportResult.metadata;
    const exportValid =
      meta.chunkId === "RIFF" &&
      meta.format === "WAVE" &&
      meta.rmsAmplitude > 0.02 &&
      meta.peakAmplitude > 0.15 &&
      exportResult.sizeBytes > 500000;

    console.log(`    - WAV Export (${(exportResult.sizeBytes / (1024 * 1024)).toFixed(2)} MB, RMS: ${meta.rmsAmplitude}): ${exportValid ? "PASS ✓" : "FAIL ✗"}`);
    if (!exportValid) allPassed = false;
  }

  // Test 2: Verify Presets Produce Distinct Structures & Musical Characteristics
  console.log("\n▶ [Test 2] Cross-Preset Distinction Verification...");
  const treeZen = generateRecursiveTree(PRESETS.zen.config);
  const treeForest = generateRecursiveTree(PRESETS.forest.config);
  const treeCosmic = generateRecursiveTree(PRESETS.cosmic.config);
  const treeDream = generateRecursiveTree(PRESETS.dream.config);

  const compZen = mapRecursionToMusic(treeZen, { scale: PRESETS.zen.audio.scale, tempoBpm: PRESETS.zen.audio.tempo });
  const compForest = mapRecursionToMusic(treeForest, { scale: PRESETS.forest.audio.scale, tempoBpm: PRESETS.forest.audio.tempo });
  const compCosmic = mapRecursionToMusic(treeCosmic, { scale: PRESETS.cosmic.audio.scale, tempoBpm: PRESETS.cosmic.audio.tempo });
  const compDream = mapRecursionToMusic(treeDream, { scale: PRESETS.dream.audio.scale, tempoBpm: PRESETS.dream.audio.tempo });

  const distinctDepths =
    treeZen.maxDepthReached === 5 &&
    treeForest.maxDepthReached === 6 &&
    treeCosmic.maxDepthReached === 6;

  const distinctScales =
    compZen.scaleKey === "pentatonic" &&
    compForest.scaleKey === "dorian" &&
    compCosmic.scaleKey === "lydian" &&
    compDream.scaleKey === "ambient";

  const distinctTempos =
    compZen.tempoBpm === 46 &&
    compForest.tempoBpm === 56 &&
    compCosmic.tempoBpm === 68 &&
    compDream.tempoBpm === 50;

  console.log(`  • Structural Differentiation  : ${distinctDepths ? "PASS ✓ (Zen 5-depth vs Canopy 6-depth)" : "FAIL ✗"}`);
  console.log(`  • Musical Scale Diversity     : ${distinctScales ? "PASS ✓ (Pentatonic, Dorian, Lydian, Ambient)" : "FAIL ✗"}`);
  console.log(`  • Tempo Pacing Differentiation: ${distinctTempos ? "PASS ✓ (46 BPM to 68 BPM)" : "FAIL ✗"}`);

  if (!distinctDepths || !distinctScales || !distinctTempos) allPassed = false;

  // Test 3: Manual Tuning Override Detection (matchActivePreset -> "custom")
  console.log("\n▶ [Test 3] Preset State & Manual Tuning Detection...");

  // Match Zen preset exactly
  const exactMatchZen = matchActivePreset(PRESETS.zen.config, {
    scale: PRESETS.zen.audio.scale,
    tempo: PRESETS.zen.audio.tempo,
    reverb: PRESETS.zen.audio.reverb,
  });
  console.log(`  • Exact Zen Match Result      : "${exactMatchZen}" (${exactMatchZen === "zen" ? "PASS ✓" : "FAIL ✗"})`);
  if (exactMatchZen !== "zen") allPassed = false;

  // Modify branchAngle by 2 degrees -> should change to "custom"
  const modifiedConfig = { ...PRESETS.zen.config, branchAngle: PRESETS.zen.config.branchAngle + 2 };
  const customMatchAngle = matchActivePreset(modifiedConfig, {
    scale: PRESETS.zen.audio.scale,
    tempo: PRESETS.zen.audio.tempo,
    reverb: PRESETS.zen.audio.reverb,
  });
  console.log(`  • Angle Modified Match Result : "${customMatchAngle}" (${customMatchAngle === "custom" ? "PASS ✓" : "FAIL ✗"})`);
  if (customMatchAngle !== "custom") allPassed = false;

  // Modify tempo by 5 BPM -> should change to "custom"
  const customMatchTempo = matchActivePreset(PRESETS.zen.config, {
    scale: PRESETS.zen.audio.scale,
    tempo: PRESETS.zen.audio.tempo + 5,
    reverb: PRESETS.zen.audio.reverb,
  });
  console.log(`  • Tempo Modified Match Result : "${customMatchTempo}" (${customMatchTempo === "custom" ? "PASS ✓" : "FAIL ✗"})`);
  if (customMatchTempo !== "custom") allPassed = false;

  // Modify scale -> should change to "custom"
  const customMatchScale = matchActivePreset(PRESETS.zen.config, {
    scale: "dorian",
    tempo: PRESETS.zen.audio.tempo,
    reverb: PRESETS.zen.audio.reverb,
  });
  console.log(`  • Scale Modified Match Result : "${customMatchScale}" (${customMatchScale === "custom" ? "PASS ✓" : "FAIL ✗"})`);
  if (customMatchScale !== "custom") allPassed = false;

  console.log("\n=================================================================");
  console.log(`FINAL RESULT: ${allPassed ? "STAGE 7 PRESETS & POLISH VERIFICATION PASSED ✓" : "FAILURES DETECTED ✗"}`);
  console.log("=================================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
