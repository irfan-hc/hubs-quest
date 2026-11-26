"use client";

import React, { useState } from "react";
import { Composition, MusicalScale, PlaybackState } from "@/lib/audio/types";
import { renderCompositionToWav, triggerWavDownload } from "@/lib/audio/wavExporter";

interface PlaybackPanelProps {
  playbackState: PlaybackState;
  composition: Composition;
  seed: number | string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  onRegenerate: () => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  reverb: number;
  onReverbChange: (rev: number) => void;
  scale: MusicalScale;
  onScaleChange: (scale: MusicalScale) => void;
  scaleName: string;
  activeVoices: number;
}

export function PlaybackPanel({
  playbackState,
  composition,
  seed,
  onPlay,
  onPause,
  onResume,
  onStop,
  onReplay,
  onRegenerate,
  tempo,
  onTempoChange,
  volume,
  onVolumeChange,
  reverb,
  onReverbChange,
  scale,
  onScaleChange,
  scaleName,
  activeVoices,
}: PlaybackPanelProps) {
  const isPlaying = playbackState === "playing";
  const isPaused = playbackState === "paused";

  // Stage 6: WAV Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleExportWav = async () => {
    if (isExporting) return;

    if (!composition || !composition.events || composition.events.length === 0) {
      setExportFeedback("Error: No composition available to export");
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }

    setIsExporting(true);
    setExportFeedback("Rendering 16-bit PCM WAV...");

    try {
      const filename = `recursive-soundscapes-seed-${seed}.wav`;
      const result = await renderCompositionToWav(composition, {
        sampleRate: 44100,
        volume: volume / 100,
        reverb: reverb / 100,
        filename,
      });

      // Trigger download
      triggerWavDownload(result.wavBytes, filename);

      const sizeMb = (result.sizeBytes / (1024 * 1024)).toFixed(2);
      setExportFeedback(`Exported ${filename} (${result.durationSec.toFixed(1)}s, ${sizeMb} MB)`);
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (err: any) {
      console.error("WAV Export Failed:", err);
      setExportFeedback(`Export Error: ${err?.message || "Failed to render WAV"}`);
      setTimeout(() => setExportFeedback(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      aria-label="Audio Playback & Composition Controls"
      className="w-full rounded-2xl border border-orange-500/20 bg-[#0A0B10]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-colors space-y-3"
    >
      {/* Live Audio Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
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
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Audio &amp; Playback
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          {exportFeedback ? (
            <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-md animate-fade-in">
              {exportFeedback}
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying
                    ? "bg-[#FF7A1A] shadow-[0_0_8px_rgba(255,122,26,0.9)] animate-pulse"
                    : isPaused
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                }`}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] text-slate-300">
                {isPlaying
                  ? `Playing • ${scaleName} (${activeVoices} events)`
                  : isPaused
                  ? `Paused • Click Resume to Continue`
                  : `Standby • ${scaleName} Ready`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Transport Actions (Black & White Monochrome Theme) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Main Play / Pause / Resume Button (full width across 2 cols) */}
        <div className="col-span-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause Soundscape"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-900 text-white border border-white font-semibold text-xs sm:text-sm shadow-[0_0_14px_rgba(255,255,255,0.18)] transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Pause</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={onResume}
              aria-label="Resume Soundscape"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black border border-white font-semibold text-xs sm:text-sm shadow-[0_0_16px_rgba(255,255,255,0.28)] transition-all active:scale-95 animate-pulse"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              aria-label="Play Procedural Soundscape"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black border border-white font-semibold text-xs sm:text-sm shadow-[0_0_16px_rgba(255,255,255,0.25)] transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Play Soundscape</span>
            </button>
          )}
        </div>

        {/* Stop Button */}
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop Playback"
          title="Stop Playback and Silence Audio"
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-black hover:bg-neutral-900 border border-white/25 hover:border-white/70 text-white font-medium text-xs transition-colors active:scale-95"
        >
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
          <span>Stop</span>
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={onReplay}
          aria-label="Replay Composition"
          title="Restart Composition from the Beginning"
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-black hover:bg-neutral-900 border border-white/25 hover:border-white/70 text-white font-medium text-xs transition-colors active:scale-95"
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
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Replay</span>
        </button>

        {/* Regenerate Composition Button */}
        <button
          type="button"
          onClick={onRegenerate}
          aria-label="Regenerate Composition"
          title="Regenerate New Seed & Composition"
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-black hover:bg-neutral-900 border border-white/25 hover:border-white/70 text-white font-medium text-xs transition-colors active:scale-95"
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
          <span>Regenerate</span>
        </button>

        {/* Stage 6: Export WAV Button */}
        <button
          type="button"
          onClick={handleExportWav}
          disabled={isExporting}
          aria-label="Export Composition as WAV Audio File"
          title="Render and Download 16-bit Stereo PCM WAV File"
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
            isExporting
              ? "bg-neutral-900 border-white/40 text-neutral-300 opacity-80 cursor-wait"
              : "bg-black hover:bg-neutral-900 border-white/25 hover:border-white/70 text-white"
          }`}
        >
          {isExporting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export WAV</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Controls: Scale, Tempo, Volume, Reverb */}
      <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5 items-center">
        {/* Musical Scale Selection */}
        <div className="space-y-1">
          <label htmlFor="playback-scale" className="text-[11px] font-medium text-slate-400 block">
            Harmonic Scale
          </label>
          <div className="relative">
            <select
              id="playback-scale"
              value={scale}
              onChange={(e) => onScaleChange(e.target.value as MusicalScale)}
              className="w-full bg-[#12131C] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 appearance-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-colors"
            >
              <option value="pentatonic">C Major Pentatonic (Zen)</option>
              <option value="dorian">Dorian Twilight (Reflective)</option>
              <option value="lydian">Lydian Celestial (Cosmic)</option>
              <option value="ambient">Ambient 432Hz (Lush)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tempo Control */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <label htmlFor="playback-tempo" className="font-medium text-slate-400">
              Tempo
            </label>
            <span className="font-mono text-orange-300 font-semibold">{tempo} BPM</span>
          </div>
          <input
            id="playback-tempo"
            type="range"
            min="35"
            max="110"
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={35}
            aria-valuemax={110}
            aria-valuenow={tempo}
          />
        </div>

        {/* Master Volume */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <label htmlFor="playback-volume" className="font-medium text-slate-400">
              Master Volume
            </label>
            <span className="font-mono text-orange-300 font-semibold">{volume}%</span>
          </div>
          <input
            id="playback-volume"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
          />
        </div>

        {/* Ambient Reverb */}
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-2 text-[11px]">
            <label htmlFor="playback-reverb" className="font-medium text-slate-400 truncate">
              Space Reverb
            </label>
            <span className="font-mono text-orange-300 font-semibold shrink-0">{reverb}%</span>
          </div>
          <input
            id="playback-reverb"
            type="range"
            min="0"
            max="100"
            value={reverb}
            onChange={(e) => onReverbChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#191B26] rounded-lg appearance-none cursor-pointer accent-[#FF6A00] hover:accent-[#FF8C2A] transition-all"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={reverb}
          />
        </div>
      </div>
    </section>
  );
}
