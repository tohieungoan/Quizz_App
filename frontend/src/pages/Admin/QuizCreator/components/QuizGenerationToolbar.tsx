import { useState } from 'react';
import { ChevronDown, Layers3, Loader2, Sparkles } from 'lucide-react';

import { QuizVersionSelection, QuizVersionsViewer } from './QuizVersionsViewer';

const CustomSelect = ({
  value,
  options,
  onChange,
  className
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (val: number) => void;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-full px-3 text-xs font-bold text-on-surface bg-surface-container-lowest border border-outline-variant rounded-xl outline-none transition-all ${isOpen ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
      >
        <span className="truncate mr-1.5">{selected?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full flex items-center px-2 py-2 text-xs font-semibold rounded-lg transition-colors ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface QuizGenerationToolbarProps {
  quizId?: string;
  variantEnabled: boolean;
  variantCount: number;
  variantStatus?: string | null;
  isGeneratingVersions: boolean;
  variantRefreshToken: number;
  disableQuestionGeneration?: boolean;
  onOpenAI: () => void;
  onVariantEnabledChange: (enabled: boolean) => void;
  onVariantCountChange: (count: number) => void;
  onGenerateVersions: () => void;
  onVariantSelect: (selection: QuizVersionSelection | null) => void;
}

export function QuizGenerationToolbar(props: QuizGenerationToolbarProps) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-5xl flex-wrap items-start gap-4">
      <section className="flex w-full min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-sm md:flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <p className="whitespace-nowrap text-sm font-bold text-on-surface">AI Questions</p>
          </div>

          <button
            type="button"
            onClick={props.onOpenAI}
            disabled={props.disableQuestionGeneration}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            title={props.disableQuestionGeneration ? 'Switch to Original before adding questions' : 'Generate questions with AI'}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </button>
      </section>

      <section className="w-full min-w-0 flex-1 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-sm md:flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers3 className="h-4 w-4" />
            </div>
            <p className="mr-auto whitespace-nowrap text-sm font-bold text-on-surface">Quiz Versions</p>

            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={props.variantEnabled}
                onChange={event => props.onVariantEnabledChange(event.target.checked)}
                aria-label="Enable AI-generated versions"
              />
              <span className="h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
            </label>

            {props.variantEnabled && (
              <>
                <CustomSelect
                  value={props.variantCount - 1}
                  onChange={val => props.onVariantCountChange(val + 1)}
                  options={[
                    { value: 1, label: '1 version' },
                    { value: 2, label: '2 versions' },
                    { value: 3, label: '3 versions' },
                    { value: 4, label: '4 versions' },
                  ]}
                  className="h-10 w-[100px] shrink-0"
                />

                <button
                  type="button"
                  onClick={props.onGenerateVersions}
                  disabled={props.isGeneratingVersions}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                >
                  {props.isGeneratingVersions && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {props.isGeneratingVersions ? 'Preparing…' : 'Generate'}
                </button>
              </>
            )}
          </div>

          <QuizVersionsViewer
            quizId={props.quizId}
            enabled={props.variantEnabled}
            status={props.variantStatus}
            onVariantSelect={props.onVariantSelect}
            refreshToken={props.variantRefreshToken}
            compact
          />
      </section>
    </div>
  );
}
