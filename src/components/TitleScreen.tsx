import React, { useEffect } from 'react';
import { Play, Sparkles, Volume2, VolumeX, ShieldCheck, LogIn, Trophy, Wrench } from 'lucide-react';
import { User } from 'firebase/auth';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  user: User | null;
  onSignIn: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGarage,
  onOpenLeaderboard,
  user,
  onSignIn,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-12 pointer-events-none select-none bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/80">
      {/* Top Header info */}
      <div className="flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-sky-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Snow Season 2026 · Fresh Powder: 18cm</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium max-w-[120px] truncate">{user.displayName || 'Driver'}</span>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-400/40 shadow cursor-pointer transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Title Lockup over 30-40% negative space */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="relative mb-4">
          <svg
            className="w-80 sm:w-96 md:w-[480px] h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
            viewBox="0 0 500 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Mountain Crest */}
            <path d="M 60 110 L 150 35 L 210 80 L 300 20 L 380 75 L 440 110 Z" fill="#334155" opacity="0.4" />
            <path d="M 150 35 L 175 60 L 160 65 L 140 50 Z" fill="#f8fafc" />
            <path d="M 300 20 L 325 45 L 310 50 L 290 35 Z" fill="#f8fafc" />

            {/* Title Text */}
            <text x="250" y="65" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="50" fontFamily="system-ui, sans-serif" letterSpacing="4">
              FROSTY TRAILS
            </text>
            <text x="250" y="105" textAnchor="middle" fill="#38bdf8" fontWeight="800" fontSize="22" fontFamily="system-ui, sans-serif" letterSpacing="6">
              COZY 3D SNOW PLOW
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-8 font-medium drop-shadow">
          Clear the snowy streets of Pine Hollow, build massive blizzard combo multipliers, and tune into the town radio dispatch!
        </p>

        {/* Primary Start CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          <button
            onClick={onStart}
            className="group flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-4 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] border-2 border-amber-300 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>START PLOWING</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-base px-6 py-4 rounded-2xl border border-slate-600 shadow transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Plow Garage</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-base px-6 py-4 rounded-2xl border border-slate-600 shadow transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Trophy className="w-5 h-5 text-sky-400" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Flat Single-Line Control Hint */}
      <div className="flex flex-col items-center gap-2 text-center pointer-events-auto">
        <div className="bg-slate-900/90 border border-slate-700/80 px-6 py-2.5 rounded-full text-xs sm:text-sm text-slate-300 font-medium shadow-lg">
          <span className="text-amber-400 font-bold">WASD / Arrows</span> Drive ·{' '}
          <span className="text-sky-400 font-bold">Space</span> Nitro Boost ·{' '}
          <span className="text-emerald-400 font-bold">R</span> Reset Position ·{' '}
          <span className="text-purple-400 font-bold">Esc</span> Pause
        </div>
        <div className="text-[11px] text-slate-400">Press [Enter] or [Space] anytime to start immediately</div>
      </div>
    </div>
  );
};
