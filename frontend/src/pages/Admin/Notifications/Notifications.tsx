import { Search, Trash2, CheckCircle2, Bell, ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 8;

  const { notifications, markAllAsRead, markAsRead, deleteNotification, clearAllRead } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter by tab + search
  const filtered = notifications.filter(n => {
    const matchTab = activeTab === 'all' || n.unread;
    const matchSearch = !searchTerm || 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm]);

  const handleDelete = async (id: number) => {
    setOpenMenuId(null);
    await deleteNotification(id);
    toast.success('Notification deleted');
  };

  const handleClearAllRead = async () => {
    setConfirmClear(false);
    await clearAllRead();
    toast.success('All read notifications cleared');
  };

  const readCount = notifications.filter(n => !n.unread).length;
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
              Notifications & Alerts
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
              Stay updated with system warnings, room activities, and user feedback.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {readCount > 0 && (
              <button 
                onClick={() => setConfirmClear(true)} 
                className="text-sm font-semibold text-error/80 hover:text-error flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-error/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear read ({readCount})
              </button>
            )}
            <button 
              onClick={markAllAsRead} 
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex bg-surface-container-low p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'unread'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-error text-on-error text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-outline-variant rounded-lg bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-3">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Bell className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-semibold">No notifications found</p>
              <p className="text-sm mt-1 opacity-70">
                {searchTerm ? 'Try adjusting your search terms.' : activeTab === 'unread' ? 'All caught up!' : 'Nothing here yet.'}
              </p>
            </div>
          ) : (
            paginated.map((n) => {
              const Icon = n.icon || Bell;
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 group ${
                    n.unread
                      ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10'
                      : 'bg-surface-container-lowest border-outline-variant/30 opacity-90'
                  }`}
                >
                  <div 
                    className="flex items-start gap-4 flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      if (n.unread) markAsRead(n.id);
                      if (n.action_url) {
                        let finalUrl = n.action_url;
                        if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
                          finalUrl = 'https://' + finalUrl;
                        }
                        window.open(finalUrl, '_blank');
                      }
                    }}
                  >
                    <div className={`p-2.5 rounded-xl ${n.bg} ${n.color} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-on-surface text-base truncate">{n.title}</h4>
                        {n.unread && (
                          <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0"></span>
                        )}
                        <span className="text-xs text-on-surface-variant font-medium ml-auto sm:ml-0 shrink-0">
                          • {n.time}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                        {n.desc}
                      </p>
                    </div>
                  </div>

                  {/* Action dropdown */}
                  <div className="relative shrink-0" ref={openMenuId === n.id ? menuRef : undefined}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)}
                      className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {openMenuId === n.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/30 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {n.unread && (
                          <button 
                            onClick={() => { markAsRead(n.id); setOpenMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Mark as read
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(n.id)}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      {/* Confirm clear modal */}
      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAllRead}
        title="Clear Read Notifications"
        message={`Are you sure you want to permanently remove all ${readCount} read notification(s)? This action cannot be undone.`}
      />
    </main>
  );
}
