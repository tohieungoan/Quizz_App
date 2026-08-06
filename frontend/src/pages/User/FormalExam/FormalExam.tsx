import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ExamHeader } from './components/ExamHeader';
import { QuestionCard } from './components/QuestionCard';
import { QuestionPalette } from './components/QuestionPalette';
import { SubmitExamModal } from './components/SubmitExamModal';
import { examService } from '@/services';

const DEMO_QUESTIONS = [
  {
    id: 901,
    text: "Identify the anatomical structure highlighted in the diagram below.",
    points: 2.0,
    type: "MULTIPLE_CHOICE",
    mediaUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    audioUrl: null,
    options: [
      { key: "A", label: "Frontal Lobe", desc: "A" },
      { key: "B", label: "Cerebellum", desc: "B" },
      { key: "C", label: "Temporal Lobe", desc: "C" },
      { key: "D", label: "Occipital Lobe", desc: "D" },
    ],
  },
  {
    id: 902,
    text: "Listen to the audio clip and determine if the statement regarding rhythmic cadence is True or False.",
    points: 2.0,
    type: "TRUE_FALSE",
    mediaUrl: null,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    audioPlayLimit: 3,
    options: [
      { key: "True", label: "True", desc: "A" },
      { key: "False", label: "False", desc: "B" },
    ],
  },
  {
    id: 903,
    text: "Describe the function of the organ shown in the image below in detail.",
    points: 5.0,
    type: "SHORT_ANSWER",
    mediaUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80",
    audioUrl: null,
    options: [],
  },
];

export const FormalExam: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId: paramExamId } = useParams<{ examId?: string }>();
  const [searchParams] = useSearchParams();

  const examData = (location.state as any) || {};
  const queryExamId = searchParams.get('exam_id') || searchParams.get('id');
  const targetExamId = examData.exam_id || examData.id || paramExamId || queryExamId;

  const [examTitle, setExamTitle] = useState<string>(examData.title || examData.exam_title || 'Formal Examination');
  const [subject, setSubject] = useState<string>(examData.subject || examData.quiz_subject || 'General Subject');

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
  const [activeExamId, setActiveExamId] = useState<any>(targetExamId);

  // 1. Initial Load: Start Exam and Get Questions
  useEffect(() => {
    const initExam = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        let currentExamId = targetExamId;

        // If no exam ID passed, try auto-fetching user's assigned active/pending exams
        if (!currentExamId) {
          try {
            const myExams = await examService.getMyExams();
            if (Array.isArray(myExams) && myExams.length > 0) {
              const pendingExam = myExams.find((e: any) => e.status === 'PENDING' || e.status === 'IN_PROGRESS');
              if (pendingExam) {
                currentExamId = pendingExam.exam_id || pendingExam.id;
                if (pendingExam.exam_title) setExamTitle(pendingExam.exam_title);
                if (pendingExam.quiz_subject) setSubject(pendingExam.quiz_subject);
              }
            }
          } catch (e) {
            console.warn("Could not auto-fetch assigned exams:", e);
          }
        }

        // If still no exam ID, load demonstration exam with image & audio
        if (!currentExamId) {
          setQuestions(DEMO_QUESTIONS);
          setTimeLeft(3600);
          setExamTitle("Demonstration Exam (Image & Audio)");
          setSubject("General Knowledge");
          setIsLoading(false);
          return;
        }

        setActiveExamId(currentExamId);

        // Notify server that user is starting/continuing the exam
        await examService.startExam(currentExamId);

        // Fetch questions and remaining time
        const takeRes = await examService.takeExam(currentExamId);
        if (takeRes) {
          setTimeLeft(takeRes.remaining_seconds || 0);
          setNavigationRule(takeRes.exam?.navigation_rule || 'FREE_NAV');

          if (takeRes.exam) {
            if (takeRes.exam.title) setExamTitle(takeRes.exam.title);
            if (takeRes.exam.quiz_subject || takeRes.exam.quiz?.subject) {
              setSubject(takeRes.exam.quiz_subject || takeRes.exam.quiz?.subject);
            }
          }

          const mapped = (takeRes.questions || []).map((q: any) => {
            const rawType = String(q.question_type || q.type || '').trim().toUpperCase();

            let qKind: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' = 'MULTIPLE_CHOICE';
            if (rawType.includes('TRUE') || rawType.includes('FALSE')) {
              qKind = 'TRUE_FALSE';
            } else if (rawType.includes('SHORT') || rawType.includes('ESSAY') || rawType.includes('TEXT') || rawType.includes('FILL')) {
              qKind = 'SHORT_ANSWER';
            } else {
              qKind = 'MULTIPLE_CHOICE';
            }

            return {
              id: q.id,
              text: q.question_text || q.content || q.text || '',
              points: q.points || 1.0,
              type: qKind,
              mediaUrl: q.media_url || q.mediaUrl || q.image_url || q.imageUrl || null,
              audioUrl: q.audio_url || q.audioUrl || null,
              audioPlayLimit: q.audio_play_limit || 0,
              options: (q.options || []).map((o: any, idx: number) => ({
                key: String(o.id || idx + 1), // option_id
                label: o.option_text || o.content || o.label || '',
                desc: String.fromCharCode(65 + idx), // 'A', 'B', 'C', 'D'
                mediaUrl: o.media_url || o.mediaUrl || o.image_url || null,
                audioUrl: o.audio_url || o.audioUrl || null,
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
        const detailedMsg = err?.message || err?.response?.data?.detail || "Unable to start exam.";
        if (!targetExamId) {
          // Fallback to Demonstration Exam when accessing /exam directly without exam ID
          setQuestions(DEMO_QUESTIONS);
          setTimeLeft(3600);
          setExamTitle("Demonstration Exam (Image & Audio)");
          setSubject("General Knowledge");
          setErrorMsg(null);
        } else {
          setErrorMsg(detailedMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initExam();
  }, [targetExamId]);

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
    if (!activeExamId) return;
    try {
      await examService.saveAnswer(activeExamId, {
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
    if (!activeExamId) return;
    try {
      await examService.saveAnswer(activeExamId, {
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
      if (activeExamId) {
        const res = await examService.submitExam(activeExamId);
        if (res) {
          if (res.results_published === false || res.score === null) {
            setFinalScore(null);
          } else {
            setFinalScore(res.score);
          }
        }
      } else {
        setFinalScore(85);
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
      if (activeExamId) {
        const res = await examService.submitExam(activeExamId);
        if (res) {
          if (res.results_published === false || res.score === null) {
            setFinalScore(null);
          } else {
            setFinalScore(res.score);
          }
        }
      } else {
        setFinalScore(85);
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
            onClick={() => {
              const returnTab = examData.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'assigned_exams';
              navigate('/dashboard', { state: { activeTab: returnTab } });
            }}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
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
