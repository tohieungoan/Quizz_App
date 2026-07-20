import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Trophy, Flame, ArrowUp, ArrowDown, Sparkles, LogOut, ChevronRight, Play, Award } from 'lucide-react'

interface LeaderboardPlayer {
  id: string
  name: string
  score: number
  streak: number
  change: 'up' | 'down' | 'same'
  isMe?: boolean
  oldRank: number
  newRank: number
  pointsToAdd: number
}

export const LiveLeaderboard: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // State variables passed from Answer Screen
  const state = location.state as { 
    nickname?: string 
    roomCode?: string 
    score?: number 
    streak?: number 
    lastPointsEarned?: number 
    lastIsCorrect?: boolean
    questionNumber?: number
  } | null

  const nickname = state?.nickname || 'Guest'
  const roomCode = state?.roomCode || '823914'
  const myFinalScore = state?.score ?? 4450
  const myStreak = state?.streak ?? 4
  const lastPointsEarned = state?.lastPointsEarned ?? 1000
  const lastIsCorrect = state?.lastIsCorrect ?? true
  const questionNumber = state?.questionNumber || 3

  const TOTAL_QUESTIONS = 3
  const isGameFinished = questionNumber >= TOTAL_QUESTIONS

  // 1. Initial State: Load leaderboard with OLD scores (before adding the points of this round)
  const initialPlayers: LeaderboardPlayer[] = [
    { id: '1', name: 'SpeedRunner', score: 4800, streak: 4, change: 'same', oldRank: 1, newRank: 1, pointsToAdd: isGameFinished ? 300 : 500 },
    { id: '2', name: 'SarahM', score: 4200, streak: 3, change: 'same', oldRank: 2, newRank: 2, pointsToAdd: isGameFinished ? 100 : 150 },
    { id: '3', name: nickname, score: myFinalScore - lastPointsEarned, streak: lastIsCorrect ? Math.max(0, myStreak - 1) : myStreak, change: 'same', isMe: true, oldRank: 3, newRank: 3, pointsToAdd: lastPointsEarned },
    { id: '4', name: 'DevPro', score: 3700, streak: 2, change: 'same', oldRank: 4, newRank: 4, pointsToAdd: isGameFinished ? 200 : 400 },
    { id: '5', name: 'Lara Croft', score: 3600, streak: 0, change: 'same', oldRank: 5, newRank: 5, pointsToAdd: 100 },
    { id: '6', name: 'BugHunter', score: 3400, streak: 1, change: 'same', oldRank: 6, newRank: 6, pointsToAdd: 50 },
    { id: '7', name: 'FlexboxKing', score: 3100, streak: 0, change: 'same', oldRank: 7, newRank: 7, pointsToAdd: 0 }
  ]

  // Sort initially to establish correct oldRank
  const sortedInitial = [...initialPlayers].sort((a, b) => b.score - a.score)
  sortedInitial.forEach((p, idx) => {
    p.oldRank = idx + 1
    p.newRank = idx + 1
  })

  const [players, setPlayers] = useState<LeaderboardPlayer[]>(sortedInitial)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPodium, setShowPodium] = useState(false)

  // 2. Perform score calculation & rank shift animation after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUpdating(true)

      // Add scores and sort to find new ranking
      const updatedPlayers = players.map(p => ({
        ...p,
        score: p.score + p.pointsToAdd
      }))

      // Sort by new scores descending
      const sortedNew = [...updatedPlayers].sort((a, b) => b.score - a.score)
      
      // Assign new ranks
      const finalPlayers = updatedPlayers.map(p => {
        const newRankIdx = sortedNew.findIndex(x => x.id === p.id)
        const newRank = newRankIdx + 1
        let change: 'up' | 'down' | 'same' = 'same'
        if (newRank < p.oldRank) change = 'up'
        else if (newRank > p.oldRank) change = 'down'

        return {
          ...p,
          newRank,
          change,
          streak: p.isMe ? myStreak : (p.pointsToAdd > 0 ? p.streak + 1 : 0)
        }
      })

      setPlayers(finalPlayers)

      // Show top 3 podium entrance after ranks settle
      setTimeout(() => {
        setShowPodium(true)
      }, 700)

    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Sort for Podium (1st, 2nd, 3rd) display based on current active positions
  const currentSorted = [...players].sort((a, b) => a.newRank - b.newRank)
  const top1 = currentSorted.find(p => p.newRank === 1)
  const top2 = currentSorted.find(p => p.newRank === 2)
  const top3 = currentSorted.find(p => p.newRank === 3)

  const handleNextAction = () => {
    if (isGameFinished) {
      // Exit room, go back to landing page
      navigate('/')
    } else {
      // Navigate to the next question answer screen
      navigate('/play', { 
        state: { 
          nickname, 
          roomCode, 
          score: myFinalScore, 
          streak: myStreak,
          activePowerUp: null,
          questionNumber: questionNumber + 1
        } 
      })
    }
  }

  const handleLeave = () => {
    navigate('/')
  }

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] text-on-surface font-body-md relative overflow-hidden flex flex-col">
      {/* Background Dots */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#c3c0ff 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
          opacity: 0.35,
        }}
      />

      {/* Floating sparkles */}
      <div className="absolute pointer-events-none z-0 inset-0">
        <div className="absolute top-[20%] left-[10%] w-6 h-6 bg-amber-500/15 rounded-full blur-sm animate-bounce" />
        <div className="absolute bottom-[30%] right-[15%] w-8 h-8 bg-primary/15 rounded-full blur-sm animate-pulse" />
      </div>

      <div className="relative z-10 flex-grow flex flex-col max-w-lg mx-auto w-full px-4 py-6 justify-between">
        
        {/* Header - Only render exit button if the game is finished */}
        <header className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-800 bg-white border-2 border-outline-variant/30 px-3.5 py-1.5 rounded-xl shadow-md">
            Room Code: <span className="text-primary font-black">{roomCode}</span>
          </span>

          {isGameFinished ? (
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all border-2 border-red-300 text-xs font-black shadow-md active:scale-95 cursor-pointer animate-in fade-in duration-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit Room
            </button>
          ) : (
            <div className="text-[10px] font-black text-red-650 bg-red-100 px-3.5 py-2 rounded-xl border-2 border-red-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              Exit Locked
            </div>
          )}
        </header>

        {/* Title */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-955 border-2 border-amber-300 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider mb-2 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-650" /> {isGameFinished ? 'Final Standing' : 'Standing leaderboard'}
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-black text-on-surface">
            {isGameFinished ? '🏆 Grand Finale Results' : 'Live Game Standings'}
          </h1>
          <p className="text-xs text-slate-850 font-bold mt-1">
            {isGameFinished 
              ? 'Congratulations! You completed all questions in the room.' 
              : (isUpdating ? 'Scores updated! View rank changes below.' : 'Calculating answers...')}
          </p>
        </div>

        {/* Podium Layout */}
        <section className="mb-4">
          <div className="flex items-end justify-center gap-3 pt-6 pb-2 h-44 relative px-2">
            {/* 2nd Place */}
            {top2 && (
              <div className={`flex flex-col items-center flex-1 transition-all duration-700 ${showPodium ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`}>
                <div className="relative mb-1">
                  <div className={`w-10 h-10 rounded-full border-2 bg-slate-100 flex items-center justify-center font-bold text-[10px] shadow-md ${top2.isMe ? 'border-primary ring-2 ring-primary/10' : 'border-slate-400'}`}>
                    {top2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">🥈</span>
                </div>
                <span className="text-[10px] font-extrabold text-on-surface truncate max-w-[70px]">{top2.name}</span>
                <span className="text-[9px] text-slate-700 font-extrabold mb-1">{top2.score} Pts</span>
                <div className="w-full bg-gradient-to-t from-slate-300 to-slate-100 border-t-2 border-slate-400 h-12 rounded-t-xl flex items-center justify-center shadow-md">
                  <span className="font-headline-md text-slate-600 font-black text-xs">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top1 && (
              <div className={`flex flex-col items-center flex-1 -translate-y-1.5 transition-all duration-700 delay-150 ${showPodium ? 'scale-105 opacity-100' : 'scale-90 opacity-50'}`}>
                <div className="relative mb-1">
                  <div className="absolute -inset-1 bg-amber-400/20 rounded-full blur animate-pulse" />
                  <div className={`w-12 h-12 rounded-full border-2 bg-amber-50 flex items-center justify-center font-bold text-[11px] shadow-md relative z-10 ${top1.isMe ? 'border-primary ring-2 ring-primary/10' : 'border-amber-400'}`}>
                    {top1.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm animate-bounce z-20">👑</span>
                </div>
                <span className="text-[10px] font-black text-on-surface truncate max-w-[75px]">{top1.name}</span>
                <span className="text-[9px] text-amber-705 font-extrabold mb-1">{top1.score} Pts</span>
                <div className="w-full bg-gradient-to-t from-amber-400 to-amber-100 border-t-2 border-amber-500 h-16 rounded-t-xl flex items-center justify-center shadow-md">
                  <span className="font-headline-md text-amber-700 font-black text-sm">1st</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className={`flex flex-col items-center flex-1 transition-all duration-700 ${showPodium ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`}>
                <div className="relative mb-1">
                  <div className={`w-10 h-10 rounded-full border-2 bg-orange-50 flex items-center justify-center font-bold text-[10px] shadow-md ${top3.isMe ? 'border-primary ring-2 ring-primary/10' : 'border-orange-400'}`}>
                    {top3.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">🥉</span>
                </div>
                <span className="text-[10px] font-extrabold text-on-surface truncate max-w-[70px]">{top3.name}</span>
                <span className="text-[9px] text-orange-900 font-extrabold mb-1">{top3.score} Pts</span>
                <div className="w-full bg-gradient-to-t from-orange-300 to-orange-100 border-t-2 border-orange-400 h-10 rounded-t-xl flex items-center justify-center shadow-md">
                  <span className="font-headline-md text-orange-900/80 font-black text-xs">3rd</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Animated Leaderboard List */}
        <section className="flex-grow flex flex-col mb-4 bg-white p-4 rounded-3xl border-2 border-outline-variant/30 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 font-headline-md block mb-3">Live Roster Positions</span>
          
          {/* Scrollable container with fixed height for absolute positioning of child elements */}
          <div className="relative h-[290px] overflow-hidden">
            {players.map((player) => {
              // Calculate Y position based on current rank (newRank) to make them slide!
              // 0-indexed position: (newRank - 1)
              const yPosition = (player.newRank - 1) * 41 // Each row takes 41px

              const isMe = player.isMe
              const hasRankedUp = player.change === 'up'
              const hasRankedDown = player.change === 'down'

              // Border highlight styling when rank shifts - make it more vibrant and saturated
              let borderStyle = 'border-outline-variant/30 bg-white'
              if (isMe) {
                borderStyle = 'border-primary bg-primary-fixed border-2 ring-4 ring-primary/10 shadow-md font-bold'
              } else if (isUpdating && hasRankedUp) {
                borderStyle = 'border-emerald-400 bg-emerald-100/50 text-emerald-950 shadow-sm animate-pulse'
              } else if (isUpdating && hasRankedDown) {
                borderStyle = 'border-red-300 bg-red-100/30 text-red-950'
              }

              return (
                <div
                  key={player.id}
                  className={`absolute left-0 right-0 h-9.5 p-2.5 px-3.5 rounded-xl border flex items-center justify-between transition-all duration-700 ease-in-out ${borderStyle}`}
                  style={{ transform: `translateY(${yPosition}px)` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    <span className={`w-5 text-center text-xs font-black ${isMe ? 'text-primary' : 'text-slate-800'}`}>
                      {player.newRank}
                    </span>

                    {/* Avatar text */}
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] ${
                      isMe ? 'bg-primary text-white' : 'bg-slate-300 text-slate-800'
                    }`}>
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Nickname & Streak */}
                    <div className="flex items-center gap-3">
                      <span className={`text-xs truncate max-w-[100px] ${isMe ? 'text-primary font-black' : 'text-on-surface font-extrabold'}`}>
                        {player.name} {isMe && '(You)'}
                      </span>
                      {player.streak > 0 && (
                        <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
                          <Flame className="w-2.5 h-2.5 fill-current text-amber-500" /> {player.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Change Indicator */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black ${isMe ? 'text-primary animate-pulse' : 'text-slate-900'}`}>
                      {player.score} pts
                    </span>
                    
                    <div className="w-4 flex items-center justify-center">
                      {isUpdating && hasRankedUp && (
                        <div className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-black animate-bounce">
                          <ArrowUp className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                      {isUpdating && hasRankedDown && (
                        <div className="flex items-center gap-0.5 text-red-600 text-[10px] font-black">
                          <ArrowDown className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                      {(!isUpdating || player.change === 'same') && (
                        <span className="text-xs text-slate-400 font-bold">-</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Action Block */}
        <footer className="pt-2 border-t border-outline-variant/20">
          <button
            onClick={handleNextAction}
            className={`w-full py-4 text-white rounded-2xl font-button text-sm font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
              isGameFinished ? 'bg-secondary hover:bg-secondary/95 shadow-secondary/25' : 'bg-primary'
            }`}
          >
            {isGameFinished ? (
              <>
                <Award className="w-4 h-4" /> Finish & Exit Room
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
  )
}
