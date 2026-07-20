import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  DoorOpen,
  ClipboardList,
  History,
  Trophy,
  SlidersHorizontal,
  Settings,
  LogOut,
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 hidden md:flex flex-col justify-between shrink-0 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 text-primary mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-headline-md text-xl font-bold tracking-tight text-on-surface">
            QuizzApp
          </span>
        </div>

        <nav className="space-y-1.5 font-body-md text-sm font-semibold text-left">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('join_room')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'join_room'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <DoorOpen className="w-5 h-5" />
            Join Live Room
          </button>

          <button
            onClick={() => setActiveTab('assigned_exams')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'assigned_exams'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Assigned Exams
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <History className="w-5 h-5" />
            History
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'achievements'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Achievements
          </button>

          <div className="h-px bg-outline-variant/30 my-3" />

          <button
            onClick={() => setActiveTab('host_studio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'host_studio'
                ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Host Studio 🚀
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
      </div>

      <div className="p-6 border-t border-outline-variant/30">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error-container/20 font-body-md text-sm font-semibold transition-all"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};
