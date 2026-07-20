import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', variant = 'danger' }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm relative flex flex-col border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-error' : variant === 'warning' ? 'text-orange-500' : 'text-primary'}`} />
            <h2 className="text-lg font-headline-sm font-bold text-on-surface">
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-body-md text-on-surface-variant">{message}</p>
        </div>
        <div className="flex items-center justify-end px-6 py-4 bg-surface-bright border-t border-outline-variant/30 gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-button text-on-surface-variant hover:bg-surface-container rounded-lg border border-outline-variant/50 transition-colors">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-5 py-2.5 text-sm font-button rounded-lg transition-colors shadow-sm ${variant === 'danger' ? 'bg-error text-on-error hover:bg-error/90' : variant === 'warning' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
