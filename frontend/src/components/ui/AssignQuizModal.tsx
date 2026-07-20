import { X, BookOpen, CheckCircle2, Search, Clock, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { DUMMY_QUIZZES } from '../../data/mockDb';

interface UserData {
  id: string;
  name: string;
  assigned_quizzes?: string[];
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
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedQuizzes([]);
      setConflictWarning(null);
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

          {conflictWarning && (
            <div className="mx-0 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium">{conflictWarning}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto border border-outline-variant/40 rounded-xl bg-surface-bright p-2 space-y-1 mt-3">
            {filteredQuizzes.length > 0 ? filteredQuizzes.map(quiz => {
              const isAlreadyAssigned = user?.assigned_quizzes?.includes(quiz.id);
              const isSelected = selectedQuizzes.includes(quiz.id);
              
              const assignedTimes = (user?.assigned_quizzes || [])
                .map(id => DUMMY_QUIZZES.find(q => q.id === id)?.time)
                .filter(Boolean)
                .filter(time => !time?.includes('Flexible'));
                
              const selectedTimes = selectedQuizzes
                .map(id => DUMMY_QUIZZES.find(q => q.id === id)?.time)
                .filter(Boolean)
                .filter(time => !time?.includes('Flexible'));
                
              const isTimeConflict = !isAlreadyAssigned && !isSelected && !quiz.time.includes('Flexible') && (assignedTimes.includes(quiz.time) || selectedTimes.includes(quiz.time));
              
              return (
                <label 
                  key={quiz.id} 
                  onClick={(e) => {
                    if (isTimeConflict) {
                      e.preventDefault();
                      setConflictWarning(`Trùng giờ! Bài "${quiz.title}" có thời gian (${quiz.time}) bị trùng với bài khác.`);
                      setTimeout(() => setConflictWarning(null), 3500);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors border ${
                    isAlreadyAssigned ? 'bg-surface-container-high opacity-70 cursor-not-allowed border-transparent' : 
                    isTimeConflict ? 'bg-error-container/20 opacity-70 cursor-not-allowed border-error/20' :
                    isSelected ? 'bg-primary/5 border-primary/30 cursor-pointer' : 
                    'hover:bg-surface-container-low border-transparent cursor-pointer'
                  }`}
                >
                  <div className="pt-0.5">
                    {isAlreadyAssigned ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isTimeConflict ? (
                      <div className="w-5 h-5 rounded-full bg-error-container text-error flex items-center justify-center">
                        <span className="text-[12px] font-bold">!</span>
                      </div>
                    ) : (
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if (isAlreadyAssigned || isTimeConflict) {
                            e.preventDefault();
                            return;
                          }
                          toggleSelection(quiz.id);
                        }}
                        disabled={isAlreadyAssigned || isTimeConflict}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-on-surface flex justify-between items-start gap-2">
                      <p className="leading-tight">{quiz.title}</p>
                      {isAlreadyAssigned && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0">Assigned</span>}
                      {isTimeConflict && <span className="text-[10px] font-bold text-error bg-error-container px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0">Time Conflict</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{quiz.id}</span>
                      <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{quiz.subject}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${isTimeConflict ? 'text-error bg-error-container' : 'text-primary bg-primary/10'}`}>
                        <Clock className="w-3 h-3" /> {quiz.time}
                      </span>
                    </div>
                  </div>
                </label>
              );
            }) : (
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
