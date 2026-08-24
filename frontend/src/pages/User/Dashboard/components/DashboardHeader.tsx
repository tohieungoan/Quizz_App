import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Trophy,
  HelpCircle,
  Clock,
  Check,
  X,
  Sparkles,
  FileText,
  History,
  Radio,
  Users,
  BookOpen,
  Settings,
  ChevronRight,
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Helper for tab & feature navigation
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
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Searchable navigation items mapping (Assigned Exams, History, Host Studio, Achievements, etc.)
  const searchableNavigationItems = [
    {
      id: 'assigned_exams',
      title: 'Assigned Exams',
      subtitle: 'View & take formal exams assigned to you by hosts',
      category: 'Exams',
      icon: FileText,
      action: () => goToTab('assigned_exams'),
      keywords: ['assigned', 'exams', 'test', 'bài thi', 'được giao', 'formal', 'exam', 'giao'],
    },
    {
      id: 'history',
      title: 'History & Results',
      subtitle: 'Review past quiz scores, feedback & performance reports',
      category: 'Analytics',
      icon: History,
      action: () => goToTab('history'),
      keywords: ['history', 'results', 'scores', 'lịch sử', 'kết quả', 'điểm', 'past', 'báo cáo'],
    },
    {
      id: 'host_studio',
      title: 'Host Studio & Live Rooms',
      subtitle: 'Create live quiz rooms, manage sessions & active hosts',
      category: 'Host Studio',
      icon: Radio,
      action: () => goToTab('host_studio'),
      keywords: ['host', 'studio', 'live', 'room', 'phòng thi', 'tạo phòng', 'trực tiếp', 'quản lý'],
    },
    {
      id: 'host_groups',
      title: 'Study Groups & Classes',
      subtitle: 'Manage classes, student rosters & join requests',
      category: 'Groups',
      icon: Users,
      action: () => goToTab('host_studio', 'groups'),
      keywords: ['group', 'groups', 'study', 'class', 'lớp', 'nhóm', 'thành viên', 'họctập'],
    },
    {
      id: 'achievements',
      title: 'Achievements & Titles',
      subtitle: 'Unlock badges, equipped titles & view level progress',
      category: 'Gamification',
      icon: Trophy,
      action: () => goToTab('achievements'),
      keywords: ['achievements', 'badges', 'titles', 'danh hiệu', 'thành tựu', 'huy chương', 'trophy', 'level'],
    },
    {
      id: 'my_quizzes',
      title: 'My Quizzes & Question Bank',
      subtitle: 'Browse, edit or create new quizzes and question sets',
      category: 'Content',
      icon: BookOpen,
      action: () => goToTab('dashboard'),
      keywords: ['quizzes', 'my quizzes', 'bộ đề', 'câu hỏi', 'bank', 'ngân hàng', 'đề thi'],
    },
    {
      id: 'settings',
      title: 'Account Settings & Profile',
      subtitle: 'Update profile details, password & notification preferences',
      category: 'Settings',
      icon: Settings,
      action: () => goToTab('settings'),
      keywords: ['settings', 'profile', 'cài đặt', 'mật khẩu', 'tài khoản', 'account', 'hồ sơ'],
    },
    {
      id: 'ai_help',
      title: 'AI Support Assistant (Quizzy)',
      subtitle: 'Ask AI for assistance with quizzes, rooms & features',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => {
        setIsAiModalOpen(true);
        setIsSearchOpen(false);
        setSearchQuery('');
      },
      keywords: ['ai', 'help', 'assistant', 'trợ lý', 'quizzy', 'support', 'hỗ trợ', 'hỏi đáp'],
    },
  ];

  // Filter items matching query
  const filteredSearchResults = searchQuery.trim()
    ? searchableNavigationItems.filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : searchableNavigationItems;

  const handleNotificationClick = (item: any) => {
    if (item.unread) {
      markAsRead(item.id);
    }
    setIsNotifOpen(false);

    const typeUpper = (item.type || '').toUpperCase();
    const titleUpper = (item.title || '').toUpperCase();
    const contentUpper = (item.content || '').toUpperCase();

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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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
      <header className="bg-white border-b border-outline-variant/30 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Global Search Component */}
        <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-outline w-3.5 h-3.5 sm:w-4 sm:h-4 z-10 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search Assigned Exams, History, Host Studio, Badges..."
              className="w-full pl-8 sm:pl-10 pr-8 py-1.5 sm:py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary text-on-surface shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full text-xs transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Global Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
              <div className="px-3.5 py-2.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
                  {searchQuery ? `Search Results (${filteredSearchResults.length})` : 'Quick Navigation'}
                </span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-xs text-outline">
                  ESC to close
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10 p-1.5">
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full p-2.5 hover:bg-primary/5 rounded-xl transition-all flex items-center gap-3 text-left group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                              {item.title}
                            </h5>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-outline">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">No matching section found</p>
                    <p className="text-[11px] text-outline mt-0.5">Try searching for "Exams", "History", "Host", or "Badges"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Active Title Badge */}
          {activeTitle && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Title: {activeTitle}
            </div>
          )}

          {/* Header AI Support Help Button (Desktop only) */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="AI Support Assistant"
          >
            <HelpCircle className="w-4 h-4" />
            <span>AI Help</span>
          </button>

          {/* Notification Bell Dropdown with Click Outside */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all cursor-pointer"
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
                      className="text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
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
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
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
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition-all border border-rose-200 flex items-center gap-1 cursor-pointer"
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
                                className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
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
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
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

      {/* Floating AI Help Message Bubble Widget */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary to-indigo-600 text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group ring-4 ring-primary/20 cursor-pointer"
        title="AI Support Assistant"
        aria-label="AI Help Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
        </div>
        <span className="font-bold text-xs sm:text-sm pr-1 hidden sm:inline-block">AI Help</span>
      </button>
    </>
  );
};
