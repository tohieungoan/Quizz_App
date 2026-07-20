import React, { useState } from 'react';
import { Search, Radio, FileText, Eye } from 'lucide-react';
import { USER_EXAM_HISTORY, ExamHistoryItem } from '@/data/userData';
import { Pagination } from '@/components/ui/Pagination';
import { ExamDetailsModal } from './ExamDetailsModal';
import { LiveLeaderboardModal } from './LiveLeaderboardModal';

export const HistoryTab: React.FC = () => {
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Live Room' | 'Official Exam'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [selectedItem, setSelectedItem] = useState<ExamHistoryItem | null>(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);

  const filteredHistory = USER_EXAM_HISTORY.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handleViewResults = (item: ExamHistoryItem) => {
    setSelectedItem(item);
    if (item.type === 'Live Room') {
      setLeaderboardModalOpen(true);
    } else {
      setExamModalOpen(true);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl text-on-surface">Quiz & Exam History</h3>
          <p className="text-xs text-on-surface-variant">
            Review previous official exam results and live room leaderboards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-outline-variant/60 rounded-xl text-xs font-semibold text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="Live Room">Live Room</option>
            <option value="Official Exam">Official Exam</option>
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input
              type="text"
              placeholder="Search history title..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-outline-variant/60 rounded-xl bg-surface-container-lowest focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider border-b border-outline-variant/30">
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold text-center">Type</th>
              <th className="px-6 py-4 font-semibold">Date Completed</th>
              <th className="px-6 py-4 font-semibold text-center">Final Score</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-sm">
            {currentHistory.length > 0 ? (
              currentHistory.map((item) => (
                <tr key={item.id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface">{item.title}</td>

                  {/* Type Column */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.type === 'Live Room'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {item.type === 'Live Room' ? (
                        <Radio className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      {item.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-on-surface-variant text-xs">{item.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-green-100 text-green-700">
                      {item.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewResults(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold text-on-surface-variant"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Results
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  No history matching search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredHistory.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Exam Details & Feedback Modal */}
      <ExamDetailsModal
        isOpen={examModalOpen}
        onClose={() => {
          setExamModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />

      {/* Live Room Leaderboard Modal */}
      <LiveLeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => {
          setLeaderboardModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
    </div>
  );
};
