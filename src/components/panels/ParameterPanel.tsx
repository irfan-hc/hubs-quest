"use client";

import React from "react";
import { RecursionConfig, RecursionPatternType } from "@/lib/recursion/types";

interface ParameterPanelProps {
  config: RecursionConfig;
  onChange: (updates: Partial<RecursionConfig>) => void;
  onRandomizeSeed: () => void;
  onResetDefaults?: () => void;
}

export function ParameterPanel({
  config,
  onChange,
  onRandomizeSeed,
  onResetDefaults,
}: ParameterPanelProps) {
  return (
    <aside
      aria-label="Recursion Configuration & Parameters"
      className="flex flex-col w-full rounded-2xl border border-[#D49572]/25 bg-[#1A0F15]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#D49572]/15">
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-[#E3A988]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <h2 className="text-sm font-medium text-[#F7EDE6]">
            Recursion Controls
          </h2>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8B89A] bg-[#26151C] border border-[#D49572]/35 px-2 py-0.5 rounded">
          Structure Controls
        </span>
      </div>

      {/* Control Groups */}
      <div className="mt-3.5 space-y-3.5 text-sm">
        {/* Recursion Pattern Topology */}
        <div className="space-y-1.5">
          <label htmlFor="param-pattern" className="text-xs font-medium text-[#F7EDE6] block">
            Recursion Pattern
          </label>
          <select
            id="param-pattern"
            value={config.patternType ?? "binary"}
            onChange={(e) => onChange({ patternType: e.target.value as RecursionPatternType })}
            className="w-full bg-[#24141B] border border-white/45 hover:border-white/75 rounded-lg px-2.5 py-1.5 text-xs text-[#F7EDE6] focus:border-white focus:ring-1 focus:ring-white transition-colors"
          >
            <option value="crystal">Crystal (6-Fold Hexagonal)</option>
            <option value="organic">Organic (Asymmetric Tree)</option>
            <option value="spiral">Spiral (Golden-Angle)</option>
            <option value="coral">Coral (Clustered Reef)</option>
            <option value="binary">Binary (Classic Tree)</option>
          </select>
        </div>

        {/* Recursion Depth */}
        <div className="space-y-1.5 relative group" title="Controls how many branching layers unfold">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-depth" className="font-medium text-[#F7EDE6]">
              Recursion Depth
            </label>
            <span className="font-mono text-[#E8B89A] bg-[#26151C] border border-white/35 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.maxDepth} levels
            </span>
          </div>
          <span
            role="tooltip"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-8 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2.5 py-1 text-[11px] text-white shadow-lg"
          >
            Controls how many branching layers unfold
          </span>
          <input
            id="param-depth"
            type="range"
            min="1"
            max="9"
            value={config.maxDepth}
            onChange={(e) => onChange({ maxDepth: Number(e.target.value) })}
            className="w-full h-2 bg-[#24131B] border border-white/45 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#E8B89A] transition-all"
            aria-valuemin={1}
            aria-valuemax={9}
            aria-valuenow={config.maxDepth}
          />
          <div className="flex justify-between text-[11px] font-medium text-[#F5DFD1] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">Less detail (1)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">More detail (9)</span>
          </div>
        </div>

        {/* Branch Angle */}
        <div className="space-y-1.5 relative group" title="Sets the spread angle between child branches">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-angle" className="font-medium text-[#F7EDE6]">
              Branching Divergence Angle
            </label>
            <span className="font-mono text-[#E8B89A] bg-[#26151C] border border-white/35 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.branchAngle}&deg;
            </span>
          </div>
          <span
            role="tooltip"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-8 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2.5 py-1 text-[11px] text-white shadow-lg"
          >
            Sets the spread angle between child branches
          </span>
          <input
            id="param-angle"
            type="range"
            min="12"
            max="70"
            value={config.branchAngle}
            onChange={(e) => onChange({ branchAngle: Number(e.target.value) })}
            className="w-full h-2 bg-[#24131B] border border-white/45 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#E8B89A] transition-all"
            aria-valuemin={12}
            aria-valuemax={70}
            aria-valuenow={config.branchAngle}
          />
          <div className="flex justify-between text-[11px] font-medium text-[#F5DFD1] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">Narrower (12&deg;)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">Wider (70&deg;)</span>
          </div>
        </div>

        {/* Length Ratio */}
        <div className="space-y-1.5 relative group" title="Controls how much each level scales in length">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-decay" className="font-medium text-[#F7EDE6]">
              Growth / Decay Ratio
            </label>
            <span className="font-mono text-[#E8B89A] bg-[#26151C] border border-white/35 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.lengthRatio.toFixed(2)}
            </span>
          </div>
          <span
            role="tooltip"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-8 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2.5 py-1 text-[11px] text-white shadow-lg"
          >
            Controls how much each level scales in length
          </span>
          <input
            id="param-decay"
            type="range"
            min="0.45"
            max="0.85"
            step="0.02"
            value={config.lengthRatio}
            onChange={(e) => onChange({ lengthRatio: Number(e.target.value) })}
            className="w-full h-2 bg-[#24131B] border border-white/45 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#E8B89A] transition-all"
            aria-valuemin={0.45}
            aria-valuemax={0.85}
            aria-valuenow={config.lengthRatio}
          />
          <div className="flex justify-between text-[11px] font-medium text-[#F5DFD1] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">Slower growth (0.45)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">Faster growth (0.85)</span>
          </div>
        </div>

        {/* Controlled Organic Asymmetry */}
        <div className="space-y-1.5 relative group" title="Adds organic variation to angles and lengths">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-variation" className="font-medium text-[#F7EDE6]">
              Randomness / Drift
            </label>
            <span className="font-mono text-[#E8B89A] bg-[#26151C] border border-white/35 px-2 py-0.5 rounded text-[11px] font-semibold">
              {Math.round((config.angleVariation ?? 0) * 100)}%
            </span>
          </div>
          <span
            role="tooltip"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-8 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2.5 py-1 text-[11px] text-white shadow-lg"
          >
            Adds organic variation to angles and lengths
          </span>
          <input
            id="param-variation"
            type="range"
            min="0"
            max="0.6"
            step="0.05"
            value={config.angleVariation ?? 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange({ angleVariation: val, lengthVariation: val * 0.75 });
            }}
            className="w-full h-2 bg-[#24131B] border border-white/45 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#E8B89A] transition-all"
            aria-valuemin={0}
            aria-valuemax={0.6}
            aria-valuenow={config.angleVariation ?? 0}
          />
          <div className="flex justify-between text-[11px] font-medium text-[#F5DFD1] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">More regular (0%)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#26151C]/80 border border-white/25">More random (60%)</span>
          </div>
        </div>

        {/* Deterministic Seed Controls */}
        <div className="pt-3 border-t border-[#D49572]/25 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="param-seed" className="text-xs font-medium text-[#F7EDE6] block">
                Deterministic PRNG Seed
              </label>
              <span className="text-[11px] font-mono text-[#E8B89A]">
                {String(config.seed)}
              </span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={onRandomizeSeed}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/60 hover:border-white text-white text-[13px] font-medium transition-all active:scale-95 shadow-sm"
                title="Pick a new deterministic seed for a unique pattern"
              >
                <svg
                  className="w-3.5 h-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                <span>Randomize</span>
              </button>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 -top-9 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
              >
                Generate a new unique seed
              </span>
            </div>
          </div>
        </div>

        {/* Reset Action */}
        {onResetDefaults && (
          <div className="pt-2 relative group">
            <button
              type="button"
              onClick={onResetDefaults}
              title="Restore default Zen preset parameters"
              className="w-full py-2 px-3 rounded-lg bg-black hover:bg-neutral-900 border border-white/60 hover:border-white text-white text-[13px] font-medium transition-colors"
            >
              Reset to Default
            </button>
            <span
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-8 z-50 whitespace-nowrap rounded-md bg-black border border-white/60 px-2 py-1 text-[11px] text-white shadow-lg"
            >
              Restore default parameters
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
