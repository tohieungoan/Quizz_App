import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'success' }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm relative flex flex-col border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-2">
            {type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-error" />
            ) : (
              <AlertCircle className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-headline-sm font-bold text-on-surface">
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-body-md text-on-surface-variant leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end px-6 py-4 bg-surface-bright border-t border-outline-variant/30">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-button bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
