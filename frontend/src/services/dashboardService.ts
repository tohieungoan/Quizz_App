import { apiClient } from './apiClient';

export interface DashboardMetrics {
  total_quizzes: number;
  total_users: number;
  active_rooms: number;
  avg_score: number;
}

export interface HottestQuiz {
  quiz_id: number;
  title: string;
  play_count: number;
}

export interface RoomDistribution {
  game_mode: number;
  exam_mode: number;
}

export interface TopActiveRoom {
  id: number;
  room_code: string;
  quiz_title: string;
  host_name: string;
  participant_count: number;
  status: string;
}

export interface EngagementData {
  date: string;
  room_count: number;
}

export interface DashboardOverviewResponse {
  metrics: DashboardMetrics;
  hottest_quizzes: HottestQuiz[];
  room_distribution: RoomDistribution;
  top_active_rooms: TopActiveRoom[];
  engagement_history: EngagementData[];
}

export const dashboardService = {
  getOverview: (): Promise<DashboardOverviewResponse> =>
    apiClient.get<DashboardOverviewResponse>('/admin/dashboard/overview'),
};
