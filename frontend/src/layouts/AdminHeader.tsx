import { Search, Bell, HelpCircle, Menu, AlertCircle, CheckCircle2, MessageSquare, Clock, User, Settings, LogOut, Shield, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../types';

export function Header({ onToggleSidebar, onNavigate }: { onToggleSidebar?: () => void, onNavigate?: (view: ViewState, context?: any) => void }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'System Warning', desc: 'High traffic detected during Calculus III Exam.', time: '5m ago', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: true },
    { id: 2, title: 'Room Completed', desc: 'Physics 101 Final has ended successfully.', time: '1h ago', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: true },
    { id: 3, title: 'New Feedback', desc: 'Sarah Jenkins requested a review on Q14.', time: '2h ago', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
    { id: 4, title: 'Server Maintenance', desc: 'Scheduled maintenance in 2 days.', time: '5h ago', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', unread: false },
    { id: 5, title: 'New Room Created', desc: 'Dr. Hayes started Room L3M4N.', time: '1d ago', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: false },
    { id: 6, title: 'Storage Alert', desc: 'Database storage is at 85% capacity.', time: '2d ago', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: false },
    { id: 7, title: 'Weekly Report', desc: 'Your weekly engagement report is ready.', time: '3d ago', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
  ];

  return (
    <header className="bg-surface-bright flex justify-between items-center w-full px-4 md:px-margin-desktop h-20 sticky top-0 z-40 border-b border-outline-variant/30 shadow-[0_4px_20px_-10px_rgba(30,0,169,0.05)] backdrop-blur-md bg-opacity-90">
      <div className="flex-1 max-w-md flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        
        {/* Notification Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications" 
            className={`p-2.5 rounded-full transition-all duration-200 relative group ${isNotifOpen ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error ring-2 ring-surface-bright"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              {/* Dropdown Panel */}
              <div className="absolute right-0 mt-3 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-outline-variant/20 z-50 overflow-hidden origin-top-right animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Notifications</h3>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[380px] overflow-y-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-2.5 mx-1 mb-1 rounded-lg transition-colors flex items-center gap-3 cursor-pointer ${notif.unread && unreadCount > 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-lowest'}`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${notif.bg} ${notif.color}`}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-on-surface mb-0.5 leading-snug">{notif.title}</h4>
                        <p className="text-[13px] text-on-surface-variant leading-snug line-clamp-2">{notif.desc}</p>
                        <span className="text-[11px] font-medium text-primary mt-1 flex items-center gap-1">
                          {notif.time}
                        </span>
                      </div>
                      {notif.unread && unreadCount > 0 && (
                        <div className="shrink-0 flex items-center justify-center w-6">
                          <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-outline-variant/10">
                  <button 
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (onNavigate) onNavigate('notifications');
                    }}
                    className="w-full py-2 text-[13px] font-bold text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    See all
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button aria-label="Help" className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200 hidden sm:block">
          <HelpCircle className="w-[22px] h-[22px]" />
        </button>
        <div className="h-8 w-px bg-outline-variant/50 mx-1 sm:mx-2 hidden sm:block"></div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="Profile menu" 
            className={`flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all duration-200 group shadow-sm ${isProfileOpen ? 'bg-surface-container-high border-outline-variant/50' : 'bg-surface-container-lowest border-transparent hover:border-outline-variant/30 hover:bg-surface-container-low'}`}
          >
            <img alt="Dr. Elena Vance" className={`h-[34px] w-[34px] rounded-full object-cover ring-2 transition-colors ${isProfileOpen ? 'ring-primary' : 'ring-primary/20 group-hover:ring-primary'}`} src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxOZFjRtTn1KzMEEV7iX31u9AQ6sJyjqhXc-nsTbTukpeJa84tkqBFP0O5D8rrREHgTH-VjytyLxZvzB2WeG5810KsteEzleJL5ZHIiB8KZeVDmtOOAqvdbTnfCnIrLDGttGrc6RF-HmPQUABytCVLNXag0-WPvZarNNZbotOcRCryBGQSv7jEVK7OpilxyQiIuxSaBrVbSQgIpXThGII7H0KvWtBpEIn3ur8ByDij8uwZ7elZagsCVlZrsWRk6eZ6W4lpUKss7orW" />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-label-bold text-[13px] text-on-surface font-extrabold leading-tight">Dr. Elena Vance</span>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-0.5">Super Admin</span>
            </div>
          </button>

          {isProfileOpen && (
            <>
              {/* Profile Panel */}
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-outline-variant/20 z-50 overflow-hidden origin-top-right animate-in zoom-in-95 fade-in duration-200 flex flex-col p-2">
                
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl mb-1">
                  <img alt="Dr. Elena Vance" className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxOZFjRtTn1KzMEEV7iX31u9AQ6sJyjqhXc-nsTbTukpeJa84tkqBFP0O5D8rrREHgTH-VjytyLxZvzB2WeG5810KsteEzleJL5ZHIiB8KZeVDmtOOAqvdbTnfCnIrLDGttGrc6RF-HmPQUABytCVLNXag0-WPvZarNNZbotOcRCryBGQSv7jEVK7OpilxyQiIuxSaBrVbSQgIpXThGII7H0KvWtBpEIn3ur8ByDij8uwZ7elZagsCVlZrsWRk6eZ6W4lpUKss7orW" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-on-surface">Elena Vance</span>
                    <span className="text-xs font-medium text-on-surface-variant">e.vance@eduquest.com</span>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/20 my-1 mx-2"></div>

                {/* Menu Items */}
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface text-[14px] font-semibold text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/dashboard');
                  }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface text-[14px] font-semibold text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-primary transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  Switch to User View
                </button>

                <div className="h-px bg-outline-variant/20 my-1 mx-2"></div>

                {/* Log Out */}
                <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface text-[14px] font-semibold text-left group">
                  <div className="w-8 h-8 rounded-full bg-surface-container group-hover:bg-error/10 flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-error transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
