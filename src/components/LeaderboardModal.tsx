import React, { useEffect, useState } from 'react';
import { X, Trophy, Medal, Snowflake, Send, LogIn, Check } from 'lucide-react';
import { User } from 'firebase/auth';
import { getTopLeaderboard, submitLeaderboardScore, LeaderboardEntryData } from '../firebase/userStore.ts';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  clearedCount: number;
  bestCombo: number;
  district: string;
  user: User | null;
  onSignIn: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  clearedCount,
  bestCombo,
  district,
  user,
  onSignIn,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadScores();
    }
  }, [isOpen]);

  const loadScores = async () => {
    setLoading(true);
    const data = await getTopLeaderboard(15);
    setEntries(data);
    setLoading(false);
  };

  const handleSubmitScore = async () => {
    if (!user || currentScore <= 0 || submitting || submitted) return;
    setSubmitting(true);
    try {
      await submitLeaderboardScore({
        score: currentScore,
        snowCleared: clearedCount,
        bestCombo: Math.max(1, bestCombo),
        district: district || 'Pine Hollow',
      });
      setSubmitted(true);
      await loadScores();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Town Honor Roll</h2>
              <p className="text-xs text-slate-400">Top snow-plow drivers of Snowflake Valley</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close leaderboard"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Run Banner & Submit */}
        <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Run Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-400 tabular-nums">{currentScore.toLocaleString()}</span>
              <span className="text-xs text-slate-400">({clearedCount} tiles · {bestCombo.toFixed(1)}x max)</span>
            </div>
          </div>

          {user ? (
            <button
              onClick={handleSubmitScore}
              disabled={submitting || submitted || currentScore === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                submitted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : currentScore > 0
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Submitted!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Post to Board'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Post Score</span>
            </button>
          )}
        </div>

        {/* Scores List */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Snowflake className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              Loading town records...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No entries logged yet. Be the first to record a winter run!
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{entry.displayName}</h4>
                    <p className="text-[11px] text-slate-400">
                      {entry.district} · {entry.snowCleared} m² plowed · {entry.bestCombo.toFixed(1)}x combo
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-300 tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">pts</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
