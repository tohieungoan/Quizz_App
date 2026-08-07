import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AIQuestionItem, ProgressStage } from '@/types/aiQuiz';
import { aiQuizService } from '@/services/aiQuizService';
import { AIFloatingProgress } from '@/components/ui/AIQuizModal/AIFloatingProgress';

interface AIQuizContextType {
  isGenerating: boolean;
  stage: ProgressStage;
  numQuestions: number;
  seconds: number;
  modelUsed?: string;
  targetPath?: string;
  unconsumedQuestions: { questions: AIQuestionItem[]; modelUsed: string } | null;
  startGeneration: (formData: FormData, numQuestions: number, customTargetPath?: string) => void;
  cancelGeneration: () => void;
  consumeQuestions: () => { questions: AIQuestionItem[]; modelUsed: string } | null;
}

const AIQuizContext = createContext<AIQuizContextType | undefined>(undefined);

export const AIQuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<ProgressStage>('idle');
  const [numQuestions, setNumQuestions] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [modelUsed, setModelUsed] = useState<string | undefined>(undefined);
  const [targetPath, setTargetPath] = useState<string>('/create-quiz');
  const [unconsumedQuestions, setUnconsumedQuestions] = useState<{
    questions: AIQuestionItem[];
    modelUsed: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const startGeneration = (
    formData: FormData,
    count: number,
    customTargetPath?: string
  ) => {
    // Abort previous task if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const chosenPath = customTargetPath || location.pathname;
    setTargetPath(chosenPath);
    setNumQuestions(count);
    setIsGenerating(true);
    setStage('parsing');
    setSeconds(0);
    setModelUsed(undefined);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const stageTimer = setTimeout(() => {
      setStage((current) => (current === 'parsing' ? 'generating' : current));
    }, 1200);

    aiQuizService
      .generate(formData, { signal: controller.signal })
      .then((response) => {
        clearTimeout(stageTimer);
        setStage('validating');
        setModelUsed(response.model_used);

        setTimeout(() => {
          setStage('completed');
          setUnconsumedQuestions({
            questions: response.questions,
            modelUsed: response.model_used,
          });

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // If user navigated to another page, notify them with a toast
          if (location.pathname !== chosenPath) {
            toast.success(
              (t) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs">AI Quiz Ready! 🎉</p>
                    <p className="text-[11px] text-slate-500">
                      Generated {response.questions.length} questions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(chosenPath);
                    }}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Open Quiz
                  </button>
                </div>
              ),
              { duration: 6000 }
            );
          }

          // Hide dock after completion
          setTimeout(() => {
            setIsGenerating(false);
            setStage('idle');
            setSeconds(0);
          }, 2500);
        }, 600);
      })
      .catch((err: any) => {
        clearTimeout(stageTimer);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED' ||
          controller.signal.aborted
        ) {
          // Cancelled cleanly
          setIsGenerating(false);
          setStage('idle');
          setSeconds(0);
          return;
        }

        console.error('Global AI Quiz Generation Error:', err);
        setIsGenerating(false);
        setStage('idle');
        setSeconds(0);

        toast.error(
          err.message ||
            'AI question generation encountered an error. Please try again.',
          { duration: 5000 }
        );
      });
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsGenerating(false);
    setStage('idle');
    setSeconds(0);
    toast('AI generation cancelled.', { icon: 'ℹ️' });
  };

  const consumeQuestions = () => {
    if (!unconsumedQuestions) return null;
    const data = unconsumedQuestions;
    setUnconsumedQuestions(null);
    return data;
  };

  return (
    <AIQuizContext.Provider
      value={{
        isGenerating,
        stage,
        numQuestions,
        seconds,
        modelUsed,
        targetPath,
        unconsumedQuestions,
        startGeneration,
        cancelGeneration,
        consumeQuestions,
      }}
    >
      {children}

      {/* Global Persistent Floating Progress Dock */}
      {isGenerating && (
        <AIFloatingProgress
          stage={stage}
          numQuestions={numQuestions}
          seconds={seconds}
          modelUsed={modelUsed}
          onCancel={cancelGeneration}
          targetPath={targetPath}
          currentPath={location.pathname}
          onNavigateTarget={() => navigate(targetPath)}
        />
      )}
    </AIQuizContext.Provider>
  );
};

export const useAIQuiz = (): AIQuizContextType => {
  const context = useContext(AIQuizContext);
  if (!context) {
    throw new Error('useAIQuiz must be used within an AIQuizProvider');
  }
  return context;
};
