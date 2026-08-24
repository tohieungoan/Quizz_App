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
  Loader2,
  Play,
  Edit3,
  Award,
  Zap,
  Eye,
  Lock,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { AiSupportModal } from './AiSupportModal';
import { groupService, quizService, examService, achievementService } from '@/services';

interface DashboardHeaderProps {
  activeTitle: string | null;
  onLogout: () => void;
}

// Accent & case-insensitive normalization helper for Vietnamese & English
const normalizeStr = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTitle,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Header active equipped title state
  const [headerTitle, setHeaderTitle] = useState<string | null>(activeTitle);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal for Unpublished Exam Results Alert
  const [unpublishedModalOpen, setUnpublishedModalOpen] = useState(false);
  const [unpublishedExamTitle, setUnpublishedExamTitle] = useState('');

  useEffect(() => {
    setHeaderTitle(activeTitle);
  }, [activeTitle]);

  // Global Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [dbBadges, setDbBadges] = useState<any[]>([]);
  const [dbGroups, setDbGroups] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false);

  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get current logged-in user
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

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

  // Ultra-Smart Real-time Database Search Engine (Host Quizzes, Groups, Exams, History & Titles)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDbQuizzes([]);
      setDbExams([]);
      setDbHistory([]);
      setDbBadges([]);
      setDbGroups([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    const timer = setTimeout(async () => {
      const qNorm = normalizeStr(searchQuery);

      try {
        const [quizRes, examRes, assignedRes, badgeRes, myGroupsRes, membershipsRes] = await Promise.allSettled([
          quizService.getQuizzes({ limit: 100 }),
          examService.getMyExams(),
          examService.getAssignedExams(),
          achievementService.getMyBadges(),
          groupService.getMyGroups(),
          groupService.getMyMemberships(),
        ]);

        // 1. Host & User Quizzes / Bộ Đề Trắc Nghiệm
        if (quizRes.status === 'fulfilled' && quizRes.value) {
          const val = quizRes.value;
          const rawItems = Array.isArray(val)
            ? val
            : val.data || val.items || val.quizzes || [];
          const matched = rawItems.filter((q: any) => {
            const titleNorm = normalizeStr(q.title);
            const subjNorm = normalizeStr(q.subject);
            const descNorm = normalizeStr(q.description);
            return titleNorm.includes(qNorm) || subjNorm.includes(qNorm) || descNorm.includes(qNorm);
          });
          setDbQuizzes(matched.slice(0, 5));
        } else {
          setDbQuizzes([]);
        }

        // 2. Assigned Exams & History (My Exams + Assigned Exams)
        const combinedExamsMap = new Map<number, any>();

        if (examRes.status === 'fulfilled' && Array.isArray(examRes.value)) {
          examRes.value.forEach((e: any) => combinedExamsMap.set(e.id || e.exam_id, e));
        }
        if (assignedRes.status === 'fulfilled' && Array.isArray(assignedRes.value)) {
          assignedRes.value.forEach((e: any) => {
            const key = e.id || e.exam_id;
            if (!combinedExamsMap.has(key)) {
              combinedExamsMap.set(key, e);
            }
          });
        }

        const allExamsList = Array.from(combinedExamsMap.values());

        // Assigned pending/active exams (not completed yet)
        const matchedPending = allExamsList.filter((ex: any) => {
          if (ex.status === 'COMPLETED' || ex.status === 'Submitted') return false;
          const tNorm = normalizeStr(ex.title || ex.exam_title || ex.quiz_title);
          const sNorm = normalizeStr(ex.subject || ex.quiz_subject);
          return tNorm.includes(qNorm) || sNorm.includes(qNorm);
        });
        setDbExams(matchedPending.slice(0, 5));

        // History completed exams
        const matchedHistory = allExamsList.filter((ex: any) => {
          if (ex.status !== 'COMPLETED' && ex.status !== 'Submitted') return false;
          const tNorm = normalizeStr(ex.title || ex.exam_title || ex.quiz_title);
          const sNorm = normalizeStr(ex.subject || ex.quiz_subject);
          const hNorm = normalizeStr(ex.host_fullname);
          return tNorm.includes(qNorm) || sNorm.includes(qNorm) || hNorm.includes(qNorm);
        });
        setDbHistory(matchedHistory.slice(0, 5));

        // 3. Achievements & Badges / Titles
        if (badgeRes.status === 'fulfilled' && Array.isArray(badgeRes.value)) {
          const matchedBadges = badgeRes.value.filter((b: any) => {
            const nNorm = normalizeStr(b.name);
            const dNorm = normalizeStr(b.description);
            const cNorm = normalizeStr(b.category);
            return nNorm.includes(qNorm) || dNorm.includes(qNorm) || cNorm.includes(qNorm);
          });
          setDbBadges(matchedBadges.slice(0, 5));
        } else {
          setDbBadges([]);
        }

        // 4. Host Groups & Class Memberships
        const groupMap = new Map<number, any>();
        if (myGroupsRes.status === 'fulfilled' && Array.isArray(myGroupsRes.value)) {
          myGroupsRes.value.forEach((g: any) => groupMap.set(g.id, g));
        }
        if (membershipsRes.status === 'fulfilled' && Array.isArray(membershipsRes.value)) {
          membershipsRes.value.forEach((g: any) => {
            if (!groupMap.has(g.id)) groupMap.set(g.id, g);
          });
        }
        const allGroupsList = Array.from(groupMap.values());
        const matchedGroups = allGroupsList.filter((g: any) => {
          const nNorm = normalizeStr(g.name);
          const dNorm = normalizeStr(g.description);
          const cNorm = normalizeStr(g.group_code);
          return nNorm.includes(qNorm) || dNorm.includes(qNorm) || cNorm.includes(qNorm);
        });
        setDbGroups(matchedGroups.slice(0, 5));
      } catch (err) {
        console.error('Database search error:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick equip title handler
  const handleQuickEquipTitle = async (badge: any) => {
    try {
      await achievementService.equipBadge(badge.id);
      setHeaderTitle(badge.name);
      localStorage.setItem('equipped_title', badge.name);
      sessionStorage.setItem('equipped_title', badge.name);

      if (currentUser) {
        currentUser.equipped_title = badge.name;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      window.dispatchEvent(new Event('user-profile-updated'));

      setToastMsg(`⚡ Equipped title: "${badge.name}"!`);
      setTimeout(() => setToastMsg(null), 3000);
      setIsSearchOpen(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to equip title:', err);
      alert('Failed to equip title.');
    }
  };

  // Searchable navigation items mapping
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

  const filteredSearchResults = searchQuery.trim()
    ? searchableNavigationItems.filter((item) => {
        const qNorm = normalizeStr(searchQuery);
        return (
          normalizeStr(item.title).includes(qNorm) ||
          normalizeStr(item.subtitle).includes(qNorm) ||
          item.keywords.some((k) => normalizeStr(k).includes(qNorm))
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

    if (item.action_url && item.action_url.includes('/lobby')) {
      navigate(item.action_url);
      return;
    }

    if (
      typeUpper === 'EXAM_ASSIGNED' ||
      titleUpper.includes('EXAM ASSIGNED') ||
      titleUpper.includes('NEW EXAM')
    ) {
      goToTab('assigned_exams');
    } else if (
      typeUpper === 'EXAM_GRADED' ||
      typeUpper === 'FEEDBACK' ||
      typeUpper === 'RESULTS_PUBLISHED' ||
      titleUpper.includes('GRADED') ||
      titleUpper.includes('FEEDBACK') ||
      titleUpper.includes('RESULT')
    ) {
      goToTab('history');
    } else if (
      typeUpper.includes('JOIN_REQUEST') ||
      typeUpper.includes('GROUP') ||
      titleUpper.includes('JOIN REQUEST') ||
      titleUpper.includes('JOIN') ||
      titleUpper.includes('GROUP') ||
      contentUpper.includes('REQUEST TO JOIN') ||
      (item.action_url && item.action_url.startsWith('/groups'))
    ) {
      goToTab('host_studio', 'groups');
    } else if (
      typeUpper === 'SUBMISSION' ||
      typeUpper === 'HOST_STUDIO' ||
      titleUpper.includes('SUBMISSION')
    ) {
      goToTab('host_studio');
    } else if (
      typeUpper === 'SETTINGS' ||
      typeUpper === 'PROFILE' ||
      titleUpper.includes('PROFILE')
    ) {
      goToTab('settings');
    } else if (item.action_url) {
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

  const hasDbResults =
    dbQuizzes.length > 0 ||
    dbExams.length > 0 ||
    dbHistory.length > 0 ||
    dbBadges.length > 0 ||
    dbGroups.length > 0;

  return (
    <>
      {/* Toast Banner for Quick Equipped Title */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-amber-400/40">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal for Unpublished Exam Results Alert */}
      {unpublishedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/30 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Results Not Published Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Results for <span className="font-bold text-slate-700">"{unpublishedExamTitle}"</span> have not been published by the host yet. Please check back later!
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setUnpublishedModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Smart Search: Quizzes, History, Exams, Titles, Groups..."
              className="w-full pl-8 sm:pl-10 pr-8 py-1.5 sm:py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary text-on-surface shadow-xs transition-all"
            />
            {isSearchingDb ? (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            ) : (
              searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full text-xs transition-colors cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>

          {/* Interactive Global Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 top-full mt-2 w-full sm:w-[520px] bg-white rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
              <div className="px-3.5 py-2.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
                  {searchQuery ? `Smart Search Results` : 'Quick Navigation'}
                </span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-xs text-outline">
                  ESC to close
                </kbd>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-outline-variant/10 p-2 space-y-2">
                {/* 1. Host & User Quizzes / Trắc Nghiệm -> Open Quiz Creator to Edit */}
                {dbQuizzes.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> Host Quizzes & Question Sets ({dbQuizzes.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {dbQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            navigate(`/create-quiz/${quiz.id}`);
                          }}
                          className="p-2.5 hover:bg-indigo-50/60 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-indigo-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-on-surface truncate group-hover:text-indigo-800 transition-colors">
                                {quiz.title}
                              </h5>
                              <p className="text-[10px] text-on-surface-variant truncate">
                                {quiz.subject || 'General'} • {quiz.questions?.length || 0} Questions • Click to Edit Quiz
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white flex items-center gap-1 shrink-0 shadow-xs group-hover:bg-indigo-700 transition-all">
                            Edit Quiz <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Assigned Exams -> Take Exam (Member) or Edit/Host (Owner) */}
                {dbExams.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Assigned Exams ({dbExams.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {dbExams.map((exam) => {
                        const isOwner = Boolean(
                          currentUser && (
                            (currentUser.id && (
                              exam.host_id === currentUser.id ||
                              exam.owner_id === currentUser.id ||
                              exam.creator_id === currentUser.id ||
                              exam.created_by === currentUser.id ||
                              exam.user_id === currentUser.id
                            )) ||
                            (currentUser.role && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) ||
                            (currentUser.name && exam.host_fullname && normalizeStr(exam.host_fullname).includes(normalizeStr(currentUser.name)))
                          )
                        );
                        return (
                          <div
                            key={exam.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              if (isOwner) {
                                sessionStorage.setItem('selected_host_exam_id', String(exam.id || exam.exam_id));
                                goToTab('host_studio', 'exams');
                              } else {
                                navigate('/exam', { state: { exam_id: exam.id, id: exam.id, title: exam.title || exam.exam_title, ...exam } });
                              }
                            }}
                            className="p-2.5 hover:bg-amber-50 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-amber-200"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-on-surface truncate group-hover:text-amber-800 transition-colors">
                                  {exam.title || exam.exam_title || exam.quiz_title || 'Formal Exam'}
                                </h5>
                                <p className="text-[10px] text-on-surface-variant truncate">
                                  {isOwner ? 'Host / Creator (Click to Edit Exam Status & Settings)' : `Timer: ${exam.timer || 30}m • Click to Take Exam`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg text-white flex items-center gap-1 shrink-0 shadow-xs transition-all ${
                                isOwner ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'
                              }`}
                            >
                              {isOwner ? (
                                <>
                                  <Settings className="w-3 h-3" /> Edit Exam Settings
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-current" /> Take Exam
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. History & Completed Exam Results */}
                {dbHistory.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3 h-3" /> Completed History & Results ({dbHistory.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {dbHistory.map((ex) => {
                        const isPublic = ex.results_published === true;
                        return (
                          <div
                            key={ex.id || ex.assignee_id || ex.exam_id}
                            onClick={() => {
                              if (isPublic) {
                                sessionStorage.setItem('selected_history_exam_id', String(ex.exam_id || ex.id || ex.assignee_id));
                                goToTab('history');
                              } else {
                                setUnpublishedExamTitle(ex.title || ex.exam_title || ex.quiz_title || 'Formal Exam');
                                setUnpublishedModalOpen(true);
                              }
                            }}
                            className={`p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent ${
                              isPublic ? 'hover:bg-emerald-50 hover:border-emerald-200' : 'hover:bg-amber-50/70 hover:border-amber-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isPublic ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                                  {ex.title || ex.exam_title || ex.quiz_title || 'Completed Exam'}
                                </h5>
                                <p className="text-[10px] text-on-surface-variant truncate">
                                  {isPublic ? (
                                    <>Score: <span className="font-bold text-emerald-700">{ex.score ?? 'N/A'} pts</span> • Results Published</>
                                  ) : (
                                    <span className="text-amber-700 font-bold">Results Not Published Yet</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg text-white flex items-center gap-1 shrink-0 shadow-xs transition-all ${
                              isPublic ? 'bg-emerald-600 group-hover:bg-emerald-700' : 'bg-amber-600 group-hover:bg-amber-700'
                            }`}>
                              {isPublic ? (
                                <><Eye className="w-3 h-3" /> View Results</>
                              ) : (
                                <><Lock className="w-3 h-3" /> Results Pending</>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Achievements & Instant Equip Titles */}
                {dbBadges.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3 h-3 text-amber-500" /> Titles & Badges (Click to Equip ⚡)
                    </div>
                    <div className="space-y-1 mt-1">
                      {dbBadges.map((badge) => (
                        <div
                          key={badge.id}
                          onClick={() => handleQuickEquipTitle(badge)}
                          className="p-2.5 hover:bg-amber-50/80 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-amber-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              🏆
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-on-surface truncate group-hover:text-amber-800 transition-colors">
                                {badge.name}
                              </h5>
                              <p className="text-[10px] text-on-surface-variant truncate">
                                {badge.description || 'Achievement Badge'} • Click to equip title
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shrink-0 shadow-xs transition-all">
                            <Zap className="w-3 h-3 fill-current text-yellow-200" /> Use Title ⚡
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Study Groups & Class Memberships */}
                {dbGroups.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-black text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Study Groups ({dbGroups.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {dbGroups.map((group) => (
                        <div
                          key={group.id}
                          onClick={() => {
                            sessionStorage.setItem('selected_group_id', String(group.id));
                            goToTab('host_studio', 'groups');
                          }}
                          className="p-2.5 hover:bg-purple-50 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-purple-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-on-surface truncate group-hover:text-purple-800 transition-colors">
                                {group.name}
                              </h5>
                              <p className="text-[10px] text-on-surface-variant truncate">
                                Code: {group.group_code} • {group.description || 'Study Group'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-600 text-white flex items-center gap-1 shrink-0 shadow-xs group-hover:bg-purple-700 transition-all">
                            <Edit3 className="w-3 h-3" /> Manage Group
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Section Navigation Items */}
                <div>
                  {searchQuery && (
                    <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Quick Navigation
                    </div>
                  )}
                  <div className="space-y-1">
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            className="w-full p-2.5 hover:bg-primary/5 rounded-xl transition-all flex items-center gap-3 text-left group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
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
                      !hasDbResults && (
                        <div className="p-6 text-center text-outline">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-bold">No matching item found</p>
                          <p className="text-[11px] text-outline mt-0.5">Try searching for "Exams", "History", "Host", or "Badges"</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Active Title Badge */}
          {headerTitle && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold animate-in fade-in duration-200">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Title: {headerTitle}
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
                                    markAllAsRead();
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
                                    markAllAsRead();
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
