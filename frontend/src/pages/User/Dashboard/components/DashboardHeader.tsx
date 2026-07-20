import React, { useState } from 'react';
import { Search, Bell, Trophy, HelpCircle, Clock } from 'lucide-react';
import { DUMMY_NOTIFICATIONS } from '@/data/mockDb';
import { AiSupportModal } from './AiSupportModal';

interface DashboardHeaderProps {
  activeTitle: string | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTitle,
  onLogout,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-outline-variant/30 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input
              type="text"
              placeholder="Search quizzes, subjects, exams..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Title Badge */}
          {activeTitle && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Title: {activeTitle}
            </div>
          )}

          {/* AI Support Help Button (?) */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all"
            title="AI Support Assistant"
          >
            <HelpCircle className="w-4 h-4" />
            <span>AI Help</span>
          </button>

          {/* Notification Bell Dropdown with Hover */}
          <div
            className="relative"
            onMouseEnter={() => setIsNotifOpen(true)}
            onMouseLeave={() => setIsNotifOpen(false)}
          >
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>

            {/* Hover Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in duration-150 text-left">
                <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Recent Notifications</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {DUMMY_NOTIFICATIONS.length} New
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/20">
                  {DUMMY_NOTIFICATIONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 hover:bg-surface-bright transition-colors flex items-start gap-3 cursor-pointer"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-on-surface truncate">{item.title}</h5>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{item.desc}</p>
                          <div className="flex items-center gap-1 text-[10px] text-outline mt-1 font-medium">
                            <Clock className="w-3 h-3" /> {item.time} • {item.date}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 text-center">
                  <button className="text-xs font-bold text-primary hover:underline">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/30" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-xs shadow-sm">
              AJ
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-on-surface leading-snug">Alex Johnson</span>
              <span className="text-[10px] text-on-surface-variant font-medium">Student / Member</span>
            </div>
          </div>
        </div>
      </header>

      {/* AI Support Modal */}
      <AiSupportModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
};
