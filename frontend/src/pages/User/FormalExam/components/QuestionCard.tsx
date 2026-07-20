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
}

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
}) => {
  const isFlagged = flaggedQuestions.has(activeQuestion.id);

  return (
    <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-label-bold text-xs font-bold">
              Question {activeQuestion.id}
            </span>
            <span className="text-on-surface-variant text-xs font-semibold">
              {activeQuestion.points} Point{activeQuestion.points > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => toggleFlag(activeQuestion.id)}
            className={`flex items-center gap-2 text-xs font-bold transition-colors group ${
              isFlagged ? 'text-tertiary' : 'text-outline hover:text-tertiary'
            }`}
          >
            <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
            <span>Mark for Review</span>
          </button>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-outline-variant/30 text-left">
          <h2 className="font-headline-md text-xl lg:text-2xl font-bold text-on-surface mb-8 leading-snug">
            {activeQuestion.text}
          </h2>

          {/* Question options */}
          {activeQuestion.type === 'radio' && activeQuestion.options ? (
            <div className="space-y-4">
              {activeQuestion.options.map((opt) => {
                const isSelected = answers[activeQuestion.id] === opt.key;
                return (
                  <label
                    key={opt.key}
                    onClick={() => handleOptionSelect(activeQuestion.id, opt.key)}
                    className={`group flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
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
                      className={`w-5 h-5 focus:ring-primary border-outline-variant mr-4 ${
                        isSelected ? 'text-primary border-primary-container' : 'text-primary'
                      }`}
                    />
                    <div className="flex flex-col text-left">
                      <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {opt.key}. {opt.label}
                      </span>
                      {opt.desc && <span className="text-xs text-on-surface-variant mt-0.5">{opt.desc}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            /* Essay / Text Answer box */
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
                  Your answer will be automatically saved as you type. Limit your response to 500 words.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          disabled={currentQuestionIndex === 0}
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 border-2 border-outline text-on-surface-variant font-button text-xs font-bold rounded-lg hover:bg-surface-variant transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
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
