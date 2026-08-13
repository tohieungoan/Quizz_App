import { apiClient } from './apiClient'

export interface QuizCreatePayload {
  title: string;
  subject?: string;
  description?: string;
  difficulty?: string;
  is_public?: boolean;
  status?: string;
  shuffle_options?: boolean;
}

export interface QuizEditorResponse {
  quiz: any;
  questions: any[];
  builder_state?: Record<string, unknown> | null;
}

export interface QuizDraftSnapshot {
  expected_version: number;
  complete_snapshot: true;
  expected_question_count: number;
  title: string;
  subject?: string;
  description?: string;
  difficulty?: string;
  is_public: boolean;
  shuffle_options: boolean;
  builder_state?: Record<string, unknown> | null;
  questions: any[];
}

export const quizService = {
  getQuizzes: (params?: any): Promise<any> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<any>(`/quizzes${query}`);
  },
  getAdminQuizzes: (params?: any): Promise<any> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<any>(`/admin/quizzes${query}`);
  },
  getQuiz: (quizId: number | string): Promise<any> => apiClient.get<any>(`/quizzes/${quizId}`),
  createQuiz: (data: QuizCreatePayload): Promise<any> => apiClient.post<any>('/quizzes', data),
  updateQuiz: (quizId: number | string, data: Partial<QuizCreatePayload>): Promise<any> => apiClient.put<any>(`/quizzes/${quizId}`, data),
  deleteQuiz: (quizId: number | string): Promise<any> => apiClient.delete<any>(`/quizzes/${quizId}`),
  duplicateQuiz: (quizId: number | string): Promise<any> => apiClient.post<any>(`/quizzes/${quizId}/duplicate`, {}),
  createOrResumeDraft: (clientDraftId: string): Promise<QuizEditorResponse> =>
    apiClient.post<QuizEditorResponse>('/quizzes/drafts', { client_draft_id: clientDraftId }),
  getDraftByClientId: (clientDraftId: string): Promise<QuizEditorResponse> =>
    apiClient.get<QuizEditorResponse>(`/quizzes/drafts/${encodeURIComponent(clientDraftId)}`),
  getEditorQuiz: (quizId: number | string): Promise<QuizEditorResponse> =>
    apiClient.get<QuizEditorResponse>(`/quizzes/${quizId}/editor`),
  saveDraft: (quizId: number | string, data: QuizDraftSnapshot): Promise<QuizEditorResponse> =>
    apiClient.put<QuizEditorResponse>(`/quizzes/${quizId}/draft`, data),
  publishQuiz: (quizId: number | string, expectedVersion: number): Promise<QuizEditorResponse> =>
    apiClient.post<QuizEditorResponse>(`/quizzes/${quizId}/publish`, { expected_version: expectedVersion }),
}
