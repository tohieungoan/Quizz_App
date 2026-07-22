import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Flame,
  ArrowUp,
  ArrowDown,
  Sparkles,
  LogOut,
  ChevronRight,
  Award,
  Crown,
  TrendingUp,
} from 'lucide-react';

interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  displayScore: number;
  streak: number;
  change: 'up' | 'down' | 'same';
  rankChangeAmount: number;
  isMe?: boolean;
  oldRank: number;
  newRank: number;
  pointsToAdd: number;
}

export const LiveLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State variables passed from Answer Screen
  const state = location.state as {
    nickname?: string;
    roomCode?: string;
    score?: number;
    streak?: number;
    lastPointsEarned?: number;
    lastIsCorrect?: boolean;
    questionNumber?: number;
    fromSource?: 'landing' | 'dashboard';
    activeTab?: string;
  } | null;

  const nickname = state?.nickname || 'Guest';
  const fromSource = state?.fromSource || (localStorage.getItem('token') ? 'dashboard' : 'landing');
  const activeTab = state?.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'join_room';
  const roomCode = state?.roomCode || '823914';
  const myFinalScore = state?.score ?? 4450;
  const myStreak = state?.streak ?? 4;
  const lastPointsEarned = state?.lastPointsEarned ?? 1000;
  const lastIsCorrect = state?.lastIsCorrect ?? true;
  const questionNumber = state?.questionNumber || 3;

  const TOTAL_QUESTIONS = 3;
  const isGameFinished = questionNumber >= TOTAL_QUESTIONS;

  // Initial Players with base scores
  const initialPlayers: LeaderboardPlayer[] = [
    {
      id: '1',
      name: 'SpeedRunner',
      score: 4800,
      displayScore: 4800,
      streak: 4,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 1,
      newRank: 1,
      pointsToAdd: isGameFinished ? 300 : 500,
    },
    {
      id: '2',
      name: 'SarahM',
      score: 4200,
      displayScore: 4200,
      streak: 3,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 2,
      newRank: 2,
      pointsToAdd: isGameFinished ? 100 : 150,
    },
    {
      id: '3',
      name: nickname,
      score: myFinalScore - lastPointsEarned,
      displayScore: myFinalScore - lastPointsEarned,
      streak: lastIsCorrect ? Math.max(0, myStreak - 1) : myStreak,
      change: 'same',
      rankChangeAmount: 0,
      isMe: true,
      oldRank: 3,
      newRank: 3,
      pointsToAdd: lastPointsEarned,
    },
    {
      id: '4',
      name: 'DevPro',
      score: 3700,
      displayScore: 3700,
      streak: 2,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 4,
      newRank: 4,
      pointsToAdd: isGameFinished ? 200 : 400,
    },
    {
      id: '5',
      name: 'Lara Croft',
      score: 3600,
      displayScore: 3600,
      streak: 0,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 5,
      newRank: 5,
      pointsToAdd: 100,
    },
    {
      id: '6',
      name: 'BugHunter',
      score: 3400,
      displayScore: 3400,
      streak: 1,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 6,
      newRank: 6,
      pointsToAdd: 50,
    },
    {
      id: '7',
      name: 'FlexboxKing',
      score: 3100,
      displayScore: 3100,
      streak: 0,
      change: 'same',
      rankChangeAmount: 0,
      oldRank: 7,
      newRank: 7,
      pointsToAdd: 0,
    },
  ];

  // Sort initially to establish old ranks
  const sortedInitial = [...initialPlayers].sort((a, b) => b.score - a.score);
  sortedInitial.forEach((p, idx) => {
    p.oldRank = idx + 1;
    p.newRank = idx + 1;
  });

  const [players, setPlayers] = useState<LeaderboardPlayer[]>(sortedInitial);
  const [phase, setPhase] = useState<'initial' | 'adding_scores' | 'ranking_shift' | 'podium_reveal'>('initial');

  useEffect(() => {
    // 1. Start score count-up after 800ms
    const timer1 = setTimeout(() => {
      setPhase('adding_scores');

      let frame = 0;
      const totalFrames = 20;
      const interval = setInterval(() => {
        frame += 1;
        const progress = frame / totalFrames;
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            displayScore: Math.round(p.score + p.pointsToAdd * progress),
          }))
        );

        if (frame >= totalFrames) {
          clearInterval(interval);

          // 2. Trigger rank shift animation
          setTimeout(() => {
            setPhase('ranking_shift');

            const updated = players.map((p) => ({ ...p, score: p.score + p.pointsToAdd, displayScore: p.score + p.pointsToAdd }));
            const sorted = [...updated].sort((a, b) => b.score - a.score);

            const finalRanks = updated.map((p) => {
              const newRankIdx = sorted.findIndex((x) => x.id === p.id);
              const newRank = newRankIdx + 1;
              const rankChangeAmount = p.oldRank - newRank;
              let change: 'up' | 'down' | 'same' = 'same';
              if (newRank < p.oldRank) change = 'up';
              else if (newRank > p.oldRank) change = 'down';

              return {
                ...p,
                newRank,
                change,
                rankChangeAmount,
                streak: p.isMe ? myStreak : p.pointsToAdd > 0 ? p.streak + 1 : 0,
              };
            });

            setPlayers(finalRanks);

            // 3. Podium Reveal
            setTimeout(() => {
              setPhase('podium_reveal');
            }, 800);
          }, 400);
        }
      }, 50);
    }, 800);

    return () => clearTimeout(timer1);
  }, []);

  // Sorted list based on active current position
  const currentSorted = [...players].sort((a, b) => a.newRank - b.newRank);
  const top1 = currentSorted.find((p) => p.newRank === 1);
  const top2 = currentSorted.find((p) => p.newRank === 2);
  const top3 = currentSorted.find((p) => p.newRank === 3);

  const mePlayer = players.find((p) => p.isMe);

  const isLoggedIn = !!(localStorage.getItem('token') || localStorage.getItem('user'));

  const handleNextAction = () => {
    if (isGameFinished) {
      if (isLoggedIn || fromSource === 'dashboard') {
        navigate('/dashboard', { state: { activeTab } });
      } else {
        navigate('/');
      }
    } else {
      navigate('/play', {
        state: {
          nickname,
          roomCode,
          score: myFinalScore,
          streak: myStreak,
          activePowerUp: null,
          questionNumber: questionNumber + 1,
          fromSource,
          activeTab,
        },
      });
    }
  };

  const handleLeave = () => {
    if (isLoggedIn || fromSource === 'dashboard') {
      navigate('/dashboard', { state: { activeTab } });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background Animated Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[40%] right-[20%] w-60 h-60 bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto w-full px-4 py-6 flex-grow flex flex-col justify-between">
        {/* Header */}
        <header className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-2xl shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">
              Room: <span className="text-amber-400 font-extrabold">{roomCode}</span>
            </span>
          </div>

          {isGameFinished ? (
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit Room
            </button>
          ) : (
            <div className="text-[11px] font-bold text-slate-300 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5">
              <span>Question {questionNumber} of {TOTAL_QUESTIONS}</span>
            </div>
          )}
        </header>

        {/* Title */}
        <div className="text-center my-3 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-wider shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            {isGameFinished ? 'Final Podium Standings' : 'Live Leaderboard'}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {isGameFinished ? '🏆 Grand Finale Results' : 'Leaderboard Standings'}
          </h1>
          <p className="text-xs text-indigo-200 font-medium">
            {phase === 'initial' && 'Calculating round results...'}
            {phase === 'adding_scores' && '⚡ Scores updating live!'}
            {(phase === 'ranking_shift' || phase === 'podium_reveal') && mePlayer?.change === 'up' && (
              <span className="text-emerald-400 font-bold animate-bounce inline-block">
                🚀 Awesome! You climbed +{mePlayer.rankChangeAmount} Position{mePlayer.rankChangeAmount > 1 ? 's' : ''}!
              </span>
            )}
            {(phase === 'ranking_shift' || phase === 'podium_reveal') && mePlayer?.change !== 'up' && (
              <span>Scores settled! View rank positions below.</span>
            )}
          </p>
        </div>

        {/* 🏆 Top 3 Podium (Visual Showcase) */}
        <section className="my-2">
          <div className="flex items-end justify-center gap-3 pt-8 pb-2 h-48 relative px-2">
            {/* 2nd Place */}
            {top2 && (
              <div
                className={`flex flex-col items-center flex-1 transition-all duration-700 ${
                  phase === 'podium_reveal' ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-60 translate-y-4'
                }`}
              >
                <div className="relative mb-1 flex flex-col items-center justify-center">
                  <span className="text-xs mb-0.5">🥈</span>
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 p-0.5 shadow-lg ${
                      top2.isMe ? 'ring-4 ring-emerald-400' : ''
                    }`}
                  >
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-xs text-slate-200">
                      {top2.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-200 truncate max-w-[75px]">{top2.name}</span>
                <span className="text-[10px] text-slate-400 font-extrabold mb-1">{top2.displayScore} Pts</span>
                <div className="w-full bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 border-t-2 border-slate-300 h-16 rounded-t-2xl flex items-center justify-center shadow-xl">
                  <span className="text-slate-200 font-black text-sm">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place (Winner Crown - Perfectly Centered) */}
            {top1 && (
              <div
                className={`flex flex-col items-center flex-1 -translate-y-2 transition-all duration-700 delay-150 ${
                  phase === 'podium_reveal' ? 'scale-105 opacity-100' : 'scale-90 opacity-60'
                }`}
              >
                <div className="relative mb-1 flex flex-col items-center justify-center">
                  {/* Crown Centered Above Avatar */}
                  <div className="flex justify-center items-center w-full mb-0.5">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-300 animate-bounce drop-shadow-md" />
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl blur-md animate-pulse opacity-70" />
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 p-0.5 shadow-2xl relative z-10 ${
                        top1.isMe ? 'ring-4 ring-emerald-400' : ''
                      }`}
                    >
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-sm text-amber-300">
                        {top1.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-300 truncate max-w-[85px]">{top1.name}</span>
                <span className="text-[10px] text-amber-400 font-black mb-1">{top1.displayScore} Pts</span>
                <div className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 border-t-2 border-yellow-200 h-24 rounded-t-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-amber-950 font-black text-base drop-shadow-sm">1st 👑</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div
                className={`flex flex-col items-center flex-1 transition-all duration-700 ${
                  phase === 'podium_reveal' ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-60 translate-y-4'
                }`}
              >
                <div className="relative mb-1 flex flex-col items-center justify-center">
                  <span className="text-xs mb-0.5">🥉</span>
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-0.5 shadow-lg ${
                      top3.isMe ? 'ring-4 ring-emerald-400' : ''
                    }`}
                  >
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-xs text-amber-500">
                      {top3.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-300 truncate max-w-[75px]">{top3.name}</span>
                <span className="text-[10px] text-amber-600 font-extrabold mb-1">{top3.displayScore} Pts</span>
                <div className="w-full bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 border-t-2 border-amber-600 h-12 rounded-t-2xl flex items-center justify-center shadow-xl">
                  <span className="text-amber-200 font-black text-xs">3rd</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Animated Roster Shift List */}
        <section className="flex-grow flex flex-col mb-4 bg-slate-800/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Player Positions & Scores
            </span>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Live Ranking
            </span>
          </div>

          {/* Smooth Sliding Roster List */}
          <div className="relative h-[290px] overflow-hidden">
            {players.map((player) => {
              const activeRank = phase === 'ranking_shift' || phase === 'podium_reveal' ? player.newRank : player.oldRank;
              const yPosition = (activeRank - 1) * 41;

              const isMe = player.isMe;
              const hasRankedUp = player.change === 'up';
              const hasRankedDown = player.change === 'down';

              let cardStyle = 'bg-slate-700/50 border-white/10 text-slate-200';
              if (isMe) {
                cardStyle = 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 border-indigo-400 border-2 ring-4 ring-indigo-500/30 text-white font-bold shadow-lg';
              } else if ((phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedUp) {
                cardStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100 shadow-md';
              } else if ((phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedDown) {
                cardStyle = 'bg-rose-950/40 border-rose-500/40 text-rose-200';
              }

              return (
                <div
                  key={player.id}
                  className={`absolute left-0 right-0 h-9.5 px-3 py-2 rounded-2xl border flex items-center justify-between transition-all duration-700 ease-out ${cardStyle}`}
                  style={{ transform: `translateY(${yPosition}px)` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <span className={`w-5 text-center text-xs font-black ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                      #{activeRank}
                    </span>

                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[9px] ${
                        isMe ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-600 text-slate-200'
                      }`}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Nickname & Streak */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs truncate max-w-[110px] ${isMe ? 'font-black text-white' : 'font-bold'}`}>
                        {player.name} {isMe && '(You)'}
                      </span>
                      {player.streak > 0 && (
                        <span className="text-[9px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-current text-amber-400" /> {player.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Rank Shift Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold ${isMe ? 'text-amber-300' : 'text-white'}`}>
                      {player.displayScore} pts
                    </span>

                    <div className="w-12 flex items-center justify-end">
                      {(phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedUp && (
                        <div className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5 animate-bounce">
                          <ArrowUp className="w-3 h-3 fill-current" />+{player.rankChangeAmount}
                        </div>
                      )}
                      {(phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedDown && (
                        <div className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                      {(phase === 'initial' || phase === 'adding_scores' || player.change === 'same') && (
                        <span className="text-xs text-slate-500 font-bold">-</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="pt-2">
          <button
            onClick={handleNextAction}
            className={`w-full py-3.5 text-white rounded-2xl text-sm font-extrabold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              isGameFinished
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30'
            }`}
          >
            {isGameFinished ? (
              <>
                <Award className="w-4 h-4" /> Finish & Exit Room 🏁
              </>
            ) : (
              <>
                Next Question <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
