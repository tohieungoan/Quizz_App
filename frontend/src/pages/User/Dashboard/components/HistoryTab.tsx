import React, { useState, useEffect } from 'react';
import { Search, FileText, Eye, Loader2, AlertCircle, Lock } from 'lucide-react';
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

  const filteredHistory = allHistory.filter((item) =>
    item.exam_title.toLowerCase().includes(historySearch.toLowerCase()) ||
    (item.quiz_subject ?? '').toLowerCase().includes(historySearch.toLowerCase())
  );

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
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-600';
    if (score >= 80) return 'bg-emerald-100 text-emerald-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl text-on-surface">Quiz & Exam History</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Review your completed exam results and host feedback.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={historySearch}
            onChange={(e) => {
              setHistorySearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-outline-variant/60 rounded-xl bg-surface-container-lowest focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-sm">Loading your exam history...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-surface-container/50 text-on-surface-variant uppercase text-xs tracking-wider border-b border-outline-variant/30">
                <th className="px-5 py-4 font-semibold">Exam Title</th>
                <th className="px-5 py-4 font-semibold">Subject</th>
                <th className="px-5 py-4 font-semibold">Host</th>
                <th className="px-5 py-4 font-semibold">Submitted</th>
                <th className="px-5 py-4 font-semibold text-center">Score</th>
                <th className="px-5 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {currentHistory.length > 0 ? (
                currentHistory.map((item) => (
                  <tr key={item.assignee_id} className="hover:bg-surface-bright transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.exam_title}</span>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${getScoreColor(item.score)}`}>
                          {item.score !== null ? `${item.score}%` : 'Pending'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {item.results_published ? (
                        <button
                          onClick={() => handleViewResults(item.exam_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold text-on-surface-variant"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Results
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container/40 text-on-surface-variant/50 text-xs font-semibold cursor-not-allowed"
                          title="Host has not published the results yet"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-600/70" />
                          Not Published
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant">
                    {historySearch
                      ? 'No completed exams match your search.'
                      : "You haven't completed any exams yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredHistory.length}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
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
