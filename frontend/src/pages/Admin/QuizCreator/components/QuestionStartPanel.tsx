import { AlignLeft, CheckSquare, CopyPlus, List, Sparkles } from 'lucide-react';
import { QuestionType } from '../quizCreatorModels';

interface QuestionStartPanelProps {
  aiPrompt: string;
  onAIPromptChange: (value: string) => void;
  onOpenAI: () => void;
  onStartBuild: (type: QuestionType) => void;
  onOpenQuestionBank: () => void;
}

const questionTypes: Array<{
  type: QuestionType;
  title: string;
  description: string;
  Icon: typeof List;
  iconClassName: string;
  hoverClassName: string;
}> = [
  { type: 'multiple', title: 'Multiple Choice', description: 'One correct answer.', Icon: List, iconClassName: 'from-primary/10 to-primary/5 text-primary', hoverClassName: 'hover:border-primary/50' },
  { type: 'truefalse', title: 'True / False', description: 'Binary choice.', Icon: CheckSquare, iconClassName: 'from-secondary/10 to-secondary/5 text-secondary', hoverClassName: 'hover:border-secondary/50' },
  { type: 'short', title: 'Short Answer', description: 'Exact text match.', Icon: AlignLeft, iconClassName: 'from-tertiary-fixed-dim/10 to-tertiary-fixed-dim/5 text-tertiary-fixed-dim', hoverClassName: 'hover:border-tertiary-fixed-dim/50' },
];

export function QuestionStartPanel(props: QuestionStartPanelProps) {
  return (
    <div className="max-w-5xl w-full mx-auto">
      <div className="rounded-2xl border border-outline-variant/50 bg-white shadow-sm mb-10 overflow-hidden">
        <div className="p-4 md:p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto"><div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Sparkles className="w-4.5 h-4.5 text-primary" /></div><h2 className="font-bold text-sm whitespace-nowrap text-primary">AI Generate</h2></div>
          <div className="flex-1 w-full relative"><input type="text" value={props.aiPrompt} onChange={event => props.onAIPromptChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') props.onOpenAI(); }} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-4 pr-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-on-surface font-medium placeholder:text-slate-400 transition-all" placeholder="E.g., Generate 5 multiple-choice questions on Object-Oriented Programming (OOP)..." /></div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0"><button onClick={props.onOpenAI} className="w-full md:w-auto px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"><Sparkles className="w-4 h-4" /> Generate with AI</button></div>
        </div>
      </div>
      <div className="mb-6"><h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Build Your Quiz</h2><p className="text-slate-500 font-medium text-sm mt-1">Add questions manually or import them from your question bank.</p></div>
      <div className="mb-10"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {questionTypes.map(({ type, title, description, Icon, iconClassName, hoverClassName }) => (
          <button key={type} onClick={() => props.onStartBuild(type)} className={`flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl ${hoverClassName} hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 group`}>
            <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${iconClassName} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}><Icon className="w-6 h-6" /></div>
            <div><h4 className="font-bold text-[15px] text-slate-800 group-hover:text-primary transition-colors tracking-tight">{title}</h4><p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">{description}</p></div>
          </button>
        ))}
        <button onClick={props.onOpenQuestionBank} className="flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><CopyPlus className="w-6 h-6" /></div>
          <div><h4 className="font-bold text-[15px] text-slate-800 group-hover:text-emerald-600 transition-colors tracking-tight">Question Bank</h4><p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">Add from library.</p></div>
        </button>
      </div></div>
    </div>
  );
}
