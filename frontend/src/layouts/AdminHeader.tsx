import { Search, Bell, HelpCircle, Menu, AlertCircle, CheckCircle2, MessageSquare, Clock, User, Settings, LogOut, Shield, RefreshCw, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import { useLogout } from '../hooks/useLogout';
import { useNotifications } from '../hooks/useNotifications';

export function Header({ onToggleSidebar, onNavigate }: { onToggleSidebar?: () => void, onNavigate?: (view: ViewState, context?: any) => void }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllRead } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useLogout();
  
  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxOZFjRtTn1KzMEEV7iX31u9AQ6sJyjqhXc-nsTbTukpeJa84tkqBFP0O5D8rrREHgTH-VjytyLxZvzB2WeG5810KsteEzleJL5ZHIiB8KZeVDmtOOAqvdbTnfCnIrLDGttGrc6RF-HmPQUABytCVLNXag0-WPvZarNNZbotOcRCryBGQSv7jEVK7OpilxyQiIuxSaBrVbSQgIpXThGII7H0KvWtBpEIn3ur8ByDij8uwZ7elZagsCVlZrsWRk6eZ6W4lpUKss7orW';

  const getUserDataFromStorage = () => {
    try {
      const profileStr = localStorage.getItem('user_profile');
      const userStr = localStorage.getItem('user');
      const profile = profileStr ? JSON.parse(profileStr) : null;
      const user = userStr ? JSON.parse(userStr) : null;

      const name = profile?.full_name || profile?.fullname || profile?.username || user?.name || 'Admin User';
      const email = profile?.email || user?.email || 'admin@domain.com';
      const role = (profile?.role === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN') ? 'SUPER ADMIN' : (profile?.role || user?.role || 'ADMIN');
      const avatar = profile?.avatar_url || profile?.avatar || user?.avatar || defaultAvatar;

      return { name, email, role, avatar };
    } catch {
      return { name: 'Admin User', email: 'admin@domain.com', role: 'ADMIN', avatar: defaultAvatar };
    }
  };

  const [userInfo, setUserInfo] = useState(getUserDataFromStorage);

  const userName = userInfo.name;
  const userEmail = userInfo.email;
  const userRole = userInfo.role;
  const userAvatar = userInfo.avatar;

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserInfo(getUserDataFromStorage());
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const readCount = notifications.filter(n => !n.unread).length;
  const displayedNotifs = notifFilter === 'unread' ? notifications.filter(n => n.unread) : notifications;

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
            className={`p-2.5 rounded-full transition-all duration-200 relative group ${isNotifOpen ? 'bg-primary/10 text-primary shadow-inner' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
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
              <div className="absolute right-0 mt-3 w-[320px] sm:w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_12px_36px_rgba(53,37,205,0.12),0_2px_8px_rgba(0,0,0,0.06)] border border-surface-variant/70 z-50 overflow-hidden origin-top-right animate-in zoom-in-95 fade-in duration-150 flex flex-col font-['Inter',sans-serif]">
                
                {/* Header */}
                <div className="px-3.5 py-3 border-b border-surface-variant/50 bg-surface-container-low/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-['Sora',sans-serif] text-sm font-bold text-on-surface truncate">Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white shrink-0">
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant shrink-0">
                        0 unread
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="px-3 py-1.5 flex items-center gap-1 border-b border-surface-variant/40 bg-white">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      notifFilter === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      notifFilter === 'unread'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        notifFilter === 'unread' ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-surface-variant/30 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
                  {displayedNotifs.length === 0 ? (
                    <div className="py-10 px-3 text-center text-on-surface-variant flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center mb-2 text-primary">
                        <Bell className="w-5 h-5 opacity-70" />
                      </div>
                      <p className="text-xs font-semibold text-on-surface">No notifications</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {notifFilter === 'unread' ? 'All caught up!' : 'No updates available yet.'}
                      </p>
                    </div>
                  ) : (
                    displayedNotifs.map((notif) => {
                      const Icon = notif.icon || Bell;
                      return (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            if (notif.unread) {
                              markAsRead(notif.id);
                            }
                            if (notif.action_url) {
                              let finalUrl = notif.action_url;
                              if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
                                finalUrl = 'https://' + finalUrl;
                              }
                              window.open(finalUrl, '_blank');
                            }
                          }}
                          className={`p-3 transition-colors flex items-start gap-2.5 cursor-pointer group relative ${
                            notif.unread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-low/60'
                          }`}
                        >
                          {/* Unread Indicator Bar */}
                          {notif.unread && (
                            <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary rounded-r" />
                          )}

                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${notif.bg} ${notif.color} border-current/10 mt-0.5`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Content with strict ellipsis */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <h4 className={`text-xs font-bold text-on-surface truncate ${notif.unread ? 'text-primary font-extrabold' : ''}`} title={notif.title}>
                                {notif.title}
                              </h4>
                              {notif.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>

                            {/* Truncated description with ellipsis (...) */}
                            <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2 mt-0.5 break-words" title={notif.desc}>
                              {notif.desc}
                            </p>

                            <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-surface-variant/20">
                              <span className="text-[10px] font-medium text-on-surface-variant/80 flex items-center gap-1 shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {notif.time}
                              </span>

                              {/* Hover Quick Actions */}
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                {notif.unread && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notif.id)}
                                  className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 border-t border-surface-variant/40 bg-surface-container-low/60 flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (onNavigate) onNavigate('notifications');
                    }}
                    className="w-full py-1.5 text-xs font-bold text-primary hover:text-primary/90 hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>See all notifications</span>
                    <span aria-hidden="true">&rarr;</span>
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
            <img alt={userName} className={`h-[34px] w-[34px] rounded-full object-cover ring-2 transition-colors ${isProfileOpen ? 'ring-primary' : 'ring-primary/20 group-hover:ring-primary'}`} src={userAvatar} />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-label-bold text-[13px] text-on-surface font-extrabold leading-tight">{userName}</span>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-0.5">{userRole}</span>
            </div>
          </button>

          {isProfileOpen && (
            <>
              {/* Profile Panel */}
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-outline-variant/20 z-50 overflow-hidden origin-top-right animate-in zoom-in-95 fade-in duration-200 flex flex-col p-2">
                
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl mb-1">
                  <img alt={userName} className="h-10 w-10 rounded-full object-cover" src={userAvatar} />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-on-surface">{userName}</span>
                    <span className="text-xs font-medium text-on-surface-variant">{userEmail}</span>
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
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface text-[14px] font-semibold text-left group"
                >
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
