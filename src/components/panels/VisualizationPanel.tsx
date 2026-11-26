"use client";

import React, { useEffect, useRef, useState } from "react";
import { RecursionResult } from "@/lib/recursion/types";
import { CanvasTreeRenderer, CanvasTheme } from "@/lib/visualization/canvasRenderer";
import type { PresetId } from "@/lib/presets/types";

type ActivePreset = PresetId | "custom";

interface VisualizationPanelProps {
  result: RecursionResult;
  isPlaying: boolean;
  onTogglePlay?: () => void;
  onReplay?: () => void;
  onResetDefaults?: () => void;
  activeBranchIds?: Set<string>;
  activePresetId?: ActivePreset;
}

/** Maps active preset to a display title for the visualization header. */
function getPresetTitle(presetId?: ActivePreset): string {
  switch (presetId) {
    case "zen":
      return "Zen Snow Crystal";
    case "forest":
      return "Enchanted Forest Sculpture";
    case "cosmic":
      return "Cosmic Harmonic Sculpture";
    case "dream":
      return "Dream Crystalline Sculpture";
    default:
      return "Custom Harmonic Sculpture";
  }
}

/** Maps active preset id to the CanvasTheme for the renderer. */
function getCanvasTheme(presetId?: ActivePreset): CanvasTheme {
  switch (presetId) {
    case "zen":
      return "zen";
    case "forest":
      return "forest";
    case "dream":
      return "dream";
    case "cosmic":
    default:
      return "cosmic";
  }
}

