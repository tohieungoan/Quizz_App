import { useState, useEffect, useCallback } from 'react';
import { DUMMY_NOTIFICATIONS, NotificationItem } from '@/data/mockDb';
import * as LucideIcons from 'lucide-react';

const STORAGE_KEY = 'quizzapp_notifications';
const EVENT_NAME = 'quizzapp_notifications_updated';

// Helper to serialize icon to string
const serializeNotifications = (notifs: NotificationItem[]) => {
  return notifs.map(n => {
    // Find the icon name by matching the component
    let iconName = 'Bell';
    if (n.icon === LucideIcons.AlertCircle) iconName = 'AlertCircle';
    if (n.icon === LucideIcons.CheckCircle2) iconName = 'CheckCircle2';
    if (n.icon === LucideIcons.MessageSquare) iconName = 'MessageSquare';
    if (n.icon === (LucideIcons as any).Megaphone) iconName = 'Megaphone';
    if (n.icon === (LucideIcons as any).Info) iconName = 'Info';
    
    // Fallback if we added custom string to object
    if ((n as any).iconName) iconName = (n as any).iconName;

    return { ...n, icon: undefined, iconName };
  });
};

// Helper to deserialize icon from string
const deserializeNotifications = (items: any[]): NotificationItem[] => {
  return items.map(n => {
    const IconComponent = (LucideIcons as any)[n.iconName || 'Bell'] || LucideIcons.Bell;
    return { ...n, icon: IconComponent };
  });
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(deserializeNotifications(parsed));
      } catch (e) {
        setNotifications(DUMMY_NOTIFICATIONS);
      }
    } else {
      setNotifications(DUMMY_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeNotifications(DUMMY_NOTIFICATIONS)));
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadNotifications();
    };
    const handleCustomEvent = () => loadNotifications();

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener(EVENT_NAME, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
    };
  }, [loadNotifications]);

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'icon'> & { iconName: string }) => {
    const current = localStorage.getItem(STORAGE_KEY);
    let items = [];
    if (current) {
      items = JSON.parse(current);
    } else {
      items = serializeNotifications(DUMMY_NOTIFICATIONS);
    }

    const newNotif = {
      ...notif,
      id: Date.now(),
    };

    const newItems = [newNotif, ...items];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    window.dispatchEvent(new Event(EVENT_NAME)); // Notify other tabs/components
  };

  const markAllAsRead = () => {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const items = JSON.parse(current);
      const updated = items.map((n: any) => ({ ...n, unread: false }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_NAME));
    }
  };

  return {
    notifications,
    addNotification,
    markAllAsRead,
    unreadCount: notifications.filter(n => n.unread).length
  };
};
