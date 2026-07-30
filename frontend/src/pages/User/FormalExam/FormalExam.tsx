import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExamHeader } from './components/ExamHeader';
import { QuestionCard } from './components/QuestionCard';
import { QuestionPalette } from './components/QuestionPalette';
import { SubmitExamModal } from './components/SubmitExamModal';
import { examService } from '@/services';

export const FormalExam: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const examData = (location.state as any) || {};
  const examId = examData.id || examData.exam_id;
  const examTitle = examData.title || examData.exam_title || 'Midterm Examination';
  const subject = examData.subject || examData.quiz_subject || 'General Subject';

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [successOverlayOpen, setSuccessOverlayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [navigationRule, setNavigationRule] = useState<'FREE_NAV' | 'FIXED_NAV'>('FREE_NAV');

  // 1. Initial Load: Start Exam and Get Questions
  useEffect(() => {
    if (!examId) {
      setErrorMsg("No exam details found. Please launch the exam from your Dashboard.");
      setIsLoading(false);
      return;
    }

    const initExam = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // Notify server that user is starting/continuing the exam
        await examService.startExam(examId);

        // Fetch questions and remaining time
        const takeRes = await examService.takeExam(examId);
        if (takeRes) {
          setTimeLeft(takeRes.remaining_seconds || 0);
          setNavigationRule(takeRes.exam?.navigation_rule || 'FREE_NAV');

          const mapped = (takeRes.questions || []).map((q: any) => {
            const qType = (q.question_type || '').trim().toLowerCase();
            const isSelection = qType === 'multiple_choice' || qType === 'true_false' || qType === 'true/false';
            return {
              id: q.id,
              text: q.question_text || '',
              points: q.points || 1.0,
              type: isSelection ? 'radio' : 'essay',
              options: (q.options || []).map((o: any, idx: number) => ({
                key: String(o.id), // option_id
                label: o.option_text || '',
                desc: String.fromCharCode(65 + idx), // 'A', 'B', 'C', 'D'
              })),
            };
          });
          setQuestions(mapped);

          // Populate answers if user had already answered questions (continuing)
          const prefilledAnswers: { [key: number]: string } = {};
          (takeRes.questions || []).forEach((q: any) => {
            if (q.user_answer) {
              prefilledAnswers[q.id] = q.user_answer.selected_option_id
                ? String(q.user_answer.selected_option_id)
                : q.user_answer.answer_text || '';
            }
          });
          setAnswers(prefilledAnswers);
        }
      } catch (err: any) {
        console.error("Failed to load exam:", err);
        setErrorMsg(err?.response?.data?.detail || "This exam is either not active, completed, or you are not authorized to take it.");
      } finally {
        setIsLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // 2. Timer countdown logic
  useEffect(() => {
    if (isLoading || errorMsg || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, errorMsg, timeLeft]);

  // 3. Prevent right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 4. Handle MCQ selection
  const handleOptionSelect = async (qId: number, optionIdStr: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIdStr }));
    try {
      await examService.saveAnswer(examId, {
        question_id: qId,
        selected_option_id: Number(optionIdStr),
      });
    } catch (err) {
      console.error("Failed to save MCQ answer:", err);
    }
  };

  // 5. Handle Essay text change
  const handleTextChange = async (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    try {
      await examService.saveAnswer(examId, {
        question_id: qId,
        answer_text: val,
      });
    } catch (err) {
      console.error("Failed to save essay answer:", err);
    }
  };

  const toggleFlag = (qId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsLoading(true);
      setSubmitModalOpen(false);
      const res = await examService.submitExam(examId);
      if (res) {
        setFinalScore(res.score);
      }
      setSuccessOverlayOpen(true);
    } catch (err: any) {
      console.error("Failed to submit exam:", err);
      alert(err?.response?.data?.detail || "Failed to submit exam on server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await examService.submitExam(examId);
      if (res) {
        setFinalScore(res.score);
      }
      setSuccessOverlayOpen(true);
    } catch (err) {
      console.error("Auto submit failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center text-on-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm font-semibold">Preparing your exam portal...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center text-on-surface p-6">
        <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h2 className="text-lg font-bold mb-2">Access Blocked</h2>
          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition-all shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentQuestionIndex];
  const isTimeCritical = timeLeft <= 300; // Under 5 minutes

  // Calculate statistics
  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)] !== '').length;
  const flaggedCount = flaggedQuestions.size;
  const totalQuestions = questions.length;
  const remainingCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body-md select-none">
      <ExamHeader
        examTitle={examTitle}
        subject={subject}
        timeLeft={timeLeft}
        formatTime={formatTime}
        isTimeCritical={isTimeCritical}
      />

      <main className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-grow">
        {activeQuestion && (
          <QuestionCard
            activeQuestion={activeQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            answers={answers}
            flaggedQuestions={flaggedQuestions}
            toggleFlag={toggleFlag}
            handleOptionSelect={handleOptionSelect}
            handleTextChange={handleTextChange}
            onPrev={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            navigationRule={navigationRule}
          />
        )}

        <QuestionPalette
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
          remainingCount={remainingCount}
          progressPercent={progressPercent}
          onSubmitClick={() => setSubmitModalOpen(true)}
          navigationRule={navigationRule}
        />
      </main>

      <SubmitExamModal
        submitModalOpen={submitModalOpen}
        successOverlayOpen={successOverlayOpen}
        remainingCount={remainingCount}
        flaggedCount={flaggedCount}
        subject={subject}
        score={finalScore}
        onConfirmSubmit={handleConfirmSubmit}
        onCancelSubmit={() => setSubmitModalOpen(false)}
        onReturnDashboard={() => {
          const returnTab = examData.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'assigned_exams';
          navigate('/dashboard', { state: { activeTab: returnTab } });
        }}
      />
    </div>
  );
};
