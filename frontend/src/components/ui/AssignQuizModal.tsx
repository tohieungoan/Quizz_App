import { X, BookOpen, CheckCircle2, Search, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { DUMMY_QUIZZES } from '../../data/mockDb';

interface UserData {
  id: string;
  name: string;
}

interface AssignQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onAssign: (userId: string, quizIds: string[]) => void;
}

export function AssignQuizModal({ isOpen, onClose, user, onAssign }: AssignQuizModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedQuizzes([]);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const filteredQuizzes = DUMMY_QUIZZES.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    if (selectedQuizzes.includes(id)) {
      setSelectedQuizzes(selectedQuizzes.filter(qId => qId !== id));
    } else {
      setSelectedQuizzes([...selectedQuizzes, id]);
    }
  };

  const handleAssign = () => {
    if (selectedQuizzes.length > 0) {
      onAssign(user.id, selectedQuizzes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden border border-outline-variant/30">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-headline-sm font-bold text-on-surface">Assign Exam</h2>
              <p className="text-sm text-on-surface-variant">to {user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0">

          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              type="text" 
              placeholder="Search exams to assign..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto border border-outline-variant/40 rounded-xl bg-surface-bright p-2 space-y-1">
            {filteredQuizzes.length > 0 ? filteredQuizzes.map(quiz => (
              <label 
                key={quiz.id} 
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedQuizzes.includes(quiz.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-surface-container-low border-transparent'}`}
              >
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={selectedQuizzes.includes(quiz.id)}
                    onChange={() => toggleSelection(quiz.id)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-on-surface">{quiz.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                    <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{quiz.id}</span>
                    <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{quiz.subject}</span>
                    <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.time}</span>
                  </div>
                </div>
              </label>
            )) : (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                No quizzes found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-surface-bright border-t border-outline-variant/30 shrink-0">
          <span className="text-sm font-medium text-on-surface-variant">
            {selectedQuizzes.length} selected
          </span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAssign}
              disabled={selectedQuizzes.length === 0}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
