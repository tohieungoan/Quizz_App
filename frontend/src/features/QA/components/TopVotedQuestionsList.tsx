import React from 'react'
import { ThumbsUp, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react'

export interface QuestionVoteItem {
  question_id: number
  text?: string
  vote_count: number
  hasVoted?: boolean
  audio_url?: string | null
  media_url?: string | null
  options?: Array<{
    id: number
    key: string
    label: string
    is_correct?: boolean
  }>
}

interface TopVotedQuestionsListProps {
  questions: QuestionVoteItem[]
  currentActiveQuestionId?: number | null
  isHost?: boolean
  onVote?: (questionId: number) => void
  onSelectQuestion?: (questionId: number) => void
}

export const TopVotedQuestionsList: React.FC<TopVotedQuestionsListProps> = ({
  questions,
  currentActiveQuestionId,
  isHost = false,
  onVote,
  onSelectQuestion,
}) => {
  return (
    <div className="flex flex-col bg-white rounded-2xl border-2 border-outline-variant/30 shadow-md overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
          <ThumbsUp className="w-4 h-4 text-emerald-600" />
          <span>Top Voted Questions</span>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Ranked by votes
        </span>
      </div>

      <div className="p-3 space-y-2.5 max-h-[360px] overflow-y-auto">
        {questions.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">No voted questions yet.</p>
            <p className="text-[11px] opacity-75">Votes from participants will appear here in real-time.</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isActive = currentActiveQuestionId !== undefined && currentActiveQuestionId !== null && String(currentActiveQuestionId) === String(q.question_id)

            return (
              <div
                key={q.question_id}
                className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-900'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {q.text || `Question #${q.question_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 fill-emerald-600" /> {q.vote_count} votes
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary text-on-primary">
                          NOW ADDRESSING
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onVote && (
                    <button
                      onClick={() => onVote(q.question_id)}
                      className={`p-2 rounded-lg font-extrabold text-xs flex items-center gap-1 transition-all ${
                        q.hasVoted
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title="Vote for this question"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isHost && onSelectQuestion && !isActive && (
                    <button
                      onClick={() => onSelectQuestion(q.question_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-[11px] hover:bg-primary/90 transition-all flex items-center gap-1"
                    >
                      Select <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