export function VisualizationPanel({
  result,
  isPlaying,
  onReplay,
  onResetDefaults,
  activeBranchIds,
  activePresetId,
}: VisualizationPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasTreeRenderer | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(1.0);
  const [isGrowthActive, setIsGrowthActive] = useState<boolean>(true);
  // Preserve the last preset's visual palette when sliders/tempo switch activePresetId to "custom"
  const lastPresetThemeRef = useRef<CanvasTheme>(getCanvasTheme(activePresetId));

  const resolvedTheme: CanvasTheme =
    activePresetId && activePresetId !== "custom"
      ? getCanvasTheme(activePresetId)
      : lastPresetThemeRef.current;

  if (activePresetId && activePresetId !== "custom") {
    lastPresetThemeRef.current = getCanvasTheme(activePresetId);
  }

  // Initialize CanvasTreeRenderer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const renderer = new CanvasTreeRenderer(
      canvasRef.current,
      containerRef.current,
      {
        autoPlay: true,
        growthDurationMs: 2600,
        onGrowthComplete: () => setIsGrowthActive(false),
        onCameraChange: (zoom) => setCurrentZoom(zoom),
      }
    );

    rendererRef.current = renderer;

    // Apply initial theme
    renderer.setTheme(resolvedTheme);

    if (result) {
      setIsGrowthActive(true);
      renderer.setResult(result, true);
    }

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tree on result update
  useEffect(() => {
    if (rendererRef.current && result) {
      setIsGrowthActive(true);
      rendererRef.current.setResult(result, true);
    }
  }, [result]);

  // Ensure growth animation plays if audio playback starts while paused
  useEffect(() => {
    if (!rendererRef.current) return;
    if (isPlaying) {
      rendererRef.current.play();
    }
  }, [isPlaying]);

  // Audio-visual synchronization: update highlighted branches in real-time
  useEffect(() => {
    if (rendererRef.current && activeBranchIds) {
      rendererRef.current.setHighlightedBranches(activeBranchIds);
    }
  }, [activeBranchIds]);

  // Update canvas theme when preset changes (preserving last preset palette during "custom" tuning)
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  const handleReplayClick = () => {
    if (rendererRef.current && result) {
      setIsGrowthActive(true);
      rendererRef.current.setResult(result, true);
    }
    if (onReplay) {
      onReplay();
    }
  };

  const handleZoomIn = () => {
    if (rendererRef.current) {
      rendererRef.current.setManualZoom(currentZoom * 1.15);
    }
  };

  const handleZoomOut = () => {
    if (rendererRef.current) {
      rendererRef.current.setManualZoom(currentZoom * 0.85);
    }
  };

  const handleResetCamera = () => {
    if (rendererRef.current) {
      rendererRef.current.resetCamera();
    }
  };

  const terminalCount = result.branches.filter((b) => b.isTerminal).length;
  const activeCount = activeBranchIds ? activeBranchIds.size : 0;
  const visualTitle = getPresetTitle(activePresetId);

  return (
    <section
      aria-label="Cosmic Tree Installation Viewport"
      className="relative flex flex-col w-full lg:h-full min-h-0 rounded-2xl border border-[#D49572]/25 bg-[#1A0F15]/95 backdrop-blur-md p-2.5 sm:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      {/* Top Studio Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 shrink-0 border-b border-[#D49572]/15">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              activeCount > 0
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1.0)] animate-ping"
                : isPlaying
                ? "bg-[#D49572] shadow-[0_0_8px_rgba(212,149,114,0.9)] animate-pulse"
                : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
            }`}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-medium tracking-tight text-[#F7EDE6] flex items-center space-x-2">
              <span>{visualTitle}</span>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  activeCount > 0 || isPlaying
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                    : "bg-[#26161D] text-[#E8B89A] border-[#D49572]/35"
                }`}
              >
                {activeCount > 0 ? `Sounding (${activeCount})` : isPlaying ? "Playing" : "Settled"}
              </span>
            </h2>
          </div>
        </div>

        {/* Telemetry HUD & Studio Actions */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Generation Statistics Badge */}
          <div className="hidden sm:flex items-center space-x-2 text-[#E6CFC2] font-mono text-[11px] bg-[#22131A] px-3 py-1.5 rounded-lg border border-[#D49572]/20 shadow-inner">
            <span>Branches:</span>
            <span className="text-[#E8B89A] font-semibold">{result.totalBranches}</span>
            <span className="text-[#6E4755]">|</span>
            <span>Depth:</span>
            <span className="text-[#F7EDE6] font-semibold">{result.maxDepthReached}</span>
            <span className="text-[#6E4755]">|</span>
            <span>Stellar Nodes:</span>
            <span className="text-emerald-300 font-semibold">{terminalCount}</span>
          </div>

          {/* Camera Zoom Controls */}
          <div className="flex items-center space-x-1 bg-black p-0.5 rounded-lg border border-white/55 shadow-inner">
            <div className="relative group">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom Out Camera"
                title="Zoom out of the simulation canvas"
                className="p-1.5 rounded text-white hover:bg-neutral-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-9 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
              >
                Zoom out
              </span>
            </div>
            <span className="px-1.5 font-mono text-[11px] text-white">
              {currentZoom.toFixed(2)}x
            </span>
            <div className="relative group">
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom In Camera"
                title="Zoom in closer to the simulation"
                className="p-1.5 rounded text-white hover:bg-neutral-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-9 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
              >
                Zoom in
              </span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={handleResetCamera}
                aria-label="Reset Camera View"
                title="Restore default camera framing and zoom"
                className="px-2 py-1 rounded text-xs font-mono text-white hover:bg-neutral-800 transition-colors border-l border-white/45"
              >
                Reset View
              </button>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-9 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
              >
                Restore default framing
              </span>
            </div>
          </div>

          {/* Replay Growth Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleReplayClick}
              aria-label="Replay Tree Growth Animation"
              title="Replay progressive formation from the center"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/60 hover:border-white text-white text-[13px] font-medium transition-all active:scale-95"
            >
              <svg
                className="w-3.5 h-3.5 text-white fill-current"
                viewBox="0 0 24 24"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Replay</span>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-9 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
            >
              Replay formation animation
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Canvas Viewport Container (fills remaining desktop viewport height) */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] sm:h-[520px] lg:h-auto lg:flex-1 lg:min-h-[340px] rounded-xl mt-2 border border-white/10 bg-[#030408] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner select-none"
        title="Drag to pan • Ctrl+Scroll to zoom • Double-click to reset"
      >
        {/* Deep Space Background Grid Lines (Subtle) */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#111422_1px,transparent_1px),linear-gradient(to_bottom,#111422_1px,transparent_1px)] bg-[size:48px_48px] opacity-20 pointer-events-none"
          aria-hidden="true"
        />

        {/* High-DPI Interactive Canvas - Positioned Absolutely to Prevent Layout Feedback */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block touch-none"
          aria-label="Cosmic branching generative tree artwork"
          role="img"
        />

        {/* Ambient telemetry badge on canvas bottom-left */}
        <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-300/90 select-none z-20 flex items-center space-x-2.5 bg-[#08090F]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 shadow-sm pointer-events-none">
          <span className="text-orange-300 font-medium">&theta;: {result.config.branchAngle}&deg;</span>
          <span className="text-slate-700">&bull;</span>
          <span>Ratio: {result.config.lengthRatio.toFixed(2)}</span>
          <span className="text-slate-700">&bull;</span>
          <span className="text-slate-400">Seed: {String(result.config.seed)}</span>
        </div>

        {/* Dynamic camera / sync badge bottom-right */}
        <div className="absolute bottom-3 right-4 text-[10px] font-mono text-slate-400 select-none z-20 hidden md:flex items-center space-x-2 bg-[#08090F]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 pointer-events-none">
          <span className="text-emerald-400">Sync: {activeCount > 0 ? "Active" : "Ready"}</span>
          <span>&bull;</span>
          <span>Drag to Pan &bull; Ctrl+Scroll to Zoom</span>
        </div>
      </div>
    </section>
  );
}
