import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  Sliders,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  AIDifficulty,
  AIQuestionType,
} from '@/types/aiQuiz';
import { aiQuizService } from '@/services/aiQuizService';

interface AIQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGeneration: (formData: FormData, numQuestions: number) => void;
  existingQuestions?: string[];
  deletedBlacklist?: string[];
  initialPromptText?: string;
}

export const AIQuizModal: React.FC<AIQuizModalProps> = ({
  isOpen,
  onClose,
  onStartGeneration,
  existingQuestions = [],
  deletedBlacklist = [],
  initialPromptText = '',
}) => {
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [promptText, setPromptText] = useState(initialPromptText);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [questionType, setQuestionType] = useState<AIQuestionType>('multiple');
  const [language, setLanguage] = useState<'vi' | 'en'>('en');
  const [startPage, setStartPage] = useState<number | ''>('');
  const [endPage, setEndPage] = useState<number | ''>('');

  // Document metadata preview
  const [docPages, setDocPages] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPromptText) {
      setPromptText(initialPromptText);
    }
  }, [initialPromptText]);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setDocPages(null);

    // Call document preview to get total page count if PDF
    if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setIsPreviewing(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const preview = await aiQuizService.previewDocument(formData);
        if (preview && preview.total_pages) {
          setDocPages(preview.total_pages);
          setStartPage(1);
          setEndPage(preview.total_pages);
        }
      } catch (err) {
        console.warn('Unable to preview document pages:', err);
      } finally {
        setIsPreviewing(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = () => {
    if (!file && !promptText.trim()) {
      setErrorMessage('Please select a document file or enter custom topic / prompt text.');
      return;
    }

    const count = numQuestions && numQuestions >= 1 ? Math.min(50, numQuestions) : 5;

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (promptText.trim()) {
      formData.append('custom_prompt', promptText.trim());
    }
    formData.append('num_questions', count.toString());
    formData.append('difficulty', difficulty);
    formData.append('question_type', questionType);
    formData.append('language', language);

    if (startPage && file) formData.append('start_page', startPage.toString());
    if (endPage && file) formData.append('end_page', endPage.toString());

    if (existingQuestions.length > 0) {
      formData.append('existing_questions', JSON.stringify(existingQuestions));
    }
    if (deletedBlacklist.length > 0) {
      formData.append('deleted_blacklist', JSON.stringify(deletedBlacklist));
    }

    // Trigger background generation and immediately close the modal
    onStartGeneration(formData, count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface tracking-tight">
                AI Quiz Generator
              </h3>
              <p className="text-xs text-on-surface-variant">
                Configure parameters and generate questions in the background
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-error-container/30 border border-error/20 flex items-start gap-3 text-error">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <p className="font-bold">Input Required</p>
                <p className="mt-0.5 opacity-80">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Unified Input Section */}
          <div className="space-y-4">
            {/* File Upload Block */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-outline-variant/60 hover:border-primary rounded-xl px-4 py-3 cursor-pointer transition-all hover:bg-primary/[0.02] group flex items-center justify-between gap-3 bg-surface-container/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-on-surface">
                      Drag & drop document or <span className="text-primary underline">Browse files</span>
                    </h4>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      PDF, DOCX, TXT, Markdown (Max 20MB - Optional)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-primary px-2.5 py-1 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  Upload
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {(file.size / 1024 / 1024).toFixed(2)} MB {docPages ? `• ${docPages} pages` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setDocPages(null);
                  }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Page Range Selector for PDF */}
            {file && docPages && docPages > 1 && (
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-on-surface">
                    Page range to generate questions from:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={docPages}
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="From"
                    className="w-20 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs text-center font-semibold text-on-surface outline-none focus:border-primary"
                  />
                  <span className="text-xs text-on-surface-variant">to</span>
                  <input
                    type="number"
                    min={1}
                    max={docPages}
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="To"
                    className="w-20 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs text-center font-semibold text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Text Area Block */}
            <div>
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={file ? "Add custom instructions for AI (e.g., 'focus only on Chapter 2', 'emphasize key formulas')..." : "Paste lesson content, syllabus summary, or enter a specific topic you want to generate questions for..."}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl p-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none font-medium leading-relaxed placeholder:text-on-surface-variant/60"
              />
              <div className="flex justify-end mt-1 text-[11px] text-on-surface-variant">
                {promptText.length} characters
              </div>
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of Questions */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  Number of Questions:
                </label>
                <span className="text-[10px] text-on-surface-variant font-medium">Max 50</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (e.target.value === '') {
                      setNumQuestions(0 as unknown as number);
                    } else if (!isNaN(val)) {
                      setNumQuestions(Math.min(50, val));
                    }
                  }}
                  onBlur={() => {
                    if (!numQuestions || numQuestions < 1) setNumQuestions(5);
                  }}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant pointer-events-none">
                  questions
                </span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Target Difficulty:
              </label>
              <div className="grid grid-cols-4 gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
                {(['EASY', 'MEDIUM', 'HARD', 'MIXED'] as AIDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-1.5 text-[11px] font-bold rounded-md transition-all ${
                      difficulty === d
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {d === 'EASY' ? 'Easy' : d === 'MEDIUM' ? 'Medium' : d === 'HARD' ? 'Hard' : 'Mixed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface">
                Question Type:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'multiple', label: 'Multiple Choice (4 Options)' },
                  { id: 'truefalse', label: 'True / False' },
                  { id: 'short', label: 'Short Answer / Fill-in' },
                  { id: 'all', label: 'Mixed Variety' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuestionType(t.id as AIQuestionType)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                      questionType === t.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deduplication Status Hint */}
          {(existingQuestions.length > 0 || deletedBlacklist.length > 0) && (
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
              <span>
                System automatically excludes {existingQuestions.length} existing and {deletedBlacklist.length} deleted questions to prevent duplicates.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={(!file && !promptText.trim()) || !numQuestions || numQuestions < 1}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate {numQuestions} Questions
          </button>
        </div>
      </div>
    </div>
  );
};
