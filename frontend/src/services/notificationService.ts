import { apiClient } from './apiClient';

export interface NotificationResponse {
  id: number;
  title: string;
  content: string;
  type: string | null;
  action_url: string | null;
  target_group_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  data: NotificationResponse[];
  unread_count: number;
}

export const notificationService = {
  /**
   * Fetch current user's notifications list and unread count
   */
  getNotifications: (skip = 0, limit = 50): Promise<NotificationListResponse> =>
    apiClient.get<NotificationListResponse>(`/notifications/?skip=${skip}&limit=${limit}`),

  /**
   * Mark a specific notification as read
   */
  markAsRead: (notificationId: number): Promise<{ success: boolean }> =>
    apiClient.put<{ success: boolean }>(`/notifications/${notificationId}/read`, {}),

  /**
   * Mark all unread notifications as read
   */
  markAllAsRead: (): Promise<{ success: boolean; marked_count: number }> =>
    apiClient.put<{ success: boolean; marked_count: number }>('/notifications/read-all', {}),

  /**
   * Send a system broadcast (Admin)
   */
  sendBroadcast: (payload: {
    title: string;
    content: string;
    type: string;
    targetType: string;
    targetGroupId?: number | null;
    targetUserId?: number | null;
    actionUrl?: string | null;
    isScheduled: boolean;
    scheduledAt?: string | null;
  }): Promise<{ success: boolean; message: string; job_id?: string }> =>
    apiClient.post<{ success: boolean; message: string; job_id?: string }>('/notifications/broadcast', payload),
};
