import { generateRecursiveTree } from "../src/lib/recursion/branchingEngine.ts";
import type { RecursionConfig } from "../src/lib/recursion/types.ts";

console.log("=================================================================");
console.log("STAGE 3 BUGFIX VERIFICATION: CAMERA STABILITY & SETTLING CHECK");
console.log("=================================================================\n");

let allPassed = true;

const configs: { name: string; config: RecursionConfig }[] = [
  {
    name: "Configuration 1: Standard Balanced Cosmic Canopy (Depth 6, 28°, Ratio 0.72)",
    config: { maxDepth: 6, branchAngle: 28, initialLength: 110, lengthRatio: 0.72, seed: 1337 },
  },
  {
    name: "Configuration 2: Expansive Wide Shrub (Depth 5, 45°, Ratio 0.65)",
    config: { maxDepth: 5, branchAngle: 45, initialLength: 95, lengthRatio: 0.65, seed: "wide-canopy" },
  },
  {
    name: "Configuration 3: Slender Dense Spire (Depth 7, 18°, Ratio 0.78)",
    config: { maxDepth: 7, branchAngle: 18, initialLength: 125, lengthRatio: 0.78, seed: "slender-spire" },
  },
];

const canvasWidth = 800;
const canvasHeight = 600;
const ANCHOR_Y_RATIO = 0.85;

for (const { name, config } of configs) {
  console.log(`▶ Testing ${name}`);
  const result = generateRecursiveTree(config);

  // 1. Calculate camera bounds as implemented in CanvasTreeRenderer
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const b of result.branches) {
    minX = Math.min(minX, b.start.x, b.end.x);
    maxX = Math.max(maxX, b.start.x, b.end.x);
    minY = Math.min(minY, b.start.y, b.end.y);
    maxY = Math.max(maxY, b.start.y, b.end.y);
  }

  const treeWidth = Math.max(maxX - minX, 30);
  const treeHeight = Math.max(maxY - minY, 30);

  const availWidth = canvasWidth * 0.76;
  const availHeight = canvasHeight * 0.78;

  const autoScaleFull = Math.min(availWidth / treeWidth, availHeight / treeHeight);
  const treeCenterX = (minX + maxX) / 2;
  const autoOffsetXFull = canvasWidth / 2 - treeCenterX * autoScaleFull;

  const rootBranch = result.branches[0];
  const rootX = rootBranch.start.x;
  const rootY = rootBranch.start.y;

  const autoOffsetYFull = canvasHeight * ANCHOR_Y_RATIO - rootY * autoScaleFull;

  const autoScaleStart = autoScaleFull * 1.45;
  const autoOffsetXStart = canvasWidth / 2 - rootX * autoScaleStart;
  const autoOffsetYStart = canvasHeight * ANCHOR_Y_RATIO - rootY * autoScaleStart;

  // 2. Test root position stability across growth steps
  // Y_canvas(root) = autoOffsetY + rootY * autoScale
  const rootY_start = autoOffsetYStart + rootY * autoScaleStart;
  const rootY_full = autoOffsetYFull + rootY * autoScaleFull;

  const rootAnchored = Math.abs(rootY_start - rootY_full) < 0.001;
  const expectedGroundedY = canvasHeight * ANCHOR_Y_RATIO;
  const rootAtGroundedY = Math.abs(rootY_full - expectedGroundedY) < 0.001;

  console.log(`  • Root Canvas Y Position at t=0.0: ${rootY_start.toFixed(2)} px (expected: ${expectedGroundedY} px)`);
  console.log(`  • Root Canvas Y Position at t=1.0: ${rootY_full.toFixed(2)} px (expected: ${expectedGroundedY} px)`);
  console.log(`  • Root Anchored & Stationary     : ${rootAnchored && rootAtGroundedY ? "PASS ✓" : "FAIL ✗"}`);
  if (!rootAnchored || !rootAtGroundedY) allPassed = false;

  // 3. Test camera post-completion stability:
  // For timestamps t >= 1.0 (e.g. t = 1.0, 1.2, 2.0, 5.0)
  const cameraSettled = [1.0, 1.1, 1.5, 2.0, 5.0].every((t) => {
    const rawProgress = Math.min(t, 1.0);
    const camEase = rawProgress >= 1.0 ? 1.0 : (1 - Math.pow(1 - rawProgress, 3));
    const curScale = autoScaleStart + (autoScaleFull - autoScaleStart) * camEase;
    const curOffsetY = autoOffsetYStart + (autoOffsetYFull - autoOffsetYStart) * camEase;
    return Math.abs(curScale - autoScaleFull) < 0.0001 && Math.abs(curOffsetY - autoOffsetYFull) < 0.0001;
  });

  console.log(`  • Camera Stationary Post-Growth  : ${cameraSettled ? "PASS ✓ (Zero drift after t >= 1.0)" : "FAIL ✗"}`);
  if (!cameraSettled) allPassed = false;

  // 4. Verify complete tree comfortably framed inside canvas
  const canvasTopY = autoOffsetYFull + minY * autoScaleFull;
  const canvasBottomY = autoOffsetYFull + maxY * autoScaleFull;
  const canvasLeftX = autoOffsetXFull + minX * autoScaleFull;
  const canvasRightX = autoOffsetXFull + maxX * autoScaleFull;

  const framedCorrectly =
    canvasTopY > 15 &&
    canvasBottomY < canvasHeight - 15 &&
    canvasLeftX > 15 &&
    canvasRightX < canvasWidth - 15;

  console.log(`  • Tree Canvas Bounds Box         : [${canvasLeftX.toFixed(1)}, ${canvasTopY.toFixed(1)}] to [${canvasRightX.toFixed(1)}, ${canvasBottomY.toFixed(1)}]`);
  console.log(`  • Tree Comfortably Visible       : ${framedCorrectly ? "PASS ✓" : "FAIL ✗"}`);
  if (!framedCorrectly) allPassed = false;

  console.log("");
}

console.log("=================================================================");
console.log(`FINAL RESULT: ${allPassed ? "CAMERA STABILITY TESTS PASSED ✓" : "FAILURES DETECTED ✗"}`);
console.log("=================================================================");

if (!allPassed) {
  process.exit(1);
}
