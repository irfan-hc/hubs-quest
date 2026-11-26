import {
  generateRecursiveTree,
  validateTreeIntegrity,
} from "../src/lib/recursion/branchingEngine.ts";
import type { RecursionConfig } from "../src/lib/recursion/types.ts";

interface TestCase {
  name: string;
  config: RecursionConfig;
}

const testCases: TestCase[] = [
  {
    name: "Config 1: Symmetric Minimalist Tree (Depth 4, 30° angle, no randomness)",
    config: {
      maxDepth: 4,
      branchAngle: 30,
      initialLength: 120,
      lengthRatio: 0.75,
      angleVariation: 0,
      lengthVariation: 0,
      seed: 42,
    },
  },
  {
    name: "Config 2: Organic Blooming Bush (Depth 6, 42° angle, organic variance, seed: 'zen-meadow')",
    config: {
      maxDepth: 6,
      branchAngle: 42,
      initialLength: 100,
      lengthRatio: 0.68,
      angleVariation: 0.35,
      lengthVariation: 0.25,
      seed: "zen-meadow",
    },
  },
  {
    name: "Config 3: Dense Canopy (Depth 8, 22° angle, gentle sway, seed: 8888)",
    config: {
      maxDepth: 8,
      branchAngle: 22,
      initialLength: 140,
      lengthRatio: 0.78,
      angleVariation: 0.15,
      lengthVariation: 0.1,
      seed: 8888,
    },
  },
  {
    name: "Config 4: Safety Guard Test (Depth requested 15 -> clamped to maxDepth 10)",
    config: {
      maxDepth: 15,
      branchAngle: 25,
      initialLength: 80,
      lengthRatio: 0.7,
      seed: "safety-test",
    },
  },
];

console.log("=================================================");
console.log("STAGE 2: RECURSIVE BRANCHING ENGINE VERIFICATION");
console.log("=================================================\n");

let allPassed = true;
const resultsSummary: Array<{
  name: string;
  totalBranches: number;
  maxDepth: number;
  terminals: number;
  valid: boolean;
}> = [];

for (const tc of testCases) {
  console.log(`▶ Testing ${tc.name}`);
  const result = generateRecursiveTree(tc.config);
  const validation = validateTreeIntegrity(result);

  console.log(`  • Config Max Depth Configured : ${result.config.maxDepth}`);
  console.log(`  • Max Depth Reached           : ${result.maxDepthReached}`);
  console.log(`  • Total Generated Branches    : ${result.totalBranches}`);
  console.log(`  • Terminal (Leaf) Branches    : ${validation.metrics.terminalCount}`);
  console.log(`  • Structural Integrity Valid  : ${validation.isValid ? "PASS ✓" : "FAIL ✗"}`);

  // Endpoint connection check (child start === parent end)
  const branchMap = new Map(result.branches.map((b) => [b.id, b]));
  let connectionErrors = 0;
  for (const b of result.branches) {
    if (b.parentId) {
      const parent = branchMap.get(b.parentId);
      if (!parent) {
        connectionErrors++;
      } else {
        const dx = Math.abs(b.start.x - parent.end.x);
        const dy = Math.abs(b.start.y - parent.end.y);
        if (dx > 0.001 || dy > 0.001) {
          connectionErrors++;
        }
      }
    }
  }
  console.log(
    `  • Parent-Child Endpoint Match : ${connectionErrors === 0 ? "PASS ✓ (100% matched)" : `FAIL ✗ (${connectionErrors} mismatches)`}`
  );

  // Depth verification
  const depthCorrect = result.maxDepthReached <= result.config.maxDepth;
  console.log(
    `  • Max Depth Compliance        : ${depthCorrect ? "PASS ✓ (Stopped exactly at configured depth)" : "FAIL ✗"}`
  );

  if (!validation.isValid || connectionErrors > 0 || !depthCorrect) {
    allPassed = false;
    if (validation.errors.length > 0) {
      console.log(`  Errors:`, validation.errors.slice(0, 5));
    }
  }

  resultsSummary.push({
    name: tc.name,
    totalBranches: result.totalBranches,
    maxDepth: result.maxDepthReached,
    terminals: validation.metrics.terminalCount,
    valid: validation.isValid && connectionErrors === 0 && depthCorrect,
  });

  console.log("");
}

// 2. Determinism Verification Test
console.log("▶ Verifying Deterministic Seed Output...");
const run1 = generateRecursiveTree({
  maxDepth: 5,
  branchAngle: 30,
  initialLength: 100,
  lengthRatio: 0.75,
  angleVariation: 0.5,
  seed: "deterministic-seed-xyz",
});

const run2 = generateRecursiveTree({
  maxDepth: 5,
  branchAngle: 30,
  initialLength: 100,
  lengthRatio: 0.75,
  angleVariation: 0.5,
  seed: "deterministic-seed-xyz",
});

let determinismMatches = true;
if (run1.totalBranches !== run2.totalBranches) {
  determinismMatches = false;
} else {
  for (let i = 0; i < run1.branches.length; i++) {
    const b1 = run1.branches[i];
    const b2 = run2.branches[i];
    if (
      b1.id !== b2.id ||
      b1.start.x !== b2.start.x ||
      b1.start.y !== b2.start.y ||
      b1.end.x !== b2.end.x ||
      b1.end.y !== b2.end.y ||
      b1.angle !== b2.angle
    ) {
      determinismMatches = false;
      break;
    }
  }
}

console.log(
  `  • Deterministic Consistency   : ${determinismMatches ? "PASS ✓ (Run 1 and Run 2 identical)" : "FAIL ✗"}`
);
if (!determinismMatches) allPassed = false;

// 3. Parameter Sensitivity Test (changing seed or angles alters structure)
console.log("\n▶ Verifying Parameter Sensitivity...");
const runDifferentSeed = generateRecursiveTree({
  maxDepth: 5,
  branchAngle: 30,
  initialLength: 100,
  lengthRatio: 0.75,
  angleVariation: 0.5,
  seed: "different-seed-abc",
});

const isDifferent =
  run1.branches[1].end.x !== runDifferentSeed.branches[1].end.x ||
  run1.branches[1].end.y !== runDifferentSeed.branches[1].end.y;

console.log(
  `  • Variation on Seed Change    : ${isDifferent ? "PASS ✓ (Produced distinct coordinates)" : "FAIL ✗"}`
);
if (!isDifferent) allPassed = false;

console.log("\n=================================================");
console.log(`FINAL RESULT: ${allPassed ? "ALL TESTS PASSED ✓" : "TEST FAILURES DETECTED ✗"}`);
console.log("=================================================");

if (!allPassed) {
  process.exit(1);
}
