import React, { useEffect, useState } from 'react';
import { FileText, Cpu, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ProgressStage } from '@/types/aiQuiz';

interface MultiStageProgressProps {
  stage: ProgressStage;
  modelName?: string;
}

interface StageItem {
  id: ProgressStage;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageItem[] = [
  {
    id: 'parsing',
    label: 'Document Parsing & Analysis',
    subLabel: 'Extracting text, sections, and page structure...',
    icon: FileText,
  },
  {
    id: 'generating',
    label: 'AI Question & Distractor Crafting',
    subLabel: "Applying Bloom's taxonomy and generating plausible options...",
    icon: Cpu,
  },
  {
    id: 'validating',
    label: 'Quality Validation & Formatting',
    subLabel: 'Verifying JSON schema integrity and standardizing items...',
    icon: CheckCircle2,
  },
];

export const MultiStageProgress: React.FC<MultiStageProgressProps> = ({ stage, modelName }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStageIndex = (s: ProgressStage): number => {
    switch (s) {
      case 'parsing':
        return 0;
      case 'generating':
        return 1;
      case 'validating':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(stage);
  const progressPercent =
    stage === 'parsing' ? 30 : stage === 'generating' ? 75 : stage === 'validating' ? 92 : stage === 'completed' ? 100 : 15;

  return (
    <div className="w-full bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-inner relative overflow-hidden backdrop-blur-sm">
      {/* Background Animated Gradient */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Header with Live Counter */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Automated AI Pipeline
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {modelName ? `Processing via: ${modelName}` : 'Connecting to high-speed LLM...'}
            </p>
          </div>
        </div>

        <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {seconds}s
        </div>
      </div>

      {/* Main Smooth Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6 p-0.5 relative z-10 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-primary via-purple-600 to-indigo-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Stage Steps Visualizer */}
      <div className="space-y-3.5 relative z-10">
        {STAGES.map((s, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-white dark:bg-slate-800/90 border border-primary/30 shadow-md shadow-primary/5 translate-x-1'
                  : isDone
                  ? 'bg-white/40 dark:bg-slate-800/30 opacity-80'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isCurrent
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-primary dark:text-primary-light'
                        : isDone
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-mono font-bold text-primary tracking-wider animate-pulse">
                      In Progress
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {s.subLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
