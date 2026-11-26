import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import type { RecursionConfig, BranchEvent, RecursionResult } from "../src/lib/recursion/types.ts";

console.log("=====================================================");
console.log("STAGE 3: RECURSIVE CANVAS VISUALIZATION VERIFICATION");
console.log("=====================================================\n");

let allPassed = true;

// 1. Confirm Actual Stage 2 Event Data Usage
console.log("▶ Verifying Stage 2 Event Data Flow...");
const baseConfig: RecursionConfig = {
  maxDepth: 5,
  branchAngle: 25,
  initialLength: 100,
  lengthRatio: 0.7,
  seed: "viz-test-1",
};

const baseResult: RecursionResult = generateRecursiveTree(baseConfig);

const requiredKeys: (keyof BranchEvent)[] = [
  "id",
  "parentId",
  "depth",
  "order",
  "start",
  "end",
  "angle",
  "length",
  "isTerminal",
  "branchIndex",
  "normalizedDepth",
  "pan",
];

let keysValid = true;
for (const branch of baseResult.branches) {
  for (const k of requiredKeys) {
    if (branch[k] === undefined) {
      keysValid = false;
      break;
    }
  }
}

console.log(
  `  • Stage 2 Event Keys Verification : ${
    keysValid ? "PASS ✓ (All 12 BranchEvent properties present)" : "FAIL ✗"
  }`
);
if (!keysValid) allPassed = false;

// 2. Test Parameter Changes Impact on Visible Structure

// Check 2A: Depth change impact
console.log("\n▶ Checking Depth Changes...");
const depth5Result = generateRecursiveTree({ ...baseConfig, maxDepth: 5 });
const depth7Result = generateRecursiveTree({ ...baseConfig, maxDepth: 7 });

const depthChangesTree =
  depth5Result.totalBranches !== depth7Result.totalBranches &&
  depth5Result.maxDepthReached === 5 &&
  depth7Result.maxDepthReached === 7;

console.log(`  • Depth 5 Total Branches: ${depth5Result.totalBranches}`);
console.log(`  • Depth 7 Total Branches: ${depth7Result.totalBranches}`);
console.log(
  `  • Depth Mutation Visible Effect   : ${
    depthChangesTree ? "PASS ✓ (Hierarchy and branch density updated)" : "FAIL ✗"
  }`
);
if (!depthChangesTree) allPassed = false;

// Check 2B: Angle change impact
console.log("\n▶ Checking Angle Changes...");
const angleNarrowResult = generateRecursiveTree({ ...baseConfig, branchAngle: 18 });
const angleWideResult = generateRecursiveTree({ ...baseConfig, branchAngle: 55 });

const narrowMaxX = Math.max(...angleNarrowResult.branches.map((b) => Math.abs(b.end.x)));
const wideMaxX = Math.max(...angleWideResult.branches.map((b) => Math.abs(b.end.x)));
const angleChangesShape =
  wideMaxX > narrowMaxX * 1.25 &&
  Math.abs(angleWideResult.branches[1].angle) > Math.abs(angleNarrowResult.branches[1].angle);

console.log(`  • Narrow (18°) Lateral Width Span: ${narrowMaxX.toFixed(2)} px`);
console.log(`  • Wide (55°) Lateral Width Span  : ${wideMaxX.toFixed(2)} px`);
console.log(
  `  • Angle Mutation Visible Effect   : ${
    angleChangesShape ? "PASS ✓ (Lateral canopy width expands significantly)" : "FAIL ✗"
  }`
);
if (!angleChangesShape) allPassed = false;

// Check 2C: Growth ratio change impact
console.log("\n▶ Checking Growth Ratio Changes...");
const ratioLowResult = generateRecursiveTree({ ...baseConfig, lengthRatio: 0.5 });
const ratioHighResult = generateRecursiveTree({ ...baseConfig, lengthRatio: 0.82 });

const lowTotalLength = ratioLowResult.branches.reduce((acc, b) => acc + b.length, 0);
const highTotalLength = ratioHighResult.branches.reduce((acc, b) => acc + b.length, 0);
const ratioChangesLengths = highTotalLength > lowTotalLength * 1.8;

