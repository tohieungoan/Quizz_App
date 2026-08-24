import { Dispatch, SetStateAction } from 'react';
import { AlertModal } from '@/components/ui/AlertModal';
import { AIQuestionReviewModal, AIQuizModal } from '@/components/ui/AIQuizModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { QuestionBankModal } from '@/components/ui/QuestionBankModal';
import { AIQuestionReviewItem } from '@/types/aiQuiz';
import { Question } from '../quizCreatorModels';

export interface QuizCreatorAlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface QuizCreatorDialogsProps {
  deleteConfirmOpen: boolean;
  publishConfirmOpen: boolean;
  bankModalOpen: boolean;
  aiReviewOpen: boolean;
  aiModalOpen: boolean;
  alertState: QuizCreatorAlertState;
  questions: Question[];
  aiReviewQuestions: AIQuestionReviewItem[];
  aiReviewModelUsed: string;
  aiReviewGenerating: boolean;
  aiReviewRequestedCount: number;
  aiReviewReceivedCount: number;
  deletedBlacklist: string[];
  quickAIPrompt: string;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  onClosePublish: () => void;
  onConfirmPublish: () => void;
  onCloseBank: () => void;
  onAddBankQuestions: (questions: Question[]) => void;
  onCloseAlert: () => void;
  onReviewChange: Dispatch<SetStateAction<AIQuestionReviewItem[]>>;
  onReviewCancel: () => void;
  onReviewImport: (questions: AIQuestionReviewItem[], uploadedUrls: string[]) => void;
  onCloseAI: () => void;
  onStartAIGeneration: (formData: FormData, count: number) => void;
}

export function QuizCreatorDialogs(props: QuizCreatorDialogsProps) {
  return <>
    <ConfirmModal isOpen={props.deleteConfirmOpen} onClose={props.onCloseDelete} onConfirm={props.onConfirmDelete} title="Delete Question" message="Are you sure you want to delete this question? This action cannot be undone." />
    <ConfirmModal isOpen={props.publishConfirmOpen} onClose={props.onClosePublish} onConfirm={props.onConfirmPublish} title="Publish Quiz" message="Are you ready to publish this quiz? It will become visible to assigned users immediately." confirmText="Publish" variant="primary" />
    <AlertModal isOpen={props.alertState.isOpen} onClose={props.onCloseAlert} title={props.alertState.title} message={props.alertState.message} type={props.alertState.type} />
    <QuestionBankModal isOpen={props.bankModalOpen} onClose={props.onCloseBank} existingQuestionIds={props.questions.map(question => question.id)} onAddQuestions={props.onAddBankQuestions} />
    <AIQuestionReviewModal isOpen={props.aiReviewOpen} questions={props.aiReviewQuestions} modelUsed={props.aiReviewModelUsed} isGenerating={props.aiReviewGenerating} requestedCount={props.aiReviewRequestedCount} receivedCount={props.aiReviewReceivedCount} onChange={props.onReviewChange} onCancel={props.onReviewCancel} onImport={props.onReviewImport} />
    <AIQuizModal isOpen={props.aiModalOpen} onClose={props.onCloseAI} onStartGeneration={props.onStartAIGeneration} existingQuestions={props.questions.map(question => question.text)} deletedBlacklist={props.deletedBlacklist} initialPromptText={props.quickAIPrompt} />
  </>;
}
