import React from 'react';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { ExamQuestion } from '@/data/userData';

interface QuestionCardProps {
  activeQuestion: ExamQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: { [key: number]: string };
  flaggedQuestions: Set<number>;
  toggleFlag: (qId: number) => void;
  handleOptionSelect: (qId: number, key: string) => void;
  handleTextChange: (qId: number, val: string) => void;
  onPrev: () => void;
  onNext: () => void;
  navigationRule?: string;
}

const formatMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  activeQuestion,
  currentQuestionIndex,
  totalQuestions,
  answers,
  flaggedQuestions,
  toggleFlag,
  handleOptionSelect,
  handleTextChange,
  onPrev,
  onNext,
  navigationRule,
}) => {
  const isFlagged = flaggedQuestions.has(activeQuestion.id);
  const questionImageUrl = formatMediaUrl(activeQuestion.mediaUrl);
  const questionAudioUrl = formatMediaUrl(activeQuestion.audioUrl);
  const isShortAnswer = activeQuestion.type === 'SHORT_ANSWER';
  const isTrueFalse = activeQuestion.type === 'TRUE_FALSE';
  const optionsList = (isTrueFalse && (!activeQuestion.options || activeQuestion.options.length === 0))
    ? [
        { key: 'True', label: 'True', desc: 'A' },
        { key: 'False', label: 'False', desc: 'B' },
      ]
    : (activeQuestion.options || []);

  return (
    <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-label-bold text-xs font-bold">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="text-on-surface-variant text-xs font-semibold">
              {activeQuestion.points} Point{activeQuestion.points > 1 ? 's' : ''}
            </span>
          </div>
          {navigationRule !== 'FIXED_NAV' && (
            <button
              onClick={() => toggleFlag(activeQuestion.id)}
              className={`flex items-center gap-2 text-xs font-bold transition-colors group ${
                isFlagged ? 'text-tertiary' : 'text-outline hover:text-tertiary'
              }`}
            >
              <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
              <span>Mark for Review</span>
            </button>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-outline-variant/30 text-left">
          <h2 className="font-headline-md text-xl lg:text-2xl font-bold text-on-surface mb-6 leading-snug">
            {activeQuestion.text}
          </h2>

          {/* Question Media (Image / Video) */}
          {questionImageUrl && (
            <div className="mb-6 flex justify-center">
              {questionImageUrl.match(/\.(mp4|webm|ogg|mov)$/i) || questionImageUrl.includes('/video/upload/') ? (
                <video
                  src={questionImageUrl}
                  controls
                  className="max-h-72 w-full max-w-xl rounded-2xl border border-outline-variant/30 shadow-sm"
                />
              ) : (
                <img
                  src={questionImageUrl}
                  alt="Question attachment"
                  className="max-h-72 w-auto object-contain rounded-2xl border border-outline-variant/30 shadow-sm"
                />
              )}
            </div>
          )}

          {/* Question Audio */}
          {questionAudioUrl && (
            <div className="mb-6 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">graphic_eq</span> Listen to Audio Prompt
              </span>
              <audio src={questionAudioUrl} controls className="w-full max-w-md h-10" />
            </div>
          )}

          {/* Question options / Input */}
          {!isShortAnswer && optionsList.length > 0 ? (
            <div className="space-y-4">
              {optionsList.map((opt) => {
                const isSelected = answers[activeQuestion.id] === opt.key;
                const optImageUrl = formatMediaUrl(opt.mediaUrl);
                const optAudioUrl = formatMediaUrl(opt.audioUrl);
                return (
                  <label
                    key={opt.key}
                    onClick={() => handleOptionSelect(activeQuestion.id, opt.key)}
                    className={`group flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-container bg-primary-container/5'
                        : 'border-outline-variant hover:border-primary-container hover:bg-primary-container/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${activeQuestion.id}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className={`w-5 h-5 focus:ring-primary border-outline-variant mr-4 mt-0.5 ${
                        isSelected ? 'text-primary border-primary-container' : 'text-primary'
                      }`}
                    />
                    <div className="flex flex-col text-left space-y-2 flex-1">
                      <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {opt.desc || opt.key}. {opt.label}
                      </span>
                      {optImageUrl && (
                        <img
                          src={optImageUrl}
                          alt={`Option ${opt.desc || opt.key} media`}
                          className="max-h-40 w-auto object-contain rounded-xl border border-outline-variant/30 mt-1"
                        />
                      )}
                      {optAudioUrl && (
                        <audio src={optAudioUrl} controls className="h-8 w-full max-w-xs mt-1" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            /* Short Answer / Text Area Answer box */
            <div className="space-y-4">
              <textarea
                value={answers[activeQuestion.id] || ''}
                onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                className="w-full rounded-lg border-2 border-outline-variant/30 focus:border-primary focus:ring-0 p-4 font-body-md text-sm text-on-surface h-48 bg-[#f9f9ff] outline-none transition-colors"
                placeholder="Type your detailed answer here..."
              />
              <div className="p-4 bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">info</span>
                <p className="text-xs text-on-surface-variant italic leading-relaxed text-left">
                  Your answer will be automatically saved as you type.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center pt-4 ${navigationRule === 'FIXED_NAV' ? 'justify-end' : 'justify-between'}`}>
        {navigationRule !== 'FIXED_NAV' && (
          <button
            disabled={currentQuestionIndex === 0}
            onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 border-2 border-outline text-on-surface-variant font-button text-xs font-bold rounded-lg hover:bg-surface-variant transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
        )}
        <button
          disabled={currentQuestionIndex === totalQuestions - 1}
          onClick={onNext}
          className="flex items-center gap-2 px-10 py-3 bg-primary text-on-primary font-button text-xs font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next Question
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
