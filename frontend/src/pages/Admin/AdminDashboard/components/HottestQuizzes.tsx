import React from 'react';
import { MoreVertical } from 'lucide-react';
import { DUMMY_HOTTEST_QUIZZES } from '@/data/mockDb';

export const HottestQuizzes: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-headline-md text-base text-on-surface">Top 5 Hottest Quizzes</h3>
        <button className="text-primary hover:bg-surface-container p-1 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {DUMMY_HOTTEST_QUIZZES.map((it, i) => (
          <div key={i} className="group">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate pr-2">
                {it.title}
              </span>
              <span className="text-on-surface-variant font-medium whitespace-nowrap">{it.plays} plays</span>
            </div>
            <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
              <div className={`h-full ${it.color}`} style={{ width: it.w }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
