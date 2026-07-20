import React from 'react';

interface ExamHeaderProps {
  examTitle: string;
  subject: string;
  timeLeft: number;
  formatTime: (sec: number) => string;
  isTimeCritical: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  examTitle,
  subject,
  timeLeft,
  formatTime,
  isTimeCritical,
}) => {
  return (
    <header className="bg-white dark:bg-inverse-surface shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-6 lg:px-10 h-16 border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        <span className="text-xl font-headline-md font-extrabold text-primary dark:text-primary-fixed-dim">
          ProExam Portal
        </span>
        <div className="h-6 w-px bg-outline-variant/30 mx-2 hidden md:block" />
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-label-bold font-extrabold text-on-surface uppercase tracking-wider">
            {examTitle}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">{subject}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Timer Container */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
            isTimeCritical
              ? 'bg-error-container/20 border-error text-error animate-pulse'
              : 'bg-primary-container/10 border-primary-container/20 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            timer
          </span>
          <span className="font-headline-md font-bold text-base tracking-tight tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Security Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary-container/30 text-on-secondary-container rounded-lg border border-secondary-container text-xs font-label-bold">
          <span className="material-symbols-outlined text-[16px]">security</span>
          <span className="font-bold tracking-wider">SECURE MODE: ACTIVE</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              alert(
                'Exam instructions: Please answer all questions, flagged items can be reviewed at any time. Tab navigation logs are active.'
              )
            }
            className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors text-[20px]"
          >
            help_outline
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-fixed-dim bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
            ST
          </div>
        </div>
      </div>
    </header>
  );
};
