import { GraduationCap, LayoutDashboard, BookOpen, MonitorPlay, Users, BarChart2, ChevronLeft, Settings as SettingsIcon, Radio, Award } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentView, onNavigate, isOpen, onToggle }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quizzes' as const, label: 'Quizzes', icon: BookOpen },
    { id: 'live-rooms' as const, label: 'Live Rooms', icon: MonitorPlay },
    { id: 'users' as const, label: 'User Directory', icon: Users },
    { id: 'reports' as const, label: 'Reports', icon: BarChart2 },
    { id: 'achievements' as const, label: 'Achievements', icon: Award },
    { id: 'broadcast' as const, label: 'Broadcasts', icon: Radio },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={onToggle}
        />
      )}
      <nav aria-label="Sidebar Navigation" className={`bg-surface-container-low h-screen fixed left-0 top-0 flex flex-col py-base gap-2 z-50 shadow-[1px_0_10px_rgba(30,0,169,0.05)] border-r border-outline-variant/30 transition-all duration-300 group ${isOpen ? 'w-64 translate-x-0' : 'w-64 md:w-20 -translate-x-full md:translate-x-0'}`}>
      <div className="px-6 py-6 mb-2 relative">
        <button onClick={onToggle} className="absolute -right-4 top-8 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-primary-container hover:text-on-primary-container transition-all duration-300 z-30 border-2 border-surface-bright">
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary shrink-0 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6 text-on-primary" fill="currentColor" />
          </div>
          {isOpen && (
            <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
              <h1 className="text-headline-md font-bold text-primary leading-tight tracking-tight">EduQuest</h1>
              <span className="text-label-bold text-on-surface-variant text-xs opacity-80 uppercase tracking-widest mt-0.5 block">Admin Central</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (currentView === 'quiz-creator' && item.id === 'quizzes');
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (window.innerWidth < 768 && isOpen) {
                  onToggle();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-highest scale-95 transition-transform duration-150' 
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              {isOpen && <span className="text-label-bold text-sm tracking-wide">{item.label}</span>}
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-outline-variant/30">
        <button
          onClick={() => {
            onNavigate('settings');
            if (window.innerWidth < 768 && isOpen) {
              onToggle();
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'settings' 
              ? 'text-primary font-bold border-l-4 border-primary bg-primary/10 transition-transform duration-150' 
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <SettingsIcon className={`w-5 h-5 ${currentView === 'settings' ? 'text-primary' : ''}`} />
          {isOpen && <span className="text-label-bold text-sm tracking-wide">Settings</span>}
        </button>
      </div>
    </nav>
    </>
  );
}
