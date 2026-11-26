import type {
  BranchEvent,
  Point2D,
  RecursionConfig,
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

/**
 * Generates structured recursive branching event data.
 *
 * Genuine recursive implementation with configurable depth, branching angles,
 * growth ratios, and deterministic random variation.
 *
 * @param config User configuration parameters
 * @returns Structured RecursionResult containing all BranchEvents
 */
export function generateRecursiveTree(
  config: RecursionConfig
): RecursionResult {
  // Safety clamps and defaults
  const maxDepth = clamp(Math.floor(config.maxDepth), 0, 10);
  const branchAngle = clamp(config.branchAngle, 5, 85);
  const initialLength = Math.max(config.initialLength, 10);
  const lengthRatio = clamp(config.lengthRatio, 0.2, 0.95);
  const angleVariation = clamp(config.angleVariation ?? 0, 0, 1);
  const lengthVariation = clamp(config.lengthVariation ?? 0, 0, 1);
  const seed = config.seed ?? 1337;
  const origin: Point2D = config.origin ?? { x: 0, y: 0 };
  const initialAngle = config.initialAngle ?? -90; // Default upwards in screen coordinates
  const maxBranchLimit = clamp(config.maxBranchLimit ?? 4096, 1, 8192);

  const resolvedConfig: Required<RecursionConfig> = {
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

  /**
   * Internal genuine recursive function.
   * Traverses and instantiates each branch in creation order.
   */
  function recurseBranch(
    parentId: string | null,
    depth: number,
    start: Point2D,
    angleRad: number,
    length: number,
    branchIndex: number
  ): void {
    if (branches.length >= maxBranchLimit) {
      return;
    }

    if (depth > maxDepthReached) {
      maxDepthReached = depth;
    }

    const currentOrder = orderCounter++;
    const id = `branch-d${depth}-o${currentOrder}`;

    // Calculate endpoint based on trigonometry
    const endX = start.x + length * Math.cos(angleRad);
    const endY = start.y + length * Math.sin(angleRad);
    const end: Point2D = {
      x: Number(endX.toFixed(4)),
      y: Number(endY.toFixed(4)),
    };

    // Terminal condition: reached maxDepth or tiny length or reached safety limit
    const isTerminal =
      depth >= maxDepth ||
      length < 2 ||
      branches.length + 2 > maxBranchLimit;

    // Derived spatial panning hint based on angle orientation relative to upward axis
    // -1 = hard left, 0 = center, +1 = hard right
    const pan = clamp(Math.sin(angleRad - degToRad(initialAngle)), -1, 1);

    const event: BranchEvent = {
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
    };

    branches.push(event);

    // If terminal, unwind recursion
    if (isTerminal) {
      return;
    }

    // Recursive step: binary branching (Left & Right children)
    const childDepth = depth + 1;
    const baseAngleDelta = degToRad(branchAngle);

    // Child 0: Left Branch (-angle offset + controlled noise)
    const leftNoise = (prng() - 0.5) * 2 * degToRad(branchAngle * angleVariation * 0.5);
    const leftAngle = angleRad - baseAngleDelta + leftNoise;
    const leftLengthScale = 1 + (prng() - 0.5) * lengthVariation * 0.4;
    const leftLength = length * lengthRatio * Math.max(0.1, leftLengthScale);

    recurseBranch(id, childDepth, end, leftAngle, leftLength, 0);

    // Child 1: Right Branch (+angle offset + controlled noise)
    const rightNoise = (prng() - 0.5) * 2 * degToRad(branchAngle * angleVariation * 0.5);
    const rightAngle = angleRad + baseAngleDelta + rightNoise;
    const rightLengthScale = 1 + (prng() - 0.5) * lengthVariation * 0.4;
    const rightLength = length * lengthRatio * Math.max(0.1, rightLengthScale);

    recurseBranch(id, childDepth, end, rightAngle, rightLength, 1);
  }

  // Root trunk initiation
  recurseBranch(
    null,
    0,
    origin,
    degToRad(initialAngle),
    initialLength,
    0
  );

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

    // Check finite numbers
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

    // Check depth bounds
    if (b.depth < 0 || b.depth > result.config.maxDepth) {
      errors.push(
        `Branch ${b.id} depth ${b.depth} exceeds configured maxDepth ${result.config.maxDepth}`
      );
    }

    // Check parent validity
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
