import { 
  Search, 
  Trash2, 
  CheckCircle2, 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  UserCheck, 
  Server, 
  GraduationCap, 
  Clock, 
  CheckCheck,
  Filter,
  Check,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

type FilterTab = 'all' | 'unread' | 'security' | 'lifecycle' | 'system' | 'academic';

export function Notifications() {
  const [activeCategory, setActiveCategory] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const itemsPerPage = 8;

  const { notifications, markAllAsRead, markAsRead, deleteNotification, clearAllRead, deleteAll } = useNotifications();

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter items
  const filtered = notifications.filter(n => {
    let matchCategory = true;
    if (activeCategory === 'unread') {
      matchCategory = n.unread;
    } else if (activeCategory !== 'all') {
      matchCategory = n.category === activeCategory;
    }

    const term = searchTerm.toLowerCase().trim();
    const matchSearch = !term || 
      n.title.toLowerCase().includes(term) ||
      n.desc.toLowerCase().includes(term) ||
      (n.action_url && n.action_url.toLowerCase().includes(term));

    return matchCategory && matchSearch;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when category or search changes
  useEffect(() => { 
    setCurrentPage(1); 
  }, [activeCategory, searchTerm]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
    toast.success('Notification removed');
  };

  const handleClearAllRead = async () => {
    setConfirmClear(false);
    await clearAllRead();
    toast.success('All read notifications cleared');
  };

  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false);
    await deleteAll();
    toast.success('All notifications deleted');
  };

  const readCount = notifications.filter(n => !n.unread).length;
  const unreadCount = notifications.filter(n => n.unread).length;

  const categoryCounts = {
    all: notifications.length,
    unread: unreadCount,
    security: notifications.filter(n => n.category === 'security').length,
    lifecycle: notifications.filter(n => n.category === 'lifecycle').length,
    system: notifications.filter(n => n.category === 'system').length,
    academic: notifications.filter(n => n.category === 'academic').length,
  };

  const filterTabs: { id: FilterTab; label: string; icon: any; count: number }[] = [
    { id: 'all', label: 'All', icon: Bell, count: categoryCounts.all },
    { id: 'unread', label: 'Unread', icon: Sparkles, count: categoryCounts.unread },
    { id: 'security', label: 'Security & Audit', icon: ShieldAlert, count: categoryCounts.security },
    { id: 'lifecycle', label: 'User Lifecycle', icon: UserCheck, count: categoryCounts.lifecycle },
    { id: 'system', label: 'System Alerts', icon: Server, count: categoryCounts.system },
    { id: 'academic', label: 'Academic & Groups', icon: GraduationCap, count: categoryCounts.academic },
  ];

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full font-['Inter',sans-serif]">
      <div className="py-gutter w-full flex flex-col gap-6 pb-24 max-w-5xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surface-variant/60 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-['Sora',sans-serif] text-2xl font-black text-on-surface tracking-tight">
                  Notification Center
                </h1>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Real-time security logs, system warnings, user lifecycle events, and activities.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {notifications.length > 0 && (
              <button 
                onClick={() => setConfirmDeleteAll(true)} 
                className="text-xs font-bold text-on-surface-variant hover:text-error bg-surface-container-low hover:bg-error-container/40 border border-surface-variant/70 hover:border-error/30 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Delete all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All</span>
              </button>
            )}
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-xs font-bold text-white bg-primary hover:bg-primary/90 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories Bar & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white p-3 rounded-2xl border border-surface-variant/60 shadow-sm">
          
          {/* Scrollable Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeCategory === tab.id;
              if (tab.count === 0 && tab.id !== 'all' && tab.id !== 'unread') return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : tab.id === 'unread' && tab.count > 0
                        ? 'bg-primary/10 text-primary font-extrabold'
                        : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search notifications, logs..."
              className="w-full pl-9 pr-8 py-1.5 text-xs font-medium border border-surface-variant/80 rounded-xl bg-surface-container-low/40 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all placeholder:text-on-surface-variant/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-3">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-surface-variant/60 shadow-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center mb-3 text-primary">
                <Bell className="w-6 h-6 opacity-70" />
              </div>
              <h3 className="font-['Sora',sans-serif] text-sm font-bold text-on-surface">No notifications found</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                {searchTerm 
                  ? 'No notifications match your search query.' 
                  : activeCategory === 'unread' 
                    ? 'All caught up! No unread notifications.' 
                    : 'You do not have any notifications in this section.'}
              </p>
            </div>
          ) : (
            paginated.map((n: NotificationItem) => {
              const Icon = n.icon || Bell;
              const isExpanded = expandedIds.has(n.id);
              const isLongDesc = n.desc && n.desc.length > 130;

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.unread) markAsRead(n.id);
                  }}
                  className={`p-4 md:p-4.5 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row items-start justify-between gap-4 group relative ${
                    n.unread
                      ? 'bg-white border-primary/40 shadow-xs ring-1 ring-primary/10'
                      : 'bg-white border-surface-variant/60 shadow-2xs hover:border-surface-variant'
                  }`}
                >
                  {/* Left Priority Accent Bar */}
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                    n.unread ? 'bg-primary' : 'bg-transparent'
                  }`} />

                  {/* Main Content Area */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0 w-full">
                    
                    {/* Icon Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${n.bg} ${n.color} border-current/15 mt-0.5 shadow-2xs`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    {/* Text Details */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0 w-full">
                      
                      {/* Title & Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className={`font-['Sora',sans-serif] text-sm font-bold text-on-surface leading-snug break-words truncate max-w-full ${
                          n.unread ? 'font-extrabold text-primary' : ''
                        }`} title={n.title}>
                          {n.title}
                        </h3>

                        {n.unread && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-primary text-white shrink-0">
                            NEW
                          </span>
                        )}

                        <span className="text-[11px] font-medium text-on-surface-variant/80 flex items-center gap-1 ml-auto shrink-0">
                          <Clock className="w-3 h-3" />
                          {n.time} {n.date !== 'Today' && n.date !== 'Yesterday' ? `• ${n.date}` : ''}
                        </span>
                      </div>

                      {/* Description Body with Safe Multi-line & Word Wrapping */}
                      <div className="relative min-w-0 w-full">
                        <p className={`text-xs text-on-surface-variant leading-relaxed break-words whitespace-pre-wrap ${
                          !isExpanded && isLongDesc ? 'line-clamp-2' : ''
                        }`}>
                          {n.desc}
                        </p>

                        {/* Expand / Collapse Button for Long Logs */}
                        {isLongDesc && (
                          <button
                            onClick={(e) => toggleExpand(n.id, e)}
                            className="text-[11px] font-bold text-primary hover:text-primary/80 mt-1 inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show less</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>Show more ...</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Optional Action URL Link */}
                      {n.action_url && (
                        <div className="mt-1.5 pt-1.5 border-t border-surface-variant/30 flex items-center gap-3">
                          <a
                            href={n.action_url.startsWith('http') ? n.action_url : `https://${n.action_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors w-fit break-all"
                          >
                            <span>Open link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 self-end md:self-start shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-variant/40 w-full md:w-auto justify-end">
                    {n.unread ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        className="text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-on-surface-variant/60 px-2 py-1 hidden md:inline">
                        Read
                      </span>
                    )}
                    
                    <button 
                      onClick={(e) => handleDelete(n.id, e)}
                      className="text-xs font-semibold text-on-surface-variant hover:text-error hover:bg-error-container/40 p-1.5 md:px-2.5 md:py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <div className="mt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

      </div>

      {/* Confirm clear read modal */}
      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAllRead}
        title="Clear Read Notifications"
        message={`Are you sure you want to permanently remove all ${readCount} read notification(s)? This action cannot be undone.`}
      />

      {/* Confirm delete all modal */}
      <ConfirmModal
        isOpen={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Notifications"
        message={`Are you sure you want to permanently remove all ${notifications.length} notification(s)? This action cannot be undone.`}
      />
    </main>
  );
}