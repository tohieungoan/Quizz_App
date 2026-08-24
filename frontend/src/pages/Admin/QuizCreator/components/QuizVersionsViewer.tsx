import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';

import { ApiError } from '@/services/apiClient';
import { quizService } from '@/services/quizService';

interface VariantOption {
  id: number;
  content: string;
  is_correct: boolean;
}

interface VariantQuestion {
  id: number;
  content: string;
  type?: string | null;
  difficulty?: string | null;
  time_limit?: number | null;
  media_url?: string | null;
  audio_url?: string | null;
  options: VariantOption[];
}

interface QuizVariant {
  id: number;
  variant_index: number;
  version_code: string;
  status: string;
  questions: VariantQuestion[];
}

export interface QuizVersionSelection {
  variantId: number;
  variantIndex: number;
  label: string;
  questions: VariantQuestion[];
}

interface VariantSet {
  status: string;
  requested_count: number;
  error_message?: string | null;
  variants: QuizVariant[];
}

interface QuizVersionsViewerProps {
  quizId?: string;
  enabled: boolean;
  status?: string | null;
  onVariantSelect: (selection: QuizVersionSelection | null) => void;
  refreshToken: number;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  DIRTY: 'bg-amber-50 text-amber-800 border-amber-200',
  STALE: 'bg-amber-50 text-amber-800 border-amber-200',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
  GENERATING: 'bg-blue-50 text-blue-700 border-blue-200',
};

const getVariantLabel = (variant: QuizVariant) => variant.variant_index === 0
  ? 'Original'
  : `Version ${variant.variant_index + 1}`;
const getVariantTabLabel = (variant: QuizVariant) => variant.variant_index === 0
  ? 'Original'
  : String(variant.variant_index + 1);

export function QuizVersionsViewer({
  quizId,
  enabled,
  status,
  onVariantSelect,
  refreshToken,
  compact = false,
}: QuizVersionsViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [variantSet, setVariantSet] = useState<VariantSet | null>(null);
  const [activeCode, setActiveCode] = useState('A');

  const load = useCallback(async (silent = false) => {
    if (!quizId) return;
    if (!silent) setLoading(true);
    try {
      const response = await quizService.getVariants(quizId);
      setVariantSet(response);
      setActiveCode(current => response.variants?.some((item: QuizVariant) => item.version_code === current)
        ? current
        : response.variants?.[0]?.version_code || 'A');
    } catch (error: unknown) {
      // A version set is only created after the quiz is published. Opening the
      // viewer before that is a valid empty state, not a request failure.
      if (error instanceof ApiError && error.status === 404) {
        setVariantSet(null);
        setActiveCode('A');
        return;
      }

      if (!silent) {
        toast.error(error instanceof Error ? error.message : 'Unable to load quiz versions.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (!expanded || !quizId) return;
    void load();
  }, [expanded, quizId, load]);

  useEffect(() => {
    if (!refreshToken || !quizId) return;
    setExpanded(true);
    void load();
  }, [refreshToken, quizId, load]);

  useEffect(() => {
    const currentStatus = status === 'STALE' ? status : variantSet?.status || status;
    if (!expanded || !['PENDING', 'GENERATING'].includes(currentStatus || '')) return;
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [expanded, variantSet?.status, status, load]);

  if (!enabled) return null;

  const currentStatus = status === 'STALE'
    ? status
    : variantSet?.status || status || 'NOT_GENERATED';
  const canRetry = ['PARTIAL', 'FAILED'].includes(currentStatus);

  const handleRetry = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      await quizService.retryVariants(quizId);
      toast.success('Quiz version generation queued again.');
      await load(true);
    } catch (error: any) {
      toast.error(error?.message || 'Unable to retry quiz versions.');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant: QuizVariant) => {
    setActiveCode(variant.version_code);
    onVariantSelect(variant.variant_index === 0 ? null : {
      variantId: variant.id,
      variantIndex: variant.variant_index,
      label: getVariantLabel(variant),
      questions: variant.questions,
    });
  };

  return (
    <div className={`${compact ? 'mt-2' : ''} rounded-xl border border-outline-variant/60 bg-surface-container-low/60`}>
      <button
        type="button"
        disabled={!quizId}
        onClick={() => setExpanded(value => !value)}
        className={`flex w-full items-center justify-between gap-3 px-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'py-2' : 'py-3'}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface">View Versions</p>
          <p className="truncate text-[11px] text-on-surface-variant">
            {quizId ? `${currentStatus.replaceAll('_', ' ')}${variantSet ? ` · ${Math.max(0, variantSet.requested_count - 1)} generated` : ''}` : 'Save the draft to generate versions'}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-outline-variant/50 p-3">
          {loading && !variantSet ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading versions…
            </div>
          ) : variantSet ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[currentStatus] || 'border-outline-variant bg-surface-container text-on-surface-variant'}`}>
                  {currentStatus === 'READY' ? <CheckCircle2 className="h-3 w-3" /> : ['FAILED', 'DIRTY'].includes(currentStatus) ? <TriangleAlert className="h-3 w-3" /> : <Loader2 className={`h-3 w-3 ${['PENDING', 'GENERATING'].includes(currentStatus) ? 'animate-spin' : ''}`} />}
                  {currentStatus}
                </span>
                {canRetry && (
                  <button type="button" onClick={handleRetry} disabled={loading} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary disabled:opacity-50">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Retry
                  </button>
                )}
              </div>

              <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
                {variantSet.variants.map(variant => (
                  <button
                    type="button"
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    disabled={variant.variant_index > 0 && ['PENDING', 'GENERATING'].includes(currentStatus)}
                    className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:cursor-wait disabled:opacity-50 ${activeCode === variant.version_code ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant bg-surface-container-lowest text-on-surface'}`}
                    title={`${getVariantLabel(variant)}: ${variant.status}`}
                  >
                    {getVariantTabLabel(variant)}
                  </button>
                ))}
              </div>

              {variantSet.error_message && (
                <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] leading-4 text-red-700">{variantSet.error_message}</p>
              )}
              {currentStatus === 'DIRTY' && (
                <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-800">
                  A manual edit made this version inconsistent with the Original. Fix the differences or generate the versions again before publishing.
                </p>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs font-semibold text-on-surface">Versions are not generated yet</p>
              <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">
                Choose a quantity and click Generate.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
