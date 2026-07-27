import React from 'react';
import { MoreVertical } from 'lucide-react';
interface QuizData {
  quiz_id: number;
  title: string;
  play_count: number;
}

interface Props {
  data: QuizData[];
}

const colors = ["bg-primary", "bg-primary/80", "bg-primary/60", "bg-primary/40", "bg-primary/20"];

export const HottestQuizzes: React.FC<Props> = ({ data }) => {
  const maxPlays = data.length > 0 ? Math.max(...data.map(d => d.play_count)) : 1;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-headline-md text-base text-on-surface">Top 5 Hottest Quizzes</h3>
      </div>
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {data.map((it, i) => (
          <div key={it.quiz_id || i} className="group">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate pr-2">
                {it.title}
              </span>
              <span className="text-on-surface-variant font-medium whitespace-nowrap">{it.play_count} plays</span>
            </div>
            <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
              <div className={`h-full ${colors[i % colors.length]}`} style={{ width: `${(it.play_count / maxPlays) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
