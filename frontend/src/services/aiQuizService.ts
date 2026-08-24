import { apiClient } from './apiClient';
import {
  AIQuestionItem,
  AIQuizGenerateRequest,
  AIQuizGenerateResponse,
  DocumentPreviewResponse,
} from '@/types/aiQuiz';

export interface AIQuizStreamBatch {
  type: 'batch';
  questions: AIQuestionItem[];
  model_used: string;
  generated_count: number;
  requested_count: number;
}

export interface AIQuizStreamComplete {
  type: 'complete';
  model_used: string;
  generated_count: number;
  requested_count: number;
  failed_batches: number;
  processing_time_ms: number;
}

export const aiQuizService = {
  /**
   * Tạo câu hỏi trắc nghiệm từ tệp tài liệu và/hoặc văn bản
   */
  generate: async (formData: FormData, config?: RequestInit): Promise<AIQuizGenerateResponse> => {
    return apiClient.postMultipart<AIQuizGenerateResponse>('/ai-quiz/generate', formData, config);
  },

  generateProgressive: async (
    formData: FormData,
    onBatch: (event: AIQuizStreamBatch) => void,
    config?: RequestInit,
  ): Promise<AIQuizStreamComplete> => {
    const response = await apiClient.postMultipartStream(
      '/ai-quiz/generate-stream',
      formData,
      config,
    );
    if (!response.body) throw new Error('The AI stream is unavailable in this browser.');

    const reader = response.body.getReader();
    const signal = config?.signal;
    const decoder = new TextDecoder();
    let buffer = '';
    let completed: AIQuizStreamComplete | null = null;

    const processLine = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'batch') {
        onBatch(event as AIQuizStreamBatch);
      } else if (event.type === 'complete') {
        completed = event as AIQuizStreamComplete;
      } else if (event.type === 'error') {
        throw new Error(event.message || 'AI generation failed.');
      }
    };

    const abortStream = () => {
      void reader.cancel('AI generation cancelled by user.').catch(() => undefined);
    };
    signal?.addEventListener('abort', abortStream, { once: true });

    try {
      while (true) {
        if (signal?.aborted) throw new DOMException('AI generation cancelled.', 'AbortError');
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(processLine);
        if (done) break;
      }
      if (signal?.aborted) throw new DOMException('AI generation cancelled.', 'AbortError');
      processLine(buffer);
    } finally {
      signal?.removeEventListener('abort', abortStream);
      reader.releaseLock();
    }

    if (!completed) throw new Error('AI generation ended before completion.');
    return completed;
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
