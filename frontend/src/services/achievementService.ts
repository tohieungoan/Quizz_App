import { apiClient } from './apiClient';

export interface AchievementBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  points_required: number;
  type_value: string;
  target_value: number;
  created_at?: string;
  current_progress?: number;
  unlocked_count?: number;
  is_unlocked?: boolean;
  is_equipped?: boolean;
  unlocked_at?: string | null;
}

export interface BadgePageResponse {
  data: AchievementBadge[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export interface BadgeUserResponse {
  id: number;
  user_id: number;
  badge_id: number;
  current_progress: number;
  is_unlocked: boolean;
  is_equipped: boolean;
  unlocked_at: string | null;
  user_name: string;
  user_email: string;
}

export const achievementService = {
  // User APIs
  getMyBadges: async (): Promise<AchievementBadge[]> => {
    return apiClient.get('/badges/me');
  },

  equipBadge: async (badgeId: number): Promise<AchievementBadge> => {
    return apiClient.post(`/badges/${badgeId}/equip`);
  },

  // Admin APIs
  getBadges: async (params: { pageIndex?: number; pageSize?: number; search?: string; tier?: string }): Promise<BadgePageResponse> => {
    const queryParams: Record<string, string> = {};
    if (params.pageIndex) queryParams.pageIndex = params.pageIndex.toString();
    if (params.pageSize) queryParams.pageSize = params.pageSize.toString();
    if (params.search) queryParams.search = params.search;
    if (params.tier && params.tier !== 'All') queryParams.tier = params.tier;
    
    const query = new URLSearchParams(queryParams);
    return apiClient.get(`/admin/badges?${query.toString()}`);
  },

  getBadgeUsers: async (badgeId: number): Promise<BadgeUserResponse[]> => {
    return apiClient.get(`/admin/badges/${badgeId}/users`);
  },

  createBadge: async (data: Omit<AchievementBadge, 'id' | 'created_at' | 'current_progress'>): Promise<AchievementBadge> => {
    return apiClient.post('/admin/badges', data);
  },

  updateBadge: async (id: number, data: Omit<AchievementBadge, 'id' | 'created_at' | 'current_progress'>): Promise<AchievementBadge> => {
    return apiClient.put(`/admin/badges/${id}`, data);
  },

  deleteBadge: async (id: number): Promise<AchievementBadge> => {
    return apiClient.delete(`/admin/badges/${id}`);
  }
};
