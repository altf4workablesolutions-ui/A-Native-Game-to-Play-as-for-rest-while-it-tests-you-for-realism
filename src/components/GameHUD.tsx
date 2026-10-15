import React, { useState } from 'react';
import {
  Coins,
  Snowflake,
  Flame,
  Radio,
  Volume2,
  VolumeX,
  Pause,
  Wrench,
  Trophy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Wind,
  Megaphone,
} from 'lucide-react';
import { GameHUDState } from '../game/engine.ts';

interface GameHUDProps {
  state: GameHUDState;
  radioBroadcast: string;
  isRadioLoading: boolean;
  onRequestRadio: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  onResetPosition: () => void;
  onHonk: () => void;
  onTriggerStorm?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  radioBroadcast,
  isRadioLoading,
  onRequestRadio,
  isMuted,
  onToggleMute,
  onPause,
  onOpenGarage,
  onOpenLeaderboard,
  onResetPosition,
  onHonk,
  onTriggerStorm,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const comboColors: Record<number, { text: string; bg: string; border: string }> = {
    0: { text: 'text-sky-300', bg: 'bg-sky-950/80', border: 'border-sky-500/40' },
    1: { text: 'text-teal-300', bg: 'bg-teal-950/80', border: 'border-teal-500/50' },
    2: { text: 'text-amber-300', bg: 'bg-amber-950/80', border: 'border-amber-500/50' },
    3: { text: 'text-orange-400', bg: 'bg-orange-950/80', border: 'border-orange-500/60' },
    4: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-950/85', border: 'border-fuchsia-400/70' },
  };
  const currentComboTheme = comboColors[state.comboTierIndex] || comboColors[0];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* TOP PERIMETER ROW */}
      <div className="flex justify-between items-start gap-4">
        {/* Top-Left: District & Reputation Cluster */}
        <div className="flex flex-col gap-2">
          {/* District & Progress card */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-2 min-w-[210px] sm:min-w-[250px]">
            <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-sky-300">
                <Snowflake className="w-4 h-4 text-sky-400" />
                {state.districtName}
              </span>
              <span className="tabular-nums font-bold text-amber-400">{state.percentCleared}%</span>
            </div>

            {/* Snow Clearing Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 p-0.5 border border-slate-700 overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-sky-500 via-blue-400 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, state.percentCleared)}%` }}
              />
            </div>

            {/* Town Reputation System Bar */}
            <div className="pt-1 border-t border-slate-800 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>Rep: {state.currentRepTier.title}</span>
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {state.reputationXP} XP
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${state.repProgressPercent}%` }}
                />
              </div>
              {state.nextRepTier && (
                <span className="text-[9px] text-slate-400 truncate">
                  Next: {state.nextRepTier.title} ({state.nextRepTier.unlockNote})
                </span>
              )}
            </div>
          </div>

          {/* Coins & Score badge */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow text-xs font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="tabular-nums tracking-wide text-sm">{state.coins}</span>
              <span className="text-[10px] text-amber-400/80 uppercase font-semibold">Coins</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow text-xs font-semibold text-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Score:</span>
              <span className="tabular-nums font-bold text-sky-300 text-sm">{state.score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Snowstorm Banner & Combo Banner */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          {/* Snowstorm Event Live Alert Banner */}
          {state.isStormActive && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-900/95 via-sky-950/95 to-indigo-900/95 border-2 border-sky-400 text-white shadow-[0_0_25px_rgba(56,189,248,0.4)] animate-pulse">
              <Wind className="w-5 h-5 text-sky-300 animate-spin" />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs tracking-wider uppercase text-sky-200">
                    BLIZZARD WARNING IN EFFECT
                  </span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                    2X REWARDS
                  </span>
                </div>
                <span className="text-[10px] text-sky-300 font-medium tabular-nums">
                  Heavy snowfall & low visibility · {state.stormTimerRemaining}s remaining
                </span>
              </div>
            </div>
          )}

          {/* Blizzard Combo Multiplier Banner */}
          {state.streakCount > 0 && (
            <div className="flex flex-col items-center transition-transform duration-200 animate-in fade-in zoom-in-95">
              <div
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 shadow-2xl ${currentComboTheme.bg} ${currentComboTheme.border}`}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 font-black text-xs text-white">
                  {state.comboMultiplier.toFixed(1)}x
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-black uppercase tracking-wider ${currentComboTheme.text}`}>
                    {state.comboTier}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium tabular-nums">
                    Streak: {state.streakCount} tiles
                  </span>
                </div>
              </div>

              <div className="w-28 bg-slate-950/80 rounded-full h-1.5 mt-1 border border-slate-700/60 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-75"
                  style={{ width: `${state.comboTimerProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Radio Dispatch & Controls */}
        <div className="flex flex-col items-end gap-2 max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onHonk}
              title="Honk Musical Horn (H)"
              aria-label="Honk musical horn"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-slate-800 transition shadow cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition shadow cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onPause}
              aria-label="Pause game"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition shadow cursor-pointer"
            >
              <Pause className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Town Radio ("Frostbite FM 98.5") */}
          <div className="pointer-events-auto bg-slate-900/95 border border-sky-500/30 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 w-64 sm:w-80">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Frostbite FM 98.5</span>
              </div>
              <button
                onClick={onRequestRadio}
                disabled={isRadioLoading}
                aria-label="Request radio broadcast"
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-md border border-amber-500/40 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isRadioLoading ? 'Tuning...' : 'Call DJ'}</span>
              </button>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed italic bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 max-h-24 overflow-y-auto">
              {radioBroadcast}
            </p>

            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="text-emerald-400 font-medium">Live Village Dispatch</span>
              <span className="text-slate-400 font-mono">Gemini 3.1 Flash-Lite</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: COLLAPSIBLE DOCK */}
      <div className="flex flex-col items-center justify-end mx-auto pointer-events-auto mb-2">
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium px-3 py-1 rounded-t-xl transition cursor-pointer shadow"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
        </button>

        {!isDockCollapsed && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-w-[320px] max-w-[94vw]">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Speed</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{state.speed}</span>
                <span className="text-xs text-slate-400 font-medium">km/h</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-32 sm:w-40">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1 font-bold text-sky-400">
                  <Flame className={`w-3.5 h-3.5 ${state.isBoosting ? 'text-amber-400 animate-bounce' : ''}`} />
                  Nitro Boost
                </span>
                <span className="text-[10px] text-slate-400">[Space]</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 p-0.5 border border-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    state.isBoosting
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                      : 'bg-gradient-to-r from-sky-400 to-cyan-500'
                  }`}
                  style={{ width: `${state.boostGauge * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
              <button
                onClick={onOpenGarage}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>Custom Shop & Garage</span>
              </button>

              <button
                onClick={onOpenLeaderboard}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-600 transition shadow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-sky-400" />
                <span>Scores</span>
              </button>

              <button
                onClick={onResetPosition}
                title="Reset plow to road center (R)"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
