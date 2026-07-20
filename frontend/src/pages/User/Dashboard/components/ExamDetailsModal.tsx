import React from 'react';
import { X, CheckCircle, Award, Clock, FileText, UserCheck, MessageSquare } from 'lucide-react';
import { ExamHistoryItem } from '@/data/userData';

interface ExamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExamHistoryItem | null;
}

export const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary to-indigo-700 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              Official Exam Results
            </span>
            <h3 className="font-extrabold text-xl mt-1">{item.title}</h3>
            <p className="text-xs text-indigo-100 mt-0.5">Completed on {item.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Final Score</span>
              <p className="text-2xl font-black text-primary mt-0.5">{item.score}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Correct</span>
              <p className="text-2xl font-black text-green-600 mt-0.5">
                {item.correctAnswers} / {item.questionsCount}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Time Spent</span>
              <p className="text-2xl font-black text-on-surface mt-0.5">{item.timeSpent}</p>
            </div>
          </div>

          {/* Instructor / Host Feedback */}
          <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Host & Instructor Feedback</span>
              {item.hostName && <span className="text-xs text-on-surface-variant font-normal">({item.hostName})</span>}
            </div>
            <p className="text-xs text-on-surface leading-relaxed font-medium">
              "{item.hostFeedback || 'Great performance! You demonstrated thorough understanding of the core concepts.'}"
            </p>
          </div>

          {/* Sample Question Review List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Question Review & Accuracy
            </h4>

            <div className="space-y-2.5">
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface">Question 1: What is the primary function of HTML?</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Correct (+1.0)</span>
                </div>
                <p className="text-xs text-on-surface-variant">Your Answer: <strong className="text-green-700">Hyper Text Markup Language</strong></p>
              </div>

              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface">Question 2: Which HTTP method is idempotent?</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Correct (+1.0)</span>
                </div>
                <p className="text-xs text-on-surface-variant">Your Answer: <strong className="text-green-700">GET</strong></p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
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
