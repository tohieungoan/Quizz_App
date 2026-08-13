import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Eye, Loader2, AlertCircle, Lock, Award, CheckCircle2, TrendingUp, BookOpen, User, Calendar } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { ExamDetailsModal } from './ExamDetailsModal';
import { examService } from '@/services';

interface HistoryExamItem {
  assignee_id: number;
  exam_id: number;
  exam_title: string;
  status: string;
  score: number | null;
  submitted_at: string | null;
  host_fullname: string | null;
  quiz_subject: string | null;
  results_published: boolean;
}

export const HistoryTab: React.FC = () => {
  const [historySearch, setHistorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Data state
  const [allHistory, setAllHistory] = useState<HistoryExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Details modal state
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examModalOpen, setExamModalOpen] = useState(false);

  // Fetch completed exams from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await examService.getMyExams();
        if (Array.isArray(res)) {
          // Filter only completed exams for history
          const completed: HistoryExamItem[] = res
            .filter((ex: any) => ex.status === 'COMPLETED')
            .map((ex: any) => ({
              assignee_id: ex.id,
              exam_id: ex.exam_id,
              exam_title: ex.exam_title || 'Untitled Exam',
              status: ex.status,
              score: ex.score ?? null,
              submitted_at: ex.submitted_at ?? null,
              host_fullname: ex.host_fullname ?? null,
              quiz_subject: ex.quiz_subject ?? null,
              results_published: ex.results_published ?? false,
            }));
          setAllHistory(completed);
        }
      } catch (err) {
        console.error('Failed to load exam history:', err);
        setError('Failed to load exam history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return allHistory.filter((item) =>
      item.exam_title.toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.quiz_subject ?? '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.host_fullname ?? '').toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [allHistory, historySearch]);

  // Quick stats calculation
  const totalCompleted = allHistory.length;
  const scoredExams = allHistory.filter((item) => item.results_published && item.score !== null);
  const avgScore = scoredExams.length > 0
    ? Math.round(scoredExams.reduce((acc, item) => acc + (item.score || 0), 0) / scoredExams.length)
    : null;
  const highestScore = scoredExams.length > 0
    ? Math.max(...scoredExams.map((item) => item.score || 0))
    : null;

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handleViewResults = (examId: number) => {
    setSelectedExamId(examId);
    setExamModalOpen(true);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-5 text-left">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg sm:text-xl text-on-surface">Quiz & Exam History</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Review your completed exam results, scores, and host feedback.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <input
            type="text"
            placeholder="Search title, subject, or host..."
            value={historySearch}
            onChange={(e) => {
              setHistorySearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-outline-variant/60 rounded-xl bg-surface-container-lowest focus:outline-none focus:border-primary text-on-surface transition-colors"
          />
        </div>
      </div>

      {/* Summary Analytics Bar */}
      {!isLoading && !error && allHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3 sm:p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/25">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Completed</p>
              <p className="text-base sm:text-lg font-black text-on-surface">{totalCompleted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 border-x border-outline-variant/20 px-2 sm:px-4">
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Avg Score</p>
              <p className="text-base sm:text-lg font-black text-on-surface">
                {avgScore !== null ? `${avgScore}%` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Best Score</p>
              <p className="text-base sm:text-lg font-black text-on-surface">
                {highestScore !== null ? `${highestScore}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
          <p className="text-xs sm:text-sm">Loading your exam history...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-14 sm:py-16 gap-3 text-rose-600">
          <AlertCircle className="w-8 h-8" />
          <p className="text-xs sm:text-sm font-medium text-center">{error}</p>
        </div>
      ) : currentHistory.length === 0 ? (
        <div className="py-14 sm:py-16 text-center text-on-surface-variant bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant/40">
          <FileText className="w-10 h-10 mx-auto text-outline/50 mb-2" />
          <p className="text-sm font-semibold">
            {historySearch ? 'No completed exams match your search.' : "You haven't completed any exams yet."}
          </p>
          {historySearch && (
            <button
              onClick={() => setHistorySearch('')}
              className="mt-2 text-xs text-primary font-bold hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/50 text-on-surface-variant uppercase text-[11px] tracking-wider border-b border-outline-variant/30">
                  <th className="px-5 py-3.5 font-semibold">Exam Title</th>
                  <th className="px-5 py-3.5 font-semibold">Subject</th>
                  <th className="px-5 py-3.5 font-semibold">Host</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Score</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {currentHistory.map((item) => (
                  <tr key={item.assignee_id} className="hover:bg-surface-bright transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/70 shrink-0" />
                        <span className="truncate max-w-[220px]">{item.exam_title}</span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-5 py-4 text-on-surface-variant text-xs">
                      {item.quiz_subject || '—'}
                    </td>

                    {/* Host */}
                    <td className="px-5 py-4 text-on-surface-variant text-xs">
                      {item.host_fullname || '—'}
                    </td>

                    {/* Submitted At */}
                    <td className="px-5 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                      {formatDate(item.submitted_at)}
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4 text-center">
                      {item.results_published ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadgeClass(
                            item.score
                          )}`}
                        >
                          {item.score !== null ? `${item.score}%` : 'Pending'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {item.results_published ? (
                        <button
                          onClick={() => handleViewResults(item.exam_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Results
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant/50 text-xs font-semibold cursor-not-allowed"
                          title="Host has not published the results yet"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-600/70" />
                          Not Published
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Visible only on mobile/tablet below md) */}
          <div className="block md:hidden space-y-3">
            {currentHistory.map((item) => (
              <div
                key={item.assignee_id}
                className="p-4 rounded-xl border border-outline-variant/35 bg-white shadow-xs hover:border-primary/30 transition-all space-y-3 text-left"
              >
                {/* Header: Title & Score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-on-surface leading-tight line-clamp-2">
                        {item.exam_title}
                      </h4>
                      {item.quiz_subject && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary mt-1">
                          <BookOpen className="w-3 h-3 shrink-0" />
                          {item.quiz_subject}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="shrink-0">
                    {item.results_published ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadgeClass(
                          item.score
                        )}`}
                      >
                        {item.score !== null ? `${item.score}%` : 'Pending'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/15 flex-wrap gap-2">
                  {item.host_fullname && (
                    <div className="flex items-center gap-1 min-w-0">
                      <User className="w-3.5 h-3.5 text-outline shrink-0" />
                      <span className="truncate max-w-[140px] font-medium">{item.host_fullname}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 ml-auto text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-outline shrink-0" />
                    <span>{formatDate(item.submitted_at)}</span>
                  </div>
                </div>

                {/* Mobile Action Button */}
                <div className="pt-1">
                  {item.results_published ? (
                    <button
                      onClick={() => handleViewResults(item.exam_id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                    >
                      <Eye className="w-4 h-4" />
                      View Results & Review
                    </button>
                  ) : (
                    <div
                      className="w-full py-2.5 px-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant/60 text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                      title="Host has not published the results yet"
                    >
                      <Lock className="w-4 h-4 text-amber-600/70" />
                      Results Not Published Yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!isLoading && !error && filteredHistory.length > 0 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredHistory.length}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Exam Details Modal */}
      <ExamDetailsModal
        isOpen={examModalOpen}
        examId={selectedExamId}
        onClose={() => {
          setExamModalOpen(false);
          setSelectedExamId(null);
        }}
      />
    </div>
  );
};

