import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Star,
} from 'lucide-react';
import { roomService } from '@/services';
import { getPlayerBadge, getBadgeStyle } from '@/utils/badgeHelper';

interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  displayScore: number;
  streak: number;
  change: 'up' | 'down' | 'same';
  rankChangeAmount: number;
  isMe?: boolean;
  oldRank: number;
  newRank: number;
  pointsToAdd: number;
  equipped_title?: string | null;
}

// Custom Confetti Component
const ConfettiCanvas: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#fbbf24'];
    const confettiCount = 80;
    const particles = Array.from({ length: confettiCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
      speedY: Math.random() * 2 + 1.5,
      rotation: Math.random() * 360,
    }));

    let animationFrameId: number;
    let opacity = 1;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.speedY;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Fade out confetti slowly after 3.5 seconds
    const fadeTimer = setTimeout(() => {
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          cancelAnimationFrame(animationFrameId);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 50);
    }, 3500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fadeTimer);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

export const LiveLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    nickname?: string;
    roomCode?: string;
    roomId?: number;
    score?: number;
    streak?: number;
    lastPointsEarned?: number;
    lastIsCorrect?: boolean;
    questionNumber?: number;
    fromSource?: 'landing' | 'dashboard';
    activeTab?: string;
  } | null;

  // Restore state from sessionStorage on page refresh
  const roomCode = state?.roomCode || sessionStorage.getItem('play_room_code') || '';
  const nickname = state?.nickname || sessionStorage.getItem('play_nickname') || 'Guest';
  const roomId = state?.roomId || Number(sessionStorage.getItem('play_room_id') || 0);
  const myStreak = state?.streak ?? Number(sessionStorage.getItem('play_final_streak') || 0);
  const fromSource = state?.fromSource || (localStorage.getItem('token') ? 'dashboard' : 'landing');
  const activeTab = state?.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'join_room';

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'initial' | 'adding_scores' | 'ranking_shift' | 'podium_reveal'>('initial');

  // Persist session parameters
  useEffect(() => {
    if (state?.roomId) sessionStorage.setItem('play_room_id', String(state.roomId));
    if (state?.streak !== undefined) sessionStorage.setItem('play_final_streak', String(state.streak));
  }, [state]);

  // Fetch real participants from DB
  useEffect(() => {
    if (!roomId && !roomCode) return;
    const fetchLeaderboard = async () => {
      try {
        let participantsList: any[] = [];
        if (roomId) {
          participantsList = await roomService.getParticipants(roomId);
        } else {
          const roomData = await roomService.getRoom(roomCode);
          participantsList = roomData.participants || [];
        }

        if (!participantsList || participantsList.length === 0) {
          console.warn('No participants found for leaderboard. roomId=', roomId, 'roomCode=', roomCode);
          setLoading(false);
          return;
        }

        let myAvatar = '';
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            myAvatar = u.avatar || u.avatar_url || '';
          } catch (e) {}
        }

        const mapped: LeaderboardPlayer[] = participantsList.map((p: any) => {
          const isMe = p.nickname?.trim().toLowerCase() === nickname.trim().toLowerCase();
          const avatarUrl = p.avatar || (isMe && myAvatar ? myAvatar : undefined);
          return {
            id: String(p.id),
            name: p.nickname || 'Unknown',
            avatar: avatarUrl,
            score: p.score || 0,
            displayScore: p.score || 0,
            streak: isMe ? myStreak : 0,
            change: 'same',
            rankChangeAmount: 0,
            isMe,
            oldRank: 1,
            newRank: 1,
            pointsToAdd: 0,
            equipped_title: p.equipped_title ?? null,
          };
        });

        const sorted = [...mapped].sort((a, b) => b.score - a.score);
        sorted.forEach((p, idx) => {
          p.oldRank = idx + 1;
          p.newRank = idx + 1;
        });

        setPlayers(sorted);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load leaderboard participants:', err);
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [roomId, roomCode, nickname, myStreak]);

  // Trigger podium reveal animation phases with count-up ticks
  useEffect(() => {
    if (loading || players.length === 0) return;

    const timer1 = setTimeout(() => {
      setPhase('adding_scores');

      // Score count-up ticker animation
      let step = 0;
      const totalSteps = 20;
      const tickerInterval = setInterval(() => {
        step += 1;
        const ratio = step / totalSteps;
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            displayScore: Math.round(p.score * ratio),
          }))
        );

        if (step >= totalSteps) {
          clearInterval(tickerInterval);
          setTimeout(() => {
            setPhase('ranking_shift');
            setTimeout(() => {
              setPhase('podium_reveal');
            }, 600);
          }, 400);
        }
      }, 35);
    }, 400);

    return () => clearTimeout(timer1);
  }, [loading]);

  const currentSorted = [...players].sort((a, b) => a.newRank - b.newRank);
  const top1 = currentSorted.find((p) => p.newRank === 1);
  const top2 = currentSorted.find((p) => p.newRank === 2);
  const top3 = currentSorted.find((p) => p.newRank === 3);
  const mePlayer = players.find((p) => p.isMe);

  const handleNextAction = () => {
    sessionStorage.removeItem('play_room_code');
    sessionStorage.removeItem('play_nickname');
    sessionStorage.removeItem('play_room_id');
    sessionStorage.removeItem('play_final_score');
    sessionStorage.removeItem('play_final_streak');
    sessionStorage.removeItem('play_last_points_earned');
    sessionStorage.removeItem('play_last_is_correct');
    sessionStorage.removeItem('play_participant_id');

    if (localStorage.getItem('token')) {
      navigate('/dashboard', { state: { activeTab } });
    } else {
      navigate('/');
    }
  };

  if (!roomCode && !roomId) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">No Active Room Session</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          You don't seem to be associated with any active quiz room leaderboard.
        </p>
        <button
          onClick={() => navigate(localStorage.getItem('token') ? '/dashboard' : '/')}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 animate-pulse">Computing final ranks & podium...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white font-body-md relative overflow-hidden flex flex-col">
      {/* Confetti Animation Canvas */}
      <ConfettiCanvas active={phase === 'podium_reveal'} />

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-800/25 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[250px] bg-purple-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex-grow flex flex-col w-full max-w-2xl mx-auto px-5 py-5 gap-4">

        {/* Header */}
        <header className="flex justify-between items-center bg-slate-800/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
              <Trophy className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                Final Leaderboard <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              </h1>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                Room Code: <span className="text-indigo-300 font-black">{roomCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleNextAction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700/60 border border-white/10 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-xs font-bold cursor-pointer hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </header>

        {/* My Score Banner with Shine Sheen Animation */}
        {mePlayer && (
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 rounded-3xl border border-indigo-500/40 shadow-xl shadow-indigo-500/20 flex items-center justify-between group">
            {/* Sheen animation line */}
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-0.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> Your Final Score
              </p>
              <p className="text-2xl font-black text-white transition-all">
                {mePlayer.displayScore.toFixed(0)} <span className="text-sm text-indigo-200 font-bold">pts</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-indigo-200 font-bold">Rank #{mePlayer.newRank} of {players.length}</span>
                <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${getBadgeStyle(getPlayerBadge(mePlayer.name, mePlayer.equipped_title))}`}>
                  🏆 {getPlayerBadge(mePlayer.name, mePlayer.equipped_title)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                {mePlayer.avatar ? (
                  <img src={mePlayer.avatar} alt={mePlayer.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-2xl font-black text-amber-300 drop-shadow-md">#{mePlayer.newRank}</span>
                )}
              </div>
              {myStreak > 0 && (
                <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Flame className="w-2.5 h-2.5 fill-current text-amber-400" /> {myStreak} streak
                </span>
              )}
            </div>
          </div>
        )}

        {/* Podium Stage with Animated Gold Halo */}
        <section className="bg-slate-800/80 backdrop-blur-xl p-5 pt-6 rounded-3xl border border-white/10 shadow-2xl relative">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4.5 h-4.5 text-amber-400 fill-amber-400 animate-bounce" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              🏆 Podium Standings
            </h2>
          </div>

          <div className="flex justify-center items-end gap-3 h-[230px] px-2 pt-6">
            {/* 2nd Place */}
            <div className="flex flex-col items-center flex-1">
              {top2 ? (
                <div className={`flex flex-col items-center mb-1.5 transition-all duration-700 ${phase === 'podium_reveal' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}`}>
                  <span className="text-lg mb-0.5 animate-bounce" style={{ animationDelay: '0.2s' }}>🥈</span>
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 p-0.5 shadow-lg overflow-hidden ${top2.isMe ? 'ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                    {top2.avatar ? (
                      <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover rounded-[14px]" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-xs text-slate-300">
                        {top2.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold truncate max-w-[75px] mt-1 ${top2.isMe ? 'text-indigo-300 font-black' : 'text-slate-300'}`}>{top2.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border border-slate-400/30 bg-slate-500/20 text-slate-200 mt-0.5`}>
                    🏆 {getPlayerBadge(top2.name, top2.equipped_title)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold mt-0.5">{top2.displayScore.toFixed(0)} Pts</span>
                </div>
              ) : <div className="flex-1" />}
              <div className={`w-full bg-gradient-to-t from-slate-600 to-slate-500 border-t-2 border-slate-400 rounded-t-2xl flex items-center justify-center shadow-xl transition-all duration-700 delay-100 ${phase === 'podium_reveal' ? 'h-16' : 'h-0'}`}>
                <span className="text-slate-200 font-black text-xs">2nd</span>
              </div>
            </div>

            {/* 1st Place - Golden Champion Stage with Floating Crown */}
            <div className="flex flex-col items-center flex-1 relative">
              {top1 ? (
                <div className={`flex flex-col items-center mb-1.5 transition-all duration-700 ${phase === 'podium_reveal' ? 'opacity-100 translate-y-0 scale-105' : 'opacity-0 translate-y-8 scale-90'}`}>
                  {/* Floating Gold Halo */}
                  <div className="absolute -top-2 w-14 h-14 bg-amber-400/20 rounded-full blur-lg animate-ping pointer-events-none" />

                  <div className="relative mb-0.5 animate-bounce">
                    <span className="text-2xl">🥇</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-spin" />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 p-0.5 shadow-2xl shadow-amber-500/50 relative overflow-hidden ${top1.isMe ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                    {top1.avatar ? (
                      <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover rounded-[13px]" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 rounded-[13px] flex items-center justify-center font-extrabold text-xs text-amber-400">
                        {top1.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold truncate max-w-[85px] mt-1 ${top1.isMe ? 'text-indigo-300 font-black' : 'text-white font-black'}`}>{top1.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border border-amber-300/40 bg-amber-400/20 text-amber-200 mt-0.5`}>
                    🏆 {getPlayerBadge(top1.name, top1.equipped_title)}
                  </span>
                  <span className="text-[10px] text-amber-400 font-black mt-0.5">{top1.displayScore.toFixed(0)} Pts</span>
                  <span className="text-amber-300 font-black text-[11px] drop-shadow-sm mt-0.5 flex items-center gap-0.5">
                    1st <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                  </span>
                </div>
              ) : <div className="flex-1" />}
              <div className={`w-full bg-gradient-to-t from-amber-700 via-amber-600 to-amber-500 border-t-2 border-amber-300 rounded-t-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 transition-all duration-700 ${phase === 'podium_reveal' ? 'h-24' : 'h-0'}`}>
                <span className="text-amber-100 font-black text-xs tracking-wider flex items-center gap-1">1st 🥇</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center flex-1">
              {top3 ? (
                <div className={`flex flex-col items-center mb-1.5 transition-all duration-700 ${phase === 'podium_reveal' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}`}>
                  <span className="text-lg mb-0.5 animate-bounce" style={{ animationDelay: '0.4s' }}>🥉</span>
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-0.5 shadow-lg overflow-hidden ${top3.isMe ? 'ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                    {top3.avatar ? (
                      <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover rounded-[14px]" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-xs text-amber-500">
                        {top3.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold truncate max-w-[75px] mt-1 ${top3.isMe ? 'text-indigo-300 font-black' : 'text-slate-300'}`}>{top3.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border border-amber-600/40 bg-amber-700/20 text-amber-300 mt-0.5`}>
                    🏆 {getPlayerBadge(top3.name, top3.equipped_title)}
                  </span>
                  <span className="text-[10px] text-amber-600 font-extrabold mt-0.5">{top3.displayScore.toFixed(0)} Pts</span>
                </div>
              ) : <div className="flex-1" />}
              <div className={`w-full bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 border-t-2 border-amber-600 rounded-t-2xl flex items-center justify-center shadow-xl transition-all duration-700 delay-200 ${phase === 'podium_reveal' ? 'h-10' : 'h-0'}`}>
                <span className="text-amber-200 font-black text-xs">3rd</span>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Roster List with Smooth Motion */}
        <section className="flex-grow flex flex-col bg-slate-800/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" /> Player Ranks & Dynamic Scores
            </span>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Live Standings
            </span>
          </div>

          {/* Smooth Sliding Roster List */}
          <div className="relative overflow-hidden" style={{ height: `${Math.min(players.length, 7) * 44}px` }}>
            {players.map((player) => {
              const activeRank = phase === 'ranking_shift' || phase === 'podium_reveal' ? player.newRank : player.oldRank;
              const yPosition = (activeRank - 1) * 44;
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
                  className={`absolute left-0 right-0 h-10 px-3 py-1.5 rounded-2xl border flex items-center justify-between transition-all duration-700 ease-out ${cardStyle}`}
                  style={{ transform: `translateY(${yPosition}px)` }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center text-xs font-black ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                      #{activeRank}
                    </span>
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-7 h-7 rounded-lg object-cover shadow-sm flex-shrink-0" />
                    ) : (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] flex-shrink-0 ${isMe ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-600 text-slate-200'}`}>
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs truncate max-w-[100px] ${isMe ? 'font-black text-white' : 'font-bold'}`}>
                        {player.name} {isMe && <span className="text-[9px] text-indigo-200 font-bold">(You)</span>}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border ${getBadgeStyle(getPlayerBadge(player.name, player.equipped_title))}`}>
                        🏆 {getPlayerBadge(player.name, player.equipped_title)}
                      </span>
                      {player.streak > 0 && (
                        <span className="text-[9px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-current text-amber-400" /> {player.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold ${isMe ? 'text-amber-300' : 'text-white'}`}>
                      {player.displayScore.toFixed(0)} pts
                    </span>
                    <div className="w-10 flex items-center justify-end">
                      {(phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedUp && (
                        <div className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5 animate-bounce">
                          <ArrowUp className="w-3 h-3" />+{player.rankChangeAmount}
                        </div>
                      )}
                      {(phase === 'ranking_shift' || phase === 'podium_reveal') && hasRankedDown && (
                        <div className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3" />
                        </div>
                      )}
                      {player.change === 'same' && (
                        <span className="text-xs text-slate-500 font-bold">-</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Button */}
        <footer className="pt-1">
          <button
            onClick={handleNextAction}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" /> Finish & Exit Room 🏁
          </button>
        </footer>

      </div>
    </div>
  );
};
