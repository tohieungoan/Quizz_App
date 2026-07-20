import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Clock, Shield, Flame, HelpCircle, ArrowLeft, Check, Sparkles } from 'lucide-react'

interface PowerUp {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgLight: string
  count: number
  unlocked: boolean
}

export const PowerUpSelection: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // State variables passed in React Router state
  const state = location.state as { nickname?: string; roomCode?: string; score?: number; streak?: number } | null
  const nickname = state?.nickname || 'Guest'
  const roomCode = state?.roomCode || '823914'
  const currentScore = state?.score ?? 3450
  const currentStreak = state?.streak ?? 3

  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    {
      id: 'double',
      name: 'Double Points (x2)',
      description: 'Double the score you receive on the next correct answer.',
      icon: <Zap className="w-6 h-6 fill-current" />,
      color: 'text-amber-650 border-amber-400 bg-amber-50',
      bgLight: 'from-amber-100 to-amber-200/40 border-amber-350 hover:bg-amber-200/60',
      count: 2,
      unlocked: true
    },
    {
      id: 'fifty',
      name: '50:50 Split',
      description: 'Eliminate two incorrect options for the current question.',
      icon: <HelpCircle className="w-6 h-6" />,
      color: 'text-blue-650 border-blue-400 bg-blue-50',
      bgLight: 'from-blue-100 to-blue-200/40 border-blue-350 hover:bg-blue-200/60',
      count: 1,
      unlocked: true
    },
    {
      id: 'freeze',
      name: 'Time Freeze',
      description: 'Stop the countdown clock for 10 seconds to read the question.',
      icon: <Clock className="w-6 h-6" />,
      color: 'text-cyan-650 border-cyan-400 bg-cyan-50',
      bgLight: 'from-cyan-100 to-cyan-200/40 border-cyan-350 hover:bg-cyan-200/60',
      count: 3,
      unlocked: true
    },
    {
      id: 'shield',
      name: 'Streak Shield',
      description: 'Protects your active streak even if you answer incorrectly.',
      icon: <Shield className="w-6 h-6 fill-current" />,
      color: 'text-indigo-650 border-indigo-400 bg-indigo-50',
      bgLight: 'from-indigo-100 to-indigo-200/40 border-indigo-350 hover:bg-indigo-200/60',
      count: 1,
      unlocked: true
    }
  ])

  const [selectedPowerUpId, setSelectedPowerUpId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    const target = powerUps.find(p => p.id === id)
    if (target && target.count > 0) {
      setSelectedPowerUpId(selectedPowerUpId === id ? null : id)
    }
  }

  const handleApply = () => {
    // Navigate back to the answer screen with the selected power-up
    navigate('/play', { 
      state: { 
        ...state, 
        activePowerUp: selectedPowerUpId 
      } 
    })
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

      {/* Fullscreen Wrapper */}
      <div className="relative z-10 flex-grow flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/play', { state })}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl text-on-surface hover:text-primary transition-all border border-outline-variant font-button text-xs shadow-sm active:scale-95 cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Game
          </button>
          
          <div className="text-right">
            <span className="font-label-bold text-[10px] tracking-widest text-outline uppercase font-bold">Player Stats</span>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-headline-md text-base font-extrabold text-primary">{currentScore} pts</span>
              <div className="flex items-center gap-1 text-secondary bg-secondary-container px-3 py-1 rounded-full text-xs font-bold border border-secondary">
                <Flame className="w-3.5 h-3.5 fill-current text-on-secondary-container animate-pulse" /> {currentStreak}
              </div>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-2.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> Choose your booster
          </div>
          <h1 className="font-headline-md text-3xl font-extrabold text-on-surface">Select a Power-Up</h1>
          <p className="font-body-md text-xs text-slate-800 mt-2 leading-relaxed font-medium">
            Equip one booster before answering the next question to maximize your score output.
          </p>
        </div>

        {/* Power-Up Grid */}
        <div className="flex-grow flex flex-col gap-4.5 overflow-y-auto pr-1 pb-4">
          {powerUps.map((pw) => {
            const isSelected = selectedPowerUpId === pw.id
            const isOutOfStock = pw.count === 0

            return (
              <div
                key={pw.id}
                onClick={() => !isOutOfStock && handleSelect(pw.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-md relative overflow-hidden bg-gradient-to-br ${pw.bgLight} ${
                  isSelected 
                    ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' 
                    : isOutOfStock 
                    ? 'opacity-35 border-outline-variant bg-[#eaeaff]/30 cursor-not-allowed'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                {/* Left icon wrapper */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-white ${pw.color} shadow-sm flex-shrink-0`}>
                  {pw.icon}
                </div>

                {/* Content details */}
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline-md text-sm font-extrabold text-on-surface">{pw.name}</h3>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      isOutOfStock 
                        ? 'bg-red-100 text-red-700 border-red-300' 
                        : 'bg-white text-slate-700 border-outline-variant shadow-sm'
                    }`}>
                      {isOutOfStock ? 'Empty' : `${pw.count} Left`}
                    </span>
                  </div>
                  <p className="font-body-md text-xs text-slate-850 mt-2 leading-relaxed font-semibold">
                    {pw.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-0 bottom-0 bg-primary text-white pl-4 pr-2 pt-2.5 pb-1 rounded-tl-2xl shadow-md">
                    <Check className="w-4.5 h-4.5 font-black" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Apply CTA Block */}
        <footer className="mt-auto pt-4 border-t border-outline-variant/20">
          <button
            onClick={handleApply}
            disabled={!selectedPowerUpId}
            className="w-full py-4 bg-primary text-white rounded-2xl font-button text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {selectedPowerUpId ? (
              <>
                Equip {powerUps.find(p => p.id === selectedPowerUpId)?.name} now!
              </>
            ) : (
              'Select a Booster to Continue'
            )}
          </button>
          <button
            onClick={() => navigate('/play', { state })}
            className="w-full text-center mt-3 text-xs text-slate-600 hover:text-primary transition-colors py-1.5 font-bold"
          >
            Skip this question without power-up
          </button>
        </footer>

      </div>
    </div>
  )
}
