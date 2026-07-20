import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { USER_FORMAL_EXAM_QUESTIONS } from '@/data/userData';
import { ExamHeader } from './components/ExamHeader';
import { QuestionCard } from './components/QuestionCard';
import { QuestionPalette } from './components/QuestionPalette';
import { SubmitExamModal } from './components/SubmitExamModal';

export const FormalExam: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const examData = (location.state as any) || {};
  const examTitle = examData.title || 'Midterm Examination: Web & Network Architectures';
  const subject = examData.subject || 'Computer Science 301';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({
    1: 'A',
    2: 'B',
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set([4, 10]));
  const [timeLeft, setTimeLeft] = useState(2692); // 44:52 in seconds
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [successOverlayOpen, setSuccessOverlayOpen] = useState(false);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent right-click / context menu
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

  const handleOptionSelect = (qId: number, key: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: key }));
  };

  const handleTextChange = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleFlag = (qId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const activeQuestion = USER_FORMAL_EXAM_QUESTIONS[currentQuestionIndex];
  const isTimeCritical = timeLeft <= 300; // Under 5 minutes

  // Calculate statistics
  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)] !== '').length;
  const flaggedCount = flaggedQuestions.size;
  const totalQuestions = USER_FORMAL_EXAM_QUESTIONS.length;
  const remainingCount = totalQuestions - answeredCount;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

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
        />

        <QuestionPalette
          questions={USER_FORMAL_EXAM_QUESTIONS}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
          remainingCount={remainingCount}
          progressPercent={progressPercent}
          onSubmitClick={() => setSubmitModalOpen(true)}
        />
      </main>

      <SubmitExamModal
        submitModalOpen={submitModalOpen}
        successOverlayOpen={successOverlayOpen}
        remainingCount={remainingCount}
        flaggedCount={flaggedCount}
        subject={subject}
        onConfirmSubmit={() => {
          setSubmitModalOpen(false);
          setSuccessOverlayOpen(true);
        }}
        onCancelSubmit={() => setSubmitModalOpen(false)}
        onReturnDashboard={() => navigate('/dashboard')}
      />
    </div>
  );
};
