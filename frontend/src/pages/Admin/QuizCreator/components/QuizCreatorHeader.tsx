import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface QuizCreatorHeaderProps {
  autoSaveStatus: 'saved' | 'saving' | 'idle';
  lastAutoSaveTime: string | null;
  isBusy: boolean;
  isPublishing: boolean;
  onClose: () => void;
  onPublish: () => void;
}

export function QuizCreatorHeader({
  autoSaveStatus,
  lastAutoSaveTime,
  isBusy,
  isPublishing,
  onClose,
  onPublish,
}: QuizCreatorHeaderProps) {
  return (
    <header className="h-14 md:h-16 shrink-0 flex items-center justify-between px-3 md:px-6 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors" title="Back">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-headline-sm md:font-headline-md text-primary hidden sm:block">Quiz Creator Studio</h1>
          <h1 className="font-headline-sm text-primary sm:hidden">Creator</h1>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-[11px] font-medium text-on-surface-variant transition-all">
            {autoSaveStatus === 'saving' ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-amber-600 dark:text-amber-400 font-semibold">Saving draft...</span></>
            ) : autoSaveStatus === 'saved' ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span>Draft saved {lastAutoSaveTime ? `(${lastAutoSaveTime})` : 'locally'}</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-primary/60" /><span>Draft mode</span></>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button onClick={onClose} disabled={isBusy} className="font-button text-xs md:text-button text-on-surface-variant hover:text-on-surface px-2 md:px-3 py-2 transition-colors disabled:opacity-50">Close</button>
        <button type="button" onClick={onPublish} disabled={isBusy} className="font-button text-xs md:text-button bg-primary text-on-primary px-4 md:px-6 py-2 md:py-2.5 rounded-lg hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5">
          <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
        </button>
      </div>
    </header>
  );
}
