import { apiClient } from './apiClient';

export interface ReportMetrics {
  avg_score: number;
  total_participants: number;
  total_questions: number;
}

export interface ReportListItem {
  id: number;
  type: 'ROOM' | 'EXAM';
  room_code: string;
  quiz_title: string;
  room_title: string;
  host: string;
  date: string;
  participants: number;
  avg_score: string;
}

export interface ReportPageResponse {
  data: ReportListItem[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export interface ReportParticipant {
  id: string;
  user_id?: string;
  nickname: string;
  status: string;
  joined_at?: string;
  score: number;
  time_taken?: string;
  correct_answers?: string;
  accuracy?: string;
  rank?: number;
  version_code?: string | null;
}

export interface ReportParticipantPageResponse {
  data: ReportParticipant[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export interface ReportQuestionAnalysis {
  id: number;
  original_question_id?: number | null;
  version_code?: string | null;
  question: string;
  correct: number;
  incorrect: number;
  rate: number;
  difficulty: string;
}

export interface ReportQuestionPageResponse {
  data: ReportQuestionAnalysis[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export const reportService = {
  getMetrics: async (): Promise<ReportMetrics> => {
    return apiClient.get('/admin/reports/metrics');
  },

  getReports: async (params: { pageIndex?: number; pageSize?: number; search?: string; reportType?: string }): Promise<ReportPageResponse> => {
    const query = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return apiClient.get(`/admin/reports?${query.toString()}`);
  },

  getParticipants: async (
    sessionId: number,
    type: string,
    params?: { pageIndex?: number; pageSize?: number }
  ): Promise<ReportParticipantPageResponse> => {
    const query = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(params || {}).map(([k, v]) => [k, String(v)])) });
    return apiClient.get(`/admin/reports/${sessionId}/participants?${query.toString()}`);
  },

  getQuestions: async (
    sessionId: number,
    type: string,
    params?: { pageIndex?: number; pageSize?: number }
  ): Promise<ReportQuestionPageResponse> => {
    const query = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(params || {}).map(([k, v]) => [k, String(v)])) });
    return apiClient.get(`/admin/reports/${sessionId}/questions?${query.toString()}`);
  },
  
  exportReport: async (sessionId: number, type: string) => {
    const token = localStorage.getItem('token');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${apiBaseUrl}/admin/reports/${sessionId}/export?type=${type}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to export');
    return res.blob();
  }
};
