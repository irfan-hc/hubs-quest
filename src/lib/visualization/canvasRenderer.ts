import { BranchEvent, RecursionResult } from "../recursion/types";

export interface RendererOptions {
  autoPlay?: boolean;
  growthDurationMs?: number;
  onGrowthComplete?: () => void;
  onCameraChange?: (zoom: number) => void;
}

export type CanvasTheme = "zen" | "forest" | "cosmic" | "dream" | "default";

interface AmbientMote {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  isWarm?: boolean;
}

interface SculptureNode {
  branch: BranchEvent;
  px: number; // parent X in sculpture space
  py: number; // parent Y in sculpture space
  cx: number; // child/node X in sculpture space
  cy: number; // child/node Y in sculpture space
  ctrlX: number; // bezier control point X for curved ribbons/spirals
  ctrlY: number; // bezier control point Y
  radius: number; // radial distance from core (0,0)
  angle: number; // polar orientation
  segLength: number;
}

interface ThemePalette {
  bgInner: string;
  bgMid: string;
  bgOuter: string;
  sunGlow: string | null;
  moteColor: string;
  moteWarmColor: string;
  moteDensity: number;
  orbitalColor: string;
  highlightStroke: string;
  highlightFill: string;
  highlightGlow: string;
  depthColor: (t: number, alpha?: number) => string;
  terminalColor: (alpha: number) => string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function interpolateRGBA(
  c1: [number, number, number, number],
  c2: [number, number, number, number],
  f: number,
  alphaScale: number = 1
): string {
  const factor = Math.max(0, Math.min(1, f));
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
  const a = Math.max(0, Math.min(1, (c1[3] + (c2[3] - c1[3]) * factor) * alphaScale)).toFixed(2);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getThemePalette(theme: CanvasTheme): ThemePalette {
  switch (theme) {
    case "forest":
      return {
        bgInner: "#0B1E14",
        bgMid: "#06110B",
        bgOuter: "#020604",
        sunGlow: "rgba(253, 224, 130, 0.14)",
        moteColor: "rgba(187, 247, 208,",
        moteWarmColor: "rgba(253, 224, 130,",
        moteDensity: 0.85,
        orbitalColor: "rgba(134, 239, 172, 0.14)",
        highlightStroke: "rgba(254, 240, 138, 0.96)",
        highlightFill: "rgba(253, 224, 71, 0.24)",
        highlightGlow: "rgba(250, 204, 21, 0.75)",
        depthColor: (t, a = 1) => {
          const cRoot: [number, number, number, number] = [110, 165, 95, 0.9];
          const cMoss: [number, number, number, number] = [52, 185, 115, 0.85];
          const cGold: [number, number, number, number] = [235, 195, 110, 0.82];
          const cBlossom: [number, number, number, number] = [249, 168, 212, 0.88];
          if (t < 0.35) return interpolateRGBA(cRoot, cMoss, t / 0.35, a);
          if (t < 0.72) return interpolateRGBA(cMoss, cGold, (t - 0.35) / 0.37, a);
          return interpolateRGBA(cGold, cBlossom, (t - 0.72) / 0.28, a);
        },
        terminalColor: (a) => `rgba(253, 224, 130, ${a.toFixed(2)})`,
      };

    case "zen":
      return {
        bgInner: "#18101C",
        bgMid: "#0E0812",
        bgOuter: "#070409",
        sunGlow: "rgba(212, 149, 114, 0.14)",
        moteColor: "rgba(186, 230, 253,",
        moteWarmColor: "rgba(232, 184, 154,",
        moteDensity: 0.6,
        orbitalColor: "rgba(212, 149, 114, 0.18)",
        highlightStroke: "rgba(253, 224, 196, 0.96)",
        highlightFill: "rgba(212, 149, 114, 0.30)",
        highlightGlow: "rgba(227, 169, 136, 0.85)",
        depthColor: (t, a = 1) => {
          const cCore: [number, number, number, number] = [212, 149, 114, 0.92];
          const cIce: [number, number, number, number] = [125, 211, 252, 0.85];
          const cPlum: [number, number, number, number] = [196, 181, 253, 0.88];
          const cRose: [number, number, number, number] = [244, 180, 198, 0.90];
          if (t < 0.33) return interpolateRGBA(cCore, cIce, t / 0.33, a);
          if (t < 0.7) return interpolateRGBA(cIce, cPlum, (t - 0.33) / 0.37, a);
          return interpolateRGBA(cPlum, cRose, (t - 0.7) / 0.3, a);
        },
        terminalColor: (a) => `rgba(232, 184, 154, ${a.toFixed(2)})`,
      };

    case "dream":
      return {
        bgInner: "#140821",
        bgMid: "#0B0414",
        bgOuter: "#040108",
        sunGlow: "rgba(216, 180, 254, 0.1)",
        moteColor: "rgba(233, 213, 255,",
        moteWarmColor: "rgba(249, 168, 212,",
        moteDensity: 0.72,
        orbitalColor: "rgba(216, 180, 254, 0.16)",
        highlightStroke: "rgba(253, 242, 248, 0.96)",
        highlightFill: "rgba(244, 114, 182, 0.24)",
        highlightGlow: "rgba(232, 121, 249, 0.75)",
        depthColor: (t, a = 1) => {
          const cPlum: [number, number, number, number] = [168, 85, 247, 0.88];
          const cPink: [number, number, number, number] = [244, 114, 182, 0.84];
          const cLavender: [number, number, number, number] = [221, 214, 254, 0.9];
          if (t < 0.5) return interpolateRGBA(cPlum, cPink, t / 0.5, a);
          return interpolateRGBA(cPink, cLavender, (t - 0.5) / 0.5, a);
        },
        terminalColor: (a) => `rgba(249, 168, 212, ${a.toFixed(2)})`,
      };

    case "cosmic":
    default:
      return {
        bgInner: "#091026",
        bgMid: "#050816",
        bgOuter: "#020308",
        sunGlow: "rgba(251, 146, 60, 0.08)",
        moteColor: "rgba(186, 230, 253,",
        moteWarmColor: "rgba(253, 186, 116,",
        moteDensity: 0.9,
        orbitalColor: "rgba(56, 189, 248, 0.16)",
        highlightStroke: "rgba(240, 249, 255, 0.98)",
        highlightFill: "rgba(56, 189, 248, 0.26)",
        highlightGlow: "rgba(56, 189, 248, 0.85)",
        depthColor: (t, a = 1) => {
          const cCore: [number, number, number, number] = [251, 146, 60, 0.92];
          const cCyan: [number, number, number, number] = [56, 189, 248, 0.86];
          const cViolet: [number, number, number, number] = [168, 85, 247, 0.85];
          const cIce: [number, number, number, number] = [224, 242, 254, 0.92];
          if (t < 0.28) return interpolateRGBA(cCore, cCyan, t / 0.28, a);
          if (t < 0.68) return interpolateRGBA(cCyan, cViolet, (t - 0.28) / 0.4, a);
          return interpolateRGBA(cViolet, cIce, (t - 0.68) / 0.32, a);
        },
        terminalColor: (a) => `rgba(186, 230, 253, ${a.toFixed(2)})`,
      };
  }
}

/**
 * CanvasTreeRenderer — Recursive Harmonic Sculpture Engine
 * Transforms Stage 2 BranchEvent data into an evolving radial, petal, crystalline,
 * and orbital generative-art sculpture with preset-specific atmospheres and 1:1 music sync.
 */
export class CanvasTreeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private result: RecursionResult | null = null;
  private sculptureNodes: SculptureNode[] = [];
  private depthRadii: number[] = [];
  private options: Required<RendererOptions>;

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private prefersReducedMotion: boolean = false;

  // Restrained ambient motes / stars
  private motes: AmbientMote[] = [];

  // Formation timing state
  private startTime: number = 0;
  private isPaused: boolean = false;
  private progress: number = 0;
  private isComplete: boolean = false;

  // Visual theme
  private currentTheme: CanvasTheme = "zen";

  // Music-to-visual sync
  private highlightedBranchIds: Set<string> = new Set();

  // Camera framing
  private dpr: number = 1;
  private autoScaleFull: number = 1;
  private autoOffsetXFull: number = 0;
  private autoOffsetYFull: number = 0;
  private autoScaleStart: number = 1;
  private autoOffsetXStart: number = 0;
  private autoOffsetYStart: number = 0;

  // Manual camera controls
  private manualZoom: number = 1.0;
  private manualPanX: number = 0;
  private manualPanY: number = 0;
  private isDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    options: RendererOptions = {}
  ) {
    this.canvas = canvas;
    this.container = container;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Unable to obtain 2D canvas context");
    }
    this.ctx = context;

