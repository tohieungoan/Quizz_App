import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SubmitExamModalProps {
  submitModalOpen: boolean;
  successOverlayOpen: boolean;
  remainingCount: number;
  flaggedCount: number;
  subject: string;
  onConfirmSubmit: () => void;
  onCancelSubmit: () => void;
  onReturnDashboard: () => void;
}

export const SubmitExamModal: React.FC<SubmitExamModalProps> = ({
  submitModalOpen,
  successOverlayOpen,
  remainingCount,
  flaggedCount,
  subject,
  onConfirmSubmit,
  onCancelSubmit,
  onReturnDashboard,
}) => {
  return (
    <>
      {/* Double-Confirmation Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-5 text-tertiary shadow-inner">
              <span className="material-symbols-outlined text-[32px]">assignment_late</span>
            </div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface mb-2">Final Submission</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              You still have <span className="font-bold text-primary">{remainingCount} unanswered</span> and{' '}
              <span className="font-bold text-tertiary">{flaggedCount} flagged</span> questions. Are you sure you
              want to end the exam?
            </p>
            <div className="space-y-3">
              <button
                onClick={onConfirmSubmit}
                className="w-full py-3.5 bg-primary text-on-primary font-button text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-98"
              >
                Yes, Submit My Exam
              </button>
              <button
                onClick={onCancelSubmit}
                className="w-full py-3.5 bg-surface-container-high text-on-surface-variant font-button text-xs font-bold rounded-xl hover:bg-surface-variant/80 transition-all active:scale-98"
              >
                No, Continue Working
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Feedback Overlay */}
      {successOverlayOpen && (
        <div className="fixed inset-0 z-[110] bg-surface flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center max-w-lg p-8">
            <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
              <CheckCircle className="w-12 h-12 text-secondary" />
            </div>
            <h1 className="font-headline-xl text-3xl font-black text-on-surface mb-3 tracking-tight">
              Submission Successful
            </h1>
            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
              Your exam for <strong className="text-on-surface">{subject}</strong> has been received. Your grade will
              be published after the review period.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onReturnDashboard}
                className="px-8 py-3.5 bg-primary hover:bg-primary/95 text-on-primary font-button text-xs font-bold rounded-xl shadow-md active:scale-98 transition-all"
              >
                View Summary & Return
              </button>
              <button
                onClick={onReturnDashboard}
                className="px-8 py-3.5 text-primary font-button text-xs font-bold hover:bg-primary/5 rounded-xl transition-all"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
