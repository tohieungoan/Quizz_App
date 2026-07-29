import { ArrowLeft, Wrench, X, List, CheckSquare, AlignLeft, Sparkles, ArrowRight, Check, Plus, Trash2, Edit2, Image as ImageIcon, Mic, UploadCloud, GripVertical, CopyPlus } from 'lucide-react';
import { useState, useRef } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { QuestionBankModal } from '@/components/ui/QuestionBankModal';
import { CloudUpload, CloudUploadRef } from '@/components/ui/CloudUpload';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { DUMMY_QUIZZES } from '@/data/mockDb';

export type QuestionType = 'multiple' | 'truefalse' | 'short';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  mediaUrl?: string;
  audioUrl?: string;
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingType, setEditingType] = useState<QuestionType | null>(null);
  
  // Builder State
  const [qText, setQText] = useState('');
  const [mcOptions, setMcOptions] = useState(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [mcCorrect, setMcCorrect] = useState(0);
  const [tfCorrect, setTfCorrect] = useState(true);
  const [shortCorrect, setShortCorrect] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'EASY'|'MEDIUM'|'HARD'>('MEDIUM');
  const [qTimeLimit, setQTimeLimit] = useState<number>(60);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

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

  // Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [formResetKey, setFormResetKey] = useState(0);

  const handleStartBuild = (type: QuestionType) => {
    setEditingType(type);
    setQText('');
    setMcOptions(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    setMcCorrect(0);
    setTfCorrect(true);
    setShortCorrect('');
    setQDifficulty('MEDIUM');
    setQTimeLimit(60);
    setMediaUrl(undefined);
    setAudioUrl(undefined);
    setMediaFile(null);
    setAudioFile(null);
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
    setEditingId(q.id);
    setFormResetKey(prev => prev + 1);
    if (q.type === 'multiple') {
      setMcOptions(q.options);
      setMcCorrect(q.correctAnswer);
    } else if (q.type === 'truefalse') {
      setTfCorrect(q.correctAnswer);
    } else if (q.type === 'short') {
      setShortCorrect(q.correctAnswer);
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
      setMcCorrect(q.correctAnswer);
    } else if (q.type === 'truefalse') {
      setTfCorrect(q.correctAnswer);
    } else if (q.type === 'short') {
      setShortCorrect(q.correctAnswer);
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
      id: (editingId !== null && editingId !== undefined) ? String(editingId) : Date.now().toString(),
      text: qText,
      difficulty: qDifficulty,
      timeLimit: qTimeLimit,
      mediaUrl: finalMediaUrl,
      audioUrl: finalAudioUrl,
    };

    if (editingType === 'multiple') {
      newQ = { ...baseQ, type: 'multiple', options: mcOptions, correctAnswer: mcCorrect };
    } else if (editingType === 'truefalse') {
      newQ = { ...baseQ, type: 'truefalse', correctAnswer: tfCorrect };
    } else {
      newQ = { ...baseQ, type: 'short', correctAnswer: shortCorrect };
    }

    if (editingId !== null && editingId !== undefined) {
      const hasMatch = questions.some(q => String(q.id) === String(editingId));
      if (!hasMatch) {
        setAlertState({
          isOpen: true,
          title: "Lỗi đồng bộ",
          message: `Không tìm thấy ID ${editingId} trong danh sách câu hỏi.`,
          type: "error"
        });
      }
      setQuestions(prev => prev.map(q => String(q.id) === String(editingId) ? newQ : q));
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

  const handlePublishClick = () => {
    setPublishConfirmOpen(true);
  };

  const confirmPublish = () => {
    setAlertState({
      isOpen: true,
      title: 'Quiz Published!',
      message: 'Your quiz has been successfully published and is now available.',
      type: 'success'
    });
    // Wait for a bit before navigating away
    setTimeout(() => {
      onCancel(); // Use existing exit flow
    }, 1500);
  };

  const handleCancelClick = () => {
    if (questions.length > 0 || quizTitle.trim() !== '') {
      if (!initialData) {
        const newQuiz = {
          id: `QZ-${Math.floor(Math.random() * 900) + 100}`,
          title: quizTitle.trim() || 'Untitled Quiz',
          status: 'Draft',
          subject: quizSubject || 'Uncategorized',
          q: questions.length,
          diff: quizDifficulty || 'Medium',
          author: 'You',
          date: 'Just now',
          time: '-'
        };
        DUMMY_QUIZZES.unshift(newQuiz as any);
      }
      setAlertState({
        isOpen: true,
        title: 'Draft Saved',
        message: 'Your quiz has been safely auto-saved as a draft.',
        type: 'success'
      });
      setTimeout(() => {
        onCancel();
      }, 1500);
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
  };

  const removeMcOption = (index: number) => {
    if (mcOptions.length <= 2) return;
    const newOpts = mcOptions.filter((_, i) => i !== index);
    setMcOptions(newOpts);
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
    <div className="h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <header className="h-14 md:h-16 shrink-0 flex items-center justify-between px-3 md:px-6 bg-surface-container-lowest border-b border-outline-variant/50">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={handleCancelClick} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="font-headline-sm md:font-headline-md text-primary hidden sm:block">Quiz Creator Studio</h1>
          <h1 className="font-headline-sm text-primary sm:hidden">Creator</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={handleCancelClick} className="font-button text-xs md:text-button text-on-surface-variant hover:text-on-surface px-2 md:px-4 py-2 transition-colors hidden sm:block">Close</button>
          <button onClick={handlePublishClick} className="font-button text-xs md:text-button bg-primary text-on-primary px-3 md:px-6 py-2 md:py-2.5 rounded-lg hover:opacity-90 transition-colors shadow-sm">Publish</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-auto">
        {/* Left Sidebar */}
        <aside className="w-full md:w-80 h-full overflow-y-auto border-b md:border-b-0 md:border-r border-outline-variant/50 p-4 md:p-6 flex flex-col gap-4 md:gap-6 bg-surface-container-low shrink-0">
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
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-on-surface-variant text-sm">Subject <span className="text-error">*</span></label>
              <select 
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface"
                value={quizSubject}
                onChange={(e) => setQuizSubject(e.target.value)}
              >
                <option value="Science">Science</option>
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-on-surface-variant text-sm">Difficulty <span className="text-error">*</span></label>
              <select 
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface"
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            
            <div className="h-px w-full bg-outline-variant/50 my-2"></div>
            
            <h3 className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider mb-1">Settings</h3>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="font-label-bold text-on-surface-variant text-sm">Public Access</label>
                <span className="text-xs text-on-surface-variant">Allow anyone to take this quiz</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="font-label-bold text-on-surface-variant text-sm">Shuffle Options</label>
                <span className="text-xs text-on-surface-variant">Randomize answers order</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Builder Area */}
        <section className="flex-1 min-h-0 overflow-y-auto overscroll-none bg-surface-container-lowest p-4 md:p-8 relative" id="main-builder-area">
          {/* Empty State / Type Selection */}
          {!editingType && (
            <div className="max-w-5xl w-full mx-auto">
              {/* AI Generator Section */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-3 relative flex flex-col md:flex-row items-center gap-3 shadow-sm mb-8">
                <div className="flex items-center gap-2 text-primary shrink-0 pl-1">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="font-headline-md text-base whitespace-nowrap hidden sm:block">AI Magic Generate</h2>
                </div>
                
                <div className="flex-1 w-full relative">
                  <input 
                    type="text"
                    className="w-full bg-white border border-outline-variant/50 rounded-lg pl-3 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface shadow-sm"
                    placeholder="Describe your topic to generate questions..."
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <button className="flex-1 md:flex-none border border-outline-variant/60 rounded-lg text-sm font-medium text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 bg-white px-4 py-2.5 shadow-sm" title="Upload Source Document (PDF, DOCX, TXT)">
                    <UploadCloud className="w-4 h-4 text-primary/70" /> 
                    <span>Upload File</span>
                  </button>

                  <button className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-on-surface mb-2">Build Your Quiz</h2>
                <p className="text-on-surface-variant">Generate a complete quiz using AI or add questions manually.</p>
              </div>

              {/* Manual Creation Section */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Manual Creation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => handleStartBuild('multiple')} className="flex items-center text-left gap-4 p-4 bg-white border-2 border-outline-variant/50 rounded-xl hover:border-primary hover:shadow-md transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <List className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">Multiple Choice</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Options with one correct answer.</p>
                    </div>
                  </button>

                  <button onClick={() => handleStartBuild('truefalse')} className="flex items-center text-left gap-4 p-4 bg-white border-2 border-outline-variant/50 rounded-xl hover:border-secondary hover:shadow-md transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors">True / False</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Quick binary choice assessments.</p>
                    </div>
                  </button>

                  <button onClick={() => handleStartBuild('short')} className="flex items-center text-left gap-4 p-4 bg-white border-2 border-outline-variant/50 rounded-xl hover:border-tertiary-fixed-dim hover:shadow-md transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <AlignLeft className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-on-surface group-hover:text-tertiary-fixed-dim transition-colors">Short Answer</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Require exact text match answers.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Builder */}
          {editingType && (
            <div className="shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 shadow-sm flex flex-col gap-6 relative">
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
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={publishConfirmOpen}
        title="Publish Quiz"
        message="Are you ready to publish this quiz? It will become available to all assigned students."
        onConfirm={confirmPublish}
        onCancel={() => setPublishConfirmOpen(false)}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}