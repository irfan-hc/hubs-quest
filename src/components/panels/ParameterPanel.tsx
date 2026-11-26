"use client";

import React from "react";
import { RecursionConfig } from "@/lib/recursion/types";

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
      className="flex flex-col w-full rounded-2xl border border-orange-500/20 bg-[#0A0B10]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-[#FF7A1A]"
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
          <h2 className="text-sm font-medium text-slate-100">
            Recursion Controls
          </h2>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-orange-300 bg-orange-950/50 border border-orange-500/30 px-2 py-0.5 rounded">
          Structure Controls
        </span>
      </div>

      {/* Control Groups */}
      <div className="mt-3.5 space-y-3.5 text-sm">
        {/* Recursion Depth */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-depth" className="font-medium text-slate-200">
              Recursion Depth
            </label>
            <span className="font-mono text-orange-300 bg-[#14151E] border border-white/10 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.maxDepth} levels
            </span>
          </div>
          <input
            id="param-depth"
            type="range"
            min="1"
            max="9"
            value={config.maxDepth}
            onChange={(e) => onChange({ maxDepth: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={1}
            aria-valuemax={9}
            aria-valuenow={config.maxDepth}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Less detail (1)</span>
            <span>More detail (9)</span>
          </div>
        </div>

        {/* Branch Angle */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-angle" className="font-medium text-slate-200">
              Branching Divergence Angle
            </label>
            <span className="font-mono text-orange-300 bg-[#14151E] border border-white/10 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.branchAngle}&deg;
            </span>
          </div>
          <input
            id="param-angle"
            type="range"
            min="12"
            max="70"
            value={config.branchAngle}
            onChange={(e) => onChange({ branchAngle: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={12}
            aria-valuemax={70}
            aria-valuenow={config.branchAngle}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Narrower (12&deg;)</span>
            <span>Wider (70&deg;)</span>
          </div>
        </div>

        {/* Length Ratio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-decay" className="font-medium text-slate-200">
              Growth / Decay Ratio
            </label>
            <span className="font-mono text-orange-300 bg-[#14151E] border border-white/10 px-2 py-0.5 rounded text-[11px] font-semibold">
              {config.lengthRatio.toFixed(2)}
            </span>
          </div>
          <input
            id="param-decay"
            type="range"
            min="0.45"
            max="0.85"
            step="0.02"
            value={config.lengthRatio}
            onChange={(e) => onChange({ lengthRatio: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={0.45}
            aria-valuemax={0.85}
            aria-valuenow={config.lengthRatio}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Slower growth (0.45)</span>
            <span>Faster growth (0.85)</span>
          </div>
        </div>

        {/* Controlled Organic Asymmetry */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="param-variation" className="font-medium text-slate-200">
              Randomness / Drift
            </label>
            <span className="font-mono text-orange-300 bg-[#14151E] border border-white/10 px-2 py-0.5 rounded text-[11px] font-semibold">
              {Math.round((config.angleVariation ?? 0) * 100)}%
            </span>
          </div>
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
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={0}
            aria-valuemax={0.6}
            aria-valuenow={config.angleVariation ?? 0}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>More regular (0%)</span>
            <span>More random (60%)</span>
          </div>
        </div>

        {/* Deterministic Seed Controls */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="param-seed" className="text-xs font-medium text-slate-200 block">
                Deterministic PRNG Seed
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {String(config.seed)}
              </span>
            </div>
            <button
              type="button"
              onClick={onRandomizeSeed}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/25 hover:border-white/70 text-white text-xs font-medium transition-all active:scale-95 shadow-sm"
              title="Generate New Deterministic Seed"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
          </div>
        </div>

        {/* Reset Action */}
        {onResetDefaults && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetDefaults}
              className="w-full py-2 px-3 rounded-lg bg-black hover:bg-neutral-900 border border-white/25 hover:border-white/70 text-white text-xs font-medium transition-colors"
            >
              Reset to Default
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
