import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, DoorOpen, ClipboardList, History, Trophy, SlidersHorizontal, Settings, Search, Users, Calendar, List, AlertCircle } from 'lucide-react';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSidebar } from './components/DashboardSidebar';
import { OverviewTab } from './components/OverviewTab';
import { JoinRoomTab } from './components/JoinRoomTab';
import { HistoryTab } from './components/HistoryTab';
import { AchievementsTab } from './components/AchievementsTab';
import { HostStudioTab } from './components/HostStudioTab';
import { SettingsTab } from './components/SettingsTab';
import { HostRoomModal } from './components/HostRoomModal';
import { ExamDeadlineCalendar } from './components/ExamDeadlineCalendar';
import { USER_ASSIGNED_EXAMS } from '@/data/userData';
import { useLogout } from '@/hooks/useLogout';
import { examService, achievementService } from '@/services';

type TabType = 'overview' | 'join_room' | 'assigned_exams' | 'history' | 'achievements' | 'host_studio' | 'settings';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { activeTab?: TabType } | null;

  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    if (locationState?.activeTab) return locationState.activeTab;
    const saved = sessionStorage.getItem('dashboard_active_tab');
    return (saved as TabType) || 'overview';
  });

  const [assignedExamsViewMode, setAssignedExamsViewMode] = useState<'all' | 'calendar' | 'list'>('all');

  const mainScrollRef = useRef<HTMLElement>(null);
  const examPaginationRef = useRef<HTMLDivElement>(null);

  // Helper to check if an exam is overdue
  const checkIsOverdue = (exam: any) => {
    if (exam.status === 'Submitted') return false;
    if (!exam.due || exam.due === 'No Deadline') return false;
    const d = new Date(exam.due);
    return !isNaN(d.getTime()) && d < new Date();
  };

  useEffect(() => {
    if (locationState?.activeTab) {
      setActiveTabState(locationState.activeTab);
      sessionStorage.setItem('dashboard_active_tab', locationState.activeTab);
    }
  }, [locationState?.activeTab]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvt = e as CustomEvent<{ tab: TabType }>;
      if (customEvt.detail?.tab) {
        setActiveTabState(customEvt.detail.tab);
        sessionStorage.setItem('dashboard_active_tab', customEvt.detail.tab);
      }
    };
    window.addEventListener('quizzapp_switch_dashboard_tab', handleSwitchTab);
    return () => {
      window.removeEventListener('quizzapp_switch_dashboard_tab', handleSwitchTab);
    };
  }, []);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    sessionStorage.setItem('dashboard_active_tab', tab);
  };

  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  // Load equipped title from database on mount
  useEffect(() => {
    let isMounted = true;
    const fetchEquippedTitle = async () => {
      try {
        const badges = await achievementService.getMyBadges();
        if (isMounted && badges) {
          const equipped = badges.find((b) => b.category === 'TITLE' && b.is_equipped);
          if (equipped) {
            setActiveTitle(equipped.name);
            localStorage.setItem('equipped_title', equipped.name);
            sessionStorage.setItem('equipped_title', equipped.name);
            const stored = localStorage.getItem('user');
            if (stored) {
              try {
                const u = JSON.parse(stored);
                u.equipped_title = equipped.name;
                localStorage.setItem('user', JSON.stringify(u));
              } catch (e) {}
            }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load equipped title', err);
      }
      
      // Fallback: check stored user in localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (isMounted && parsed?.equipped_title) {
            setActiveTitle(parsed.equipped_title);
          }
        } catch {
          // ignore JSON parse error
        }
      }
    };

    fetchEquippedTitle();
    return () => {
      isMounted = false;
    };
  }, []);

  const [hostRoomModalOpen, setHostRoomModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [studentExams, setStudentExams] = useState<any[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  // Filters for Assigned Exams tab
  const [examSearch, setExamSearch] = useState('');
  const [examSubjectFilter, setExamSubjectFilter] = useState('All Subjects');
  const [examStatusFilter, setExamStatusFilter] = useState('All Status');
  const [examGroupFilter, setExamGroupFilter] = useState('All Groups');

  const loadStudentExams = async () => {
    try {
      setIsLoadingExams(true);
      setExamsError(null);
      const res = await examService.getMyExams();
      if (res) {
        const mapped = res.map((e: any) => ({
          id: e.exam_id,
          assigneeId: e.id,
          title: e.exam_title || 'Untitled Exam',
          due: e.end_time || 'No Deadline',
          subject: e.quiz_subject || 'General',
          groupName: e.group_name || 'Individual / General',
          duration: e.timer,
          status: e.status === 'COMPLETED' ? 'Submitted' : e.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started',
          score: e.score,
          submittedAt: e.submitted_at,
          rule: 'Free Navigation',
        }));
        setStudentExams(mapped);
      }
    } catch (err) {
      console.error("Failed to load student exams:", err);
      setExamsError("Failed to load assigned exams.");
    } finally {
      setIsLoadingExams(false);
    }
  };

  useEffect(() => {
    loadStudentExams();
  }, []);

  const STUDENT_EXAMS_PER_PAGE = 6;
  const [studentExamPage, setStudentExamPage] = useState(1);

  const handleExamPageChange = (newPage: number) => {
    const targetScrollTop = mainScrollRef.current ? mainScrollRef.current.scrollTop : window.scrollY;
    setStudentExamPage(newPage);
    
    // Instantly preserve scroll position without any jump or smooth-scroll animation
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = targetScrollTop;
      } else {
        window.scrollTo({ top: targetScrollTop, behavior: 'instant' as ScrollBehavior });
      }
    });
  };

  useEffect(() => { setStudentExamPage(1); }, [examSearch, examStatusFilter, examSubjectFilter]);

  const filteredStudentExams = studentExams.filter((ex) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      ex.subject.toLowerCase().includes(examSearch.toLowerCase());

    const matchesStatus =
      examStatusFilter === 'All Status' || ex.status === examStatusFilter;

    const matchesSubject =
      examSubjectFilter === 'All Subjects' || ex.subject === examSubjectFilter;

    const matchesGroup =
      examGroupFilter === 'All Groups' || ex.groupName === examGroupFilter;

    return matchesSearch && matchesStatus && matchesSubject && matchesGroup;
  });

  const totalStudentExamPages = Math.ceil(filteredStudentExams.length / STUDENT_EXAMS_PER_PAGE) || 1;
  const paginatedStudentExams = filteredStudentExams.slice(
    (studentExamPage - 1) * STUDENT_EXAMS_PER_PAGE,
    studentExamPage * STUDENT_EXAMS_PER_PAGE
  );

  const studentExamSubjects = ['All Subjects', ...Array.from(new Set(studentExams.map(e => e.subject).filter(Boolean)))];
  const studentExamGroups = ['All Groups', ...Array.from(new Set(studentExams.map(e => e.groupName).filter(Boolean)))];

  const handleStartExam = (exam: any) => {
    if (checkIsOverdue(exam)) {
      alert("This exam is overdue and can no longer be taken.");
      return;
    }
    sessionStorage.setItem('dashboard_active_tab', activeTab);
    const realExamId = exam.exam_id || exam.id;
    navigate('/exam', { state: { ...exam, exam_id: realExamId, id: realExamId, activeTab } });
  };

  const handleCreateQuiz = () => {
    sessionStorage.setItem('dashboard_active_tab', activeTab);
    navigate('/create-quiz', { state: { activeTab } });
  };

  const { logout } = useLogout();

  const handleLogout = () => logout();

  return (
    <div className="min-h-screen bg-surface-bright text-on-surface flex font-sans antialiased md:ml-64">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop & Mobile Header */}
        <DashboardHeader
          activeTitle={activeTitle}
          onLogout={handleLogout}
        />

        {/* Mobile Sub-header Bar */}
        <div className="md:hidden bg-white border-b border-outline-variant/30 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg">
              Tab: {activeTab.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl bg-surface-container active:scale-90 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Mobile Right-Side Slide-Over Drawer Menu with Smooth Transitions */}
        <div
          className={`md:hidden fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {/* Dark Backdrop Overlay */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-Over Content Drawer from Right */}
          <div
            className={`fixed inset-y-0 right-0 max-w-full flex pl-10 transform transition-transform duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between rounded-l-3xl overflow-hidden border-l border-outline-variant/20">
              
              {/* Drawer Header */}
              <div>
                <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-gradient-to-r from-surface-container-low to-surface-container">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-black flex items-center justify-center text-xs shadow-sm">
                      Q
                    </div>
                    <span className="font-extrabold text-sm text-on-surface tracking-tight">Navigation</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-90 transition-all cursor-pointer"
                    aria-label="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Menu Links */}
                <div className="p-4 space-y-2 font-medium text-sm text-left">
                  <button
                    onClick={() => {
                      setActiveTab('overview');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'overview'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Overview
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('join_room');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'join_room'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <DoorOpen className="w-4 h-4" /> Join Live Room
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('assigned_exams');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'assigned_exams'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" /> Assigned Exams
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('history');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'history'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <History className="w-4 h-4" /> History
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('achievements');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'achievements'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <Trophy className="w-4 h-4" /> Achievements
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('host_studio');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'host_studio'
                        ? 'bg-secondary text-white font-bold shadow-md translate-x-1'
                        : 'text-secondary font-bold hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Host Studio
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 active:scale-98 ${
                      activeTab === 'settings'
                        ? 'bg-primary text-white font-bold shadow-md translate-x-1'
                        : 'text-on-surface hover:bg-surface-container hover:translate-x-1'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-error hover:bg-error-container/20 font-bold transition-all flex items-center gap-3 active:scale-98"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Tab Body */}
        <main ref={mainScrollRef} className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              onStartExam={handleStartExam}
              onJoinRoom={() => setActiveTab('join_room')}
              onViewAllExams={() => setActiveTab('assigned_exams')}
              onViewHistory={() => setActiveTab('history')}
              assignedExams={studentExams}
              isLoadingExams={isLoadingExams}
            />
          )}

          {activeTab === 'join_room' && <JoinRoomTab />}

          {activeTab === 'assigned_exams' && (
            <div className="space-y-6 text-left">
              {/* Top Header & View Switcher */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Assigned Exams</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Exams assigned to you with deadline tracking</p>
                </div>
                
                {/* View Mode Switcher Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-outline-variant/30 self-stretch sm:self-auto justify-center">
                  <button
                    onClick={() => setAssignedExamsViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      assignedExamsViewMode === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All View
                  </button>
                  <button
                    onClick={() => setAssignedExamsViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      assignedExamsViewMode === 'calendar'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Calendar
                  </button>
                  <button
                    onClick={() => setAssignedExamsViewMode('list')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      assignedExamsViewMode === 'list'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Cards List
                  </button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <div className="relative w-full col-span-1 sm:col-span-2 lg:col-span-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-xs focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
                <select
                  value={examStatusFilter}
                  onChange={(e) => setExamStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Submitted</option>
                </select>
                <select
                  value={examSubjectFilter}
                  onChange={(e) => setExamSubjectFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none cursor-pointer truncate"
                >
                  {studentExamSubjects.map(sub => (
                    <option key={sub}>{sub}</option>
                  ))}
                </select>
                <select
                  value={examGroupFilter}
                  onChange={(e) => setExamGroupFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none cursor-pointer truncate"
                >
                  {studentExamGroups.map(grp => (
                    <option key={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              {/* Deadline Calendar Widget Section */}
              {(assignedExamsViewMode === 'all' || assignedExamsViewMode === 'calendar') && (
                <ExamDeadlineCalendar
                  exams={studentExams}
                  onStartExam={handleStartExam}
                />
              )}

              {/* Exam Cards List Section */}
              {(assignedExamsViewMode === 'all' || assignedExamsViewMode === 'list') && (
                <div>
                  {isLoadingExams ? (
                    <div className="py-16 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredStudentExams.length === 0 ? (
                    <div className="py-16 text-center text-on-surface-variant text-xs sm:text-sm bg-white rounded-2xl border border-outline-variant/20">
                      No assigned exams found matching your criteria.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-h-[420px] sm:min-h-[480px]">
                        {paginatedStudentExams.map((exam) => (
                          <div
                            key={exam.id}
                            className="bg-white p-4 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all text-left"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] sm:text-xs font-extrabold text-primary uppercase tracking-wider truncate">
                                  {exam.subject}
                                </span>
                                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                  exam.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' :
                                  checkIsOverdue(exam) ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                  exam.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {exam.status === 'Submitted' ? 'Submitted' : checkIsOverdue(exam) ? 'Expired' : exam.status}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug">{exam.title}</h3>
                              <p className="text-xs font-semibold text-secondary flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 shrink-0" /> Group: {exam.groupName || 'Individual'}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                Due: <span className="font-bold text-error">{exam.due !== 'No Deadline' ? new Date(exam.due).toLocaleString('vi-VN') : 'No Deadline'}</span>
                              </p>
                              {exam.duration && <p className="text-xs text-on-surface-variant">Duration: {exam.duration} minutes</p>}
                              {exam.status === 'Submitted' && exam.score !== undefined && (
                                <p className="text-xs sm:text-sm font-extrabold text-emerald-600 pt-1">
                                  Score: {exam.score}%
                                </p>
                              )}
                            </div>
                            {exam.status === 'Submitted' ? null : checkIsOverdue(exam) ? (
                              <button
                                disabled
                                className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-xl font-bold text-xs sm:text-sm cursor-not-allowed opacity-80 border border-slate-300 flex items-center justify-center gap-1.5"
                              >
                                <AlertCircle className="w-4 h-4 text-rose-500" /> Exam Expired (Overdue)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartExam(exam)}
                                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                              >
                                {exam.status === 'In Progress' ? 'Continue Exam' : 'Start Exam Now'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Student Exams Pagination */}
                      {totalStudentExamPages > 1 && (
                        <div
                          ref={examPaginationRef}
                          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-outline-variant/20 mt-6 text-xs text-on-surface-variant font-medium scroll-mt-6"
                        >
                          <div>
                            Showing <span className="font-bold text-on-surface">{(studentExamPage - 1) * STUDENT_EXAMS_PER_PAGE + 1}</span> to{' '}
                            <span className="font-bold text-on-surface">{Math.min(studentExamPage * STUDENT_EXAMS_PER_PAGE, filteredStudentExams.length)}</span> of{' '}
                            <span className="font-bold text-on-surface">{filteredStudentExams.length}</span> exams
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleExamPageChange(Math.max(1, studentExamPage - 1))}
                              disabled={studentExamPage === 1}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                            >
                              Previous
                            </button>
                            {Array.from({ length: totalStudentExamPages }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                onClick={() => handleExamPageChange(p)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                                  studentExamPage === p
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              onClick={() => handleExamPageChange(Math.min(totalStudentExamPages, studentExamPage + 1))}
                              disabled={studentExamPage === totalStudentExamPages}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                </>
              )}
            </div>
          )}
        </div>
      )}

          {activeTab === 'history' && <HistoryTab />}

          {activeTab === 'achievements' && (
            <AchievementsTab activeTitle={activeTitle} setActiveTitle={setActiveTitle} />
          )}

          {activeTab === 'host_studio' && (
            <HostStudioTab
              onOpenHostRoomModal={() => setHostRoomModalOpen(true)}
              onCreateQuiz={handleCreateQuiz}
              onEditQuiz={(quizId) => navigate(`/create-quiz/${quizId}`)}
            />
          )}

          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      {/* Host Room Modal */}
      <HostRoomModal
        isOpen={hostRoomModalOpen}
        onClose={() => setHostRoomModalOpen(false)}
      />
    </div>
  );
};
