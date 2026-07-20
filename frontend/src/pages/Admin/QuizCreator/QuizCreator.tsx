import { ArrowLeft, Wrench, X, List, CheckSquare, AlignLeft, Sparkles, ArrowRight, Check, Plus, Trash2, Edit2, Image as ImageIcon, Mic, UploadCloud, GripVertical, CopyPlus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { DUMMY_QUIZZES } from '@/data/mockDb';

export type QuestionType = 'multiple' | 'truefalse' | 'short';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
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

  const handleStartBuild = (type: QuestionType) => {
    setEditingType(type);
    setQText('');
    setMcOptions(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    setMcCorrect(0);
    setTfCorrect(true);
    setShortCorrect('');
    setQDifficulty('MEDIUM');
    setQTimeLimit(60);
    setEditingId(null);
    
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
    setEditingId(q.id);
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
    setEditingType(q.type);
    setQText(q.text + ' (Copy)');
    setQDifficulty(q.difficulty);
    setQTimeLimit(q.timeLimit);
    setEditingId(null);
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

  const handleSaveQuestion = (nextType: QuestionType | null = null) => {
    if (!qText.trim()) return;

    let newQ: Question;
    const baseQ = {
      id: editingId || Date.now().toString(),
      text: qText,
      difficulty: qDifficulty,
      timeLimit: qTimeLimit,
    };

    if (editingType === 'multiple') {
      newQ = { ...baseQ, type: 'multiple', options: mcOptions, correctAnswer: mcCorrect };
    } else if (editingType === 'truefalse') {
      newQ = { ...baseQ, type: 'truefalse', correctAnswer: tfCorrect };
    } else {
      newQ = { ...baseQ, type: 'short', correctAnswer: shortCorrect };
    }

    if (editingId) {
      setQuestions(questions.map(q => q.id === editingId ? newQ : q));
    } else {
      setQuestions([...questions, newQ]);
    }

    if (nextType) {
      handleStartBuild(nextType);
    } else {
      setEditingType(null);
      setEditingId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setQuestionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      setQuestions(questions.filter(q => q.id !== questionToDelete));
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
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] w-full flex flex-col overflow-hidden bg-surface-container-lowest text-on-surface">
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

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-80 h-auto md:h-full max-h-[35vh] md:max-h-none overflow-y-auto border-b md:border-b-0 md:border-r border-outline-variant/50 p-4 md:p-6 flex flex-col gap-4 md:gap-6 bg-surface-container-low shrink-0">
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
        {/* Right Content */}
        <section className="flex-1 min-h-0 overflow-y-auto overscroll-none bg-surface-container-lowest p-4 md:p-8 relative" id="main-builder-area">
          
          {/* Empty State / Type Selection */}
          {!editingType && (
            <div className="max-w-5xl w-full mx-auto">
              
              {/* AI Generator Section (Ultra Compact Layout) */}
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
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 border border-outline-variant/50 rounded-lg text-xs font-bold text-on-surface hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" /> Add Image
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 border border-outline-variant/50 rounded-lg text-xs font-bold text-on-surface hover:text-secondary hover:border-secondary/50 hover:bg-secondary/5 transition-all shadow-sm">
                        <Mic className="w-3.5 h-3.5 text-secondary" /> Add Audio
                      </button>
                    </div>
                  </label>
                  <textarea 
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    className="w-full border-2 border-outline-variant/50 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-sm text-sm" 
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
                      <select 
                        value={qDifficulty}
                        onChange={e => setQDifficulty(e.target.value as any)}
                        className="w-full bg-white border border-outline-variant/50 rounded-lg px-3 py-2.5 focus:border-primary outline-none text-sm cursor-pointer shadow-sm"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
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
                      onPointerDown={(e) => { 
                        if (!qText.trim() || (editingType === 'short' && !shortCorrect.trim())) return;
                        e.preventDefault(); 
                        handleSaveQuestion(null); 
                      }}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (editingType) handleSaveQuestion(null);
                      }}
                      disabled={!qText.trim() || (editingType === 'short' && !shortCorrect.trim())}
                      className="font-bold text-sm bg-white border-2 border-primary text-primary px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button 
                      type="button"
                      onPointerDown={(e) => { 
                        if (!qText.trim() || (editingType === 'short' && !shortCorrect.trim())) return;
                        e.preventDefault(); 
                        handleSaveQuestion(editingType); 
                      }}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (editingType) handleSaveQuestion(editingType);
                      }}
                      disabled={!qText.trim() || (editingType === 'short' && !shortCorrect.trim())}
                      className="font-bold text-sm bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 active:bg-primary/80 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" /> Save & Next
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Questions List Section (Always Visible) */}
          <div className="shrink-0 max-w-5xl mx-auto flex flex-col w-full mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Question List ({questions.length})</h3>
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
                      {questions.map((q, idx) => (
                        <tr key={q.id} className="hover:bg-surface-bright transition-colors group">
                          <td className="px-4 py-4 text-on-surface-variant cursor-grab active:cursor-grabbing hover:text-on-surface opacity-30 group-hover:opacity-100 transition-opacity text-center">
                            <GripVertical className="w-4 h-4 mx-auto" />
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">Q{idx + 1}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">{getTypeName(q.type)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface font-medium">
                            <p className="line-clamp-2 max-w-md">{q.text || 'Untitled Question'}</p>
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
                      ))}
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
    </div>
  );
}
