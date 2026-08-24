import { CopyPlus, Edit2, GripVertical, Trash2 } from 'lucide-react';
import { Question, QuestionType } from '../quizCreatorModels';

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDuplicate: (question: Question) => void;
  onDelete: (questionId: string) => void;
  versionLabel?: string;
  readOnly?: boolean;
  variantMode?: boolean;
}

const getTypeName = (type: QuestionType) => type === 'multiple'
  ? 'Multiple Choice'
  : type === 'truefalse' ? 'True / False' : 'Short Answer';

export function QuestionList({ questions, onEdit, onDuplicate, onDelete, versionLabel, readOnly = false, variantMode = false }: QuestionListProps) {
  return (
    <div id="questions-list-section" className="shrink-0 max-w-5xl mx-auto flex flex-col w-full mt-10 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
          Question List{versionLabel ? ` · ${versionLabel}` : ''} ({questions.length})
        </h3>
        <span className="text-xs text-on-surface-variant">{readOnly ? 'Generation in progress · Read only' : variantMode ? 'Generated version · Editable' : 'Reorder by dragging rows'}</span>
      </div>
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-2xl text-on-surface-variant text-sm shadow-sm">
          {variantMode ? 'This generated version has no questions.' : 'No questions yet. Start building your quiz manually or use AI to generate them!'}
        </div>
      ) : (
        <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col mb-10">
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] relative">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 z-10 bg-surface-container-lowest shadow-sm">
                <tr className="border-b border-outline-variant/50">
                  <th className="w-10 px-4 py-4" /><th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-16 text-center">#</th><th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-36">Type</th><th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question Text</th><th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Answer Details</th>{!readOnly && <th className="px-6 py-4 w-28 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {questions.map((question, index) => (
                  <tr key={question.id} className="group hover:bg-surface-bright">
                    <td className={`px-4 py-4 text-on-surface-variant text-center ${readOnly || variantMode ? 'opacity-20' : 'cursor-grab active:cursor-grabbing hover:text-on-surface opacity-30 group-hover:opacity-100 transition-opacity'}`}>{!readOnly && !variantMode && <GripVertical className="w-4 h-4 mx-auto" />}</td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">Q{index + 1}</td>
                    <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">{getTypeName(question.type)}</span></td>
                    <td className="px-6 py-4 text-sm text-on-surface font-medium"><p className="line-clamp-2 max-w-md group-hover:line-clamp-none transition-all">{question.text || 'Untitled Question'}</p></td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">
                      {question.type === 'multiple' && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />{question.options.length} Options<span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" />Ans: {String.fromCharCode(65 + question.correctAnswer)}</div>}
                      {question.type === 'truefalse' && <div className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${question.correctAnswer ? 'bg-green-500' : 'bg-error'}`} />Answer: <span className="font-bold text-on-surface">{question.correctAnswer ? 'True' : 'False'}</span></div>}
                      {question.type === 'short' && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim" />Keyword: <span className="text-on-surface font-bold truncate max-w-[150px]">{question.correctAnswer || 'None'}</span></div>}
                    </td>
                    {!readOnly && <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEdit(question)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-md transition-colors hover:bg-surface-container" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      {!variantMode && <button onClick={() => onDuplicate(question)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-md transition-colors hover:bg-surface-container" title="Duplicate"><CopyPlus className="w-4 h-4" /></button>}
                      <button onClick={() => onDelete(question.id)} className="p-1.5 text-on-surface-variant hover:text-error rounded-md transition-colors hover:bg-error-container" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
