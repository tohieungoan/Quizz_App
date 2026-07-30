import { apiClient } from './apiClient';

export interface QuestionOptionCreatePayload {
  content?: string;
  audio_url?: string;
  media_url?: string;
  is_correct?: boolean;
}

export interface QuestionCreatePayload {
  parent_question_id?: number | null;
  type?: string;
  content: string;
  audio_url?: string;
  media_url?: string;
  audio_play_limit?: number;
  difficulty?: string;
  time_limit?: number;
  source?: string;
  is_original?: boolean;
  options?: QuestionOptionCreatePayload[];
}

export const questionService = {
  createQuestion: (quizId: number | string, data: QuestionCreatePayload): Promise<any> => {
    return apiClient.post<any>(`/quizzes/${quizId}/questions`, data);
  },
  getQuestions: (quizId: number | string, params?: any): Promise<any[]> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<any[]>(`/quizzes/${quizId}/questions${query}`);
  },
  updateQuestion: (questionId: number | string, data: any): Promise<any> => {
    return apiClient.put<any>(`/quizzes/questions/${questionId}`, data);
  },
  deleteQuestion: (questionId: number | string): Promise<any> => {
    return apiClient.delete<any>(`/quizzes/questions/${questionId}`);
  },
  getQuestionBank: (params?: any): Promise<any> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<any>(`/quizzes/questions/bank${query}`);
  }
};