    this.prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.options = {
      autoPlay: options.autoPlay ?? true,
      growthDurationMs: options.growthDurationMs ?? 2800,
      onGrowthComplete: options.onGrowthComplete ?? (() => {}),
      onCameraChange: options.onCameraChange ?? (() => {}),
    };

    this.initAmbientMotes(64);
    this.handleResize = this.handleResize.bind(this);
    this.renderLoop = this.renderLoop.bind(this);

    this.setupResizeObserver();
    this.setupInteractiveCamera();
    this.handleResize();
  }

  private initAmbientMotes(count: number): void {
    this.motes = [];
    let seed = 4289;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: lcg(),
        y: lcg(),
        size: 0.7 + lcg() * 1.4,
        baseAlpha: 0.14 + lcg() * 0.34,
        phase: lcg() * Math.PI * 2,
        speed: 0.0008 + lcg() * 0.0012,
        isWarm: i % 3 === 0,
      });
    }
  }

  /**
   * Builds rendering nodes directly from Stage 2 BranchEvent coordinates and relationships.
   * Preserves the exact generated topology, positions, angles, lengths, and event IDs.
   */
  private buildSculptureGeometry(result: RecursionResult): void {
    this.sculptureNodes = [];
    this.depthRadii = [];
    if (!result || result.branches.length === 0) return;

    const root = result.branches[0];
    const rx = root.start.x;
    const ry = root.start.y;
    const depthRadiusSums = new Map<number, { sum: number; count: number }>();

    for (const branch of result.branches) {
      const px = branch.start.x - rx;
      const py = branch.start.y - ry;
      const cx = branch.end.x - rx;
      const cy = branch.end.y - ry;

      // Subtle perpendicular bezier control point driven by branch.pan for organic/spiral curves
      const midX = (px + cx) * 0.5;
      const midY = (py + cy) * 0.5;
      const perpAngle = branch.angle + Math.PI / 2;
      const curveOffset = branch.length * 0.16 * (branch.pan >= 0 ? 1 : -1);
      const ctrlX = midX + Math.cos(perpAngle) * curveOffset;
      const ctrlY = midY + Math.sin(perpAngle) * curveOffset;

      const radius = Math.hypot(cx, cy);

      this.sculptureNodes.push({
        branch,
        px,
        py,
        cx,
        cy,
        ctrlX,
        ctrlY,
        radius,
        angle: branch.angle,
        segLength: branch.length,
      });

      if (branch.depth >= 1) {
        const stat = depthRadiusSums.get(branch.depth) ?? { sum: 0, count: 0 };
        stat.sum += radius;
        stat.count += 1;
        depthRadiusSums.set(branch.depth, stat);
      }
    }

    for (let d = 1; d <= result.maxDepthReached; d++) {
      const stat = depthRadiusSums.get(d);
      if (stat && stat.count > 0) {
        this.depthRadii.push(stat.sum / stat.count);
      }
    }
  }

  public setTheme(theme: CanvasTheme): void {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    this.calculateCameraBounds();
    if (this.isComplete) {
      this.drawFrame(1.0, performance.now());
    }
  }

  public setResult(result: RecursionResult, replay: boolean = true): void {
    this.result = result;
    this.buildSculptureGeometry(result);
    this.calculateCameraBounds();

    if (this.prefersReducedMotion || !replay) {
      this.progress = 1.0;
      this.isComplete = true;
      this.drawFrame(1.0, performance.now());
      if (this.prefersReducedMotion) {
        this.options.onGrowthComplete();
      }
      return;
    }

    this.resetGrowth();
    if (this.options.autoPlay) {
      this.play();
    } else {
      this.drawFrame(0, performance.now());
    }
  }

  public setHighlightedBranches(branchIds: Set<string>): void {
    this.highlightedBranchIds = branchIds;
    if (this.isComplete) {
      this.drawFrame(1.0, performance.now());
    }
  }

  private setupResizeObserver(): void {
    if (typeof window === "undefined" || !("ResizeObserver" in window)) {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);
  }

  private setupInteractiveCamera(): void {
    const el = this.canvas;

    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastDragX;
      const dy = e.clientY - this.lastDragY;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;

      this.manualPanX += dx;
      this.manualPanY += dy;
      this.drawFrame(this.progress, performance.now());
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isDragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };

    // Only zoom when Ctrl/Cmd is held; normal scroll propagates to page
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.setManualZoom(this.manualZoom * zoomFactor);
    };

    const onDblClick = () => {
      this.resetCamera();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dblclick", onDblClick);

    (this as any)._cleanupEvents = () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDblClick);
    };
  }

  public setManualZoom(newZoom: number): void {
    this.manualZoom = Math.max(0.4, Math.min(newZoom, 4.0));
    this.options.onCameraChange(Number(this.manualZoom.toFixed(2)));
    this.drawFrame(this.progress, performance.now());
  }

  public resetCamera(): void {
    this.manualZoom = 1.0;
    this.manualPanX = 0;
    this.manualPanY = 0;
    this.options.onCameraChange(1.0);
    this.drawFrame(this.progress, performance.now());
  }

  public handleResize(): void {
    if (!this.canvas || !this.container) return;

    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    this.dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const targetWidth = Math.floor(width * this.dpr);
    const targetHeight = Math.floor(height * this.dpr);

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    this.calculateCameraBounds();
    if (this.result) {
      this.drawFrame(this.progress, performance.now());
    }
  }

  private calculateCameraBounds(): void {
    if (!this.result || this.result.branches.length === 0 || this.sculptureNodes.length === 0) return;

    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of this.sculptureNodes) {
      minX = Math.min(minX, n.px, n.cx, n.ctrlX);
      maxX = Math.max(maxX, n.px, n.cx, n.ctrlX);
      minY = Math.min(minY, n.py, n.cy, n.ctrlY);
      maxY = Math.max(maxY, n.py, n.cy, n.ctrlY);
    }

    const spanX = Math.max(maxX - minX, 60);
    const spanY = Math.max(maxY - minY, 60);

    const availWidth = width * 0.86;
    const availHeight = height * 0.86;

    this.autoScaleFull = Math.min(availWidth / spanX, availHeight / spanY);
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;

    this.autoOffsetXFull = width * 0.5 - centerX * this.autoScaleFull;
    this.autoOffsetYFull = height * 0.5 - centerY * this.autoScaleFull;

    this.autoScaleStart = this.autoScaleFull * 1.18;
    this.autoOffsetXStart = width * 0.5;
    this.autoOffsetYStart = height * 0.5;
  }

  public play(): void {
    if (this.prefersReducedMotion) {
      this.progress = 1.0;
      this.isComplete = true;
      this.drawFrame(1.0, performance.now());
      this.options.onGrowthComplete();
      return;
    }
    if (this.isComplete) {
      this.resetGrowth();
    }
    this.isPaused = false;
    this.startTime = performance.now() - this.progress * this.options.growthDurationMs;

    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.renderLoop);
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resetGrowth(): void {
    this.progress = 0;
    this.isComplete = false;
    this.isPaused = false;
    this.startTime = performance.now();
  }

  private renderLoop(timestamp: number): void {
    if (this.isPaused) return;

    const elapsed = timestamp - this.startTime;
    const rawProgress = Math.min(elapsed / this.options.growthDurationMs, 1.0);
    this.progress = rawProgress;

    this.drawFrame(this.progress, timestamp);

    if (rawProgress >= 1.0) {
      this.progress = 1.0;
      this.isComplete = true;
      this.drawFrame(1.0, timestamp);
      this.options.onGrowthComplete();

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    } else {
      this.animationFrameId = requestAnimationFrame(this.renderLoop);
    }
  }

  public drawFrame(progress: number, timestamp: number): void {
    const ctx = this.ctx;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const palette = getThemePalette(this.currentTheme);

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // 1. Atmospheric Backdrop
    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      20,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.72
    );
    bgGrad.addColorStop(0, palette.bgInner);
    bgGrad.addColorStop(0.55, palette.bgMid);
    bgGrad.addColorStop(1, palette.bgOuter);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle upper sunlight / nebula haze for Forest, Dream, Cosmic
    if (palette.sunGlow) {
      const hazeGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        10,
        width * 0.5,
        height * 0.35,
        Math.max(width, height) * 0.5
      );
      hazeGrad.addColorStop(0, palette.sunGlow);
      hazeGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Restrained Floating Motes / Stars
    for (const mote of this.motes) {
      const mx = mote.x * width;
      const my = mote.y * height;
      const twinkle = Math.sin(timestamp * mote.speed + mote.phase);
      const alpha = Math.max(0.04, mote.baseAlpha * palette.moteDensity + twinkle * 0.12);

      ctx.beginPath();
      ctx.arc(mx, my, mote.size, 0, Math.PI * 2);
      const baseColor = mote.isWarm ? palette.moteWarmColor : palette.moteColor;
      ctx.fillStyle = `${baseColor}${alpha.toFixed(2)})`;
      ctx.fill();
    }

    if (!this.result || this.sculptureNodes.length === 0) {
      ctx.restore();
      return;
    }

    // 3. Dynamic Camera Framing (settles cleanly at progress = 1.0)
    const camEase = progress >= 1.0 ? 1.0 : easeOutCubic(progress);
    const curScale =
      (this.autoScaleStart + (this.autoScaleFull - this.autoScaleStart) * camEase) *
      this.manualZoom;
    const curOffsetX =
      this.autoOffsetXStart +
      (this.autoOffsetXFull - this.autoOffsetXStart) * camEase +
      this.manualPanX;
    const curOffsetY =
      this.autoOffsetYStart +
      (this.autoOffsetYFull - this.autoOffsetYStart) * camEase +
      this.manualPanY;

    ctx.translate(curOffsetX, curOffsetY);
    ctx.scale(curScale, curScale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const maxDepth = Math.max(this.result.maxDepthReached, 1);
    const totalLevels = maxDepth + 1;

    // Special Zen Preset: Enchanted 6-Fold Snow Crystal Formation
    if (this.currentTheme === "zen") {
      this.drawZenSnowCrystal(ctx, progress, curScale, totalLevels, palette);
      ctx.restore();
      return;
    }

    // 4. Concentric Orbital Rings (one per depth layer)
    const ringCount = this.depthRadii.length;
    for (let i = 0; i < ringCount; i++) {
      const ringProgress = Math.min(1, Math.max(0, (progress - (i / totalLevels) * 0.8) * 3));
      if (ringProgress <= 0) continue;

      const r = this.depthRadii[i];
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2 * easeOutCubic(ringProgress));
      ctx.strokeStyle = palette.orbitalColor;
      ctx.lineWidth = (i === 0 ? 1.3 : 0.85) / curScale;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 5. Central Harmonic Core
    const coreProgress = Math.min(1, progress * 5);
    if (coreProgress > 0) {
      const coreRadius = 10 / curScale;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 2.2 * easeOutCubic(coreProgress), 0, Math.PI * 2);
      ctx.fillStyle = palette.depthColor(0.05, 0.16);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.9 * easeOutCubic(coreProgress), 0, Math.PI * 2);
      ctx.fillStyle = palette.depthColor(0, 0.9);
      ctx.fill();
    }

    // 6. Recursive Sculpture Petals, Facets, Spirals & Connections
    for (const node of this.sculptureNodes) {
      const depth = node.branch.depth;
      const levelStart = depth / totalLevels;
      const levelEnd = (depth + 1.25) / totalLevels;

      let localGrowth = 0;
      if (progress >= 1.0 || progress >= levelEnd) {
        localGrowth = 1.0;
      } else if (progress <= levelStart) {
        localGrowth = 0.0;
      } else {
        localGrowth = (progress - levelStart) / (levelEnd - levelStart);
      }
      if (localGrowth <= 0) continue;

      const eased = localGrowth >= 1.0 ? 1.0 : easeOutCubic(localGrowth);
      const curX = node.px + (node.cx - node.px) * eased;
      const curY = node.py + (node.cy - node.py) * eased;
      const curCtrlX = node.px + (node.ctrlX - node.px) * eased;
      const curCtrlY = node.py + (node.ctrlY - node.py) * eased;

      const isHighlighted = this.highlightedBranchIds.has(node.branch.id);
      const normD = node.branch.normalizedDepth;

      // Preset-specific geometric element rendering
      this.drawSculptureElement(
        ctx,
        node,
        curX,
        curY,
        curCtrlX,
        curCtrlY,
        eased,
        curScale,
        normD,
        isHighlighted,
        palette
      );

      // Luminous Terminal / Joint Nodes
      if (node.branch.isTerminal && localGrowth > 0.7) {
        const nodeAlpha = localGrowth >= 1.0 ? 0.92 : (localGrowth - 0.7) * 3.0;
        const rNode = (isHighlighted ? 4.4 : 2.6) / curScale;

        if (isHighlighted) {
          ctx.beginPath();
          ctx.arc(curX, curY, rNode * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = palette.highlightFill;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(curX, curY, rNode, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted
          ? palette.highlightStroke
          : palette.terminalColor(nodeAlpha);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Renders the Zen Enchanted Snow Crystal directly from the actual Stage 2 BranchEvent coordinates.
   * When patternType is "crystal", the 6-fold hexagonal arms are genuinely generated in the recursion data.
   */
  private drawZenSnowCrystal(
    ctx: CanvasRenderingContext2D,
    progress: number,
    curScale: number,
    totalLevels: number,
    palette: ThemePalette
  ): void {
    if (!this.result || this.result.branches.length === 0) return;

    const root = this.result.branches[0];
    const rx = root.start.x;
    const ry = root.start.y;

    // Stage 1: First Frost — central hexagonal crystal seed & delicate ice plate
    const seedProgress = Math.min(1, progress * 5.5);
    if (seedProgress > 0) {
      const seedEase = easeOutCubic(seedProgress);
      const hexR = (18 * seedEase) / Math.max(curScale, 0.35);

      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3 - Math.PI / 2;
        const hx = Math.cos(a) * hexR;
        const hy = Math.sin(a) * hexR;
        if (k === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(212, 149, 114, 0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(232, 184, 154, 0.82)";
      ctx.lineWidth = 1.2 / curScale;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, (4.2 * seedEase) / curScale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 184, 154, 0.94)";
      ctx.fill();
    }

    // Stages 2–5: Render actual generated BranchEvent coordinates directly
    for (const branch of this.result.branches) {
      const depth = branch.depth;
      if (depth === 0) continue; // seed already drawn at center

      const levelStart = depth / totalLevels;
      const levelEnd = (depth + 1.2) / totalLevels;

      let localGrowth = 0;
      if (progress >= 1.0 || progress >= levelEnd) {
        localGrowth = 1.0;
      } else if (progress <= levelStart) {
        localGrowth = 0.0;
      } else {
        localGrowth = (progress - levelStart) / (levelEnd - levelStart);
      }
      if (localGrowth <= 0) continue;

      const eased = localGrowth >= 1.0 ? 1.0 : easeOutCubic(localGrowth);

      const sx = branch.start.x - rx;
      const sy = branch.start.y - ry;
      const ex = sx + (branch.end.x - branch.start.x) * eased;
      const ey = sy + (branch.end.y - branch.start.y) * eased;

      const isHighlighted = this.highlightedBranchIds.has(branch.id);
      const normD = branch.normalizedDepth;

      const dx = ex - sx;
      const dy = ey - sy;
      const plateRatio = depth <= 1 ? 0.12 : depth <= 2 ? 0.16 : 0.2;
      const px = -dy * plateRatio;
      const py = dx * plateRatio;
      const mx = sx + dx * 0.55;
      const my = sy + dy * 0.55;

      if (isHighlighted) {
        ctx.shadowColor = palette.highlightGlow;
        ctx.shadowBlur = 10 / curScale;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx + px, my + py);
      ctx.lineTo(ex, ey);
      ctx.lineTo(mx - px, my - py);
      ctx.closePath();
      ctx.fillStyle = isHighlighted
        ? palette.highlightFill
        : palette.depthColor(normD, depth <= 1 ? 0.22 : 0.16);
      ctx.fill();

      ctx.strokeStyle = isHighlighted
        ? palette.highlightStroke
        : palette.depthColor(normD, 0.78);
      ctx.lineWidth = isHighlighted
        ? 1.9 / curScale
        : Math.max(0.65 / curScale, (1.5 - normD * 0.75) / curScale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = isHighlighted
        ? "rgba(253, 224, 196, 0.98)"
        : "rgba(212, 149, 114, 0.45)";
      ctx.lineWidth = Math.max(0.5 / curScale, (1.1 - normD * 0.5) / curScale);
      ctx.stroke();

      if (branch.isTerminal && localGrowth > 0.75) {
        const tipAlpha = localGrowth >= 1.0 ? 0.92 : (localGrowth - 0.75) * 3.5;
        const rTip = (isHighlighted ? 3.2 : 1.7) / curScale;
        ctx.beginPath();
        ctx.arc(ex, ey, rTip, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted
          ? "rgba(255, 255, 255, 0.98)"
          : palette.terminalColor(tipAlpha);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  private drawSculptureElement(
    ctx: CanvasRenderingContext2D,
    node: SculptureNode,
    curX: number,
    curY: number,
    curCtrlX: number,
    curCtrlY: number,
    eased: number,
    curScale: number,
    normD: number,
    isHighlighted: boolean,
    palette: ThemePalette
  ): void {
    const strokeWidth = isHighlighted
      ? 2.6 / curScale
      : Math.max(0.8 / curScale, (2.2 - normD * 1.3) / curScale);

    if (isHighlighted) {
      ctx.shadowColor = palette.highlightGlow;
      ctx.shadowBlur = 12 / curScale;
    } else {
      ctx.shadowBlur = 0;
    }

    if (this.currentTheme === "cosmic") {
      // Cosmic: Layered Lotus Petals + Orbital Ribbon Connections
      const dx = curX - node.px;
      const dy = curY - node.py;
      const perpX = -dy * 0.24;
      const perpY = dx * 0.24;

      if (node.branch.depth >= 1) {
        ctx.beginPath();
        ctx.moveTo(node.px, node.py);
        ctx.quadraticCurveTo((node.px + curX) * 0.5 + perpX, (node.py + curY) * 0.5 + perpY, curX, curY);
        ctx.quadraticCurveTo((node.px + curX) * 0.5 - perpX, (node.py + curY) * 0.5 - perpY, node.px, node.py);
        ctx.fillStyle = isHighlighted ? palette.highlightFill : palette.depthColor(normD, 0.12);
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.65);
        ctx.lineWidth = strokeWidth * 0.75;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(node.px, node.py);
      ctx.quadraticCurveTo(curCtrlX, curCtrlY, curX, curY);
      ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.85);
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    } else if (this.currentTheme === "forest") {
      // Forest: Flowing Organic Spirals & Leaf-like Clusters
      ctx.beginPath();
      ctx.moveTo(node.px, node.py);
      ctx.quadraticCurveTo(curCtrlX, curCtrlY, curX, curY);
      ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.85);
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      if (node.branch.depth >= 2 && eased > 0.45) {
        const leafLen = Math.min(14, node.segLength * 0.28) * eased;
        const leafAngle = node.angle + (node.branch.pan >= 0 ? 0.45 : -0.45);
        const lx = curX + Math.cos(leafAngle) * leafLen;
        const ly = curY + Math.sin(leafAngle) * leafLen;
        const mx = (curX + lx) * 0.5;
        const my = (curY + ly) * 0.5;
        const px = -(ly - curY) * 0.35;
        const py = (lx - curX) * 0.35;

        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.quadraticCurveTo(mx + px, my + py, lx, ly);
        ctx.quadraticCurveTo(mx - px, my - py, curX, curY);
        ctx.fillStyle = isHighlighted ? palette.highlightFill : palette.depthColor(normD, 0.32);
        ctx.fill();
      }
    } else if (this.currentTheme === "dream") {
      // Dream: Ethereal Crystalline Facets & Flowing Ribbons
      const dx = curX - node.px;
      const dy = curY - node.py;
      const mx = (node.px + curX) * 0.5;
      const my = (node.py + curY) * 0.5;
      const facetW = 0.2;
      const fx1 = mx - dy * facetW;
      const fy1 = my + dx * facetW;
      const fx2 = mx + dy * facetW;
      const fy2 = my - dx * facetW;

      ctx.beginPath();
      ctx.moveTo(node.px, node.py);
      ctx.lineTo(fx1, fy1);
      ctx.lineTo(curX, curY);
      ctx.lineTo(fx2, fy2);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? palette.highlightFill : palette.depthColor(normD, 0.16);
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.78);
      ctx.lineWidth = strokeWidth * 0.85;
      ctx.stroke();
    } else {
      // Zen: Minimal Balanced Geometric Spokes & Clean Arcs
      ctx.beginPath();
      ctx.moveTo(node.px, node.py);
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.78);
      ctx.lineWidth = strokeWidth * 0.9;
      ctx.stroke();

      if (node.branch.depth <= 2 && eased > 0.6) {
        const arcR = Math.max(4, node.segLength * 0.16);
        ctx.beginPath();
        ctx.arc(curX, curY, arcR, node.angle - 0.8, node.angle + 0.8);
        ctx.strokeStyle = isHighlighted ? palette.highlightStroke : palette.depthColor(normD, 0.4);
        ctx.lineWidth = 0.8 / curScale;
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  }

  public destroy(): void {
    this.pause();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if ((this as any)._cleanupEvents) {
      (this as any)._cleanupEvents();
    }
  }
}
