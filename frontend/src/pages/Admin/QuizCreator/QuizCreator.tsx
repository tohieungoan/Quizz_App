import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { toAIReviewQuestion } from '@/components/ui/AIQuizModal';
import { AIQuestionItem, AIQuestionReviewItem } from '@/types/aiQuiz';
import { useAIQuiz } from '@/contexts/AIQuizContext';
import { CloudUploadRef } from '@/components/ui/CloudUpload';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { quizService } from '@/services/quizService';
import { ApiError } from '@/services/apiClient';
import { getActiveQuizDraftPointerKey, getOrCreateActiveQuizDraftId } from '@/utils/quizDraftSession';
import { QuestionList } from './components/QuestionList';
import { QuestionEditor } from './components/QuestionEditor';
import { QuizCreatorDialogs } from './components/QuizCreatorDialogs';
import { QuizCreatorHeader } from './components/QuizCreatorHeader';
import { QuizSettingsPanel } from './components/QuizSettingsPanel';
import { QuestionStartPanel } from './components/QuestionStartPanel';
import {
  mapServerQuestion,
  Question,
  QuestionType,
  toDraftQuestionSnapshot,
} from './quizCreatorModels';

export type { Question, QuestionType } from './quizCreatorModels';

export function QuizCreator({ onCancel, initialData }: { onCancel: () => void, initialData?: any }) {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingType, setEditingType] = useState<QuestionType | null>(null);
  const [mobileTab, setMobileTab] = useState<'build' | 'settings'>('build');
  
  // Builder State
  const [qText, setQText] = useState('');
  const [mcOptions, setMcOptions] = useState(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [mcOptionIds, setMcOptionIds] = useState<(number | undefined)[]>([undefined, undefined, undefined, undefined]);
  const [mcCorrect, setMcCorrect] = useState(0);
  const [tfCorrect, setTfCorrect] = useState(true);
  const [tfOptionIds, setTfOptionIds] = useState<(number | undefined)[]>([undefined, undefined]);
  const [shortCorrect, setShortCorrect] = useState('');
  const [shortOptionId, setShortOptionId] = useState<number | undefined>(undefined);
  const [qDifficulty, setQDifficulty] = useState<'EASY'|'MEDIUM'|'HARD'>('MEDIUM');
  const [qTimeLimit, setQTimeLimit] = useState<number>(60);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showUploadType, setShowUploadType] = useState<'image' | 'audio' | null>(null);

  const imageUploadRef = useRef<CloudUploadRef>(null);
  const audioUploadRef = useRef<CloudUploadRef>(null);

  const { uploadFile: uploadMedia, deleteFile: deleteMediaFile, isUploading: isUploadingMedia } = useCloudinaryUpload();
  const { uploadFile: uploadAudio, deleteFile: deleteAudioFile, isUploading: isUploadingAudio } = useCloudinaryUpload();
  
  // Track assets uploaded during this specific draft session so we can clean them up if replaced
  const [draftUploadedUrls, setDraftUploadedUrls] = useState<Set<string>>(new Set());
  
  const [editingId, setEditingId] = useState<string | null>(null);

  // Core Quiz Info State
  const [quizTitle, setQuizTitle] = useState(initialData?.title || '');
  const [quizDescription, setQuizDescription] = useState(initialData?.description || '');
  const [quizSubject, setQuizSubject] = useState(initialData?.subject || 'Science');
  const [quizDifficulty, setQuizDifficulty] = useState(initialData?.diff || 'Medium');
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? initialData?.isPublic ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-Save Draft & Crash Recovery State
  const quizRawId = (id || initialData?.id || '').replace('QZ-', '');
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userScope = String(storedUser.id || storedUser.email || 'anonymous');
  const activeDraftPointerKey = getActiveQuizDraftPointerKey();
  const draftClientIdRef = useRef<string>((() => {
    if (quizRawId) return '';
    return getOrCreateActiveQuizDraftId();
  })());
  const draftStorageKey = quizRawId
    ? `quizz_creator_draft_${userScope}_edit_${quizRawId}`
    : `quizz_creator_draft_${userScope}_new_${draftClientIdRef.current}`;
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialMount = useRef(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const serverQuizIdRef = useRef<string>(quizRawId);
  const quizVersionRef = useRef<number>(1);
  const saveOperationRef = useRef<Promise<boolean> | null>(null);
  const queuedSaveRef = useRef(false);
  const skipNextServerAutosaveRef = useRef(true);
  // Mark media removals so they are persisted immediately after React commits
  // the updated question list (including when Save & Next resets the form).
  const saveAfterQuestionRef = useRef(false);
  const saveQuizRef = useRef<(status: string, shouldExit?: boolean, silent?: boolean) => Promise<boolean>>(async () => false);

  // Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiReviewQuestions, setAiReviewQuestions] = useState<AIQuestionReviewItem[]>([]);
  const [aiReviewModelUsed, setAiReviewModelUsed] = useState('');
  const [quickAIPrompt, setQuickAIPrompt] = useState('');
  const [deletedBlacklist, setDeletedBlacklist] = useState<string[]>([]);
  const [, setHighlightedQuestionIds] = useState<Set<string>>(new Set());

  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [formResetKey, setFormResetKey] = useState(0);

  // Global Background AI Generation Integration
  const { startGeneration, unconsumedQuestions, consumeQuestions } = useAIQuiz();

  // Import only after the author has reviewed and validated the AI output.
  const handleAIReviewImport = (
    reviewedQuestions: AIQuestionReviewItem[],
    uploadedUrls: string[],
  ) => {
    const modelUsed = aiReviewModelUsed;
    const generatedQuestions: AIQuestionItem[] = reviewedQuestions;
    const newQuestions: Question[] = generatedQuestions.map((item, idx) => {
      const uniqueId = `q_ai_${Date.now()}_${idx}`;
      const base = {
        id: uniqueId,
        text: item.content,
        difficulty: (item.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
        timeLimit: item.time_limit || 60,
        isAIGenerated: true,
        mediaUrl: item.media_url,
      };

      if (item.type === 'truefalse') {
        const correctOption = item.options.find(option => option.is_correct);
        const tfAns = !['false', 'sai'].includes(correctOption?.content.toLowerCase() || 'true');
        return {
          ...base,
          type: 'truefalse' as const,
          correctAnswer: tfAns,
        };
      } else if (item.type === 'short') {
        const shortAns = item.keyword
          || item.acceptable_answers?.[0]
          || item.options.find(option => option.is_correct)?.content
          || item.options[0]?.content
          || '';
        return {
          ...base,
          type: 'short' as const,
          correctAnswer: shortAns,
        };
      } else {
        // Multiple choice
        const optionsText = item.options.map(o => o.content);
        const correctIdx = item.options.findIndex(o => o.is_correct);

        return {
          ...base,
          type: 'multiple' as const,
          options: optionsText.length >= 2 ? optionsText : [...optionsText, 'Additional Option'],
          correctAnswer: correctIdx,
        };
      }
    });

    setQuestions(prev => [...prev, ...newQuestions]);
    setDraftUploadedUrls(previous => new Set([...previous, ...uploadedUrls]));
    setAiReviewQuestions([]);
    setAiReviewModelUsed('');
    setAiReviewOpen(false);
    
    // Highlight new questions
    const newIds = new Set(newQuestions.map(q => q.id));
    setHighlightedQuestionIds(newIds);
    setTimeout(() => setHighlightedQuestionIds(new Set()), 5000);

    setQuickAIPrompt('');
    setAlertState({
      isOpen: true,
      title: 'AI Generation Complete!',
      message: `Successfully generated and added ${newQuestions.length} standard questions (${modelUsed}) to your quiz list.`,
      type: 'success'
    });

    // Smooth scroll down to questions list
    setTimeout(() => {
      document.getElementById('questions-list-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Generated questions enter a review queue instead of being injected directly.
  useEffect(() => {
    if (unconsumedQuestions) {
      const data = consumeQuestions();
      if (data && data.questions.length > 0) {
        const reviewQuestions = data.questions.map(question => toAIReviewQuestion(question));
        setAiReviewQuestions(previous => [...previous, ...reviewQuestions]);
        setAiReviewModelUsed(data.modelUsed);
        setAiReviewOpen(true);
      }
    }
  }, [unconsumedQuestions]);

  const handleAIReviewCancel = () => {
    setAiReviewQuestions([]);
    setAiReviewModelUsed('');
    setAiReviewOpen(false);
  };

  const handleStartAIGeneration = (formData: FormData, count: number) => {
    startGeneration(formData, count, window.location.pathname);
  };

  // Load a complete server snapshot, then silently apply a newer crash-recovery
  // snapshot from this user/browser. There is intentionally no restore modal.
  useEffect(() => {
    let cancelled = false;

    const applyBuilderState = (builder: any) => {
      if (!builder) return;
      setEditingType(builder.editingType ?? null);
      setEditingId(builder.editingId ?? null);
      setQText(builder.qText ?? '');
      setMcOptions(builder.mcOptions ?? ['Option 1', 'Option 2', 'Option 3', 'Option 4']);
      setMcOptionIds(builder.mcOptionIds ?? [undefined, undefined, undefined, undefined]);
      setMcCorrect(builder.mcCorrect ?? 0);
      setTfCorrect(builder.tfCorrect ?? true);
      setTfOptionIds(builder.tfOptionIds ?? [undefined, undefined]);
      setShortCorrect(builder.shortCorrect ?? '');
      setShortOptionId(builder.shortOptionId ?? undefined);
      setQDifficulty(builder.qDifficulty ?? 'MEDIUM');
      setQTimeLimit(builder.qTimeLimit ?? 60);
      setMediaUrl(builder.mediaUrl ?? undefined);
      setAudioUrl(builder.audioUrl ?? undefined);
      setShowUploadType(builder.showUploadType ?? null);
      const restoredReview = Array.isArray(builder.aiReviewQuestions)
        ? builder.aiReviewQuestions.map((question: AIQuestionReviewItem) => toAIReviewQuestion(question))
        : [];
      setAiReviewQuestions(restoredReview);
      setAiReviewModelUsed(builder.aiReviewModelUsed ?? '');
      setAiReviewOpen(restoredReview.length > 0);
    };

    const applyLocalSnapshot = (snapshot: any) => {
      if (!snapshot) return;
      setQuizTitle(snapshot.quizTitle ?? '');
      setQuizDescription(snapshot.quizDescription ?? '');
      setQuizSubject(snapshot.quizSubject ?? 'Science');
      setQuizDifficulty(snapshot.quizDifficulty ?? 'Medium');
      setIsPublic(snapshot.isPublic ?? false);
      setShuffleOptions(snapshot.shuffleOptions ?? true);
      if (Array.isArray(snapshot.questions)) setQuestions(snapshot.questions);
      applyBuilderState(snapshot.builderState);
    };

    const bootstrap = async () => {
      try {
        let response = null;
        if (quizRawId) {
          response = await quizService.getEditorQuiz(quizRawId);
        } else {
          try {
            // Lookup is intentionally read-only. Opening Create Quiz must not
            // create an empty database record.
            response = await quizService.getDraftByClientId(draftClientIdRef.current);
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) throw error;
          }
        }
        if (cancelled) return;

        if (response) {
          serverQuizIdRef.current = String(response.quiz.id);
          quizVersionRef.current = response.quiz.version || 1;
          setQuizTitle(response.quiz.title || '');
          setQuizDescription(response.quiz.description || '');
          setQuizSubject(response.quiz.subject || 'Science');
          setQuizDifficulty(response.quiz.difficulty || 'Medium');
          setIsPublic(response.quiz.is_public ?? false);
          setShuffleOptions(response.quiz.shuffle_options ?? true);
          setQuestions((response.questions || []).map(mapServerQuestion));
          applyBuilderState(response.builder_state);
        }

        try {
          const localRaw = localStorage.getItem(draftStorageKey);
          const localSnapshot = localRaw ? JSON.parse(localRaw) : null;
          const rawUpdatedAt = response?.quiz.updated_at || '';
          const serverTimestamp = response ? Date.parse(
            rawUpdatedAt && !/[zZ]|[+-]\d\d:\d\d$/.test(rawUpdatedAt) ? `${rawUpdatedAt}Z` : rawUpdatedAt,
          ) || 0 : 0;
          if (localSnapshot?.timestamp > serverTimestamp) {
            applyLocalSnapshot(localSnapshot);
            skipNextServerAutosaveRef.current = false;
          }
        } catch (error) {
          console.warn('Unable to read local crash-recovery snapshot:', error);
        }

        // A fresh editor stays entirely client-side until meaningful content
        // triggers autosave or an explicit save/publish action.
        if (!response) skipNextServerAutosaveRef.current = false;
        setAutoSaveStatus(response ? 'saved' : 'idle');
        setIsEditorReady(true);
        isInitialMount.current = false;
      } catch (error: any) {
        if (cancelled) return;
        console.error('Failed to initialize quiz editor', error);
        setAlertState({
          isOpen: true,
          title: 'Error Loading Quiz',
          message: error?.message || 'Could not load the complete quiz snapshot.',
          type: 'error',
        });
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  }, [draftStorageKey, quizRawId]);

  // Debounced Auto-Save Draft to LocalStorage whenever anything changes
  useEffect(() => {
    if (isInitialMount.current || !isEditorReady) {
      return;
    }

    setHasUnsavedChanges(true);
    setAutoSaveStatus('saving');

    const timer = setTimeout(() => {
      try {
        if (quizTitle.trim() || questions.length > 0 || quizDescription.trim() || qText.trim() || aiReviewQuestions.length > 0) {
          const payload = {
            quizTitle,
            quizDescription,
            quizSubject,
            quizDifficulty,
            isPublic,
            shuffleOptions,
            questions,
            builderState: {
              editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
              tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty,
              qTimeLimit, mediaUrl, audioUrl, showUploadType,
              aiReviewQuestions, aiReviewModelUsed,
            },
            timestamp: Date.now()
          };
          localStorage.setItem(draftStorageKey, JSON.stringify(payload));
          setAutoSaveStatus('saved');
          setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } else {
          setAutoSaveStatus('idle');
        }
      } catch (err) {
        console.warn('Failed to auto-save draft to localStorage:', err);
        setAutoSaveStatus('idle');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [quizTitle, quizDescription, quizSubject, quizDifficulty, isPublic, shuffleOptions,
    questions, editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
    tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty, qTimeLimit,
    mediaUrl, audioUrl, showUploadType, aiReviewQuestions, aiReviewModelUsed,
    draftStorageKey, isEditorReady]);

  // Auto-save immediately when switching browser tabs, minimizing window or page hiding
  useEffect(() => {
    const handleTabOrVisibilityChange = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        if (quizTitle.trim() || questions.length > 0 || quizDescription.trim() || qText.trim() || aiReviewQuestions.length > 0) {
          const payload = {
            quizTitle,
            quizDescription,
            quizSubject,
            quizDifficulty,
            isPublic,
            shuffleOptions,
            questions,
            builderState: {
              editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
              tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty,
              qTimeLimit, mediaUrl, audioUrl, showUploadType,
              aiReviewQuestions, aiReviewModelUsed,
            },
            timestamp: Date.now()
          };
          localStorage.setItem(draftStorageKey, JSON.stringify(payload));
          setAutoSaveStatus('saved');
          setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    };

    document.addEventListener('visibilitychange', handleTabOrVisibilityChange);
    window.addEventListener('pagehide', handleTabOrVisibilityChange);
    window.addEventListener('blur', handleTabOrVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleTabOrVisibilityChange);
      window.removeEventListener('pagehide', handleTabOrVisibilityChange);
      window.removeEventListener('blur', handleTabOrVisibilityChange);
    };
  }, [quizTitle, quizDescription, quizSubject, quizDifficulty, isPublic, shuffleOptions,
    questions, editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
    tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty, qTimeLimit,
    mediaUrl, audioUrl, showUploadType, aiReviewQuestions, aiReviewModelUsed,
    draftStorageKey]);

  // Browser beforeunload protection against accidental tab close or page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (quizTitle.trim() || questions.length > 0 || qText.trim() || aiReviewQuestions.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, quizTitle, questions, qText, aiReviewQuestions]);

  const handleStartBuild = (type: QuestionType) => {
    setEditingType(type);
    setQText('');
    setMcOptions(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    setMcOptionIds([undefined, undefined, undefined, undefined]);
    setMcCorrect(0);
    setTfCorrect(true);
    setTfOptionIds([undefined, undefined]);
    setShortCorrect('');
    setShortOptionId(undefined);
    setQDifficulty('MEDIUM');
    setQTimeLimit(60);
    setMediaUrl(undefined);
    setAudioUrl(undefined);
    setMediaFile(null);
    setAudioFile(null);
    setShowUploadType(null);
    setEditingId(null);
    setFormResetKey(prev => prev + 1);
    
    // Scroll to top of the builder area
    setTimeout(() => {
      const container = document.getElementById('main-builder-area');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingType(q.type);
    setQText(q.text);
    setQDifficulty(q.difficulty);
    setQTimeLimit(q.timeLimit);
    setMediaUrl(q.mediaUrl);
    setAudioUrl(q.audioUrl);
    setMediaFile(null);
    setAudioFile(null);
    setShowUploadType(null);
    setEditingId(q.id);
    setFormResetKey(prev => prev + 1);
    if (q.type === 'multiple') {
      setMcOptions(q.options);
      setMcOptionIds(q.optionIds || []);
      setMcCorrect(q.correctAnswer);
    } else if (q.type === 'truefalse') {
      setTfCorrect(q.correctAnswer);
      setTfOptionIds(q.optionIds || [undefined, undefined]);
    } else if (q.type === 'short') {
      setShortCorrect(q.correctAnswer);
      setShortOptionId(q.optionIds?.[0]);
    }
    
    // Scroll to top of the builder area
    setTimeout(() => {
      const container = document.getElementById('main-builder-area');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const handleDuplicateQuestion = (q: Question) => {
    // Determine the base text and the next copy number
    const baseText = q.text.replace(/\s*\(Copy( \d+)?\)$/, '');
    let maxCopyNum = 0;
    
    questions.forEach(item => {
      if (item.text === baseText) {
        maxCopyNum = Math.max(maxCopyNum, 0);
      } else if (item.text.startsWith(baseText + ' (Copy ')) {
        const suffix = item.text.substring((baseText + ' (Copy ').length);
        const numMatch = suffix.match(/^(\d+)\)$/);
        if (numMatch) {
          maxCopyNum = Math.max(maxCopyNum, parseInt(numMatch[1], 10));
        }
      }
    });
    
    const newText = `${baseText} (Copy ${maxCopyNum + 1})`;

    setEditingType(q.type);
    setQText(newText);
    setQDifficulty(q.difficulty);
    setQTimeLimit(q.timeLimit);
    setMediaUrl(q.mediaUrl);
    setAudioUrl(q.audioUrl);
    setMediaFile(null);
    setAudioFile(null);
    setEditingId(null);
    setFormResetKey(prev => prev + 1);
    
    if (q.type === 'multiple') {
      setMcOptions([...q.options]);
      setMcOptionIds([]);
      setMcCorrect(q.correctAnswer);
    } else if (q.type === 'truefalse') {
      setTfCorrect(q.correctAnswer);
      setTfOptionIds([undefined, undefined]);
    } else if (q.type === 'short') {
      setShortCorrect(q.correctAnswer);
      setShortOptionId(undefined);
    }
    
    // Scroll to top of the builder area
    setTimeout(() => {
      const container = document.getElementById('main-builder-area');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const handleSaveQuestion = async (nextType: QuestionType | null = null) => {
    if (!qText.trim()) return;

    let finalMediaUrl = mediaUrl;
    let finalAudioUrl = audioUrl;

    if (mediaFile) {
      const url = await uploadMedia(mediaFile);
      if (!url) {
        toast.error('Image or video upload failed. Retry the upload before saving this question.');
        return;
      }
      // If there was an old URL and it was uploaded during this draft session, delete it to prevent orphaned assets
      if (mediaUrl && mediaUrl !== url && draftUploadedUrls.has(mediaUrl)) {
        const isReferenced = questions.some(q => q.id !== editingId && (q.mediaUrl === mediaUrl || q.audioUrl === mediaUrl));
        if (!isReferenced) {
          void deleteMediaFile(mediaUrl);
          setDraftUploadedUrls(prev => {
            const newSet = new Set(prev);
            newSet.delete(mediaUrl);
            return newSet;
          });
        }
      }
      finalMediaUrl = url;
      setDraftUploadedUrls(prev => new Set(prev).add(url));
    }

    if (audioFile) {
      const url = await uploadAudio(audioFile);
      if (!url) {
        toast.error('Audio upload failed. Retry the upload before saving this question.');
        return;
      }
      if (audioUrl && audioUrl !== url && draftUploadedUrls.has(audioUrl)) {
        const isReferenced = questions.some(q => q.id !== editingId && (q.mediaUrl === audioUrl || q.audioUrl === audioUrl));
        if (!isReferenced) {
          void deleteAudioFile(audioUrl);
          setDraftUploadedUrls(prev => {
            const newSet = new Set(prev);
            newSet.delete(audioUrl);
            return newSet;
          });
        }
      }
      finalAudioUrl = url;
      setDraftUploadedUrls(prev => new Set(prev).add(url));
    }

    let newQ: Question;
    const baseQ = {
      id: (editingId !== null && editingId !== undefined) ? String(editingId) : `q_${Date.now()}`,
      text: qText,
      difficulty: qDifficulty,
      timeLimit: qTimeLimit,
      mediaUrl: finalMediaUrl,
      audioUrl: finalAudioUrl,
    };

    if (editingType === 'multiple') {
      newQ = { ...baseQ, type: 'multiple', options: mcOptions, correctAnswer: mcCorrect, optionIds: mcOptionIds as number[] };
    } else if (editingType === 'truefalse') {
      newQ = { ...baseQ, type: 'truefalse', correctAnswer: tfCorrect, optionIds: tfOptionIds as number[] };
    } else {
      newQ = { ...baseQ, type: 'short', correctAnswer: shortCorrect, optionIds: shortOptionId ? [shortOptionId] : [] };
    }

    if (editingId !== null && editingId !== undefined) {
      const previousQuestion = questions.find(q => String(q.id) === String(editingId));
      saveAfterQuestionRef.current = Boolean(
        previousQuestion
        && (previousQuestion.mediaUrl !== finalMediaUrl || previousQuestion.audioUrl !== finalAudioUrl),
      );
      setQuestions(prev => {
        const hasMatch = prev.some(q => String(q.id) === String(editingId));
        if (!hasMatch) {
           console.warn(`[QuizCreator] Cannot find question ID ${editingId} in questions array. Existing IDs: ${prev.map(q => q.id).join(", ")}`);
        }
        return prev.map(q => String(q.id) === String(editingId) ? newQ : q);
      });
    } else {
      setQuestions(prev => [...prev, newQ]);
    }

    if (nextType) {
      handleStartBuild(nextType);
    } else {
      setEditingType(null);
      setEditingId(null);
    }
    setMediaFile(null);
    setAudioFile(null);
    setMediaUrl(undefined);
    setAudioUrl(undefined);
    setFormResetKey(prev => prev + 1);
    imageUploadRef.current?.reset();
    audioUploadRef.current?.reset();
  };

  const handleDeleteClick = (id: string) => {
    setQuestionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      const qToDelete = questions.find(q => q.id === questionToDelete);
      if (qToDelete) {
        // Add to deleted blacklist to prevent AI from re-generating this question
        if (qToDelete.text && qToDelete.text.trim()) {
          setDeletedBlacklist(prev => [...prev, qToDelete.text.trim()]);
        }

        if (qToDelete.mediaUrl && draftUploadedUrls.has(qToDelete.mediaUrl)) {
          const isReferenced = questions.some(q => q.id !== questionToDelete && (q.mediaUrl === qToDelete.mediaUrl || q.audioUrl === qToDelete.mediaUrl));
          if (!isReferenced) {
            deleteMediaFile(qToDelete.mediaUrl);
            setDraftUploadedUrls(prev => {
              const newSet = new Set(prev);
              newSet.delete(qToDelete.mediaUrl!);
              return newSet;
            });
          }
        }
        if (qToDelete.audioUrl && draftUploadedUrls.has(qToDelete.audioUrl)) {
          const isReferenced = questions.some(q => q.id !== questionToDelete && (q.mediaUrl === qToDelete.audioUrl || q.audioUrl === qToDelete.audioUrl));
          if (!isReferenced) {
            deleteAudioFile(qToDelete.audioUrl);
            setDraftUploadedUrls(prev => {
              const newSet = new Set(prev);
              newSet.delete(qToDelete.audioUrl!);
              return newSet;
            });
          }
        }
      }
      setQuestions(prev => prev.filter(q => q.id !== questionToDelete));
      setQuestionToDelete(null);
    }
  };

  const saveQuizAndQuestions = async (
    status: string,
    shouldExit: boolean = true,
    silent: boolean = false,
  ): Promise<boolean> => {
    if (saveOperationRef.current) {
      queuedSaveRef.current = true;
      const previousResult = await saveOperationRef.current;
      if (!previousResult) return false;
      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        return saveQuizAndQuestions(status, shouldExit, silent);
      }
      return true;
    }

    const operation = (async (): Promise<boolean> => {
      if (!isEditorReady && !serverQuizIdRef.current) return false;
      if (status !== 'Published' && questions.length === 0 && !quizTitle.trim() && !qText.trim() && aiReviewQuestions.length === 0) {
        // An empty Draft can be closed without creating a server record.
        if (shouldExit) onCancel();
        return true;
      }

      setIsSaving(true);
      setAutoSaveStatus('saving');

      const questionSnapshot = questions.map(toDraftQuestionSnapshot);

      const builderState = {
        editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
        tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty,
        qTimeLimit, mediaUrl, audioUrl, showUploadType,
        aiReviewQuestions, aiReviewModelUsed,
      };

      try {
        if (!serverQuizIdRef.current) {
          const created = await quizService.createOrResumeDraft(draftClientIdRef.current);
          serverQuizIdRef.current = String(created.quiz.id);
          quizVersionRef.current = created.quiz.version;
        }

        const saved = await quizService.saveDraft(serverQuizIdRef.current, {
          expected_version: quizVersionRef.current,
          complete_snapshot: true,
          expected_question_count: questionSnapshot.length,
          title: quizTitle,
          description: quizDescription,
          subject: quizSubject,
          difficulty: quizDifficulty,
          is_public: isPublic,
          shuffle_options: shuffleOptions,
          builder_state: builderState,
          questions: questionSnapshot,
        });
        quizVersionRef.current = saved.quiz.version;

        // Preserve any keystrokes made while the request was in flight; only
        // merge database identifiers returned for new questions/options.
        setQuestions(current => {
          let identifiersChanged = false;
          const merged = current.map(question => {
          const snapshotIndex = questionSnapshot.findIndex(snapshot =>
            snapshot.id === Number(question.id) || snapshot.client_id === question.id
          );
          if (snapshotIndex < 0) return question;
          const persisted = saved.questions[snapshotIndex];
          if (!persisted) return question;
          const nextId = String(persisted.id);
          const nextOptionIds = (persisted.options || []).map((option: any) => option.id);
          const currentOptionIds = question.optionIds || [];
          if (
            question.id === nextId
            && currentOptionIds.length === nextOptionIds.length
            && currentOptionIds.every((value, index) => value === nextOptionIds[index])
          ) return question;
          identifiersChanged = true;
          return {
            ...question,
            id: nextId,
            optionIds: nextOptionIds,
          } as Question;
          });
          return identifiersChanged ? merged : current;
        });

        if (status === 'Published') {
          const published = await quizService.publishQuiz(
            serverQuizIdRef.current,
            quizVersionRef.current,
          );
          quizVersionRef.current = published.quiz.version;
          if (!quizRawId) localStorage.removeItem(activeDraftPointerKey);
          localStorage.removeItem(draftStorageKey);
        } else {
          localStorage.removeItem(draftStorageKey);
        }

        setDraftUploadedUrls(new Set());
        setHasUnsavedChanges(false);
        setAutoSaveStatus('saved');
        setLastAutoSaveTime(new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }));

        if (shouldExit) {
          setAlertState({
            isOpen: true,
            title: status === 'Published' ? 'Quiz Published!' : 'Draft Saved',
            message: status === 'Published'
              ? 'Your quiz passed validation and is now published.'
              : 'Your complete draft was saved atomically to the server.',
            type: 'success',
          });
          setTimeout(onCancel, 700);
        } else if (!silent && status === 'Published') {
          toast.success('Quiz published!');
        }
        return true;
      } catch (error: any) {
        console.error('Failed to save quiz snapshot', error);
        setAutoSaveStatus('idle');
        const detail = error instanceof ApiError ? error.details as any : null;
        const validationErrors = Array.isArray(detail?.errors) ? detail.errors.join('\n') : null;
        const conflictMessage = error instanceof ApiError && error.code === 'QUIZ_VERSION_CONFLICT'
          ? 'A newer version exists on the server. Reload the editor before continuing.'
          : null;
        if (!silent || error instanceof ApiError && error.status === 409) {
          setAlertState({
            isOpen: true,
            title: conflictMessage ? 'Draft Conflict' : 'Unable to Save Quiz',
            message: validationErrors || conflictMessage || error?.message || 'Failed to save quiz.',
            type: 'error',
          });
        }
        return false;
      } finally {
        setIsSaving(false);
      }
    })();

    saveOperationRef.current = operation;
    try {
      return await operation;
    } finally {
      if (saveOperationRef.current === operation) saveOperationRef.current = null;
    }
  };

  // AdminLayout requests this save before routing away through the sidebar or
  // header. The route change only proceeds after the Draft is stored on server.
  useEffect(() => {
    saveQuizRef.current = saveQuizAndQuestions;
  });

  useEffect(() => {
    if (!saveAfterQuestionRef.current) return;
    saveAfterQuestionRef.current = false;
    void saveQuizRef.current('Draft', false, true);
  }, [questions]);

  // Persist to the server after a short idle window. LocalStorage remains the
  // immediate crash journal; the server snapshot is the cross-device source of truth.
  useEffect(() => {
    if (!isEditorReady || isInitialMount.current) return;
    if (skipNextServerAutosaveRef.current) {
      skipNextServerAutosaveRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveQuizRef.current('Draft', false, true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [quizTitle, quizDescription, quizSubject, quizDifficulty, isPublic, shuffleOptions,
    questions, editingType, editingId, qText, mcOptions, mcOptionIds, mcCorrect,
    tfCorrect, tfOptionIds, shortCorrect, shortOptionId, qDifficulty, qTimeLimit,
    mediaUrl, audioUrl, showUploadType, aiReviewQuestions, aiReviewModelUsed,
    isEditorReady]);

  useEffect(() => {
    const handleSaveBeforeNavigation = async (event: Event) => {
      const { onSaved } = (event as CustomEvent<{ onSaved?: () => void }>).detail || {};
      const saved = await saveQuizRef.current('Draft', false);
      if (saved) onSaved?.();
    };

    window.addEventListener('quizzapp:save-quiz-draft', handleSaveBeforeNavigation);
    return () => window.removeEventListener('quizzapp:save-quiz-draft', handleSaveBeforeNavigation);
  }, []);

  const handlePublishClick = () => {
    setPublishConfirmOpen(true);
  };

  const confirmPublish = () => {
    setPublishConfirmOpen(false);
    void saveQuizAndQuestions('Published', true);
  };

  const handleCancelClick = () => {
    if (quizTitle.trim() || questions.length > 0 || qText.trim() || aiReviewQuestions.length > 0) {
      // Directly auto-save to Database as Draft and exit smoothly
      saveQuizAndQuestions('Draft', true);
    } else {
      onCancel();
    }
  };

  const updateMcOption = (index: number, val: string) => {
    const newOpts = [...mcOptions];
    newOpts[index] = val;
    setMcOptions(newOpts);
  };

  const addMcOption = () => {
    if (mcOptions.length >= 8) return;
    setMcOptions([...mcOptions, `Option ${mcOptions.length + 1}`]);
    setMcOptionIds([...mcOptionIds, undefined]);
  };

  const removeMcOption = (index: number) => {
    if (mcOptions.length <= 2) return;
    const newOpts = mcOptions.filter((_, i) => i !== index);
    setMcOptions(newOpts);
    
    const newIds = mcOptionIds.filter((_, i) => i !== index);
    setMcOptionIds(newIds);
    
    if (mcCorrect === index) setMcCorrect(0);
    else if (mcCorrect > index) setMcCorrect(mcCorrect - 1);
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] w-full flex flex-col overflow-hidden bg-surface-container-lowest text-on-surface">
      <QuizCreatorHeader
        autoSaveStatus={autoSaveStatus}
        lastAutoSaveTime={lastAutoSaveTime}
        isBusy={isSaving || isUploadingMedia || isUploadingAudio}
        isPublishing={isSaving}
        onClose={handleCancelClick}
        onPublish={handlePublishClick}
      />

      {/* Mobile Tabs */}
      <div className="flex md:hidden p-3 bg-surface-container-lowest border-b border-outline-variant/50 shrink-0 shadow-sm relative z-10 justify-center">
        <div className="flex w-full max-w-sm bg-surface-container-low p-1 rounded-xl">
          <button 
            onClick={() => setMobileTab('build')}
            className={`flex-1 py-2 text-[13px] font-bold text-center rounded-lg transition-all duration-300 ${mobileTab === 'build' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Build Questions
          </button>
          <button 
            onClick={() => setMobileTab('settings')}
            className={`flex-1 py-2 text-[13px] font-bold text-center rounded-lg transition-all duration-300 ${mobileTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Quiz Settings
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <QuizSettingsPanel
          visibleOnMobile={mobileTab === 'settings'}
          title={quizTitle}
          description={quizDescription}
          subject={quizSubject}
          difficulty={quizDifficulty}
          isPublic={isPublic}
          shuffleOptions={shuffleOptions}
          onTitleChange={setQuizTitle}
          onDescriptionChange={setQuizDescription}
          onSubjectChange={setQuizSubject}
          onDifficultyChange={setQuizDifficulty}
          onPublicChange={setIsPublic}
          onShuffleOptionsChange={setShuffleOptions}
        />

        {/* Main Builder Area */}
        {/* Right Content */}
        <section className={`${mobileTab === 'build' ? 'block' : 'hidden'} md:block flex-1 min-h-0 overflow-y-auto overscroll-none bg-surface-container-lowest p-4 md:p-8 relative animate-in slide-in-from-left-4 md:animate-none`} id="main-builder-area">
          
          {!editingType && (
            <QuestionStartPanel
              aiPrompt={quickAIPrompt}
              onAIPromptChange={setQuickAIPrompt}
              onOpenAI={() => setAiModalOpen(true)}
              onStartBuild={handleStartBuild}
              onOpenQuestionBank={() => setBankModalOpen(true)}
            />
          )}

          {editingType && (
            <QuestionEditor
              type={editingType}
              text={qText}
              multipleChoiceOptions={mcOptions}
              multipleChoiceCorrect={mcCorrect}
              trueFalseCorrect={tfCorrect}
              shortAnswer={shortCorrect}
              difficulty={qDifficulty}
              timeLimit={qTimeLimit}
              mediaUrl={mediaUrl}
              audioUrl={audioUrl}
              mediaFile={mediaFile}
              audioFile={audioFile}
              resetKey={formResetKey}
              imageUploadRef={imageUploadRef}
              audioUploadRef={audioUploadRef}
              isUploading={isUploadingMedia || isUploadingAudio}
              onTypeChange={setEditingType}
              onTextChange={setQText}
              onMultipleChoiceCorrectChange={setMcCorrect}
              onMultipleChoiceOptionChange={updateMcOption}
              onRemoveMultipleChoiceOption={removeMcOption}
              onAddMultipleChoiceOption={addMcOption}
              onTrueFalseCorrectChange={setTfCorrect}
              onShortAnswerChange={setShortCorrect}
              onDifficultyChange={setQDifficulty}
              onTimeLimitChange={setQTimeLimit}
              onImageSelect={async file => {
                if (!file) {
                  setMediaUrl(undefined);
                  setMediaFile(null);
                  return;
                }
                setMediaFile(file);
                const uploaded = await uploadMedia(file);
                if (uploaded) {
                  setMediaUrl(uploaded);
                  setDraftUploadedUrls(previous => new Set(previous).add(uploaded));
                  setMediaFile(null);
                } else {
                  toast.error('Image or video upload failed. Please retry before saving.');
                }
              }}
              onAudioSelect={async file => {
                if (!file) {
                  setAudioUrl(undefined);
                  setAudioFile(null);
                  return;
                }
                setAudioFile(file);
                const uploaded = await uploadAudio(file);
                if (uploaded) {
                  setAudioUrl(uploaded);
                  setDraftUploadedUrls(previous => new Set(previous).add(uploaded));
                  setAudioFile(null);
                } else {
                  toast.error('Audio upload failed. Please retry before saving.');
                }
              }}
              onClose={() => {
                setEditingType(null);
                setEditingId(null);
              }}
              onSave={nextType => handleSaveQuestion(nextType)}
            />
          )}

          <QuestionList
            questions={questions}
            onEdit={handleEditQuestion}
            onDuplicate={handleDuplicateQuestion}
            onDelete={handleDeleteClick}
          />


        </section>
      </main>

      <QuizCreatorDialogs
        deleteConfirmOpen={deleteConfirmOpen}
        publishConfirmOpen={publishConfirmOpen}
        bankModalOpen={bankModalOpen}
        aiReviewOpen={aiReviewOpen}
        aiModalOpen={aiModalOpen}
        alertState={alertState}
        questions={questions}
        aiReviewQuestions={aiReviewQuestions}
        aiReviewModelUsed={aiReviewModelUsed}
        deletedBlacklist={deletedBlacklist}
        quickAIPrompt={quickAIPrompt}
        onCloseDelete={() => setDeleteConfirmOpen(false)}
        onConfirmDelete={confirmDeleteQuestion}
        onClosePublish={() => setPublishConfirmOpen(false)}
        onConfirmPublish={confirmPublish}
        onCloseBank={() => setBankModalOpen(false)}
        onAddBankQuestions={newQuestions => {
          setQuestions(current => [...current, ...newQuestions]);
          setAlertState({
            isOpen: true,
            title: 'Questions Added',
            message: `Successfully added ${newQuestions.length} question(s) from the bank.`,
            type: 'success',
          });
        }}
        onCloseAlert={() => setAlertState(previous => ({ ...previous, isOpen: false }))}
        onReviewChange={setAiReviewQuestions}
        onReviewCancel={handleAIReviewCancel}
        onReviewImport={handleAIReviewImport}
        onCloseAI={() => setAiModalOpen(false)}
        onStartAIGeneration={handleStartAIGeneration}
      />
    </div>
  );
}
