/**
 * Type definitions for the Recursive Branching Engine
 */

export interface Point2D {
  x: number;
  y: number;
}

export type RecursionPatternType =
  | "binary"
  | "organic"
  | "crystal"
  | "coral"
  | "spiral";

export interface RecursionConfig {
  /** Recursion topology mode (defaults to "binary" for backward compatibility). */
  patternType?: RecursionPatternType;
  /** Maximum recursion depth (0 = trunk only). Clamped to [0, 10] for safety. */
  maxDepth: number;
  /** Branching angle offset in degrees (e.g., 25 degrees). */
  branchAngle: number;
  /** Initial trunk length in coordinate units. */
  initialLength: number;
  /** Growth/decay multiplier for child branches (e.g., 0.75). */
  lengthRatio: number;
  /** Controlled angle variance multiplier [0.0, 1.0]. */
  angleVariation?: number;
  /** Controlled length variance multiplier [0.0, 1.0]. */
  lengthVariation?: number;
  /** Deterministic random seed (number or string). */
  seed?: number | string;
  /** Starting coordinate for trunk root. Defaults to (0, 0). */
  origin?: Point2D;
  /** Initial trunk angle in degrees (default: -90 for standard upward growth). */
  initialAngle?: number;
  /** Hard safety limit on total generated branches. Defaults to 4096. */
  maxBranchLimit?: number;
}

export interface BranchEvent {
  /** Unique branch identifier. */
  id: string;
  /** ID of parent branch, or null for root trunk. */
  parentId: string | null;
  /** Recursion depth level (0 = root, 1 = first split, etc.). */
  depth: number;
  /** Global sequence order of creation (0, 1, 2...). */
  order: number;
  /** Starting coordinates. */
  start: Point2D;
  /** Ending coordinates. */
  end: Point2D;
  /** Absolute orientation angle in radians. */
  angle: number;
  /** Branch length in units. */
  length: number;
  /** True if this is an outermost leaf node (no children). */
  isTerminal: boolean;
  /** Sibling index (0 = left/primary, 1 = right/secondary, etc.). */
  branchIndex: number;
  /** Normalized depth [0.0, 1.0] for sonic octave/frequency scaling. */
  normalizedDepth: number;
  /** Spatial panning value [-1.0, +1.0] derived from orientation/lateral offset. */
  pan: number;
}

export interface RecursionResult {
  /** Ordered list of all generated branch events. */
  branches: BranchEvent[];
  /** Maximum depth actually reached. */
  maxDepthReached: number;
  /** Total count of generated branches. */
  totalBranches: number;
  /** Full validated configuration used. */
  config: Required<RecursionConfig>;
}
