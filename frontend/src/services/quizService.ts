import { apiClient } from './apiClient'

export const quizService = {
  getQuizzes: (): Promise<any[]> => apiClient.get<any[]>('/quizzes/'),
}
