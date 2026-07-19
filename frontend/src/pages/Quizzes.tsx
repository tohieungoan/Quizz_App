import { Plus, ChevronDown, Edit2, Copy, Trash2, Flame, ChevronLeft, ChevronRight, X, Save, Search, CheckCircle2, FileEdit } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useState } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DUMMY_QUIZZES, Quiz } from '../data/mockDb';

export function Quizzes({ onCreateQuiz, onEditQuiz }: { onCreateQuiz: () => void, onEditQuiz: (quiz: Quiz) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(DUMMY_QUIZZES);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All Difficulty');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const itemsPerPage = 5;

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  // Actions
  const handleDuplicate = (quiz: Quiz) => {
    const match = quiz.title.match(/^(.*?) \(copy\d*\)$/);
    const baseTitle = match ? match[1] : quiz.title;
    
    let maxCopyNum = 0;
    quizzes.forEach(q => {
      if (q.title.startsWith(baseTitle)) {
        const m = q.title.substring(baseTitle.length).match(/^ \(copy(\d+)\)$/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxCopyNum) {
            maxCopyNum = num;
          }
        }
      }
    });

    const newQuiz: Quiz = {
      ...quiz,
      id: `QZ-${Math.floor(Math.random() * 900) + 100}`,
      title: `${baseTitle} (copy${maxCopyNum + 1})`,
      date: 'Just now'
    };
    setQuizzes([newQuiz, ...quizzes]);
  };

  const handleDelete = (id: string) => {
    setQuizToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      setQuizzes(quizzes.filter(q => q.id !== quizToDelete));
      setQuizToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  // Filtering
  const filteredQuizzes = quizzes.filter(q => {
    if (difficultyFilter !== 'All Difficulty' && q.diff !== difficultyFilter) return false;
    if (subjectFilter !== 'All Subjects' && q.subject !== subjectFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      if (!q.title.toLowerCase().includes(term) && !q.id.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Ensure current page is valid when filtering changes
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return (
    <main className="flex-1 p-margin-mobile md:p-margin-desktop bg-background px-margin-desktop relative">
      <div className="max-w-container-max mx-auto space-y-gutter w-full pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-on-background tracking-tight">Quiz Management</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Create, organize, and monitor active assessments across disciplines.</p>
          </div>
          <button onClick={onCreateQuiz} className="bg-primary text-on-primary text-button font-button rounded-lg px-5 py-3 flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            Create New Quiz
          </button>
        </div>

        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-xl border border-outline-variant p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface outline-none" 
              placeholder="Find by title or ID..." 
              type="text" 
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <Dropdown
              value={subjectFilter}
              onChange={(val) => { setSubjectFilter(val); setCurrentPage(1); }}
              options={[
                'All Subjects',
                'Physics',
                'Mathematics',
                'Biology',
                'Literature',
                'History',
                'Computer Science',
                'Chemistry'
              ]}
              className="w-full sm:w-48"
            />
            <Dropdown
              value={difficultyFilter}
              onChange={(val) => { setDifficultyFilter(val); setCurrentPage(1); }}
              options={[
                'All Difficulty',
                'Easy',
                'Medium',
                'Hard'
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant w-20">ID</th>
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant min-w-[250px]">Quiz Details</th>
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant w-40">Subject</th>
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant w-40">Metrics</th>
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant w-48">Author</th>
                  <th className="py-4 px-6 text-label-bold text-on-surface-variant text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {currentQuizzes.length > 0 ? currentQuizzes.map(q => (
                  <tr key={q.id} className="hover:bg-surface-bright transition-colors group">
                    <td className="py-4 px-6 text-label-bold text-on-surface-variant">{q.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <p className="font-semibold text-on-surface">{q.title}</p>
                        {q.status === 'Draft' ? (
                          <span className="inline-flex items-center gap-1.5 w-max px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5 bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            <FileEdit className="w-3 h-3" />
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 w-max px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            {q.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface">{q.subject}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-on-surface-variant text-sm">{q.q} Questions</span>
                        <span className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-full text-xs font-label-bold ${q.diff === 'Hard' ? 'bg-error-container text-on-error-container' : q.diff === 'Medium' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                          {q.diff === 'Hard' && <Flame className="w-3.5 h-3.5" />} {q.diff}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-on-surface font-semibold">{q.author}</span>
                        <span className="text-xs text-on-surface-variant">{q.date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEditQuiz(q)} className="p-2 rounded-md text-primary hover:bg-surface-container-high transition-colors"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDuplicate(q)} className="p-2 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"><Copy className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(q.id)} className="p-2 rounded-md text-on-surface-variant hover:bg-error-container/50 hover:text-error transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant">No quizzes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">
                Showing <span className="font-medium text-on-surface">{startIndex + 1}</span> to <span className="font-medium text-on-surface">{Math.min(startIndex + itemsPerPage, filteredQuizzes.length)}</span> of <span className="font-medium text-on-surface">{filteredQuizzes.length}</span> results
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      isPageDropdownOpen 
                        ? 'border-primary text-primary ring-1 ring-primary/20' 
                        : 'border-outline-variant/50 text-on-surface hover:border-outline-variant'
                    }`}
                  >
                    Page {currentPage} of {totalPages}
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  </button>

                  {/* Dropdown Menu */}
                  {isPageDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsPageDropdownOpen(false)}></div>
                      <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1">
                        <div className="max-h-48 overflow-y-auto">
                          {pages.map(page => (
                            <button
                              key={page}
                              onClick={() => {
                                setCurrentPage(page);
                                setIsPageDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                currentPage === page
                                  ? 'bg-primary/5 text-primary font-semibold'
                                  : 'text-on-surface hover:bg-surface-container-low'
                              }`}
                            >
                              Page {page}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Quiz" 
        message="Are you sure you want to delete this quiz? All associated questions and data will be permanently removed." 
      />
    </main>
  );
}
