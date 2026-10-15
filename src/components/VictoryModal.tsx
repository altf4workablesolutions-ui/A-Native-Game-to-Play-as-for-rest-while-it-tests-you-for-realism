import React from 'react';
import { Award, Coins, Flame, RotateCcw, Wrench, Sparkles, Trophy } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  score: number;
  coins: number;
  clearedCount: number;
  bestCombo: number;
  districtName: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onContinue,
  onOpenGarage,
  onOpenLeaderboard,
  score,
  coins,
  clearedCount,
  bestCombo,
  districtName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.25)]">
        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
          <Award className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
          DISTRICT CLEARED!
        </h2>
        <p className="text-sm font-semibold text-amber-400 mt-1">{districtName} is safe & cozy!</p>
        <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
          Mayor Penelope and the town council award you the Golden Snowflake Key for keeping our roads open!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full my-6">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Score</span>
            <div className="text-xl font-black text-sky-300 tabular-nums">{score.toLocaleString()}</div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Cozy Coins</span>
            <div className="flex items-center justify-center gap-1.5 text-xl font-black text-amber-400 tabular-nums">
              <Coins className="w-4 h-4" />
              <span>+{coins}</span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Snow Cleared</span>
            <div className="text-xl font-black text-white tabular-nums">{clearedCount} m²</div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Max Combo</span>
            <div className="flex items-center justify-center gap-1 text-xl font-black text-orange-400 tabular-nums">
              <Flame className="w-4 h-4" />
              <span>{bestCombo.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onContinue}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow hover:scale-105 active:scale-95 cursor-pointer"
          >
            Keep Plowing (100%)
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Garage</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-sm border border-slate-600 transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-sky-400" />
            <span>Post Score</span>
          </button>
        </div>
      </div>
    </div>
  );
};
