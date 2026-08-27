import { apiClient } from './apiClient'

export interface ExamAssignPayload {
  quiz_id: number;
  group_id: number;
  title?: string;
  start_time?: string; // ISO string
  end_time: string; // ISO string
  timer: number; // minutes
  navigation_rule?: 'FREE_NAV' | 'FIXED_NAV';
  results_published?: boolean;
  status?: string;
  use_ai_question?: boolean;
}

export interface ExamUpdatePayload {
  quiz_id?: number;
  group_id?: number;
  title?: string;
  start_time?: string;
  end_time?: string;
  timer?: number;
  navigation_rule?: 'FREE_NAV' | 'FIXED_NAV';
  results_published?: boolean;
  status?: string;
  use_ai_question?: boolean;
}

export const examService = {
  getAssignedExams: (): Promise<any> => apiClient.get<any>('/exams/assigned'),
  getMyExams: (): Promise<any> => apiClient.get<any>('/exams/my-exams'),
  assignExam: (data: ExamAssignPayload): Promise<any> => apiClient.post<any>('/exams/assign', data),
  getExamDetails: (examId: number | string): Promise<any> => apiClient.get<any>(`/exams/${examId}`),
  updateExam: (examId: number | string, data: ExamUpdatePayload): Promise<any> => apiClient.put<any>(`/exams/${examId}`, data),
  deleteExam: (examId: number | string): Promise<any> => apiClient.delete<any>(`/exams/${examId}`),
  getMissedQuestions: (examId: number | string): Promise<any> => apiClient.get<any>(`/exams/${examId}/missed-questions`),
  startExam: (examId: number | string): Promise<any> => apiClient.post<any>(`/exams/${examId}/start`, {}),
  takeExam: (examId: number | string): Promise<any> => apiClient.get<any>(`/exams/${examId}/take`),
  saveAnswer: (examId: number | string, data: { question_id: number; selected_option_id?: number | null; answer_text?: string | null }): Promise<any> =>
    apiClient.post<any>(`/exams/${examId}/answer`, data),
  submitExam: (examId: number | string): Promise<any> => apiClient.post<any>(`/exams/${examId}/submit`, {}),
  resetSubmission: (examId: number | string, userId: number | string): Promise<any> =>
    apiClient.post<any>(`/exams/${examId}/submissions/${userId}/reset`, {}),
  getSubmissionDetails: (examId: number | string, userId: number | string): Promise<any> =>
    apiClient.get<any>(`/exams/${examId}/submissions/${userId}`),
  saveSubmissionFeedback: (examId: number | string, userId: number | string, data: { feedback_comment?: string | null; score?: number | null }): Promise<any> =>
    apiClient.put<any>(`/exams/${examId}/submissions/${userId}/feedback`, data),
  gradeAnswer: (
    examId: number | string,
    userId: number | string,
    questionId: number | string,
    data: { is_correct: boolean; score?: number | null }
  ): Promise<any> =>
    apiClient.put<any>(`/exams/${examId}/submissions/${userId}/answers/${questionId}/grade`, data),
  getMyExamResult: (examId: number | string): Promise<any> =>
    apiClient.get<any>(`/exams/${examId}/my-result`),
}
