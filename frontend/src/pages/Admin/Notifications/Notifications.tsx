import { Search, MoreVertical, CheckCircle2, Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const { notifications, markAllAsRead } = useNotifications();

  const displayedNotifs = activeTab === 'unread' ? notifications.filter(n => n.unread) : notifications;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-headline-xl text-[28px] text-primary font-extrabold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5 text-white" />
              </div>
              Notifications & Alerts
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
              Stay updated with system warnings, room activities, and user feedback.
            </p>
          </div>
          <button onClick={markAllAsRead} className="self-start sm:self-auto text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
            Mark all as read
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex bg-surface-container-low p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'unread'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Unread
              <span className="bg-error text-on-error text-xs px-1.5 py-0.2 rounded-full">
                {notifications.filter(n => n.unread).length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-3">
          {displayedNotifs.map((n) => {
            const Icon = n.icon || Bell;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  n.unread
                    ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10'
                    : 'bg-surface-container-lowest border-outline-variant/30 opacity-90'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${n.bg} ${n.color} shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-on-surface text-base">{n.title}</h4>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                      )}
                      <span className="text-xs text-on-surface-variant font-medium ml-auto sm:ml-0">
                        • {n.time}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                </div>

                <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
