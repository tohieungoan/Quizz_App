import React from 'react';
import { X, Trophy, Users, Radio, Medal } from 'lucide-react';
import { ExamHistoryItem } from '@/data/userData';

interface LiveLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExamHistoryItem | null;
}

export const LiveLeaderboardModal: React.FC<LiveLeaderboardModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const leaderboardData = item.leaderboard || [
    { rank: 1, name: 'Liam Smith', score: 950, accuracy: '95%' },
    { rank: 2, name: 'Alex Johnson (You)', score: 880, accuracy: '88%', isUser: true },
    { rank: 3, name: 'Maria Garcia', score: 820, accuracy: '82%' },
    { rank: 4, name: 'Emma Watson', score: 760, accuracy: '76%' },
    { rank: 5, name: 'John Doe', score: 700, accuracy: '70%' },
  ];

  const userRank = leaderboardData.find((l) => l.isUser)?.rank || 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-secondary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                Live Room Session • {item.roomCode || '#EDU-3810'}
              </span>
              <h3 className="font-extrabold text-xl mt-1">{item.title}</h3>
              <p className="text-xs text-purple-100">Host: {item.hostName || 'Dr. Sarah Jenkins'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Rank Highlight Banner */}
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                #{userRank}
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">Your Final Position</h4>
                <p className="text-xs text-on-surface-variant">Score: <strong className="text-purple-700">{item.score}</strong> ({item.correctAnswers || 13} Correct)</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              {userRank === 1 ? '1st Place 🏆' : userRank === 2 ? '2nd Place 🥈' : 'Top 5 Finisher'}
            </span>
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> Room Leaderboard Standings
            </h4>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-4 py-3 border-b border-outline-variant/30">Rank</th>
                    <th className="px-4 py-3 border-b border-outline-variant/30">Participant</th>
                    <th className="px-4 py-3 border-b border-outline-variant/30 text-center">Score Points</th>
                    <th className="px-4 py-3 border-b border-outline-variant/30 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {leaderboardData.map((row) => (
                    <tr
                      key={row.rank}
                      className={
                        row.isUser
                          ? 'bg-purple-100/60 font-bold text-purple-950'
                          : 'hover:bg-surface-bright transition-colors'
                      }
                    >
                      <td className="px-4 py-3 font-extrabold">
                        {row.rank === 1 ? '🥇 1st' : row.rank === 2 ? '🥈 2nd' : row.rank === 3 ? '🥉 3rd' : `#${row.rank}`}
                      </td>
                      <td className="px-4 py-3 font-bold flex items-center gap-2">
                        {row.name}
                        {row.isUser && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-700 text-white font-extrabold">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-purple-700">{row.score} pts</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{row.accuracy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition-all shadow-xs"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
