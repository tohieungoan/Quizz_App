import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, Bell, Megaphone, Info } from 'lucide-react';
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
  }

  // 2. Map Time & Date from created_at
  const createdDate = new Date(item.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let time = 'Just now';
  if (diffMins > 0 && diffMins < 60) {
    time = `${diffMins}m ago`;
  } else if (diffHours > 0 && diffHours < 24) {
    time = `${diffHours}h ago`;
  } else if (diffDays > 0) {
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
    action_url: item.action_url
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
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

    // Poll every 30 seconds to fetch new notifications dynamically
    const interval = setInterval(fetchNotifications, 30000);

    const handleCustomEvent = () => fetchNotifications();
    window.addEventListener(EVENT_NAME, handleCustomEvent);

    return () => {
      clearInterval(interval);
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
