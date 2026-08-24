import { useState, useEffect, useCallback } from 'react';
import { getWebSocketUrl } from '@/utils/getWebSocketUrl';
import { 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Bell, 
  Megaphone, 
  Info, 
  UserPlus, 
  ShieldAlert, 
  UserCheck, 
  Trash2, 
  GraduationCap, 
  Layers, 
  Sparkles,
  Server
} from 'lucide-react';
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
  category: 'security' | 'lifecycle' | 'system' | 'academic' | 'general';
  unread: boolean;
  action_url?: string | null;
  type?: string | null;
  targetGroupId?: number | null;
  created_at?: string;
}

const EVENT_NAME = 'quizzapp_notifications_updated';

const mapBackendNotification = (item: NotificationResponse): NotificationItem => {
  // 1. Map Icon, colors, bg, and category
  let IconComponent = Bell;
  let color = 'text-primary';
  let bg = 'bg-primary/10';
  let category: NotificationItem['category'] = 'general';

  const typeUpper = (item.type || '').toUpperCase();
  const titleUpper = (item.title || '').toUpperCase();

  if (typeUpper.includes('SECURITY') || titleUpper.includes('SECURITY') || titleUpper.includes('PERMISSION') || titleUpper.includes('ROLE CHANGED')) {
    IconComponent = ShieldAlert;
    color = 'text-amber-600';
    bg = 'bg-amber-100 dark:bg-amber-950/40';
    category = 'security';
  } else if (typeUpper.includes('DELETION') || titleUpper.includes('DELETED') || titleUpper.includes('CRITICAL')) {
    IconComponent = Trash2;
    color = 'text-rose-600';
    bg = 'bg-rose-100 dark:bg-rose-950/40';
    category = 'security';
  } else if (typeUpper.includes('LIFECYCLE') || typeUpper.includes('IMPORT') || titleUpper.includes('REGISTERED') || titleUpper.includes('IMPORTED') || titleUpper.includes('USER')) {
    IconComponent = UserCheck;
    color = 'text-emerald-600';
    bg = 'bg-emerald-100 dark:bg-emerald-950/40';
    category = 'lifecycle';
  } else if (typeUpper.includes('EXAM') || typeUpper.includes('QUIZ') || titleUpper.includes('EXAM') || titleUpper.includes('QUIZ') || titleUpper.includes('GRADE')) {
    IconComponent = GraduationCap;
    color = 'text-indigo-600';
    bg = 'bg-indigo-100 dark:bg-indigo-950/40';
    category = 'academic';
  } else if (typeUpper.includes('GROUP') || typeUpper.includes('INVITE') || titleUpper.includes('GROUP')) {
    IconComponent = UserPlus;
    color = 'text-cyan-600';
    bg = 'bg-cyan-100 dark:bg-cyan-950/40';
    category = 'academic';
  } else if (typeUpper === 'SYSTEM' || typeUpper === 'WARNING' || titleUpper.includes('SYSTEM')) {
    IconComponent = Server;
    color = 'text-blue-600';
    bg = 'bg-blue-100 dark:bg-blue-950/40';
    category = 'system';
  } else if (typeUpper === 'BROADCAST') {
    IconComponent = Megaphone;
    color = 'text-purple-600';
    bg = 'bg-purple-100 dark:bg-purple-950/40';
    category = 'general';
  } else if (typeUpper === 'SUCCESS' || typeUpper === 'COMPLETED') {
    IconComponent = CheckCircle2;
    color = 'text-emerald-600';
    bg = 'bg-emerald-100 dark:bg-emerald-950/40';
    category = 'general';
  } else if (typeUpper === 'MESSAGE' || typeUpper === 'FEEDBACK') {
    IconComponent = MessageSquare;
    color = 'text-primary';
    bg = 'bg-primary/10';
    category = 'general';
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
    category: category,
    unread: !item.is_read,
    action_url: item.action_url,
    type: item.type,
    targetGroupId: item.target_group_id,
    created_at: item.created_at
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
      const wsUrl = getWebSocketUrl(`/api/v1/ws/notifications?token=${token}`);

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

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error(`Failed to delete notification ${notificationId}:`, err);
    }
  };

  const clearAllRead = async () => {
    try {
      await notificationService.clearAllRead();
      setNotifications(prev => prev.filter(n => n.unread));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Failed to clear all read notifications:', err);
    }
  };

  const deleteAll = async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAllRead,
    deleteAll
  };
};