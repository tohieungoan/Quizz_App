import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Eye,
  FileImage,
  ImageIcon,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AIQuestionReviewItem, AIQuestionType } from '@/types/aiQuiz';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface AIQuestionReviewModalProps {
  isOpen: boolean;
  questions: AIQuestionReviewItem[];
  modelUsed: string;
  isGenerating: boolean;
  requestedCount: number;
  receivedCount: number;
  onChange: (questions: AIQuestionReviewItem[]) => void;
  onCancel: () => void;
  onImport: (questions: AIQuestionReviewItem[], uploadedUrls: string[]) => void;
}

const makeReviewId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ai_review_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const createBlankAIReviewQuestion = (): AIQuestionReviewItem => ({
  review_id: makeReviewId(),
  content: '',
  type: 'multiple',
  difficulty: 'MEDIUM',
  time_limit: 60,
  points: 1,
  options: [
    { content: '', is_correct: true },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
  ],
});

export const toAIReviewQuestion = (
  question: AIQuestionReviewItem | Omit<AIQuestionReviewItem, 'review_id'>,
): AIQuestionReviewItem => ({
  ...question,
  review_id: 'review_id' in question && question.review_id ? question.review_id : makeReviewId(),
  content: question.content || '',
  time_limit: question.time_limit || 60,
  points: question.points || 1,
  options: (question.options || []).map(option => ({ ...option })),
});

const validateQuestion = (question: AIQuestionReviewItem): string[] => {
  const errors: string[] = [];
  if (!question.content.trim()) errors.push('Question content is required.');
  if (!question.time_limit || question.time_limit < 1) errors.push('Time limit must be greater than zero.');

  if (question.type === 'multiple') {
    const options = question.options.filter(option => option.content.trim());
    if (options.length < 2) errors.push('Multiple choice requires at least two non-empty options.');
    if (question.options.filter(option => option.is_correct).length !== 1) {
      errors.push('Select exactly one correct option.');
    }
    if (question.options.some(option => !option.content.trim())) errors.push('Remove or complete empty options.');
  } else if (question.type === 'truefalse') {
    if (question.options.length !== 2) errors.push('True/False requires exactly two options.');
    if (question.options.filter(option => option.is_correct).length !== 1) {
      errors.push('Select exactly one correct answer.');
    }
  } else if (question.type === 'short') {
    if (!(question.keyword || question.acceptable_answers?.[0] || '').trim()) {
      errors.push('A short-answer keyword is required.');
    }
  }
  return errors;
};

const normalizeForType = (
  question: AIQuestionReviewItem,
  type: Exclude<AIQuestionType, 'all'>,
): AIQuestionReviewItem => {
  if (type === 'truefalse') {
    const currentCorrect = question.options.find(option => option.is_correct)?.content.toLowerCase();
    const falseIsCorrect = ['false', 'sai'].includes(currentCorrect || '');
    return {
      ...question,
      type,
      options: [
        { content: 'True', is_correct: !falseIsCorrect },
        { content: 'False', is_correct: falseIsCorrect },
      ],
    };
  }
  if (type === 'short') {
    const answer = question.keyword
      || question.acceptable_answers?.[0]
      || question.options.find(option => option.is_correct)?.content
      || '';
    return { ...question, type, keyword: answer, acceptable_answers: answer ? [answer] : [], options: [] };
  }

  const existing = question.options.length >= 2
    ? question.options
    : [
        { content: '', is_correct: true },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
      ];
  const hasCorrect = existing.some(option => option.is_correct);
  return {
    ...question,
    type,
    options: existing.map((option, index) => ({
      ...option,
      is_correct: hasCorrect ? option.is_correct : index === 0,
    })),
  };
};

