import React from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { ExamQuestion } from '@/data/userData';

interface QuestionPaletteProps {
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  answers: { [key: number]: string };
  flaggedQuestions: Set<number>;
  answeredCount: number;
  flaggedCount: number;
  remainingCount: number;
  progressPercent: number;
  onSubmitClick: () => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  flaggedQuestions,
  answeredCount,
  flaggedCount,
  remainingCount,
  progressPercent,
  onSubmitClick,
}) => {
  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="bg-white rounded-xl p-6 border border-outline-variant/30 flex flex-col shadow-sm">
        <h3 className="font-headline-md text-sm font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">apps</span>
          Exam Navigation
        </h3>

        {/* Grid of Questions */}
        <div className="grid grid-cols-5 gap-2.5 mb-8">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const isFlagged = flaggedQuestions.has(q.id);
            const isAnswered = answers[q.id] && answers[q.id] !== '';

            let btnClass = 'bg-outline-variant/20 text-on-surface-variant hover:bg-outline-variant/40';
            if (isCurrent) {
              btnClass = 'border-2 border-primary bg-white text-primary font-extrabold shadow-sm';
            } else if (isFlagged) {
              btnClass = 'bg-tertiary text-on-tertiary hover:opacity-90';
            } else if (isAnswered) {
              btnClass = 'bg-secondary text-on-secondary hover:opacity-90';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${btnClass}`}
              >
                {q.id}
              </button>
            );
          })}
        </div>

        {/* Stats Legend */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">
              {answeredCount} Answered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary" />
            <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">
              {flaggedCount} Flagged
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
            <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">
              {remainingCount} Remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
            <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">Current</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-on-surface-variant">Overall Progress</span>
            <span className="text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Submit CTA */}
        <button
          onClick={onSubmitClick}
          className="mt-8 w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-button text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Submit Exam
        </button>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-error-container/10 border border-error-container rounded-xl flex gap-3 text-left">
        <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
          Leaving this tab or minimizing the window will be logged and may invalidate your secure exam session.
        </p>
      </div>
    </aside>
  );
};
