import React, { useState } from 'react';
import { X, Search, CheckCircle2, List, CheckSquare, AlignLeft, Check, ChevronDown } from 'lucide-react';
import { Question } from '@/pages/Admin/QuizCreator/QuizCreator';

// Dummy data for Question Bank
type BankQuestion = Question & { sourceQuizId: string; sourceQuizTitle: string };

const DUMMY_QUESTION_BANK: BankQuestion[] = [
  {
    id: 'qb-1',
    type: 'multiple',
    text: 'What is the powerhouse of the cell?',
    difficulty: 'EASY',
    timeLimit: 30,
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    correctAnswer: 1,
    sourceQuizId: 'q-1',
    sourceQuizTitle: 'Biology Midterm'
  },
  {
    id: 'qb-2',
    type: 'truefalse',
    text: 'The Earth is flat.',
    difficulty: 'EASY',
    timeLimit: 15,
    correctAnswer: false,
    sourceQuizId: 'q-2',
    sourceQuizTitle: 'General Science'
  },
  {
    id: 'qb-3',
    type: 'short',
    text: 'What is the chemical symbol for Gold?',
    difficulty: 'MEDIUM',
    timeLimit: 45,
    correctAnswer: 'Au',
    sourceQuizId: 'q-3',
    sourceQuizTitle: 'Chemistry Basics'
  },
  {
    id: 'qb-4',
    type: 'multiple',
    text: 'Which planet is known as the Red Planet?',
    difficulty: 'EASY',
    timeLimit: 30,
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    sourceQuizId: 'q-2',
    sourceQuizTitle: 'General Science'
  },
  {
    id: 'qb-5',
    type: 'multiple',
    text: 'What is the largest ocean on Earth?',
    difficulty: 'MEDIUM',
    timeLimit: 30,
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 3,
    sourceQuizId: 'q-4',
    sourceQuizTitle: 'Geography Quiz'
  }
];

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
  existingQuestionIds: string[];
}

