import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, DoorOpen, ClipboardList, History, Trophy, SlidersHorizontal, Settings } from 'lucide-react';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSidebar } from './components/DashboardSidebar';
import { OverviewTab } from './components/OverviewTab';
import { JoinRoomTab } from './components/JoinRoomTab';
import { HistoryTab } from './components/HistoryTab';
import { AchievementsTab } from './components/AchievementsTab';
import { HostStudioTab } from './components/HostStudioTab';
import { SettingsTab } from './components/SettingsTab';
import { HostRoomModal } from './components/HostRoomModal';
import { USER_ASSIGNED_EXAMS } from '@/data/userData';

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

  useEffect(() => {
    if (locationState?.activeTab) {
      setActiveTabState(locationState.activeTab);
      sessionStorage.setItem('dashboard_active_tab', locationState.activeTab);
    }
  }, [locationState?.activeTab]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    sessionStorage.setItem('dashboard_active_tab', tab);
  };

  const [activeTitle, setActiveTitle] = useState<string | null>('Perfect Score');
  const [hostRoomModalOpen, setHostRoomModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStartExam = (exam: any) => {
    sessionStorage.setItem('dashboard_active_tab', activeTab);
    navigate('/exam', { state: { ...exam, activeTab } });
  };

  const handleCreateQuiz = () => {
    sessionStorage.setItem('dashboard_active_tab', activeTab);
    navigate('/create-quiz', { state: { activeTab } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('dashboard_active_tab');
    navigate('/login');
  };

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
        <div className="md:hidden bg-white border-b border-outline-variant/30 px-4 py-2 flex items-center justify-between sticky top-[57px] z-20">
          <span className="font-bold text-xs text-primary uppercase tracking-wider">
            Tab: {activeTab.replace('_', ' ')}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg bg-surface-container"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-outline-variant/30 p-4 space-y-1.5 font-medium text-sm text-left">
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('join_room');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <DoorOpen className="w-4 h-4" /> Join Live Room
            </button>
            <button
              onClick={() => {
                setActiveTab('assigned_exams');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" /> Assigned Exams
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <History className="w-4 h-4" /> History
            </button>
            <button
              onClick={() => {
                setActiveTab('achievements');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" /> Achievements
            </button>
            <button
              onClick={() => {
                setActiveTab('host_studio');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-secondary font-bold hover:bg-surface-container flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Host Studio 🚀
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-error hover:bg-error-container/20 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        )}

        {/* Tab Body */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              onStartExam={handleStartExam}
              onJoinRoom={() => setActiveTab('join_room')}
            />
          )}

          {activeTab === 'join_room' && <JoinRoomTab />}

          {activeTab === 'assigned_exams' && (
            <div className="space-y-6 text-left">
              <h2 className="text-2xl font-bold text-on-surface">Assigned Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {USER_ASSIGNED_EXAMS.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {exam.subject}
                      </span>
                      <h3 className="text-lg font-bold text-on-surface mt-1">{exam.title}</h3>
                      <p className="text-xs text-on-surface-variant mt-2">
                        Due Date: <span className="font-semibold text-error">{exam.due}</span>
                      </p>
                      <p className="text-xs text-on-surface-variant">Rule: {exam.rule}</p>
                    </div>
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm"
                    >
                      Start Exam Now
                    </button>
                  </div>
                ))}
              </div>
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
              onEditQuiz={() => navigate('/create-quiz')}
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
