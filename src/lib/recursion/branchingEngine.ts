import type {
  BranchEvent,
  Point2D,
  RecursionConfig,
  RecursionPatternType,
  RecursionResult,
} from "./types";

/**
 * FNV-1a 32-bit hash function to convert string seeds to integers.
 */
function hashSeed(input: string | number): number {
  if (typeof input === "number") {
    return Math.floor(input) || 1;
  }
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

/**
 * Deterministic PRNG using Mulberry32 algorithm.
 * Produces uniform pseudo-random floats in [0, 1).
 */
export function createPRNG(seedInput: number | string = 42): () => number {
  let s = hashSeed(seedInput);
  return function mulberry32(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts degrees to radians.
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Clamps a number between min and max.
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const GOLDEN_ANGLE_RAD = (137.507764 * Math.PI) / 180;

/**
 * Generates structured recursive branching event data across 5 distinct topologies:
 * - "binary":  Classic symmetric binary split (backward-compatible default)
 * - "organic": Asymmetric trunk continuation + variable lateral shoots
 * - "crystal": Genuine 6-fold hexagonal recursive symmetry
 * - "coral":   Irregular clustered reef-like branching with variable density
 * - "spiral":  Golden-angle / logarithmic spiral progression with nested offshoots
 */
export function generateRecursiveTree(
  config: RecursionConfig
): RecursionResult {
  const patternType: RecursionPatternType = config.patternType ?? "binary";
  const maxDepth = clamp(Math.floor(config.maxDepth), 0, 10);
  const branchAngle = clamp(config.branchAngle, 5, 85);
  const initialLength = Math.max(config.initialLength, 10);
  const lengthRatio = clamp(config.lengthRatio, 0.2, 0.95);
  const angleVariation = clamp(config.angleVariation ?? 0, 0, 1);
  const lengthVariation = clamp(config.lengthVariation ?? 0, 0, 1);
  const seed = config.seed ?? 1337;
  const origin: Point2D = config.origin ?? { x: 0, y: 0 };
  const initialAngle = config.initialAngle ?? -90;
  const maxBranchLimit = clamp(config.maxBranchLimit ?? 4096, 1, 8192);

  const resolvedConfig: Required<RecursionConfig> = {
    patternType,
    maxDepth,
    branchAngle,
    initialLength,
    lengthRatio,
    angleVariation,
    lengthVariation,
    seed,
    origin,
    initialAngle,
    maxBranchLimit,
  };

  const prng = createPRNG(seed);
  const branches: BranchEvent[] = [];
  let maxDepthReached = 0;
  let orderCounter = 0;

  function emitBranch(
    parentId: string | null,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number,
    forceTerminal: boolean = false
  ): { id: string; end: Point2D; isTerminal: boolean } | null {
    if (branches.length >= maxBranchLimit) {
      return null;
    }

    if (depth > maxDepthReached) {
      maxDepthReached = depth;
    }

    const currentOrder = orderCounter++;
    const id = `branch-d${depth}-o${currentOrder}`;

    const endX = start.x + length * Math.cos(angleRad);
    const endY = start.y + length * Math.sin(angleRad);
    const end: Point2D = {
      x: Number(endX.toFixed(4)),
      y: Number(endY.toFixed(4)),
    };

    const isTerminal =
      forceTerminal ||
      depth >= maxDepth ||
      length < 2 ||
      branches.length + 2 > maxBranchLimit;

    const pan = clamp(Math.sin(angleRad - degToRad(initialAngle)), -1, 1);

    branches.push({
      id,
      parentId,
      depth,
      order: currentOrder,
      start,
      end,
      angle: Number(angleRad.toFixed(6)),
      length: Number(length.toFixed(4)),
      isTerminal,
      branchIndex,
      normalizedDepth: maxDepth > 0 ? Number((depth / maxDepth).toFixed(4)) : 0,
      pan: Number(pan.toFixed(4)),
    });

    return { id, end, isTerminal };
  }

  // 1. BINARY (Classic symmetric 2-child split — preserved exactly)
  function recurseBinary(
    parentId: string | null,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number
  ): void {
    const node = emitBranch(parentId, depth, start, angleRad, length, branchIndex);
    if (!node || node.isTerminal) return;

    const childDepth = depth + 1;
    const baseAngleDelta = degToRad(branchAngle);

    const leftNoise = (prng() - 0.5) * 2 * degToRad(branchAngle * angleVariation * 0.5);
    const leftAngle = angleRad - baseAngleDelta + leftNoise;
    const leftLengthScale = 1 + (prng() - 0.5) * lengthVariation * 0.4;
    recurseBinary(node.id, childDepth, node.end, leftAngle, length * lengthRatio * Math.max(0.1, leftLengthScale), 0);

    const rightNoise = (prng() - 0.5) * 2 * degToRad(branchAngle * angleVariation * 0.5);
    const rightAngle = angleRad + baseAngleDelta + rightNoise;
    const rightLengthScale = 1 + (prng() - 0.5) * lengthVariation * 0.4;
    recurseBinary(node.id, childDepth, node.end, rightAngle, length * lengthRatio * Math.max(0.1, rightLengthScale), 1);
  }

  // 2. ORGANIC (Asymmetric trunk continuation + variable 1..3 lateral shoots)
  function recurseOrganic(
    parentId: string | null,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number
  ): void {
    const node = emitBranch(parentId, depth, start, angleRad, length, branchIndex);
    if (!node || node.isTerminal) return;

    const childDepth = depth + 1;
    const baseDelta = degToRad(branchAngle);
    const sway = (prng() - 0.5) * degToRad(branchAngle * (0.35 + angleVariation));

    // Primary trunk/stem continuation (longer, gentler curve)
    if (branchIndex === 0 || prng() > 0.25) {
      const contAngle = angleRad + sway * 0.45;
      const contLen = length * clamp(lengthRatio * 1.08, 0.45, 0.9);
      recurseOrganic(node.id, childDepth, node.end, contAngle, contLen, 0);
    }

    // 1 or 2 asymmetric lateral shoots
    const shootCount = prng() > 0.42 ? 2 : 1;
    const sideSign = prng() > 0.5 ? 1 : -1;
    for (let s = 0; s < shootCount; s++) {
      const dir = s === 0 ? sideSign : -sideSign;
      const shootAngle =
        angleRad +
        dir * baseDelta * (0.75 + prng() * 0.55) +
        (prng() - 0.5) * degToRad(10 * angleVariation);
      const shootLen = length * lengthRatio * (0.62 + prng() * 0.24 * (1 + lengthVariation * 0.3));
      recurseOrganic(node.id, childDepth, node.end, shootAngle, shootLen, s + 1);
    }
  }

  // 3. CRYSTAL (Genuine 6-fold hexagonal recursive symmetry in event data)
  function recurseCrystalArm(
    parentId: string,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number,
    armNoiseSeeds: number[]
  ): void {
    const node = emitBranch(parentId, depth, start, angleRad, length, branchIndex);
    if (!node || node.isTerminal) return;

    const childDepth = depth + 1;
    const crystalDelta = degToRad(clamp(branchAngle * 1.45, 25, 65));
    const deterministicScale = 1 + (armNoiseSeeds[depth % armNoiseSeeds.length] - 0.5) * lengthVariation * 0.25;

    // Central crystal spine continues along arm axis
    const spineLen = length * clamp(lengthRatio * 0.96, 0.4, 0.85) * deterministicScale;
    recurseCrystalArm(node.id, childDepth, node.end, angleRad, spineLen, 0, armNoiseSeeds);

    // Symmetric left and right crystalline frost needles (at depth <= 4 to keep crisp plates)
    if (depth <= 4) {
      const needleLen = length * lengthRatio * 0.62 * deterministicScale;
      recurseCrystalArm(node.id, childDepth, node.end, angleRad - crystalDelta, needleLen, 1, armNoiseSeeds);
      recurseCrystalArm(node.id, childDepth, node.end, angleRad + crystalDelta, needleLen, 2, armNoiseSeeds);
    }
  }

  function generateCrystal(): void {
    const armNoiseSeeds = Array.from({ length: 12 }, () => prng());
    // Depth 0: central crystal seed node
    const seedLen = Math.max(8, initialLength * 0.14);
    const rootNode = emitBranch(null, 0, origin, degToRad(initialAngle), seedLen, 0, maxDepth === 0);
    if (!rootNode || rootNode.isTerminal) return;

    // Depth 1: 6 primary hexagonal crystal arms radiating from center (0°, 60°, 120°, 180°, 240°, 300°)
    const primaryLen = initialLength * 0.72;
    for (let arm = 0; arm < 6; arm++) {
      const armAngle = degToRad(initialAngle) + (arm * Math.PI) / 3;
      recurseCrystalArm(rootNode.id, 1, origin, armAngle, primaryLen, arm, armNoiseSeeds);
    }
  }

  // 4. CORAL (Irregular, clustered reef branching with variable density & polyps)
  function recurseCoral(
    parentId: string | null,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number,
    clusterBias: number
  ): void {
    const node = emitBranch(parentId, depth, start, angleRad, length, branchIndex);
    if (!node || node.isTerminal) return;

    const childDepth = depth + 1;
    // Coral clusters heavily at mid-depths (2..4) and tapers at outer tips
    const clusterRoll = prng();
    const childCount =
      depth >= 1 && depth <= 3 && clusterRoll > 0.35
        ? 3
        : clusterRoll > 0.22
        ? 2
        : 1;

    const spread = degToRad(branchAngle * (0.9 + angleVariation * 0.5));
    for (let c = 0; c < childCount; c++) {
      const offsetNorm = childCount === 1 ? 0 : (c / (childCount - 1) - 0.5) * 2;
      const jitter = (prng() - 0.5) * degToRad(18 + branchAngle * angleVariation);
      const nextAngle = angleRad + offsetNorm * spread + clusterBias * 0.25 + jitter;
      const nextLen = length * clamp(lengthRatio * (0.7 + prng() * 0.38), 0.35, 0.92);
      recurseCoral(node.id, childDepth, node.end, nextAngle, nextLen, c, clusterBias * 0.7 + (prng() - 0.5) * 0.3);
    }
  }

  // 5. SPIRAL (Golden-angle / logarithmic spiral progression with nested offshoots)
  function generateSpiral(): void {
    const rootAngle = degToRad(initialAngle);
    const rootNode = emitBranch(null, 0, origin, rootAngle, initialLength * 0.32, 0, maxDepth === 0);
    if (!rootNode || rootNode.isTerminal) return;

    function recurseSpiralArm(
      parentId: string,
      depth: number,
      start: Point2D,
      angleRad: number,
      length: number,
      branchIndex: number,
      turnDir: number
    ): void {
      const node = emitBranch(parentId, depth, start, angleRad, length, branchIndex);
      if (!node || node.isTerminal) return;

      const childDepth = depth + 1;
      const spiralStep = turnDir * (GOLDEN_ANGLE_RAD * 0.28 + degToRad(branchAngle) * 0.55);
      const noise = (prng() - 0.5) * degToRad(8 * angleVariation);

      // Primary logarithmic spiral continuation
      const nextAngle = angleRad + spiralStep + noise;
      const nextLen = length * clamp(lengthRatio * 1.06, 0.45, 0.9);
      recurseSpiralArm(node.id, childDepth, node.end, nextAngle, nextLen, 0, turnDir);

      // Nested secondary counter-spiral or radial offshoot
      if (depth % 2 === 1 || prng() > 0.35) {
        const subAngle = angleRad - turnDir * degToRad(branchAngle * 1.15) + noise;
        const subLen = length * lengthRatio * 0.68;
        recurseSpiralArm(node.id, childDepth, node.end, subAngle, subLen, 1, -turnDir);
      }
    }

    // Launch 3 golden-offset primary spiral arms from the core
    const armCount = 3;
    for (let a = 0; a < armCount; a++) {
      const armAngle = rootAngle + a * ((Math.PI * 2) / armCount) + (prng() - 0.5) * 0.15;
      recurseSpiralArm(rootNode.id, 1, origin, armAngle, initialLength * 0.78, a, 1);
    }
  }

  // Dispatch by patternType
  switch (patternType) {
    case "organic":
      recurseOrganic(null, 0, origin, degToRad(initialAngle), initialLength, 0);
      break;
    case "crystal":
      generateCrystal();
      break;
    case "coral":
      recurseCoral(null, 0, origin, degToRad(initialAngle), initialLength * 0.85, 0, (prng() - 0.5) * 0.4);
      break;
    case "spiral":
      generateSpiral();
      break;
    case "binary":
    default:
      recurseBinary(null, 0, origin, degToRad(initialAngle), initialLength, 0);
      break;
  }

  return {
    branches,
    maxDepthReached,
    totalBranches: branches.length,
    config: resolvedConfig,
  };
}

/**
 * Validation utility to rigorously verify tree integrity.
 */
export function validateTreeIntegrity(result: RecursionResult): {
  isValid: boolean;
  errors: string[];
  metrics: {
    totalBranches: number;
    maxDepth: number;
    terminalCount: number;
    nonTerminalCount: number;
  };
} {
  const errors: string[] = [];
  const branchMap = new Map<string, BranchEvent>();

  let terminalCount = 0;
  let nonTerminalCount = 0;

  for (const b of result.branches) {
    if (branchMap.has(b.id)) {
      errors.push(`Duplicate branch ID detected: ${b.id}`);
    }
    branchMap.set(b.id, b);

    if (
      !Number.isFinite(b.start.x) ||
      !Number.isFinite(b.start.y) ||
      !Number.isFinite(b.end.x) ||
      !Number.isFinite(b.end.y) ||
      !Number.isFinite(b.length) ||
      !Number.isFinite(b.angle)
    ) {
      errors.push(`Invalid non-finite coordinate or angle on branch ${b.id}`);
    }

    if (b.depth < 0 || b.depth > result.config.maxDepth) {
      errors.push(
        `Branch ${b.id} depth ${b.depth} exceeds configured maxDepth ${result.config.maxDepth}`
      );
    }

    if (b.depth === 0) {
      if (b.parentId !== null) {
        errors.push(`Root branch ${b.id} must have parentId null`);
      }
    } else {
      if (!b.parentId) {
        errors.push(`Child branch ${b.id} at depth ${b.depth} has null parentId`);
      } else if (!branchMap.has(b.parentId)) {
        errors.push(`Branch ${b.id} references non-existent parentId ${b.parentId}`);
      }
    }

    if (b.isTerminal) {
      terminalCount++;
    } else {
      nonTerminalCount++;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    metrics: {
      totalBranches: result.branches.length,
      maxDepth: result.maxDepthReached,
      terminalCount,
      nonTerminalCount,
    },
  };
}
