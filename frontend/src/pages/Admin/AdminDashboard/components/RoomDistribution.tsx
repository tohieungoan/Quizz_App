import React, { useState, useEffect } from 'react';

export const RoomDistribution: React.FC = () => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Trigger entry animation
    setTimeout(() => setIsLoaded(true), 100);
  }, []);
  
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  
  const gamePercent = 65;
  const examPercent = 35;
  
  const gameStroke = (gamePercent / 100) * circumference;
  const examStroke = (examPercent / 100) * circumference;
  
  const gap = 20; 

  // Center display logic
  let centerMain = "42";
  let centerSub = "Total Rooms";
  if (hoveredSlice === 'game') {
    centerMain = "65%";
    centerSub = "Game Mode";
  } else if (hoveredSlice === 'exam') {
    centerMain = "35%";
    centerSub = "Exam Mode";
  }
  
  return (
    <div className="bg-white rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col h-full relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/5 rounded-full blur-3xl -z-10 group-hover:bg-[#6366f1]/10 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0ea5e9]/5 rounded-full blur-3xl -z-10 group-hover:bg-[#0ea5e9]/10 transition-colors duration-700" />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base text-slate-800 font-extrabold tracking-tight">Room Distribution</h3>
        <div className="p-1.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center pt-2">
        <div className="relative w-52 h-52 flex items-center justify-center group/chart">
          
          <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="gameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="examGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#f8fafc"
              strokeWidth="14"
            />

            {/* Game Mode (65%) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="url(#gameGradient)"
              strokeWidth={hoveredSlice === 'game' ? 22 : 16}
              strokeDasharray={`${gameStroke - gap} ${circumference}`}
              strokeDashoffset={isLoaded ? 0 : circumference}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              onMouseEnter={() => setHoveredSlice('game')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            {/* Exam Mode (35%) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="url(#examGradient)"
              strokeWidth={hoveredSlice === 'exam' ? 22 : 16}
              strokeDasharray={`${examStroke - gap} ${circumference}`}
              strokeDashoffset={isLoaded ? -(gameStroke) : circumference}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              onMouseEnter={() => setHoveredSlice('exam')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
          </svg>
          
          {/* Dynamic Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
            <span className={`text-4xl font-black tracking-tighter transition-colors duration-300 ${
              hoveredSlice === 'game' ? 'text-[#7c3aed]' : 
              hoveredSlice === 'exam' ? 'text-[#0ea5e9]' : 
              'text-slate-800'
            }`}>
              {centerMain}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {centerSub}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-10 w-full px-2">
          {/* Game Legend */}
          <div 
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer border border-transparent ${
              hoveredSlice === 'game' ? 'bg-[#6366f1]/5 border-[#6366f1]/10 scale-[1.02]' : 'hover:bg-slate-50'
            } ${hoveredSlice === 'exam' ? 'opacity-30 grayscale' : 'opacity-100'}`}
            onMouseEnter={() => setHoveredSlice('game')}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
              <span className="text-[13px] font-bold text-slate-600">Game Mode</span>
            </div>
            <span className="text-sm font-black text-slate-800">65%</span>
          </div>

          {/* Exam Legend */}
          <div 
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer border border-transparent ${
              hoveredSlice === 'exam' ? 'bg-[#0ea5e9]/5 border-[#0ea5e9]/10 scale-[1.02]' : 'hover:bg-slate-50'
            } ${hoveredSlice === 'game' ? 'opacity-30 grayscale' : 'opacity-100'}`}
            onMouseEnter={() => setHoveredSlice('exam')}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#2dd4bf] shadow-[0_0_12px_rgba(14,165,233,0.5)]"></div>
              <span className="text-[13px] font-bold text-slate-600">Exam Mode</span>
            </div>
            <span className="text-sm font-black text-slate-800">35%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
