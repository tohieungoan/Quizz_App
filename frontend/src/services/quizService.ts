import { apiClient } from './apiClient'

export interface QuizCreatePayload {
  title: string;
  subject?: string;
  description?: string;
  difficulty?: string;
  is_public?: boolean;
  status?: string;
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
}
