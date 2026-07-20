import React, { useState } from 'react';
import { Plus, Edit2, Copy, Trash2, Search, CheckCircle2, FileEdit } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { DUMMY_QUIZZES, Quiz } from '@/data/mockDb';

interface QuizzesProps {
  onCreateQuiz: () => void;
  onEditQuiz: (quiz: Quiz) => void;
}

export const Quizzes: React.FC<QuizzesProps> = ({ onCreateQuiz, onEditQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(DUMMY_QUIZZES);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All Difficulty');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  // Filtered Quizzes Logic
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All Difficulty' || quiz.diff === difficultyFilter;
    const matchesSubject = subjectFilter === 'All Subjects' || quiz.subject === subjectFilter;

    return matchesSearch && matchesDifficulty && matchesSubject;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage);

  // Actions
  const handleDuplicate = (quiz: Quiz) => {
    const baseTitle = quiz.title.replace(/\s*\(Copy( \d+)?\)$/, '');
    
    let maxCopyNum = 0;
    quizzes.forEach(q => {
      if (q.title.startsWith(baseTitle)) {
        if (q.title === `${baseTitle} (Copy)`) {
          maxCopyNum = Math.max(maxCopyNum, 1);
        } else {
          const match = q.title.match(new RegExp(`${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(Copy (\\d+)\\)$`));
          if (match) {
            maxCopyNum = Math.max(maxCopyNum, parseInt(match[1], 10));
          }
        }
      }
    });

    const newCopyNum = maxCopyNum + 1;
    
    const newQuiz: Quiz = {
      ...quiz,
      id: `QZ-${Math.floor(Math.random() * 900) + 100}`,
      title: `${baseTitle} (Copy ${newCopyNum})`,
      date: 'Just now',
    };
    setQuizzes([newQuiz, ...quizzes]);
  };

  const handleDeleteClick = (id: string) => {
    setQuizToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      setQuizzes(quizzes.filter((q) => q.id !== quizToDelete));
      setQuizToDelete(null);
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">Quiz Library</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Manage and create quizzes for your students.
          </p>
        </div>
        <button
          onClick={onCreateQuiz}
          className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Quiz
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-8 flex flex-col">
        {/* Table Header / Toolbar */}
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant/40 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by title, subject, ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Dropdown
              value={difficultyFilter}
              onChange={(val) => {
                setDifficultyFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All Difficulty', label: 'All Difficulty' },
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />

            <Dropdown
              value={subjectFilter}
              onChange={(val) => {
                setSubjectFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All Subjects', label: 'All Subjects' },
                { value: 'Science', label: 'Science' },
                { value: 'Physics', label: 'Physics' },
                { value: 'Mathematics', label: 'Mathematics' },
                { value: 'Biology', label: 'Biology' },
                { value: 'Literature', label: 'Literature' },
                { value: 'History', label: 'History' },
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Chemistry', label: 'Chemistry' },
              ]}
            />
          </div>
        </div>

        {/* Quizzes Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">ID</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Quiz Title</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Subject</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                  Questions
                </th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                  Difficulty
                </th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                  Status
                </th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
              {currentQuizzes.length > 0 ? (
                currentQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-4 md:px-6 py-4 font-medium text-primary whitespace-nowrap">{quiz.id}</td>
                    <td className="px-4 md:px-6 py-4 font-semibold text-on-surface max-w-xs truncate">
                      {quiz.title}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-on-surface-variant whitespace-nowrap">{quiz.subject}</td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">{quiz.q} Qs</td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          quiz.diff === 'Easy'
                            ? 'bg-green-100 text-green-700'
                            : quiz.diff === 'Medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {quiz.diff}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          quiz.status === 'Published'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {quiz.status === 'Published' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <FileEdit className="w-3.5 h-3.5" />
                        )}
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditQuiz(quiz)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Edit Quiz"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(quiz)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Duplicate Quiz"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(quiz.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-md transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">
                    No quizzes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuizzes.length}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
      />
    </main>
  );
};
