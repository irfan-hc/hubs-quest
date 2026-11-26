"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { VisualizationPanel } from "@/components/panels/VisualizationPanel";
import { ParameterPanel } from "@/components/panels/ParameterPanel";
import { PlaybackPanel } from "@/components/panels/PlaybackPanel";
import { PresetSelector } from "@/components/panels/PresetSelector";
import { RecursionConfig } from "@/lib/recursion/types";
import { generateRecursiveTree } from "@/lib/recursion/branchingEngine";
import { mapRecursionToMusic } from "@/lib/audio/musicMapper";
import { audioEngine } from "@/lib/audio/audioEngine";
import { MusicalScale, PlaybackState } from "@/lib/audio/types";
import { PRESETS, matchActivePreset } from "@/lib/presets/presets";
import type { PresetDefinition } from "@/lib/presets/types";

const INITIAL_PRESET = PRESETS.zen;

export default function Home() {
  // Central interactive recursion configuration initialized with Zen preset
  const [config, setConfig] = useState<RecursionConfig>(INITIAL_PRESET.config);

  // Playback & Audio Synthesis State
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [tempo, setTempo] = useState<number>(INITIAL_PRESET.audio.tempo);
  const [scale, setScale] = useState<MusicalScale>(INITIAL_PRESET.audio.scale);
  const [volume, setVolume] = useState<number>(INITIAL_PRESET.audio.volume);
  const [reverb, setReverb] = useState<number>(INITIAL_PRESET.audio.reverb);
  const [activeBranchIds, setActiveBranchIds] = useState<Set<string>>(new Set());

  // Dynamically tracks whether current settings match a preset or are in custom tuning
  const activePresetId = useMemo(() => {
    return matchActivePreset(config, { scale, tempo, reverb });
  }, [config, scale, tempo, reverb]);

  // 1. Generate recursive tree events directly from Stage 2 engine
  const treeResult = useMemo(() => {
    return generateRecursiveTree(config);
  }, [config]);

  // 2. Generate procedural musical composition directly from Stage 2 event data
  const composition = useMemo(() => {
    return mapRecursionToMusic(treeResult, {
      scale,
      tempoBpm: tempo,
      totalDurationSec: 9.0,
      maxSimultaneousVoices: 8,
    });
  }, [treeResult, scale, tempo]);

  // Connect AudioEngine callbacks for state & real-time branch visualization sync
  useEffect(() => {
    if (!audioEngine) return;

    audioEngine.setOnActiveBranchesChange((branchIds: Set<string>) => {
      setActiveBranchIds(branchIds);
    });

    audioEngine.setOnStateChange((state: PlaybackState) => {
      setPlaybackState(state);
    });
  }, []);

  // Volume & Reverb synchronization
  useEffect(() => {
    if (audioEngine) {
      audioEngine.setVolume(volume / 100);
    }
  }, [volume]);

  useEffect(() => {
    if (audioEngine) {
      audioEngine.setReverb(reverb / 100);
    }
  }, [reverb]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioEngine) {
        audioEngine.stop();
      }
    };
  }, []);

  // Playback control actions
  const handlePlay = useCallback(async () => {
    if (!audioEngine) return;
    try {
      await audioEngine.ensureAudioContext();
      await audioEngine.playComposition(composition);
    } catch (err) {
      console.error("Audio playback initialization error:", err);
    }
  }, [composition]);

  const handlePause = useCallback(() => {
    if (!audioEngine) return;
    audioEngine.pause();
  }, []);

  const handleResume = useCallback(async () => {
    if (!audioEngine) return;
    try {
      await audioEngine.ensureAudioContext();
      await audioEngine.resume();
    } catch (err) {
      console.error("Audio resume error:", err);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (!audioEngine) return;
    audioEngine.stop();
    setActiveBranchIds(new Set());
  }, []);

  const handleReplay = useCallback(async () => {
    if (!audioEngine) return;
    try {
      await audioEngine.ensureAudioContext();
      await audioEngine.playComposition(composition);
    } catch (err) {
      console.error("Audio replay error:", err);
    }
  }, [composition]);

  const handleRegenerate = useCallback(() => {
    if (audioEngine) {
      audioEngine.stop();
      setActiveBranchIds(new Set());
    }
    setConfig((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 90000) + 10000,
    }));
  }, []);

  const handleScaleChange = useCallback(
    (newScale: MusicalScale) => {
      if (audioEngine && (playbackState === "playing" || playbackState === "paused")) {
        audioEngine.stop();
        setActiveBranchIds(new Set());
      }
      setScale(newScale);
    },
    [playbackState]
  );

  const handleTempoChange = useCallback(
    (newTempo: number) => {
      if (audioEngine && (playbackState === "playing" || playbackState === "paused")) {
        audioEngine.stop();
        setActiveBranchIds(new Set());
      }
      setTempo(newTempo);
    },
    [playbackState]
  );

  const handleSelectPreset = useCallback(
    (preset: PresetDefinition) => {
      if (audioEngine && (playbackState === "playing" || playbackState === "paused")) {
        audioEngine.stop();
        setActiveBranchIds(new Set());
      }
      setConfig(preset.config);
      setScale(preset.audio.scale);
      setTempo(preset.audio.tempo);
      setReverb(preset.audio.reverb);
      setVolume(preset.audio.volume);
    },
    [playbackState]
  );

  const handleConfigChange = (updates: Partial<RecursionConfig>) => {
    if (audioEngine && (playbackState === "playing" || playbackState === "paused")) {
      audioEngine.stop();
      setActiveBranchIds(new Set());
    }
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleRandomizeSeed = () => {
    handleRegenerate();
  };

  const handleResetDefaults = () => {
    handleSelectPreset(INITIAL_PRESET);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      {/* Top Application Header */}
      <Header />

      {/* Main Responsive Photoshop-Style Studio Workspace */}
      <main className="flex-1 min-h-0 w-full px-2.5 py-2 flex flex-col gap-2">
        {/* Compact Atmosphere Presets Strip */}
        <div className="shrink-0">
          <PresetSelector
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
          />
        </div>

        {/* Core Studio Area: Maximized Simulation Canvas + Compact Scrollable Right Inspector */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5">
          {/* Main Cosmic Visualization Viewport (always 100% visible on desktop) */}
          <div className="flex-1 min-w-0 lg:h-full flex flex-col">
            <VisualizationPanel
              result={treeResult}
              isPlaying={playbackState === "playing"}
              activeBranchIds={activeBranchIds}
              activePresetId={activePresetId}
              onReplay={handleReplay}
              onResetDefaults={handleResetDefaults}
            />
          </div>

          {/* Right Inspector Dock: Slimmer width + independently scrollable */}
          <div className="w-full lg:w-[290px] xl:w-[320px] shrink-0 lg:h-full lg:overflow-y-auto lg:pr-0.5 flex flex-col gap-2.5">
            <PlaybackPanel
              playbackState={playbackState}
              composition={composition}
              seed={config.seed ?? 1337}
              onPlay={handlePlay}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onReplay={handleReplay}
              onRegenerate={handleRegenerate}
              tempo={tempo}
              onTempoChange={handleTempoChange}
              volume={volume}
              onVolumeChange={setVolume}
              reverb={reverb}
              onReverbChange={setReverb}
              scale={scale}
              onScaleChange={handleScaleChange}
              scaleName={composition.scaleName}
              activeVoices={composition.activeVoicesCount}
            />
            <ParameterPanel
              config={config}
              onChange={handleConfigChange}
              onRandomizeSeed={handleRandomizeSeed}
              onResetDefaults={handleResetDefaults}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
