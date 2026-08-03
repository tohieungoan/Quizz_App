import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, Bell, Megaphone, Info, UserPlus } from 'lucide-react';
import { notificationService, NotificationResponse } from '@/services/notificationService';

export interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  date: string;
  icon: any;
  color: string;
  bg: string;
  unread: boolean;
  action_url?: string | null;
  type?: string | null;
  targetGroupId?: number | null;
}

const EVENT_NAME = 'quizzapp_notifications_updated';

const mapBackendNotification = (item: NotificationResponse): NotificationItem => {
  // 1. Map Icon, colors, bg
  let IconComponent = Bell;
  let color = 'text-primary';
  let bg = 'bg-primary/10';

  const typeUpper = item.type?.toUpperCase();

  if (typeUpper === 'SYSTEM' || typeUpper === 'WARNING') {
    IconComponent = AlertCircle;
    color = 'text-error';
    bg = 'bg-error-container';
  } else if (typeUpper === 'SUCCESS' || typeUpper === 'COMPLETED') {
    IconComponent = CheckCircle2;
    color = 'text-green-600';
    bg = 'bg-green-100';
  } else if (typeUpper === 'MESSAGE' || typeUpper === 'FEEDBACK') {
    IconComponent = MessageSquare;
    color = 'text-primary';
    bg = 'bg-primary/10';
  } else if (typeUpper === 'INFO') {
    IconComponent = Info;
    color = 'text-blue-600';
    bg = 'bg-blue-100';
  } else if (typeUpper === 'BROADCAST') {
    IconComponent = Megaphone;
    color = 'text-orange-600';
    bg = 'bg-orange-100';
  } else if (typeUpper === 'GROUP_INVITE') {
    IconComponent = UserPlus;
    color = 'text-indigo-600';
    bg = 'bg-indigo-100';
  }

  // 2. Map Time & Date from created_at (Ensure UTC 'Z' timezone indicator)
  let rawDateStr = String(item.created_at || '');
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/i.test(rawDateStr);
  if (rawDateStr && !hasTimezone) {
    rawDateStr += 'Z';
  }
  const createdDate = new Date(rawDateStr);

  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let time = 'Just now';
  if (diffMins <= 0) {
    time = 'Just now';
  } else if (diffMins < 60) {
    time = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    time = `${diffHours}h ago`;
  } else {
    time = `${diffDays}d ago`;
  }

  // Map date label
  let dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isToday = createdDate.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = createdDate.toDateString() === yesterday.toDateString();

  if (isToday) {
    dateStr = 'Today';
  } else if (isYesterday) {
    dateStr = 'Yesterday';
  }

  return {
    id: item.id,
    title: item.title,
    desc: item.content,
    time: time,
    date: dateStr,
    icon: IconComponent,
    color: color,
    bg: bg,
    unread: !item.is_read,
    action_url: item.action_url,
    type: item.type,
    targetGroupId: item.target_group_id
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Skip if not authenticated

    try {
      const response = await notificationService.getNotifications(0, 30);
      const mapped = response.data.map(mapBackendNotification);
      setNotifications(mapped);
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error('Failed to load notifications from API:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup real-time WebSocket connection for instant zero-latency notification delivery
    const token = localStorage.getItem('token');
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    if (token) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const apiHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '');
      const wsUrl = `${wsProtocol}//${apiHost}/api/v1/ws/notifications?token=${token}`;

      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = () => {
          // Instantly fetch notifications ONLY when server pushes a new WebSocket event
          fetchNotifications();
        };
        ws.onerror = () => {
          // Fallback interval ONLY if WebSocket connection fails
          if (!fallbackInterval) {
            fallbackInterval = setInterval(fetchNotifications, 120000);
          }
        };
      } catch (err) {
        console.warn('Failed to establish WebSocket notification channel:', err);
      }
    }

    const handleCustomEvent = () => fetchNotifications();
    window.addEventListener(EVENT_NAME, handleCustomEvent);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
    };
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Instantly update local states
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Instantly update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error(`Failed to mark notification ${notificationId} as read:`, err);
    }
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    markAsRead
  };
};