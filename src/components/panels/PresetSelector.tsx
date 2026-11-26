"use client";

import React from "react";
import { PRESET_LIST } from "@/lib/presets/presets";
import type { PresetDefinition, PresetId } from "@/lib/presets/types";

interface PresetSelectorProps {
  activePresetId: PresetId | "custom";
  onSelectPreset: (preset: PresetDefinition) => void;
  disabled?: boolean;
}

/** Mini procedural tree artwork matching each preset's visual identity. */
function PresetTreeThumbnail({ id }: { id: PresetId }) {
  const styles: Record<PresetId, { bg: string; glow: string; stroke: string; tip: string }> = {
    forest: {
      bg: "from-[#0A1F0E] via-[#071509] to-[#040805]",
      glow: "rgba(74, 222, 128, 0.45)",
      stroke: "#4ADE80",
      tip: "#FACC15",
    },
    cosmic: {
      bg: "from-[#0B1230] via-[#080C22] to-[#04050C]",
      glow: "rgba(56, 189, 248, 0.5)",
      stroke: "#38BDF8",
      tip: "#C084FC",
    },
    zen: {
      bg: "from-[#1A1612] via-[#100D0B] to-[#070709]",
      glow: "rgba(251, 191, 36, 0.4)",
      stroke: "#FDE68A",
      tip: "#99F6E4",
    },
    dream: {
      bg: "from-[#220B26] via-[#14071A] to-[#07040B]",
      glow: "rgba(244, 114, 182, 0.45)",
      stroke: "#F472B6",
      tip: "#E9D5FF",
    },
  };
  const s = styles[id];

  return (
    <div
      className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-b ${s.bg} border border-white/10 flex items-center justify-center overflow-hidden relative`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-1 bottom-0.5 h-2 rounded-full blur-sm opacity-70"
        style={{ background: s.glow }}
      />
      <svg className="w-6 h-6 relative z-10" viewBox="0 0 40 40" fill="none">
        <path
          d="M20 35V20M20 20L12 13M20 20L28 13M12 13L8 8M12 13L15 8M28 13L25 8M28 13L32 8"
          stroke={s.stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="1.8" fill={s.tip} />
        <circle cx="15" cy="8" r="1.5" fill={s.tip} />
        <circle cx="25" cy="8" r="1.5" fill={s.tip} />
        <circle cx="32" cy="8" r="1.8" fill={s.tip} />
      </svg>
    </div>
  );
}

const PRESET_SHORT_DESC: Record<string, string> = {
  zen: "Minimal & peaceful",
  forest: "Natural & organic",
  cosmic: "Expansive & celestial",
  dream: "Ethereal & flowing",
};

export function PresetSelector({
  activePresetId,
  onSelectPreset,
  disabled = false,
}: PresetSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Procedural Soundscape Presets"
      className="w-full bg-[#1A0F15]/95 border border-[#D49572]/25 rounded-xl px-2.5 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex items-center justify-between md:justify-start md:space-x-2 shrink-0 px-1">
          <div className="flex items-center space-x-1.5">
            <svg
              className="w-3.5 h-3.5 text-[#E3A988]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F7EDE6]">
              Presets
            </span>
          </div>

          {activePresetId === "custom" && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2E1922] border border-[#D49572]/45 text-[#E8B89A]">
              Custom
            </span>
          )}
        </div>

        {/* Preset Cards Grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_LIST.map((preset) => {
            const isSelected = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectPreset(preset)}
                className={`group relative flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#D49572] focus-visible:outline-none select-none ${
                  isSelected
                    ? "bg-gradient-to-r from-[#2D1821] via-[#23131A] to-[#1A0E14] border-[#D49572] shadow-[0_0_14px_rgba(212,149,114,0.22)] ring-1 ring-[#D49572]/45"
                    : "bg-[#1E1118]/90 hover:bg-[#27161F] border-[#D49572]/15 hover:border-[#D49572]/50"
                } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"}`}
              >
                <PresetTreeThumbnail id={preset.id} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[13px] font-semibold tracking-tight truncate ${
                        isSelected ? "text-[#FFF5EE]" : "text-[#F3E2D8] group-hover:text-white"
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected ? (
                      <span
                        className="w-3.5 h-3.5 rounded-full bg-[#D49572] text-[#1A0E12] flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#5C3A45] group-hover:bg-[#D49572]/70 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-[#E6CFC2] truncate">
                    {PRESET_SHORT_DESC[preset.id] ?? preset.tagline} ·{" "}
                    <span className="font-mono text-[#E8B89A]">
                      {preset.config.maxDepth}D {preset.config.branchAngle}° {preset.audio.scale} {preset.audio.tempo}bpm
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
