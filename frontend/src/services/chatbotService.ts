import { apiClient } from './apiClient';

export interface ChatbotResponse {
  answer: string;
}

export const chatbotService = {
  sendChatMessage: async (question: string, sessionId: string = 'default'): Promise<ChatbotResponse> => {
    return apiClient.post<ChatbotResponse>('/chatbot/chat', {
      question,
      session_id: sessionId,
    });
  },

  clearChatHistory: async (sessionId: string = 'default'): Promise<{ status: string; message: string }> => {
    return apiClient.post<{ status: string; message: string }>('/chatbot/clear', {
      session_id: sessionId,
    });
  },
};
