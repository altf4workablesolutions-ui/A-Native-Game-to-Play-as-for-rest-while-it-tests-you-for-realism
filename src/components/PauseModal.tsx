import React from 'react';
import { Play, RotateCcw, Wrench, Trophy, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenGarage,
  onOpenLeaderboard,
  isMuted,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl">
        <h2 className="text-2xl font-black text-white tracking-wider mb-2">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Take a hot cocoa break! The snow isn't going anywhere.</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Plowing</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-600 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Plow Garage & Upgrades</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-sm border border-slate-600 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-sky-400" />
            <span>Town Leaderboard</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm border border-slate-600 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset District Snow</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Audio: Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio: On</span>
              </>
            )}
          </button>
        </div>

        {/* Controls recap */}
        <div className="mt-6 pt-4 border-t border-slate-800 w-full text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Controls:</p>
          <p>WASD / Arrows to Drive · Space for Nitro Boost · R to Center Plow</p>
        </div>
      </div>
    </div>
  );
};