export function AIQuestionReviewModal({
  isOpen,
  questions,
  modelUsed,
  isGenerating,
  requestedCount,
  receivedCount,
  onChange,
  onCancel,
  onImport,
}: AIQuestionReviewModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const uploadedUrlsRef = useRef<Set<string>>(new Set());
  const questionsRef = useRef(questions);
  const reviewActiveRef = useRef(isOpen);
  const questionListRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const { uploadFile, deleteFile, error: uploadError, progress } = useCloudinaryUpload();
  questionsRef.current = questions;

  useEffect(() => {
    reviewActiveRef.current = isOpen;
    if (!isOpen) return;
    if (!selectedId || !questions.some(question => question.review_id === selectedId)) {
      setSelectedId(questions[0]?.review_id || null);
    }
  }, [isOpen, questions, selectedId]);

  useEffect(() => {
    setShowImagePreview(false);
  }, [selectedId]);

  const selectedIndex = questions.findIndex(question => question.review_id === selectedId);
  const selectedQuestion = selectedIndex >= 0 ? questions[selectedIndex] : null;
  const invalidQuestions = useMemo(
    () => questions.map((question, index) => ({ index, errors: validateQuestion(question) }))
      .filter(result => result.errors.length > 0),
    [questions],
  );
  const readyCount = questions.length - invalidQuestions.length;
  const completionPercent = questions.length > 0
    ? Math.round((readyCount / questions.length) * 100)
    : 0;
  const selectedErrors = selectedQuestion ? validateQuestion(selectedQuestion) : [];

  if (!isOpen) return null;

  const updateSelected = (updater: (question: AIQuestionReviewItem) => AIQuestionReviewItem) => {
    if (selectedIndex < 0) return;
    onChange(questions.map((question, index) => index === selectedIndex ? updater(question) : question));
    setValidationMessage(null);
  };

  const selectQuestion = (questionId: string) => {
    setSelectedId(questionId);
    setValidationMessage(null);
    editorRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.requestAnimationFrame(() => {
      questionListRef.current
        ?.querySelector<HTMLElement>(`[data-question-id="${questionId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  };

  const selectAdjacentQuestion = (direction: -1 | 1) => {
    const target = questions[selectedIndex + direction];
    if (target) selectQuestion(target.review_id);
  };

  const removeQuestion = async (index: number) => {
    const removed = questions[index];
    if (removed?.media_url && uploadedUrlsRef.current.has(removed.media_url)) {
      await deleteFile(removed.media_url);
      uploadedUrlsRef.current.delete(removed.media_url);
    }
    const next = questionsRef.current.filter(item => item.review_id !== removed.review_id);
    onChange(next);
    setSelectedId(next[Math.min(index, next.length - 1)]?.review_id || null);
  };

  const handleImageUpload = async (question: AIQuestionReviewItem, file: File) => {
    setUploadingQuestionId(question.review_id);
    setValidationMessage(null);
    const oldUrl = question.media_url;
    const uploadedUrl = await uploadFile(file);
    setUploadingQuestionId(null);
    if (!uploadedUrl) return;
    if (!reviewActiveRef.current) {
      await deleteFile(uploadedUrl);
      return;
    }

    uploadedUrlsRef.current.add(uploadedUrl);
    onChange(questionsRef.current.map(item => item.review_id === question.review_id
      ? { ...item, media_url: uploadedUrl }
      : item));

    if (oldUrl && uploadedUrlsRef.current.has(oldUrl)) {
      await deleteFile(oldUrl);
      uploadedUrlsRef.current.delete(oldUrl);
    }
  };

  const removeImage = async (question: AIQuestionReviewItem) => {
    if (question.media_url && uploadedUrlsRef.current.has(question.media_url)) {
      await deleteFile(question.media_url);
      uploadedUrlsRef.current.delete(question.media_url);
    }
    onChange(questionsRef.current.map(item => item.review_id === question.review_id
      ? { ...item, media_url: undefined }
      : item));
  };

  const discardReview = async () => {
    if (isDiscarding) return;
    setIsDiscarding(true);
    reviewActiveRef.current = false;
    setConfirmDiscard(false);
    setValidationMessage(null);
    // Abort generation and close immediately; remote image cleanup can finish in the background.
    onCancel();
    const uploadedUrls = [...uploadedUrlsRef.current];
    await Promise.allSettled(uploadedUrls.map(url => deleteFile(url)));
    uploadedUrlsRef.current.clear();
    setIsDiscarding(false);
  };

  const importQuestions = async () => {
    if (questions.length === 0) {
      setValidationMessage('Add at least one question before importing.');
      return;
    }
    if (invalidQuestions.length > 0) {
      const first = invalidQuestions[0];
      setSelectedId(questions[first.index].review_id);
      setValidationMessage(`Question ${first.index + 1}: ${first.errors.join(' ')}`);
      return;
    }

    const usedUrls = new Set(questions.map(question => question.media_url).filter(Boolean) as string[]);
    const unusedUrls = [...uploadedUrlsRef.current].filter(url => !usedUrls.has(url));
    await Promise.allSettled(unusedUrls.map(url => deleteFile(url)));
    const transferredUrls = [...uploadedUrlsRef.current].filter(url => usedUrls.has(url));
    uploadedUrlsRef.current.clear();
    reviewActiveRef.current = false;
    onImport(questions, transferredUrls);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-md sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-[1440px] flex-col overflow-hidden bg-surface-container-lowest shadow-[0_28px_80px_-24px_rgba(15,23,42,0.55)] sm:h-[92vh] sm:rounded-[26px] sm:border sm:border-white/20">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm shadow-primary/20 sm:h-11 sm:w-11 sm:rounded-2xl">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-bold tracking-tight text-on-surface sm:text-lg">Review AI questions</h2>
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-on-surface-variant sm:mt-1 sm:text-xs">
                <span className="flex shrink-0 items-center gap-1">
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <ListChecks className="h-3.5 w-3.5" />}
                  {isGenerating ? `${receivedCount}/${requestedCount} generated` : `${questions.length} questions`}
                </span>
              </div>
            </div>
          </div>
          <button type="button" disabled={isDiscarding} onClick={() => setConfirmDiscard(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl" aria-label={isGenerating ? 'Cancel AI generation' : 'Close review'}>
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-1">
          <aside className="flex min-h-0 flex-col border-b border-outline-variant/30 bg-white md:border-b-0 md:border-r md:bg-[#f7f8fc]">
            <div className="border-b border-slate-200/80 bg-white px-4 py-3 md:px-5 md:py-4">
              <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700"><span className="md:hidden">Questions</span><span className="hidden md:inline">Question set</span></p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500 md:hidden">Question {selectedIndex + 1} of {questions.length}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 md:hidden">
                  <button type="button" disabled={selectedIndex <= 0} onClick={() => selectAdjacentQuestion(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous question"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" disabled={selectedIndex >= questions.length - 1} onClick={() => selectAdjacentQuestion(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next question"><ChevronRight className="h-4 w-4" /></button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = createBlankAIReviewQuestion();
                    onChange([...questions, next]);
                    selectQuestion(next.review_id);
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary px-3 text-[11px] font-bold text-on-primary shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 md:rounded-lg md:text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              </div>
              <div className="mt-3 flex items-center gap-3 md:mt-4">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${invalidQuestions.length ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${completionPercent}%` }} />
                </div>
                <span className="shrink-0 text-[11px] font-bold text-slate-600">{readyCount}/{questions.length} ready</span>
              </div>
            </div>
            <div ref={questionListRef} className="flex h-[104px] shrink-0 snap-x snap-mandatory touch-pan-x items-stretch gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain bg-slate-50 px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-auto md:min-h-0 md:flex-1 md:snap-none md:flex-col md:items-stretch md:gap-2 md:overflow-x-hidden md:overflow-y-auto md:bg-transparent md:p-4 md:[scrollbar-width:auto] md:[&::-webkit-scrollbar]:block">
              {questions.map((question, index) => {
                const errors = validateQuestion(question);
                const isSelected = selectedId === question.review_id;
                const typeLabel = question.type === 'multiple' ? 'Multiple choice' : question.type === 'truefalse' ? 'True / False' : 'Short answer';
                return (
                  <button
                    type="button"
                    key={question.review_id}
                    data-question-id={question.review_id}
                    onClick={() => selectQuestion(question.review_id)}
                    className={`group relative h-full w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] shrink-0 snap-center overflow-hidden rounded-xl border bg-white p-3 text-left transition-all duration-200 md:h-auto md:w-full md:max-w-none md:min-w-0 md:flex-none md:snap-start md:rounded-lg md:p-3.5 ${isSelected ? 'border-primary/45 shadow-[0_8px_20px_-16px_rgba(79,70,229,0.65)] ring-1 ring-primary/15' : 'border-slate-200/90 hover:border-primary/30 hover:shadow-sm'}`}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold md:rounded-md md:text-[11px] ${isSelected ? 'bg-primary text-on-primary' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span>
                        <span className="truncate rounded-md bg-slate-100 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-600 md:rounded md:text-[9px]">{typeLabel}</span>
                      </div>
                      <span className={`flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[8px] font-bold uppercase tracking-wide md:text-[9px] ${errors.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`} title={errors.length ? 'Needs attention' : 'Ready'}>
                        {errors.length ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        <span className="hidden min-[390px]:inline md:inline">{errors.length ? 'Review' : 'Ready'}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main ref={editorRef} className="min-h-0 overflow-y-auto bg-surface-container-low/25">
            {!selectedQuestion ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-on-surface-variant">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
                <p className="font-bold text-on-surface">No questions to review</p>
                <p className="mt-1 text-xs">Add a blank question or close this review.</p>
              </div>
            ) : (
              <div className="mx-auto max-w-5xl space-y-3 p-3 sm:space-y-4 sm:p-6 lg:p-8">
                <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-3 shadow-[0_10px_28px_-28px_rgba(15,23,42,0.65)] sm:rounded-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-28 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-on-surface">Question {selectedIndex + 1}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedErrors.length ? 'bg-error/10 text-error' : 'bg-emerald-500/10 text-emerald-700'}`}>{selectedErrors.length ? 'Needs attention' : 'Ready'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 md:hidden">
                      <button type="button" disabled={selectedIndex <= 0} onClick={() => selectAdjacentQuestion(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant disabled:opacity-30" aria-label="Previous question"><ChevronLeft className="h-4 w-4" /></button>
                      <span className="min-w-10 text-center text-[10px] font-bold text-on-surface-variant">{selectedIndex + 1}/{questions.length}</span>
                      <button type="button" disabled={selectedIndex >= questions.length - 1} onClick={() => selectAdjacentQuestion(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant disabled:opacity-30" aria-label="Next question"><ChevronRight className="h-4 w-4" /></button>
                    </div>

                    <div className="order-last grid w-full grid-cols-2 gap-2 lg:order-none lg:w-auto lg:grid-cols-[140px_108px_100px]">
                      <label className="col-span-2 min-w-0 sm:col-span-1">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">Question type</span>
                        <select value={selectedQuestion.type} onChange={event => updateSelected(question => normalizeForType(question, event.target.value as Exclude<AIQuestionType, 'all'>))} className="h-10 w-full rounded-lg border border-outline-variant/45 bg-surface-container-low/35 px-2.5 text-base font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-9 sm:text-xs">
                          <option value="multiple">Multiple choice</option>
                          <option value="truefalse">True / False</option>
                          <option value="short">Short answer</option>
                        </select>
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">Difficulty</span>
                        <select value={selectedQuestion.difficulty} onChange={event => updateSelected(question => ({ ...question, difficulty: event.target.value as AIQuestionReviewItem['difficulty'] }))} className="h-10 w-full rounded-lg border border-outline-variant/45 bg-surface-container-low/35 px-2.5 text-base font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-9 sm:text-xs">
                          <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                        </select>
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">Time limit</span>
                        <span className="relative block">
                          <input type="number" min={1} max={86400} value={selectedQuestion.time_limit} onChange={event => updateSelected(question => ({ ...question, time_limit: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-outline-variant/45 bg-surface-container-low/35 px-2 pr-5 text-base font-semibold text-on-surface outline-none [appearance:textfield] focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-9 sm:text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-on-surface-variant">s</span>
                        </span>
                      </label>
                    </div>

                    <div className="ml-auto flex items-center gap-1">
                      <label className={`mr-1 flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-sm transition-all ${selectedQuestion.media_url ? 'border-primary/50 bg-primary/10 text-primary' : 'border-outline-variant/50 text-on-surface hover:bg-primary/5 hover:text-primary'} ${uploadingQuestionId ? 'pointer-events-none opacity-60' : ''}`} title={selectedQuestion.media_url ? 'Change image' : 'Add image'}>
                        {uploadingQuestionId === selectedQuestion.review_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                        {uploadingQuestionId === selectedQuestion.review_id ? `${progress}%` : 'Image'}
                        <input type="file" accept="image/*" className="hidden" disabled={Boolean(uploadingQuestionId)} onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) void handleImageUpload(selectedQuestion, file);
                          event.target.value = '';
                        }} />
                      </label>
                      <button type="button" onClick={() => void removeQuestion(selectedIndex)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-error/20 text-error transition-colors hover:bg-error/10" title="Delete question" aria-label="Delete question"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {selectedQuestion.media_url && (
                    <div className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low p-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileImage className="h-8 w-8 shrink-0 text-blue-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-on-surface">Current Media</p>
                          <p className="text-[10px] text-on-surface-variant">Question image</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button type="button" onClick={() => setShowImagePreview(true)} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"><Eye className="h-3.5 w-3.5" /> Preview</button>
                        <button type="button" onClick={() => { setShowImagePreview(false); void removeImage(selectedQuestion); }} className="flex items-center gap-1.5 rounded-md border border-error/20 px-2.5 py-1.5 text-xs font-bold text-error transition-colors hover:bg-error/10"><X className="h-3.5 w-3.5" /> Remove</button>
                      </div>
                    </div>
                  )}
                  {uploadError && uploadingQuestionId === null && <p className="mt-2 text-[10px] font-medium text-error">{uploadError}</p>}
                </div>

                {validationMessage && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-error/20 bg-error-container/25 px-3.5 py-3 text-xs font-medium text-error">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {validationMessage}
                  </div>
                )}

                <section className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-3.5 shadow-[0_10px_28px_-28px_rgba(15,23,42,0.65)] sm:rounded-2xl sm:p-5">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-on-surface">Question &amp; answers</h4>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-on-surface">Question</span>
                    <textarea
                      rows={4}
                      value={selectedQuestion.content}
                      onChange={event => updateSelected(question => ({ ...question, content: event.target.value }))}
                      className="w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container-low/55 p-3 text-base leading-6 text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 sm:p-3.5 sm:text-sm"
                      placeholder="Enter the question..."
                    />
                  </label>

                  <div className="mt-5 border-t border-outline-variant/30 pt-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div><h4 className="text-sm font-bold text-on-surface">Answer</h4><p className="mt-0.5 text-[11px] text-on-surface-variant">Choose the correct answer before importing.</p></div>
                    {selectedQuestion.type === 'multiple' && (
                      <button type="button" disabled={selectedQuestion.options.length >= 20} onClick={() => updateSelected(question => ({ ...question, options: [...question.options, { content: '', is_correct: false }] }))} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add option</button>
                    )}
                  </div>

                  {selectedQuestion.type === 'multiple' && (
                    <div className="space-y-2.5">
                      {selectedQuestion.options.map((option, optionIndex) => (
                        <div key={optionIndex} className={`flex items-center gap-1.5 rounded-xl border p-1.5 transition-colors sm:gap-2 sm:p-2 ${option.is_correct ? 'border-primary/35 bg-primary/[0.04]' : 'border-outline-variant/40 bg-surface-container-low/30'}`}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container text-[11px] font-bold text-on-surface-variant max-[360px]:hidden">{String.fromCharCode(65 + optionIndex)}</span>
                          <input type="radio" name={`correct-${selectedQuestion.review_id}`} checked={option.is_correct} onChange={() => updateSelected(question => ({ ...question, options: question.options.map((item, index) => ({ ...item, is_correct: index === optionIndex })) }))} className="h-4 w-4 shrink-0 accent-primary" aria-label={`Mark option ${optionIndex + 1} correct`} />
                          <input value={option.content} onChange={event => updateSelected(question => ({ ...question, options: question.options.map((item, index) => index === optionIndex ? { ...item, content: event.target.value } : item) }))} className="h-10 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:h-9 sm:text-sm" placeholder={`Option ${optionIndex + 1}`} />
                          {option.is_correct && <span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-primary sm:inline">Correct</span>}
                          <button type="button" disabled={selectedQuestion.options.length <= 2} onClick={() => updateSelected(question => {
                            const next = question.options.filter((_, index) => index !== optionIndex);
                            if (!next.some(item => item.is_correct)) next[0] = { ...next[0], is_correct: true };
                            return { ...question, options: next };
                          })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30" aria-label={`Remove option ${optionIndex + 1}`}><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedQuestion.type === 'truefalse' && (
                    <div className="grid grid-cols-2 gap-3">{['True', 'False'].map((answer, answerIndex) => {
                      const active = selectedQuestion.options[answerIndex]?.is_correct;
                      return <button type="button" key={answer} onClick={() => updateSelected(question => ({ ...question, options: question.options.map((item, index) => ({ ...item, is_correct: index === answerIndex })) }))} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${active ? 'border-primary bg-primary text-on-primary shadow-sm shadow-primary/20' : 'border-outline-variant/50 bg-surface-container-low/35 text-on-surface hover:border-primary/30'}`}>{active && <Check className="h-4 w-4" />}{answer}</button>;
                    })}</div>
                  )}

                  {selectedQuestion.type === 'short' && (
                    <label className="block text-xs font-bold text-on-surface"><span className="mb-2 block">Accepted answer</span><input value={selectedQuestion.keyword || selectedQuestion.acceptable_answers?.[0] || ''} onChange={event => updateSelected(question => ({ ...question, keyword: event.target.value, acceptable_answers: event.target.value ? [event.target.value] : [] }))} className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-low/40 px-3 text-base font-medium outline-none transition-shadow focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 sm:text-sm" placeholder="Enter the accepted answer" /></label>
                  )}
                  </div>
                </section>

              </div>
            )}
          </main>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-3 py-2.5 backdrop-blur-sm sm:justify-between sm:gap-3 sm:px-6 sm:py-3">
          <div className="hidden min-w-0 items-center gap-3 sm:flex">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${invalidQuestions.length ? 'bg-error/10 text-error' : 'bg-emerald-500/10 text-emerald-700'}`}>{invalidQuestions.length ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span>
            <div>
              <p className={`text-xs font-bold ${invalidQuestions.length ? 'text-error' : 'text-on-surface'}`}>{invalidQuestions.length ? `${invalidQuestions.length} question${invalidQuestions.length > 1 ? 's' : ''} need attention` : 'All questions are ready'}</p>
              <div className="mt-1 hidden items-center gap-2 sm:flex">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-container"><div className={`h-full rounded-full ${invalidQuestions.length ? 'bg-primary' : 'bg-emerald-600'}`} style={{ width: `${completionPercent}%` }} /></div>
                <span className="text-[10px] text-on-surface-variant">{readyCount}/{questions.length} validated</span>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <button type="button" disabled={isDiscarding} onClick={() => setConfirmDiscard(true)} className="h-11 flex-1 rounded-xl border border-outline-variant/40 px-3 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:flex-none sm:border-0 sm:px-4">{isGenerating ? 'Cancel' : 'Discard'}</button>
            <button type="button" disabled={Boolean(uploadingQuestionId) || questions.length === 0 || isGenerating} onClick={() => void importQuestions()} className="flex h-11 flex-[1.7] items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-on-primary shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:flex-none sm:px-5">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {isGenerating ? `Generating ${receivedCount}/${requestedCount}` : `Import ${questions.length}`}</button>
          </div>
        </footer>
      </div>

      {showImagePreview && selectedQuestion?.media_url && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8" onClick={() => setShowImagePreview(false)}>
          <div className="relative flex h-full w-full max-w-5xl items-center justify-center">
            <button type="button" onClick={() => setShowImagePreview(false)} className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70" aria-label="Close image preview"><X className="h-5 w-5" /></button>
            <img src={selectedQuestion.media_url} alt="Question preview full size" className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" onClick={event => event.stopPropagation()} />
          </div>
        </div>
      )}

      {confirmDiscard && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.7)] sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error"><AlertCircle className="h-5 w-5" /></div>
            <h3 className="mt-4 text-base font-bold text-on-surface">{isGenerating ? 'Cancel AI generation?' : 'Discard AI review?'}</h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{isGenerating ? `Generation will stop now. The ${receivedCount} question${receivedCount === 1 ? '' : 's'} received so far will be discarded.` : 'Generated questions and images that have not been imported will be permanently removed from this review.'}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={isDiscarding} onClick={() => setConfirmDiscard(false)} className="h-11 rounded-xl px-4 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40 sm:h-10">Continue reviewing</button><button type="button" disabled={isDiscarding} onClick={() => void discardReview()} className="h-11 rounded-xl bg-error px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-error/90 disabled:opacity-50 sm:h-10">{isDiscarding ? 'Cancelling…' : isGenerating ? 'Cancel generation' : 'Discard review'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