export function QuestionBankModal({ isOpen, onClose, onAddQuestions, existingQuestionIds }: QuestionBankModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuizFilter, setSelectedQuizFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Custom dropdown state
  const [quizDropdownOpen, setQuizDropdownOpen] = useState(false);
  const [quizSearchTerm, setQuizSearchTerm] = useState('');

  if (!isOpen) return null;

  const uniqueQuizzes = Array.from(new Set(DUMMY_QUESTION_BANK.map(q => q.sourceQuizId))).map(id => {
    return {
      id,
      title: DUMMY_QUESTION_BANK.find(q => q.sourceQuizId === id)?.sourceQuizTitle || 'Unknown'
    };
  });

  const filteredQuestions = DUMMY_QUESTION_BANK.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuiz = selectedQuizFilter === 'ALL' || q.sourceQuizId === selectedQuizFilter;
    return matchesSearch && matchesQuiz;
  });

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(qId => qId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAdd = () => {
    const selectedQuestions = DUMMY_QUESTION_BANK.filter(q => selectedIds.includes(q.id));
    onAddQuestions(selectedQuestions);
    setSelectedIds([]);
    setSearchTerm('');
    onClose();
  };

  const getTypeIcon = (type: string) => {
    if (type === 'multiple') return <List className="w-4 h-4 text-primary" />;
    if (type === 'truefalse') return <CheckSquare className="w-4 h-4 text-secondary" />;
    if (type === 'short') return <AlignLeft className="w-4 h-4 text-tertiary-fixed-dim" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative flex flex-col max-h-[85vh] overflow-hidden border border-white/40 ring-1 ring-slate-900/5">
        
        {/* Premium Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(99,102,241,0.5)]">
              <List className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold text-slate-800 tracking-tight leading-tight">Question Bank</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">Select and import high-quality questions.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-200/60 shadow-sm hover:shadow"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-5 sm:p-6 gap-4 bg-[#f8fafc]">
          {/* Premium Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by keyword, topic, or question text..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-[15px] font-medium text-slate-700 placeholder-slate-400 focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 outline-none transition-all shadow-sm"
              />
            </div>
            
            {/* Custom Searchable Dropdown */}
            <div className="w-full sm:w-64 shrink-0 relative">
              <button 
                onClick={() => setQuizDropdownOpen(!quizDropdownOpen)}
                className={`w-full bg-white border ${quizDropdownOpen ? 'border-[#6366f1] ring-4 ring-[#6366f1]/10' : 'border-slate-200 hover:border-slate-300'} rounded-xl py-3.5 pl-4 pr-10 text-[14px] font-bold text-slate-700 text-left transition-all shadow-sm flex items-center justify-between outline-none`}
              >
                <span className="truncate">
                  {selectedQuizFilter === 'ALL' ? 'All Quizzes' : uniqueQuizzes.find(q => q.id === selectedQuizFilter)?.title}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-4 transition-transform duration-200 ${quizDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {quizDropdownOpen && (
                <>
                  {/* Invisible overlay to catch outside clicks */}
                  <div className="fixed inset-0 z-10" onClick={() => setQuizDropdownOpen(false)}></div>
                  
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] z-20 overflow-hidden flex flex-col transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search quizzes..." 
                          value={quizSearchTerm}
                          onChange={(e) => setQuizSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[13px] font-medium text-slate-700 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all shadow-inner"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {/* ALL option */}
                      {'All Quizzes'.toLowerCase().includes(quizSearchTerm.toLowerCase()) && (
                        <button
                          onClick={() => {
                            setSelectedQuizFilter('ALL');
                            setQuizDropdownOpen(false);
                            setQuizSearchTerm('');
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2 ${selectedQuizFilter === 'ALL' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {selectedQuizFilter === 'ALL' && <Check className="w-4 h-4 shrink-0" />}
                          <span className={selectedQuizFilter === 'ALL' ? '' : 'ml-6'}>All Quizzes</span>
                        </button>
                      )}
                      
                      {uniqueQuizzes.filter(q => q.title.toLowerCase().includes(quizSearchTerm.toLowerCase())).map(q => (
                        <button
                          key={q.id}
                          onClick={() => {
                            setSelectedQuizFilter(q.id);
                            setQuizDropdownOpen(false);
                            setQuizSearchTerm('');
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-2 ${selectedQuizFilter === q.id ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {selectedQuizFilter === q.id && <Check className="w-4 h-4 shrink-0" />}
                          <span className={`truncate ${selectedQuizFilter === q.id ? '' : 'ml-6'}`} title={q.title}>{q.title}</span>
                        </button>
                      ))}

                      {uniqueQuizzes.filter(q => q.title.toLowerCase().includes(quizSearchTerm.toLowerCase())).length === 0 && !'All Quizzes'.toLowerCase().includes(quizSearchTerm.toLowerCase()) && (
                        <div className="px-3 py-5 flex flex-col items-center justify-center text-slate-400">
                          <Search className="w-6 h-6 mb-2 opacity-20" />
                          <span className="text-[12px] font-medium text-center">No quizzes found<br/>matching your search.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1 custom-scrollbar">
            {filteredQuestions.length > 0 ? filteredQuestions.map(q => {
              const isAlreadyAdded = existingQuestionIds.includes(q.id);
              const isSelected = selectedIds.includes(q.id);
              
              return (
                <label 
                  key={q.id} 
                  className={`group/card flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300 border ${
                    isAlreadyAdded ? 'bg-slate-50 opacity-60 cursor-not-allowed border-slate-200 grayscale-[20%]' : 
                    isSelected ? 'bg-[#6366f1]/[0.03] border-[#6366f1]/40 shadow-[0_2px_15px_-3px_rgba(99,102,241,0.15)] ring-1 ring-[#6366f1]/20 cursor-pointer scale-[1.01]' : 
                    'bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer hover:-translate-y-0.5'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isAlreadyAdded ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (isAlreadyAdded) {
                              e.preventDefault();
                              return;
                            }
                            toggleSelection(q.id);
                          }}
                          disabled={isAlreadyAdded}
                          className="peer w-5 h-5 rounded-md border-2 border-slate-300 text-[#6366f1] focus:ring-[#6366f1]/30 focus:ring-offset-0 cursor-pointer transition-all checked:border-[#6366f1]"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide border border-slate-200/60">
                        {getTypeIcon(q.type)}
                        {q.type === 'multiple' ? 'Multiple Choice' : q.type === 'truefalse' ? 'True / False' : 'Short Answer'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                        q.difficulty === 'EASY' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        q.difficulty === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wide border border-blue-200 truncate max-w-[100px]" title={`From: ${q.sourceQuizTitle}`}>
                        {q.sourceQuizTitle}
                      </span>
                      {isAlreadyAdded && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase shrink-0">Added</span>}
                    </div>
                    <p className="font-bold text-[14px] text-slate-800 leading-snug mb-2.5 pr-2">{q.text}</p>
                    
                    {/* Preview details */}
                    <div className="text-[12px] text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100/80 transition-all duration-300">
                      {q.type === 'multiple' && (
                        <div className="grid grid-cols-2 gap-3">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className={`flex items-start gap-1.5 ${idx === q.correctAnswer ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                              {idx === q.correctAnswer ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 ml-1 mt-1.5" />
                              )}
                              <span className="truncate group-hover/card:whitespace-normal group-hover/card:break-words transition-all duration-300">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'truefalse' && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Correct Answer:</span>
                          <strong className={`font-extrabold ${q.correctAnswer ? 'text-emerald-600' : 'text-rose-600'}`}>{q.correctAnswer ? 'TRUE' : 'FALSE'}</strong>
                        </div>
                      )}
                      {q.type === 'short' && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Exact Match:</span> 
                          <strong className="text-slate-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{q.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              );
            }) : (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 h-full">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-bold text-[17px] text-slate-600">No questions found</p>
                <p className="text-[14px] mt-1 text-slate-400 text-center max-w-xs">We couldn't find any questions matching your keywords.</p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200/60 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center bg-[#6366f1]/10 text-[#6366f1] font-bold text-sm w-6 h-6 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-[14px] font-bold text-slate-600">
              question{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-[13.5px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all focus:ring-4 focus:ring-slate-100 outline-none"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-[13.5px] font-bold hover:shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:ring-4 focus:ring-[#6366f1]/20 outline-none flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" strokeWidth={3} />
              Add to Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