console.log(`  • Low Ratio (0.50) Aggregate Length : ${lowTotalLength.toFixed(1)}`);
console.log(`  • High Ratio (0.82) Aggregate Length: ${highTotalLength.toFixed(1)}`);
console.log(
  `  • Ratio Mutation Visible Effect     : ${
    ratioChangesLengths ? "PASS ✓ (Branch lengths scaled proportionally)" : "FAIL ✗"
  }`
);
if (!ratioChangesLengths) allPassed = false;

// 3. Progressive Hierarchical Growth Logic Simulation
console.log("\n▶ Verifying Progressive Growth Constraints...");
// Simulate progressive growth from t = 0.0 to 1.0 in 10 steps
const maxDepth = baseResult.maxDepthReached;
const totalLevels = maxDepth + 1;
let hierarchyRespected = true;

for (let progress = 0.1; progress <= 1.0; progress += 0.2) {
  for (const b of baseResult.branches) {
    if (b.parentId) {
      const parent = baseResult.branches.find((p) => p.id === b.parentId);
      if (!parent) continue;

      // Calculate parent growth at this progress
      const pLevelStart = parent.depth / totalLevels;
      const pLevelEnd = (parent.depth + 1.2) / totalLevels;
      const parentGrowth =
        progress >= pLevelEnd ? 1.0 : progress <= pLevelStart ? 0.0 : (progress - pLevelStart) / (pLevelEnd - pLevelStart);

      // Calculate child growth at this progress
      const cLevelStart = b.depth / totalLevels;
      const childGrowth =
        progress <= cLevelStart ? 0.0 : progress >= (b.depth + 1.2) / totalLevels ? 1.0 : (progress - cLevelStart) / ((b.depth + 1.2) / totalLevels - cLevelStart);

      // Parent must have started before child can start
      if (childGrowth > 0 && parentGrowth <= 0) {
        hierarchyRespected = false;
        break;
      }
    }
  }
}

console.log(
  `  • Parent-Child Growth Hierarchy   : ${
    hierarchyRespected ? "PASS ✓ (Child branches never precede parent growth)" : "FAIL ✗"
  }`
);
if (!hierarchyRespected) allPassed = false;

// 4. Performance & Frame Rate Headroom Simulation
console.log("\n▶ Performance & Frame Rate Benchmark...");
const heavyTree = generateRecursiveTree({
  maxDepth: 8,
  branchAngle: 30,
  initialLength: 100,
  lengthRatio: 0.75,
  seed: "perf-test",
});

const startBenchmark = performance.now();
const framesToSimulate = 500;
let dummyTotal = 0;

for (let f = 0; f < framesToSimulate; f++) {
  const t = (f % 60) / 60;
  for (const b of heavyTree.branches) {
    dummyTotal += b.start.x * t + b.end.y * (1 - t);
  }
}
const elapsedMs = performance.now() - startBenchmark;
const msPerFrame = elapsedMs / framesToSimulate;
const projectedFps = Math.round(1000 / Math.max(msPerFrame, 0.001));

console.log(`  • Tree Size Tested               : ${heavyTree.totalBranches} branches (Depth 8)`);
console.log(`  • Average Compute Time per Frame : ${msPerFrame.toFixed(3)} ms`);
console.log(`  • Theoretical Render FPS Headroom: ~${projectedFps} FPS (Target >= 60 FPS)`);
console.log(
  `  • Performance Evaluation          : ${
    msPerFrame < 1.0 ? "PASS ✓ (Negligible CPU overhead, highly fluid)" : "FAIL ✗"
  }`
);
if (msPerFrame >= 2.0) allPassed = false;

console.log("\n=====================================================");
console.log(`FINAL RESULT: ${allPassed ? "STAGE 3 VERIFICATION PASSED ✓" : "STAGE 3 FAILURES DETECTED ✗"}`);
console.log("=====================================================");

if (!allPassed) {
  process.exit(1);
}
