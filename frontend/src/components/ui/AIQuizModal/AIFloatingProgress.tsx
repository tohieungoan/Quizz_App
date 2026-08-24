import React from 'react';
import { Sparkles, X, CheckCircle2, Loader2, Cpu, FileText, ArrowRight } from 'lucide-react';
import { ProgressStage } from '@/types/aiQuiz';

interface AIFloatingProgressProps {
  stage: ProgressStage;
  numQuestions: number;
  receivedQuestionCount: number;
  seconds: number;
  modelUsed?: string;
  onCancel: () => void;
  targetPath?: string;
  currentPath?: string;
  onNavigateTarget?: () => void;
}

export const AIFloatingProgress: React.FC<AIFloatingProgressProps> = ({
  stage,
  numQuestions,
  receivedQuestionCount,
  seconds,
  modelUsed,
  onCancel,
  targetPath,
  currentPath,
  onNavigateTarget,
}) => {
  if (stage === 'idle') return null;

  const isCompleted = stage === 'completed';
  const isDifferentTab = Boolean(
    targetPath &&
    currentPath &&
    !currentPath.includes('create-quiz') &&
    !currentPath.includes('quizzes/create') &&
    !currentPath.includes('quizzes/edit')
  );

  const getProgressPercentage = () => {
    switch (stage) {
      case 'parsing':
        return 30;
      case 'generating':
        return Math.max(35, Math.min(88, 35 + (receivedQuestionCount / Math.max(1, numQuestions)) * 53));
      case 'validating':
        return 92;
      case 'completed':
        return 100;
      default:
        return 15;
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'parsing':
        return 'Document Parsing & Analysis';
      case 'generating':
        return `Generated ${receivedQuestionCount} of ${numQuestions} Questions`;
      case 'validating':
        return 'Quality Validation & Formatting';
      case 'completed':
        return `Successfully Generated ${receivedQuestionCount} Questions!`;
      default:
        return 'AI Generation Running';
    }
  };

  const getStageSubtitle = () => {
    switch (stage) {
      case 'parsing':
        return 'Extracting text, sections, and document structure...';
      case 'generating':
        return modelUsed
          ? `Powered by ${modelUsed}`
          : "Applying Bloom's taxonomy & building options...";
      case 'validating':
        return 'Verifying schema integrity and standardizing items...';
      case 'completed':
        return 'Injecting questions into your quiz builder...';
      default:
        return 'Processing in background...';
    }
  };

  const StageIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />;
    if (stage === 'parsing') return <FileText className="w-4.5 h-4.5 text-blue-600 animate-pulse" />;
    if (stage === 'generating') return <Cpu className="w-4.5 h-4.5 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />;
    return <Loader2 className="w-4.5 h-4.5 text-primary animate-spin" />;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-white/95 text-slate-800 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-800/10 rounded-2xl p-4 overflow-hidden relative">
        {/* Background ambient subtle glow */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content Row */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Left Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              <StageIcon />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                  {getStageTitle()}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium shrink-0">
                  Background
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {getStageSubtitle()}
              </p>
            </div>
          </div>

          {/* Right Controls: Timer + Go to Quiz + Cancel */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 bg-slate-100 border border-slate-200/90 rounded-lg text-xs font-mono font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs">
              {!isCompleted && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              )}
              {seconds}s
            </div>

            {isDifferentTab && onNavigateTarget && (
              <button
                type="button"
                onClick={onNavigateTarget}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary hover:text-primary-dark text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Go to Quiz Creator"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Go to Quiz</span>
              </button>
            )}

            {!isCompleted && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Cancel AI Generation"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 border border-slate-200/70 h-2 rounded-full overflow-hidden mt-3 relative z-10 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isCompleted
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-primary via-indigo-500 to-purple-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          >
            {!isCompleted && (
              <div className="absolute inset-0 bg-white/30 skew-x-12 animate-[shimmer_2s_infinite]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
