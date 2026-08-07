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

export interface ScheduledBroadcastItem {
  id: number;
  admin_id?: number | null;
  title: string;
  content: string;
  type: string;
  target_type?: string;
  action_url?: string | null;
  is_scheduled: boolean;
  scheduled_at: string | null;
  status: string;
  job_id?: string | null;
  created_at: string;
}

export interface ScheduledBroadcastListResponse {
  data: ScheduledBroadcastItem[];
  total: number;
  pageIndex: number;
  pageSize: number;
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
    targetType?: string;
    targetGroupId?: number | null;
    actionUrl?: string | null;
    isScheduled: boolean;
    scheduledAt?: string | null;
  }): Promise<{ success: boolean; message: string; job_id?: string }> =>
    apiClient.post<{ success: boolean; message: string; job_id?: string }>('/notifications/broadcast', payload),

  /**
   * Fetch pending scheduled broadcasts (Admin)
   */
  getScheduledBroadcasts: (skip = 0, limit = 20): Promise<ScheduledBroadcastListResponse> =>
    apiClient.get<ScheduledBroadcastListResponse>(`/notifications/broadcast/history?status=PENDING&is_scheduled=true&skip=${skip}&limit=${limit}`),

  /**
   * Cancel/delete a scheduled broadcast (Admin)
   */
  cancelScheduledBroadcast: (jobIdOrId: string | number): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/notifications/broadcast/${jobIdOrId}`),

  /**
   * Delete a specific notification
   */
  deleteNotification: (notificationId: number): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`),

  /**
   * Clear all read notifications
   */
  clearAllRead: (): Promise<{ success: boolean; cleared_count: number }> =>
    apiClient.delete<{ success: boolean; cleared_count: number }>('/notifications/read'),

  /**
   * Delete all notifications (read and unread)
   */
  deleteAll: (): Promise<{ success: boolean; deleted_count: number }> =>
    apiClient.delete<{ success: boolean; deleted_count: number }>('/notifications/all'),
};
