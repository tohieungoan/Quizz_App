import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, XCircle, Clock, FileText, MessageSquare,
  Loader2, User, BookOpen
} from 'lucide-react';
import { examService } from '@/services';

interface ExamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number | null;
}

interface ResultQuestion {
  id: number;
  content: string;
  type: string;
  options: { id: number; content: string; is_correct: boolean }[];
  user_answer: {
    selected_option_id: number | null;
    answer_text: string | null;
    is_correct: boolean;
    answer_score: number | null;
  } | null;
}

interface ExamResult {
  exam_id: number;
  exam_title: string;
  host_fullname: string | null;
  quiz_subject: string | null;
  status: string;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  feedback_comment: string | null;
  correct_count: number;
  total_questions: number;
  questions: ResultQuestion[];
}

export const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({ isOpen, onClose, examId }) => {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || examId === null) return;
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setResult(null);
        const res = await examService.getMyExamResult(examId);
        setResult(res);
      } catch (err: any) {
        console.error('Failed to load exam result:', err);
        setError('Failed to load exam result. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, [isOpen, examId]);

  if (!isOpen) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return 'text-slate-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary to-indigo-700 text-white flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              Official Exam Results
            </span>
            <h3 className="font-extrabold text-xl mt-2 leading-tight">
              {result?.exam_title ?? (isLoading ? 'Loading...' : 'Exam Result')}
            </h3>
            {result && (
              <p className="text-xs text-indigo-100 mt-1 flex items-center gap-3 flex-wrap">
                {result.host_fullname && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {result.host_fullname}
                  </span>
                )}
                {result.quiz_subject && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {result.quiz_subject}
                  </span>
                )}
                {result.submitted_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Submitted {formatDate(result.submitted_at)}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
              <p className="text-sm">Loading your results...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-600">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : result ? (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Final Score</span>
                  <p className={`text-2xl font-black mt-1 ${getScoreColor(result.score)}`}>
                    {result.score !== null ? `${result.score}%` : 'Pending'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Correct</span>
                  <p className="text-2xl font-black text-on-surface mt-1">
                    {result.correct_count} / {result.total_questions}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</span>
                  <p className="text-sm font-black text-emerald-600 mt-1 capitalize">
                    {result.status}
                  </p>
                </div>
              </div>

              {/* Host Feedback */}
              <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <MessageSquare className="w-4 h-4" />
                  <span>Host Feedback</span>
                  {result.host_fullname && (
                    <span className="text-xs text-on-surface-variant font-normal">({result.host_fullname})</span>
                  )}
                </div>
                <p className="text-xs text-on-surface leading-relaxed font-medium">
                  {result.feedback_comment
                    ? `"${result.feedback_comment}"`
                    : <span className="italic text-on-surface-variant">No feedback has been left yet.</span>}
                </p>
              </div>

              {/* Question Review */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Question Review ({result.total_questions} questions)
                </h4>

                <div className="space-y-3">
                  {result.questions.map((q, idx) => {
                    const hasAns = q.user_answer !== null;
                    const isCorrect = q.user_answer?.is_correct ?? false;
                    const qType = (q.type || '').trim().toLowerCase();
                    const isMCQ = qType === 'multiple_choice' || qType === 'true_false' || qType === 'true/false';

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border space-y-3 ${
                          !hasAns
                            ? 'border-outline-variant/25 bg-surface-container-lowest'
                            : isCorrect
                            ? 'border-emerald-300/50 bg-emerald-50/20'
                            : 'border-rose-300/50 bg-rose-50/10'
                        }`}
                      >
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-bold text-on-surface text-sm leading-snug">{q.content}</p>
                              <span className="text-[10px] text-on-surface-variant font-semibold mt-1 inline-block uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded">
                                {q.type}
                              </span>
                            </div>
                          </div>
                          {hasAns ? (
                            <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                              isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {isCorrect
                                ? <><CheckCircle className="w-3 h-3" /> Correct</>
                                : <><XCircle className="w-3 h-3" /> Incorrect</>}
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500">
                              Skipped
                            </span>
                          )}
                        </div>

                        {/* MCQ Options */}
                        {isMCQ && (
                          <div className="pl-7 space-y-1.5">
                            {q.options.map((opt) => {
                              const isUserPick = q.user_answer?.selected_option_id === opt.id;
                              const isCorrectOpt = opt.is_correct;
                              let cls = 'bg-white border-outline-variant/25 text-on-surface';
                              if (isCorrectOpt) cls = 'bg-emerald-50 border-emerald-400/50 text-emerald-900';
                              else if (isUserPick && !isCorrectOpt) cls = 'bg-rose-50 border-rose-400/50 text-rose-900';
                              return (
                                <div key={opt.id} className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${cls}`}>
                                  <span className={isCorrectOpt ? 'font-bold' : ''}>{opt.content}</span>
                                  {isUserPick && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      isCorrectOpt ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>Your Answer</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Written answer */}
                        {!isMCQ && (
                          <div className="pl-7 space-y-2 text-xs">
                            <div className="p-3 bg-surface-container-low/60 rounded-lg border border-outline-variant/20">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Your Answer:</span>
                              <p className="font-medium whitespace-pre-wrap text-on-surface">
                                {q.user_answer?.answer_text || <span className="italic text-on-surface-variant/60">No response</span>}
                              </p>
                            </div>
                            {/* Model answer */}
                            {q.options.length > 0 && (
                              <div className="p-3 bg-emerald-50/30 rounded-lg border border-emerald-200/50">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Expected Answer:</span>
                                <ul className="list-disc pl-4 space-y-1">
                                  {q.options.map((opt) => (
                                    <li key={opt.id} className="font-medium text-emerald-900">{opt.content}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
          >
            Close Results
          </button>
        </div>
      </div>
    </div>
  );
};
