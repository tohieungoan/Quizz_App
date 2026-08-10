import { ArrowLeft, Wrench, X, List, CheckSquare, AlignLeft, Sparkles, ArrowRight, Check, Plus, Trash2, Edit2, Image as ImageIcon, Mic, UploadCloud, GripVertical, CopyPlus, ChevronDown, Bot, Save, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { Dropdown } from '@/components/ui/Dropdown';
import { QuestionBankModal } from '@/components/ui/QuestionBankModal';
import { AIQuizModal } from '@/components/ui/AIQuizModal';
import { AIQuestionItem } from '@/types/aiQuiz';
import { useAIQuiz } from '@/contexts/AIQuizContext';
import { CloudUpload, CloudUploadRef } from '@/components/ui/CloudUpload';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';

export type QuestionType = 'multiple' | 'truefalse' | 'short';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  mediaUrl?: string;
  audioUrl?: string;
  optionIds?: number[];
  isAIGenerated?: boolean;
  source?: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple';
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'truefalse';
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short';
  correctAnswer: string;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

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
  const [isPublic, setIsPublic] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-Save Draft & Crash Recovery State
  const quizRawId = (id || initialData?.id || '').replace('QZ-', '');
  const draftStorageKey = quizRawId ? `quizz_creator_draft_edit_${quizRawId}` : 'quizz_creator_draft_new';
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recoveredDraftModalOpen, setRecoveredDraftModalOpen] = useState(false);
  const [recoveredDraftData, setRecoveredDraftData] = useState<any>(null);
  const isInitialMount = useRef(true);
  const saveQuizRef = useRef<(status: string, shouldExit?: boolean) => Promise<boolean>>(async () => false);

  // Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [quickAIPrompt, setQuickAIPrompt] = useState('');
  const [deletedBlacklist, setDeletedBlacklist] = useState<string[]>([]);
  const [highlightedQuestionIds, setHighlightedQuestionIds] = useState<Set<string>>(new Set());

  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [formResetKey, setFormResetKey] = useState(0);

  // Global Background AI Generation Integration
  const { startGeneration, unconsumedQuestions, consumeQuestions } = useAIQuiz();

  // Handle direct injection of AI-generated questions
  const handleAIGenerateSuccess = (generatedQuestions: AIQuestionItem[], modelUsed: string) => {
    const newQuestions: Question[] = generatedQuestions.map((item, idx) => {
      const uniqueId = `q_ai_${Date.now()}_${idx}`;
      const base = {
        id: uniqueId,
        text: item.content,
        difficulty: (item.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
        timeLimit: item.time_limit || 60,
        isAIGenerated: true,
        source: item.source,
        explanation: item.explanation,
      };

      if (item.type === 'truefalse') {
        const tfAns = item.options.find(o => o.content.toLowerCase() === 'true')?.is_correct ?? true;
        return {
          ...base,
          type: 'truefalse' as const,
          correctAnswer: tfAns,
        };
      } else if (item.type === 'short') {
        const shortAns = item.keyword || item.options[0]?.content || 'Answer';
        return {
          ...base,
          type: 'short' as const,
          correctAnswer: shortAns,
        };
      } else {
        // Multiple choice
        const optionsText = item.options.map(o => o.content);
        let correctIdx = item.options.findIndex(o => o.is_correct);
        if (correctIdx < 0) correctIdx = 0;

        return {
          ...base,
          type: 'multiple' as const,
          options: optionsText.length >= 2 ? optionsText : [...optionsText, 'Additional Option'],
          correctAnswer: correctIdx,
        };
      }
    });

    setQuestions(prev => [...prev, ...newQuestions]);
    
    // Highlight new questions
    const newIds = new Set(newQuestions.map(q => q.id));
    setHighlightedQuestionIds(newIds);
    setTimeout(() => setHighlightedQuestionIds(new Set()), 5000);

    setQuickAIPrompt('');
    setAlertState({
      isOpen: true,
      title: 'AI Generation Complete! 🎉',
      message: `Successfully generated and added ${newQuestions.length} standard questions (${modelUsed}) to your quiz list.`,
      type: 'success'
    });

    // Smooth scroll down to questions list
    setTimeout(() => {
      document.getElementById('questions-list-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Consume any newly generated AI questions automatically
  useEffect(() => {
    if (unconsumedQuestions) {
      const data = consumeQuestions();
      if (data && data.questions.length > 0) {
        handleAIGenerateSuccess(data.questions, data.modelUsed);
      }
    }
  }, [unconsumedQuestions]);

  const handleStartAIGeneration = (formData: FormData, count: number) => {
    startGeneration(formData, count, window.location.pathname);
  };

  // Load existing questions and quiz info if editing
  useEffect(() => {
    const loadExistingData = async () => {
      const quizId = id || initialData?.id;
      if (quizId && quizId.startsWith('QZ-')) {
        const rawId = quizId.replace('QZ-', '');
        if (!isNaN(Number(rawId))) {
          try {
            // 1. Fetch Quiz Info
            try {
              const fetchedQuiz = await quizService.getQuiz(rawId);
              if (fetchedQuiz) {
                setQuizTitle(fetchedQuiz.title || '');
                setQuizDescription(fetchedQuiz.description || '');
                setQuizSubject(fetchedQuiz.subject || '');
                setQuizDifficulty(fetchedQuiz.difficulty || 'Medium');
                setIsPublic(fetchedQuiz.is_public ?? true);
              }
            } catch (err) {
              console.error("Failed to load quiz details", err);
            }

            // 2. Fetch Questions
            const fetchedQuestions = await questionService.getQuestions(rawId);
            const mapped: Question[] = fetchedQuestions.map((q: any) => {
              const typeStr = (q.type || '').toLowerCase();
              let qType: QuestionType = 'multiple';
              
              if (typeStr.includes('true') || typeStr.includes('false')) qType = 'truefalse';
              else if (typeStr.includes('short') || typeStr.includes('fill')) qType = 'short';
              
              const base: BaseQuestion = {
                id: q.id.toString(),
                type: qType,
                text: q.content,
                difficulty: (q.difficulty || 'MEDIUM').toUpperCase() as 'EASY'|'MEDIUM'|'HARD',
                timeLimit: q.time_limit || 60,
                mediaUrl: q.media_url,
                audioUrl: q.audio_url,
              };

              if (qType === 'multiple') {
                const options = (q.options || []).map((o: any) => o.content);
                const correctIndex = (q.options || []).findIndex((o: any) => o.is_correct);
                base.optionIds = (q.options || []).map((o: any) => o.id);
                return {
                  ...base,
                  type: 'multiple',
                  options: options.length > 0 ? options : ['Option 1'],
                  correctAnswer: correctIndex >= 0 ? correctIndex : 0,
                } as MultipleChoiceQuestion;
              } else if (qType === 'truefalse') {
                const correctOption = (q.options || []).find((o: any) => o.is_correct);
                const isTrue = correctOption ? correctOption.content.toLowerCase() === 'true' : true;
                // Make sure we have 2 options ids to match True and False
                const trueOpt = (q.options || []).find((o: any) => o.content.toLowerCase() === 'true');
                const falseOpt = (q.options || []).find((o: any) => o.content.toLowerCase() === 'false');
                base.optionIds = [trueOpt?.id, falseOpt?.id];
                return {
                  ...base,
                  type: 'truefalse',
                  correctAnswer: isTrue,
                } as TrueFalseQuestion;
              } else {
                const correctOption = (q.options || []).find((o: any) => o.is_correct);
                base.optionIds = correctOption ? [correctOption.id] : [];
                return {
                  ...base,
                  type: 'short',
                  correctAnswer: correctOption ? correctOption.content : '',
                } as ShortAnswerQuestion;
              }
            });
            setQuestions(mapped);
          } catch (err) {
            console.error("Failed to load existing questions", err);
            setAlertState({
              isOpen: true,
              title: 'Error Loading Quiz',
              message: 'Could not load quiz data. Please check your connection.',
              type: 'error'
            });
            // Stop loading to prevent accidental saves of empty questions array
            return;
          }
        }
      }
    };
    loadExistingData();
  }, [id, initialData]);

  // Check for recovered unsaved draft from previous crash/session on mount
  useEffect(() => {
    // New quizzes are now persisted as server-side Drafts when leaving the
    // editor. Do not offer recovery of an old local browser draft here.
    if (!quizRawId) {
      localStorage.removeItem(draftStorageKey);
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }

    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.questions?.length > 0 || (parsed.quizTitle && parsed.quizTitle.trim() !== ''))) {
          setRecoveredDraftData(parsed);
          setRecoveredDraftModalOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error reading saved draft:', e);
    } finally {
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [draftStorageKey, quizRawId]);

  // Debounced Auto-Save Draft to LocalStorage whenever anything changes
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    setHasUnsavedChanges(true);
    setAutoSaveStatus('saving');

    const timer = setTimeout(() => {
      try {
        if (quizTitle.trim() || questions.length > 0 || quizDescription.trim()) {
          const payload = {
            quizTitle,
            quizDescription,
            quizSubject,
            quizDifficulty,
            isPublic,
            shuffleOptions,
            questions,
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
  }, [quizTitle, quizDescription, quizSubject, quizDifficulty, isPublic, shuffleOptions, questions, draftStorageKey]);

  // Auto-save immediately when switching browser tabs, minimizing window or page hiding
  useEffect(() => {
    const handleTabOrVisibilityChange = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        if (quizTitle.trim() || questions.length > 0 || quizDescription.trim()) {
          const payload = {
            quizTitle,
            quizDescription,
            quizSubject,
            quizDifficulty,
            isPublic,
            shuffleOptions,
            questions,
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
  }, [quizTitle, quizDescription, quizSubject, quizDifficulty, isPublic, shuffleOptions, questions, draftStorageKey]);

  // Browser beforeunload protection against accidental tab close or page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (quizTitle.trim() || questions.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, quizTitle, questions]);

  const handleRestoreDraft = () => {
    if (recoveredDraftData) {
      if (recoveredDraftData.quizTitle !== undefined) setQuizTitle(recoveredDraftData.quizTitle);
      if (recoveredDraftData.quizDescription !== undefined) setQuizDescription(recoveredDraftData.quizDescription);
      if (recoveredDraftData.quizSubject !== undefined) setQuizSubject(recoveredDraftData.quizSubject);
      if (recoveredDraftData.quizDifficulty !== undefined) setQuizDifficulty(recoveredDraftData.quizDifficulty);
      if (recoveredDraftData.isPublic !== undefined) setIsPublic(recoveredDraftData.isPublic);
      if (recoveredDraftData.shuffleOptions !== undefined) setShuffleOptions(recoveredDraftData.shuffleOptions);
      if (recoveredDraftData.questions && Array.isArray(recoveredDraftData.questions)) {
        setQuestions(recoveredDraftData.questions);
      }
      toast.success('Unsaved draft recovered successfully!');
    }
    setRecoveredDraftModalOpen(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setRecoveredDraftData(null);
    setRecoveredDraftModalOpen(false);
  };

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
      if (url) {
        // If there was an old URL and it was uploaded during this draft session, delete it to prevent orphaned assets
        if (mediaUrl && mediaUrl !== url && draftUploadedUrls.has(mediaUrl)) {
          const isReferenced = questions.some(q => q.id !== editingId && (q.mediaUrl === mediaUrl || q.audioUrl === mediaUrl));
          if (!isReferenced) {
            deleteMediaFile(mediaUrl);
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
    }

    if (audioFile) {
      const url = await uploadAudio(audioFile);
      if (url) {
        if (audioUrl && audioUrl !== url && draftUploadedUrls.has(audioUrl)) {
          const isReferenced = questions.some(q => q.id !== editingId && (q.mediaUrl === audioUrl || q.audioUrl === audioUrl));
          if (!isReferenced) {
            deleteAudioFile(audioUrl);
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

  const saveQuizAndQuestions = async (status: string, shouldExit: boolean = true) => {
    if (questions.length === 0 && quizTitle.trim() === '') {
      if (shouldExit) onCancel();
      return true;
    }
    
    setIsSaving(true);
    try {
      let targetQuizId = '';
      let updatedQuestions = [...questions];
      const isEditMode = !!(id || initialData?.id);
      const rawId = isEditMode ? (id || initialData?.id).replace('QZ-', '') : '';

      // Helper to generate payload
      const generateQuestionPayload = (q: Question) => {
        let optionsPayload: any[] = [];
        let typeStr = 'Multiple Choice';
        
        if (q.type === 'multiple') {
          typeStr = 'Multiple Choice';
          optionsPayload = q.options.map((optText, idx) => ({
            id: q.optionIds?.[idx],
            content: optText,
            is_correct: idx === q.correctAnswer
          }));
        } else if (q.type === 'truefalse') {
          typeStr = 'True/False';
          optionsPayload = [
            { id: q.optionIds?.[0], content: 'True', is_correct: q.correctAnswer === true },
            { id: q.optionIds?.[1], content: 'False', is_correct: q.correctAnswer === false }
          ];
        } else if (q.type === 'short') {
          typeStr = 'Short Answer';
          optionsPayload = [
            { id: q.optionIds?.[0], content: q.correctAnswer, is_correct: true }
          ];
        }
        
        return {
          content: q.text || 'Untitled Question',
          type: typeStr,
          difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase(),
          time_limit: q.timeLimit,
          media_url: q.mediaUrl || null,
          audio_url: q.audioUrl || null,
          options: optionsPayload
        };
      };

      if (isEditMode) {
        targetQuizId = rawId;
        // 1. Update Quiz Shell
        await quizService.updateQuiz(targetQuizId, {
          title: quizTitle.trim() || 'Untitled Quiz',
          description: quizDescription,
          subject: quizSubject,
          difficulty: quizDifficulty,
          is_public: isPublic,
          // Questions cannot be changed after publication. Keep the quiz editable
          // until every question has been persisted, then publish in the final step.
          status: 'Draft'
        });

        // 2. Delete Questions Sequentially
        // Calculate ids locally to avoid re-fetching race condition
        const currentIdsInState = questions.map(q => q.id).filter(qid => !qid.startsWith('q_'));
        // Any ID that was previously loaded but is now missing needs deletion
        const existingQs = await questionService.getQuestions(targetQuizId);
        const existingIdsInDb = existingQs.map(q => q.id.toString());
        const idsToDelete = existingIdsInDb.filter(qid => !currentIdsInState.includes(qid));
        
        for (const qid of idsToDelete) {
          await questionService.deleteQuestion(qid);
        }

        // 3. Update or Create Sequentially to avoid partial failure bugs
        for (let i = 0; i < updatedQuestions.length; i++) {
          const q = updatedQuestions[i];
          const payload = generateQuestionPayload(q);
          if (q.id.startsWith('q_')) {
            const newQ = await questionService.createQuestion(targetQuizId, payload);
            // Properly update state immutably so next save doesn't duplicate on failure
            updatedQuestions[i] = {
              ...q,
              id: newQ.id.toString(),
              optionIds: newQ.options?.map((opt: any) => opt.id)
            };
          } else {
            await questionService.updateQuestion(q.id, payload);
          }
        }
        setQuestions([...updatedQuestions]);

      } else {
        // 1. Create Quiz Shell
        const quizRes = await quizService.createQuiz({
          title: quizTitle.trim() || 'Untitled Quiz',
          description: quizDescription,
          subject: quizSubject,
          difficulty: quizDifficulty,
          is_public: isPublic,
          // Create the quiz as a draft first so the subsequent question-create
          // requests are accepted; publication happens after they all succeed.
          status: 'Draft'
        });
        
        targetQuizId = quizRes.id;
        
        // 2. Create Questions Sequentially
        for (let i = 0; i < updatedQuestions.length; i++) {
          const q = updatedQuestions[i];
          const payload = generateQuestionPayload(q);
          const newQ = await questionService.createQuestion(targetQuizId, payload);
          updatedQuestions[i] = {
            ...q,
            id: newQ.id.toString(),
            optionIds: newQ.options?.map((opt: any) => opt.id)
          };
        }
        setQuestions([...updatedQuestions]);
      }

      // 3. Update to Published if requested
      if (status === 'Published') {
        await quizService.updateQuiz(targetQuizId, { status: 'Published' });
      }
      
      // 4. Cleanup orphaned draft images
      const usedUrls = new Set();
      updatedQuestions.forEach(q => {
        if (q.mediaUrl) usedUrls.add(q.mediaUrl);
        if (q.audioUrl) usedUrls.add(q.audioUrl);
      });
      
      draftUploadedUrls.forEach(url => {
        if (!usedUrls.has(url)) {
          deleteMediaFile(url);
        }
      });
      // Clear draft tracking since they are now safely in the DB
      setDraftUploadedUrls(new Set());

      // Clear local draft from localStorage since DB is up to date
      localStorage.removeItem(draftStorageKey);
      setHasUnsavedChanges(false);
      setAutoSaveStatus('saved');
      setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (shouldExit) {
        setAlertState({
          isOpen: true,
          title: status === 'Published' ? 'Quiz Published!' : 'Draft Saved',
          message: status === 'Published' ? 'Your quiz has been successfully published and is now available.' : 'Your quiz draft has been safely saved to the database.',
          type: 'success'
        });
        
        setTimeout(() => {
          onCancel();
        }, 1200);
      } else {
        toast.success(status === 'Published' ? 'Quiz published!' : 'Draft saved to server successfully!');
      }

      return true;
      
    } catch (error: any) {
      console.error("Failed to save quiz", error);
      setAlertState({
        isOpen: true,
        title: 'Error',
        message: error?.message || 'Failed to save quiz. Please try again.',
        type: 'error'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // AdminLayout requests this save before routing away through the sidebar or
  // header. The route change only proceeds after the Draft is stored on server.
  useEffect(() => {
    saveQuizRef.current = saveQuizAndQuestions;
  });

  useEffect(() => {
    const handleSaveBeforeNavigation = async (event: Event) => {
      if (isSaving) return;
      const { onSaved } = (event as CustomEvent<{ onSaved?: () => void }>).detail || {};
      const saved = await saveQuizRef.current('Draft', false);
      if (saved) onSaved?.();
    };

    window.addEventListener('quizzapp:save-quiz-draft', handleSaveBeforeNavigation);
    return () => window.removeEventListener('quizzapp:save-quiz-draft', handleSaveBeforeNavigation);
  }, [isSaving]);

  const handlePublishClick = () => {
    setPublishConfirmOpen(true);
  };

  const confirmPublish = () => {
    setPublishConfirmOpen(false);
    saveQuizAndQuestions('Published', true);
  };

  const handleCancelClick = () => {
    if (quizTitle.trim() || questions.length > 0) {
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

  const getTypeIcon = (type: QuestionType) => {
    if (type === 'multiple') return <List className="w-5 h-5" />;
    if (type === 'truefalse') return <CheckSquare className="w-5 h-5" />;
    return <AlignLeft className="w-5 h-5" />;
  };

  const getTypeName = (type: QuestionType) => {
    if (type === 'multiple') return 'Multiple Choice';
    if (type === 'truefalse') return 'True / False';
    return 'Short Answer';
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] w-full flex flex-col overflow-hidden bg-surface-container-lowest text-on-surface">
      <header className="h-14 md:h-16 shrink-0 flex items-center justify-between px-3 md:px-6 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={handleCancelClick} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors" title="Back">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm md:font-headline-md text-primary hidden sm:block">Quiz Creator Studio</h1>
            <h1 className="font-headline-sm text-primary sm:hidden">Creator</h1>
            
            {/* Auto-save Status Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-[11px] font-medium text-on-surface-variant transition-all">
              {autoSaveStatus === 'saving' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Saving draft...</span>
                </>
              ) : autoSaveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span>Draft saved {lastAutoSaveTime ? `(${lastAutoSaveTime})` : 'locally'}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-primary/60" />
                  <span>Draft mode</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={handleCancelClick} disabled={isSaving || isUploadingMedia} className="font-button text-xs md:text-button text-on-surface-variant hover:text-on-surface px-2 md:px-3 py-2 transition-colors">
            Close
          </button>

          {/* Publish Button */}
          <button 
            type="button"
            onClick={handlePublishClick} 
            disabled={isSaving || isUploadingMedia} 
            className="font-button text-xs md:text-button bg-primary text-on-primary px-4 md:px-6 py-2 md:py-2.5 rounded-lg hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </header>

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
        {/* Left Sidebar (Settings) */}
        <aside className={`${mobileTab === 'settings' ? 'flex' : 'hidden'} md:flex w-full md:w-80 h-full overflow-y-auto border-r border-outline-variant/50 p-4 md:p-6 flex-col gap-4 md:gap-6 bg-surface-container-low shrink-0 animate-in slide-in-from-right-4 md:animate-none`}>
          <div className="bg-surface-container-lowest rounded-xl p-4 md:p-5 border border-outline-variant/50 shadow-sm flex flex-col gap-4 md:gap-5">
            <h2 className="font-headline-md text-lg">Core Information</h2>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-on-surface-variant text-sm">Quiz Title <span className="text-error">*</span></label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface" 
                value={quizTitle} 
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-on-surface-variant text-sm">Description</label>
              <textarea 
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface min-h-[80px] resize-y" 
                value={quizDescription} 
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Enter quiz description..."
              />
            </div>
            <div className="flex flex-col gap-1.5 z-20">
              <label className="font-label-bold text-on-surface-variant text-sm">Subject <span className="text-error">*</span></label>
              <Dropdown 
                value={quizSubject}
                onChange={setQuizSubject}
                options={["Science", "Physics", "Mathematics", "Biology", "Literature", "History", "Computer Science", "Chemistry"]}
                className="w-full bg-surface-container-low border-outline-variant"
              />
            </div>
            <div className="flex flex-col gap-1.5 z-10">
              <label className="font-label-bold text-on-surface-variant text-sm">Difficulty <span className="text-error">*</span></label>
              <Dropdown 
                value={quizDifficulty}
                onChange={setQuizDifficulty}
                options={["Easy", "Medium", "Hard"]}
                className="w-full bg-surface-container-low border-outline-variant"
              />
            </div>
            
            <div className="h-px w-full bg-outline-variant/50 my-2"></div>
            
            <h3 className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider mb-1">Settings</h3>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="font-label-bold text-on-surface-variant text-sm">Public Access</label>
                <span className="text-xs text-on-surface-variant">Allow anyone to take this quiz</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="font-label-bold text-on-surface-variant text-sm">Shuffle Options</label>
                <span className="text-xs text-on-surface-variant">Randomize answers order</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>


        </aside>

        {/* Main Builder Area */}
        {/* Right Content */}
        <section className={`${mobileTab === 'build' ? 'block' : 'hidden'} md:block flex-1 min-h-0 overflow-y-auto overscroll-none bg-surface-container-lowest p-4 md:p-8 relative animate-in slide-in-from-left-4 md:animate-none`} id="main-builder-area">
          
          {/* Empty State / Type Selection */}
          {!editingType && (
            <div className="max-w-5xl w-full mx-auto">
              
              {/* AI Generator Quick Bar */}
              <div className="rounded-2xl border border-outline-variant/50 bg-white shadow-sm mb-10 overflow-hidden">
                <div className="p-4 md:p-5 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h2 className="font-bold text-sm whitespace-nowrap text-primary">AI Generate</h2>
                  </div>
                  
                  <div className="flex-1 w-full relative">
                    <input 
                      type="text"
                      value={quickAIPrompt}
                      onChange={(e) => setQuickAIPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setAiModalOpen(true);
                        }
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-4 pr-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-on-surface font-medium placeholder:text-slate-400 transition-all"
                      placeholder="E.g., Generate 5 multiple-choice questions on Object-Oriented Programming (OOP)..."
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    <button 
                      onClick={() => setAiModalOpen(true)}
                      className="w-full md:w-auto px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Generate with AI
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Build Your Quiz</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Add questions manually or import them from your question bank.</p>
              </div>

              {/* Manual Creation Section */}
              <div className="mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <button onClick={() => handleStartBuild('multiple')} className="flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl hover:border-primary/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <List className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800 group-hover:text-primary transition-colors tracking-tight">Multiple Choice</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">One correct answer.</p>
                    </div>
                  </button>

                  <button onClick={() => handleStartBuild('truefalse')} className="flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl hover:border-secondary/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800 group-hover:text-secondary transition-colors tracking-tight">True / False</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">Binary choice.</p>
                    </div>
                  </button>

                  <button onClick={() => handleStartBuild('short')} className="flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl hover:border-tertiary-fixed-dim/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-tertiary-fixed-dim/10 to-tertiary-fixed-dim/5 text-tertiary-fixed-dim flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <AlignLeft className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800 group-hover:text-tertiary-fixed-dim transition-colors tracking-tight">Short Answer</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">Exact text match.</p>
                    </div>
                  </button>

                  <button onClick={() => setBankModalOpen(true)} className="flex items-center text-left gap-4 p-4 bg-white border border-outline-variant/40 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CopyPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800 group-hover:text-emerald-600 transition-colors tracking-tight">Question Bank</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight">Add from library.</p>
                    </div>
                  </button>
                </div>
              </div>




            </div>
          )}

          {/* Form Builder */}
          {editingType && (
              <div className="shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                {/* Decorative Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary-fixed-dim"></div>

                <div className="flex flex-col gap-2.5">
                  <label className="font-headline-md text-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">1</span>
                      Question Text <span className="text-error">*</span>
                      
                      <div className="ml-0 sm:ml-4 flex items-center gap-2 border-l border-outline-variant/30 pl-4">
                        <span className="text-xs text-on-surface-variant font-medium">Type:</span>
                        <select 
                          value={editingType || 'multiple'} 
                          onChange={(e) => setEditingType(e.target.value as QuestionType)}
                          className="bg-surface-container-low border border-outline-variant/50 hover:border-outline-variant rounded-md px-3 py-1 text-sm font-medium text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer shadow-sm transition-colors"
                        >
                          <option value="multiple">Multiple Choice</option>
                          <option value="truefalse">True / False</option>
                          <option value="short">Short Answer</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); imageUploadRef.current?.openDialog(); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${mediaUrl || mediaFile ? 'bg-primary/10 border-primary/50 text-primary' : 'border-outline-variant/50 text-on-surface hover:text-primary hover:bg-primary/5'}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Image
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); audioUploadRef.current?.openDialog(); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${audioUrl || audioFile ? 'bg-secondary/10 border-secondary/50 text-secondary' : 'border-outline-variant/50 text-on-surface hover:text-secondary hover:bg-secondary/5'}`}
                      >
                        <Mic className="w-3.5 h-3.5" /> Audio
                      </button>
                    </div>
                  </label>
                  
                  {/* UPLOAD SECTIONS */}
                  <div className="flex flex-col gap-2">
                    <CloudUpload 
                      key={`img-${formResetKey}`}
                      ref={imageUploadRef}
                      hideDropzone={true}
                      acceptedTypes="image/*,video/*"
                      label={(mediaUrl || mediaFile) ? "Change Image or Video" : "Upload Image or Video for this question"}
                      initialPreviewUrl={mediaUrl}
                      file={mediaFile}
                      onFileSelect={(file) => {
                        if (file) setMediaFile(file);
                        else { 
                          setMediaUrl(undefined); 
                          setMediaFile(null); 
                        }
                      }}
                    />

                    <CloudUpload 
                      key={`aud-${formResetKey}`}
                      ref={audioUploadRef}
                      hideDropzone={true}
                      acceptedTypes="audio/*"
                      label={(audioUrl || audioFile) ? "Change Audio" : "Upload Audio for this question"}
                      initialPreviewUrl={audioUrl}
                      file={audioFile}
                      onFileSelect={(file) => {
                        if (file) setAudioFile(file);
                        else { 
                          setAudioUrl(undefined); 
                          setAudioFile(null); 
                        }
                      }}
                    />
                  </div>

                  <textarea 
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    className="w-full border-2 border-outline-variant/50 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-sm text-sm mt-2" 
                    placeholder="Type your question here..." 
                    rows={3}
                  ></textarea>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-headline-md text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">2</span>
                    Answers Configuration
                  </label>
                  
                  {/* MULTIPLE CHOICE UI */}
                  {editingType === 'multiple' && (
                    <div className="flex flex-col gap-2">
                      {mcOptions.map((opt, idx) => (
                        <div key={idx} className={`flex items-center gap-3 bg-surface-container-lowest p-1.5 pr-3 rounded-lg border-2 transition-all ${mcCorrect === idx ? 'border-primary shadow-sm bg-primary/5' : 'border-outline-variant/30 hover:border-outline-variant'}`}>
                          <div 
                            onClick={() => setMcCorrect(idx)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 cursor-pointer transition-colors shrink-0 ${mcCorrect === idx ? 'bg-primary border-primary text-white' : 'border-outline-variant/50 hover:border-outline-variant'}`}
                          >
                            {mcCorrect === idx && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <input 
                            type="text" 
                            value={opt}
                            onChange={e => updateMcOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm outline-none ${mcCorrect === idx ? 'font-medium text-primary' : ''}`} 
                          />
                          <button 
                            onClick={() => removeMcOption(idx)}
                            disabled={mcOptions.length <= 2}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-md disabled:opacity-30 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {mcOptions.length < 8 && (
                        <button onClick={addMcOption} className="mt-1 py-2 border-2 border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors font-button flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Add Option
                        </button>
                      )}
                      {mcOptions.length >= 8 && (
                        <div className="mt-1 text-center text-[11px] text-error font-medium">
                          Maximum limit of 8 options reached.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRUE / FALSE UI */}
                  {editingType === 'truefalse' && (
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <button 
                        onClick={() => setTfCorrect(true)}
                        className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${tfCorrect === true ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${tfCorrect === true ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          <Check className="w-5 h-5" />
                        </div>
                        <span className={`text-lg font-headline-md ${tfCorrect === true ? 'text-primary' : 'text-on-surface-variant'}`}>True</span>
                        {tfCorrect === true && <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full border border-primary/20">Correct</span>}
                      </button>

                      <button 
                        onClick={() => setTfCorrect(false)}
                        className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${tfCorrect === false ? 'border-error bg-error-container/20 ring-2 ring-error/20 shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${tfCorrect === false ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          <X className="w-5 h-5" />
                        </div>
                        <span className={`text-lg font-headline-md ${tfCorrect === false ? 'text-error' : 'text-on-surface-variant'}`}>False</span>
                        {tfCorrect === false && <span className="text-[10px] text-error font-bold uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full border border-error/20">Correct</span>}
                      </button>
                    </div>
                  )}

                  {/* SHORT ANSWER UI */}
                  {editingType === 'short' && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                        <label className="block font-label-bold text-sm text-on-surface-variant mb-1.5">Accepted Answer Keyword(s)</label>
                        <input 
                          type="text"
                          value={shortCorrect}
                          onChange={e => setShortCorrect(e.target.value)}
                          className="w-full bg-white border-2 border-outline-variant/50 rounded-lg px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                          placeholder="e.g. Mitochondria"
                        />
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-headline-md text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">3</span>
                    Question Settings
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-on-surface-variant">Difficulty <span className="text-error">*</span></label>
                      <Dropdown 
                        value={qDifficulty}
                        onChange={(val: any) => setQDifficulty(val)}
                        options={[
                          { value: "EASY", label: "Easy" },
                          { value: "MEDIUM", label: "Medium" },
                          { value: "HARD", label: "Hard" }
                        ]}
                        className="w-full rounded-xl bg-surface border-outline-variant"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-on-surface-variant">Time Limit (seconds) <span className="text-error">*</span></label>
                      <input 
                        type="number" 
                        value={qTimeLimit}
                        onChange={e => setQTimeLimit(Number(e.target.value))}
                        className="w-full bg-white border border-outline-variant/50 rounded-lg px-3 py-2.5 focus:border-primary outline-none text-sm shadow-sm" 
                        placeholder="e.g. 60" 
                        min={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center mt-6 pt-5 border-t border-outline-variant/50">
                  <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); setEditingType(null); setEditingId(null); }}
                      onClick={(e) => { e.preventDefault(); setEditingType(null); setEditingId(null); }}
                      className="font-bold text-sm bg-surface-container-high border border-transparent text-on-surface-variant px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-outline-variant/30 hover:text-on-surface transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" /> Close
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (editingType) handleSaveQuestion(null);
                      }}
                      disabled={!qText.trim() || (editingType === 'short' && !shortCorrect.trim()) || isUploadingMedia || isUploadingAudio}
                      className="font-bold text-sm bg-white border-2 border-primary text-primary px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingMedia || isUploadingAudio ? (
                        <>Uploading...</>
                      ) : (
                        <><Check className="w-4 h-4" /> Save</>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (editingType) handleSaveQuestion(editingType);
                      }}
                      disabled={!qText.trim() || (editingType === 'short' && !shortCorrect.trim()) || isUploadingMedia || isUploadingAudio}
                      className="font-bold text-sm bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 active:bg-primary/80 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingMedia || isUploadingAudio ? (
                        <>Uploading...</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Save & Next</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Questions List Section (Always Visible) */}
          <div id="questions-list-section" className="shrink-0 max-w-5xl mx-auto flex flex-col w-full mt-10 mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Question List ({questions.length})</h3>
              <span className="text-xs text-on-surface-variant">Reorder by dragging rows</span>
            </div>
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-2xl text-on-surface-variant text-sm shadow-sm">
                No questions yet. Start building your quiz manually or use AI to generate them!
              </div>
            ) : (
              <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col mb-10">
                <div className="overflow-x-auto overflow-y-auto max-h-[400px] relative">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-10 bg-surface-container-lowest shadow-sm">
                      <tr className="border-b border-outline-variant/50">
                        <th className="w-10 px-4 py-4"></th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-16 text-center">#</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-36">Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question Text</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Answer Details</th>
                        <th className="px-6 py-4 w-28 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {questions.map((q, idx) => {
                        return (
                          <tr 
                            key={q.id} 
                            className="group hover:bg-surface-bright"
                          >
                            <td className="px-4 py-4 text-on-surface-variant cursor-grab active:cursor-grabbing hover:text-on-surface opacity-30 group-hover:opacity-100 transition-opacity text-center">
                              <GripVertical className="w-4 h-4 mx-auto" />
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">Q{idx + 1}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">{getTypeName(q.type)}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface font-medium">
                              <p className="line-clamp-2 max-w-md group-hover:line-clamp-none transition-all">{q.text || 'Untitled Question'}</p>
                            </td>
                            <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">
                              {q.type === 'multiple' && (
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                                  {q.options.length} Options
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2"></span>
                                  Ans: {String.fromCharCode(65 + q.correctAnswer)}
                                </div>
                              )}
                              {q.type === 'truefalse' && (
                                <div className="flex items-center gap-2">
                                   <span className={`w-1.5 h-1.5 rounded-full ${q.correctAnswer ? 'bg-green-500' : 'bg-error'}`}></span>
                                   Answer: <span className="font-bold text-on-surface">{q.correctAnswer ? 'True' : 'False'}</span>
                                </div>
                              )}
                              {q.type === 'short' && (
                                <div className="flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                                   Keyword: <span className="text-on-surface font-bold truncate max-w-[150px]">{q.correctAnswer || 'None'}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-md transition-colors hover:bg-surface-container" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDuplicateQuestion(q)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-md transition-colors hover:bg-surface-container" title="Duplicate"><CopyPlus className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteClick(q.id)} className="p-1.5 text-on-surface-variant hover:text-error rounded-md transition-colors hover:bg-error-container" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>


        </section>
      </main>

      <ConfirmModal 
        isOpen={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)} 
        onConfirm={confirmDeleteQuestion} 
        title="Delete Question" 
        message="Are you sure you want to delete this question? This action cannot be undone." 
      />

      <ConfirmModal 
        isOpen={recoveredDraftModalOpen} 
        onClose={handleDiscardDraft} 
        onConfirm={handleRestoreDraft} 
        title="Unsaved Draft Recovered" 
        message={`We found an auto-saved draft of "${recoveredDraftData?.quizTitle || 'Untitled Quiz'}" with ${recoveredDraftData?.questions?.length || 0} question(s) from your previous session (e.g. power outage or closed tab). Would you like to restore it?`} 
        confirmText="Restore Draft"
        cancelText="Discard"
        variant="primary"
      />

      <ConfirmModal 
        isOpen={publishConfirmOpen} 
        onClose={() => setPublishConfirmOpen(false)} 
        onConfirm={confirmPublish} 
        title="Publish Quiz" 
        message="Are you ready to publish this quiz? It will become visible to assigned users immediately." 
        confirmText="Publish"
        variant="primary"
      />

      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      <QuestionBankModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        existingQuestionIds={questions.map(q => q.id)}
        onAddQuestions={(newQuestions) => {
          setQuestions([...questions, ...newQuestions]);
          setAlertState({
            isOpen: true,
            title: 'Questions Added',
            message: `Successfully added ${newQuestions.length} question(s) from the bank.`,
            type: 'success'
          });
        }}
      />

      <AIQuizModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onStartGeneration={handleStartAIGeneration}
        existingQuestions={questions.map(q => q.text)}
        deletedBlacklist={deletedBlacklist}
        initialPromptText={quickAIPrompt}
      />
    </div>
  );
}
