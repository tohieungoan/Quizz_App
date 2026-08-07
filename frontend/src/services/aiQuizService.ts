import { apiClient } from './apiClient';
import {
  AIQuizGenerateRequest,
  AIQuizGenerateResponse,
  DocumentPreviewResponse,
} from '@/types/aiQuiz';

export const aiQuizService = {
  /**
   * Tạo câu hỏi trắc nghiệm từ tệp tài liệu và/hoặc văn bản
   */
  generate: async (formData: FormData, config?: RequestInit): Promise<AIQuizGenerateResponse> => {
    return apiClient.postMultipart<AIQuizGenerateResponse>('/ai-quiz/generate', formData, config);
  },

  /**
   * Bóc tách xem trước tài liệu và số trang
   */
  previewDocument: async (formData: FormData): Promise<DocumentPreviewResponse> => {
    return apiClient.postMultipart<DocumentPreviewResponse>('/ai-quiz/preview-document', formData);
  },

  /**
   * Kiểm tra tình trạng kết nối tới các Model AI
   */
  getModelsStatus: async (): Promise<{ status: string; primary_model: string; fallback_model: string; active_cascade: string[] }> => {
    return apiClient.get('/ai-quiz/models/status');
  },
};
