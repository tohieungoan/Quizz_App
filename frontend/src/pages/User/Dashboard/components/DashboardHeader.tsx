import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Trophy, HelpCircle, Clock, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { AiSupportModal } from './AiSupportModal';
import { groupService } from '@/services';

interface DashboardHeaderProps {
  activeTitle: string | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTitle,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  const handleNotificationClick = (item: any) => {
    if (item.unread) {
      markAsRead(item.id);
    }
    setIsNotifOpen(false);

    const typeUpper = (item.type || '').toUpperCase();
    const titleUpper = (item.title || '').toUpperCase();
    const contentUpper = (item.content || '').toUpperCase();

    // Helper for navigation
    const goToTab = (tab: string, subTab?: string) => {
      sessionStorage.setItem('dashboard_active_tab', tab);
      if (subTab) {
        sessionStorage.setItem('host_studio_active_subtab', subTab);
      }
      window.dispatchEvent(new CustomEvent('quizzapp_switch_dashboard_tab', { detail: { tab } }));
      if (subTab) {
        window.dispatchEvent(new CustomEvent('quizzapp_switch_host_subtab', { detail: { subTab } }));
      }
      if (window.location.pathname !== '/dashboard') {
        navigate('/dashboard', { state: { activeTab: tab } });
      }
    };

    // 0. Live quiz lobby invitation -> Navigate directly to lobby
    if (item.action_url && item.action_url.includes('/lobby')) {
      navigate(item.action_url);
      return;
    }
    
    // 1. EXAM_ASSIGNED -> Navigate to My Assigned Exams tab
    if (
      typeUpper === 'EXAM_ASSIGNED' ||
      titleUpper.includes('EXAM ASSIGNED') ||
      titleUpper.includes('NEW EXAM')
    ) {
      goToTab('assigned_exams');
    }
    // 2. EXAM_GRADED / FEEDBACK / RESULTS -> Navigate to History & Results tab
    else if (
      typeUpper === 'EXAM_GRADED' ||
      typeUpper === 'FEEDBACK' ||
      typeUpper === 'RESULTS_PUBLISHED' ||
      titleUpper.includes('GRADED') ||
      titleUpper.includes('FEEDBACK') ||
      titleUpper.includes('RESULT')
    ) {
      goToTab('history');
    }
    // 3. GROUP / JOIN REQUEST -> Navigate to Host Studio tab -> My Study Groups sub-tab
    else if (
      typeUpper.includes('JOIN_REQUEST') ||
      typeUpper.includes('GROUP') ||
      titleUpper.includes('JOIN REQUEST') ||
      titleUpper.includes('JOIN') ||
      titleUpper.includes('GROUP') ||
      contentUpper.includes('REQUEST TO JOIN') ||
      (item.action_url && item.action_url.startsWith('/groups'))
    ) {
      goToTab('host_studio', 'groups');
    }
    // 4. HOST_STUDIO / SUBMISSION -> Navigate to Host Studio tab
    else if (
      typeUpper === 'SUBMISSION' ||
      typeUpper === 'HOST_STUDIO' ||
      titleUpper.includes('SUBMISSION')
    ) {
      goToTab('host_studio');
    }
    // 5. SETTINGS / PROFILE -> Navigate to Settings tab
    else if (
      typeUpper === 'SETTINGS' ||
      typeUpper === 'PROFILE' ||
      titleUpper.includes('PROFILE')
    ) {
      goToTab('settings');
    }
    // 6. Explicit action URL navigation
    else if (item.action_url) {
      if (item.action_url.startsWith('/exams/')) {
        goToTab('assigned_exams');
      } else if (item.action_url.startsWith('/groups')) {
        goToTab('host_studio', 'groups');
      } else {
        navigate(item.action_url);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; role?: string } | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const handleProfileChange = () => {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };

    window.addEventListener('storage', handleProfileChange);
    window.addEventListener('user-profile-updated', handleProfileChange);

    return () => {
      window.removeEventListener('storage', handleProfileChange);
      window.removeEventListener('user-profile-updated', handleProfileChange);
    };
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'Member';
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'Host';
    return 'Member';
  };

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

          {/* Notification Bell Dropdown with Click Outside */}
          <div
            ref={notifRef}
            className="relative"
          >
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
                </>
              )}
            </button>

            {/* Hover Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in duration-150 text-left">
                <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Recent Notifications</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
                    >
                      Mark all read
                    </button>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {unreadCount} New
                    </span>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/20">
                  {notifications.map((item) => {
                    const Icon = item.icon || Bell;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 hover:bg-surface-bright transition-colors flex items-start gap-3 cursor-pointer relative ${item.unread ? 'bg-primary/5' : ''}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bg || 'bg-primary/10'} ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-on-surface truncate">{item.title}</h5>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{item.desc}</p>
                          
                          {/* Invite Actions */}
                          {item.type === 'GROUP_INVITE' && item.targetGroupId && item.unread && (
                            <div className="flex items-center gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={async () => {
                                  try {
                                    await groupService.acceptInvite(item.targetGroupId!);
                                    markAsRead(item.id);
                                    alert("Successfully joined the group!");
                                  } catch (err) {
                                    console.error(err);
                                    alert("Failed to join group.");
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" /> Accept
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await groupService.declineInvite(item.targetGroupId!);
                                    markAsRead(item.id);
                                    alert("Invitation declined.");
                                  } catch (err) {
                                    console.error(err);
                                    alert("Failed to decline invitation.");
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition-all border border-rose-200 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          )}

                          {item.type === 'GROUP_INVITE' && item.targetGroupId && !item.unread && (
                            <span className="text-[10px] text-outline font-bold block mt-2.5 bg-surface-container px-2 py-0.5 rounded-md w-fit">
                              Invitation Responded
                            </span>
                          )}

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1 text-[10px] text-outline font-medium">
                              <Clock className="w-3 h-3" /> {item.time} • {item.date}
                            </div>
                            {item.type !== 'GROUP_INVITE' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(item);
                                }}
                                className="text-[10px] text-primary font-bold hover:underline"
                              >
                                View Details &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 text-center">
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/30" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name || 'User')
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-on-surface leading-snug truncate max-w-[120px]" title={user?.name || 'User'}>
                {user?.name || 'Alex Johnson'}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* AI Support Modal */}
      <AiSupportModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
};
