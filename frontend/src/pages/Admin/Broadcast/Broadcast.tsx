import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, 
  Megaphone, 
  AlertCircle, 
  Info, 
  Smartphone, 
  Monitor, 
  Link as LinkIcon, 
  CalendarClock, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { notificationService, ScheduledBroadcastItem } from '@/services/notificationService';
import { toast } from 'react-hot-toast';

export function Broadcast() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [actionUrl, setActionUrl] = useState('');
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [scheduledList, setScheduledList] = useState<ScheduledBroadcastItem[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Compute minimum datetime string for datetime-local input (2 minutes in future)
  const minScheduledDateTime = useMemo(() => {
    const d = new Date(Date.now() + 2 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  // Fetch scheduled broadcasts
  const fetchScheduled = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingScheduled(true);
    try {
      const res = await notificationService.getScheduledBroadcasts(0, 50);
      setScheduledList(res?.data || []);
    } catch (err) {
      console.error('Failed to load scheduled broadcasts:', err);
    } finally {
      if (!silent) setIsLoadingScheduled(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const handleSend = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedUrl = actionUrl.trim();

    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      toast.error('Title must be between 3 and 200 characters.');
      return;
    }

    if (trimmedContent.length < 5 || trimmedContent.length > 2000) {
      toast.error('Content must be between 5 and 2000 characters.');
      return;
    }

    if (trimmedUrl) {
      if (trimmedUrl.length > 500) {
        toast.error('Action URL must not exceed 500 characters.');
        return;
      }
      if (!trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        toast.error("Action URL must start with '/' (internal route) or 'http://' / 'https://'.");
        return;
      }
    }

    if (isScheduled) {
      if (!scheduledAt) {
        toast.error('Please select a future scheduled date & time.');
        return;
      }
      const scheduledTimestamp = new Date(scheduledAt).getTime();
      const nowTimestamp = Date.now();
      if (scheduledTimestamp < nowTimestamp + 45 * 1000) {
        toast.error('Scheduled time must be at least 1 minute in the future.');
        return;
      }
    }
    
    setIsSending(true);
    try {
      await notificationService.sendBroadcast({
        title: trimmedTitle,
        content: trimmedContent,
        type,
        targetType: 'ALL_USERS',
        targetGroupId: null,
        actionUrl: trimmedUrl || null,
        isScheduled,
        scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : null,
      });

      setTitle('');
      setContent('');
      setType('ANNOUNCEMENT');
      setActionUrl('');
      setIsScheduled(false);
      setScheduledAt('');
      
      toast.success(`Broadcast ${isScheduled ? 'scheduled' : 'sent'} successfully!`);
      
      // If scheduled, refresh the queue
      if (isScheduled) {
        fetchScheduled(true);
      } else {
        // Notify all active useNotifications hooks across the app to refetch immediately
        window.dispatchEvent(new Event('quizzapp_notifications_updated'));
      }
      
    } catch (err: any) {
      console.error('Failed to send broadcast:', err);
      toast.error(err?.response?.data?.detail || 'Failed to send system broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteScheduled = async (item: ScheduledBroadcastItem) => {
    const targetKey = item.job_id || item.id;
    setDeletingId(targetKey);
    try {
      await notificationService.cancelScheduledBroadcast(targetKey);
      toast.success('Scheduled broadcast deleted successfully.');
      setScheduledList((prev) => prev.filter((s) => s.id !== item.id && s.job_id !== item.job_id));
    } catch (err: any) {
      console.error('Failed to delete scheduled broadcast:', err);
      toast.error(err?.response?.data?.detail || 'Could not delete scheduled broadcast.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatScheduledTime = (isoString?: string | null) => {
    if (!isoString) return 'Scheduled';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getPreviewIcon = () => {
    switch (type) {
      case 'SYSTEM': return <AlertCircle className="w-5 h-5 text-error" />;
      case 'ANNOUNCEMENT': return <Megaphone className="w-5 h-5 text-orange-600" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getPreviewBg = () => {
    switch (type) {
      case 'SYSTEM': return 'bg-error-container/60';
      case 'ANNOUNCEMENT': return 'bg-orange-100';
      default: return 'bg-primary/10';
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full font-['Inter',sans-serif]">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-5xl">
        
        {/* Header */}
        <div>
          <h1 className="font-['Sora',sans-serif] text-2xl md:text-[28px] text-on-surface font-extrabold tracking-tight">
            System Broadcast
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Send real-time alerts or schedule announcements for all active users.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-surface-variant/60 shadow-sm relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>

            <div className="space-y-5">
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-on-surface">
                    Broadcast Title <span className="text-error">*</span>
                  </label>
                  <span className={`text-[11px] font-medium ${title.length > 200 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                    {title.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Maintenance"
                  className="w-full px-4 py-2.5 bg-surface-container-low/40 border border-surface-variant/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium placeholder:text-on-surface-variant/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-on-surface">
                    Message Content <span className="text-error">*</span>
                  </label>
                  <span className={`text-[11px] font-medium ${content.length > 2000 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                    {content.length}/2000
                  </span>
                </div>
                <textarea
                  value={content}
                  maxLength={2000}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type the detailed message here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-surface-container-low/40 border border-surface-variant/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface resize-none placeholder:text-on-surface-variant/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" /> Action URL (Optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /exam/101 or https://..."
                  className="w-full px-4 py-2.5 bg-surface-container-low/40 border border-surface-variant/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium placeholder:text-on-surface-variant/50"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Must start with <code className="text-primary font-mono">/</code> for internal pages or <code className="text-primary font-mono">https://</code> for external links.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Event Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { id: 'ANNOUNCEMENT', label: 'News', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
                    { id: 'SYSTEM', label: 'System', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container/50 hover:bg-error-container border-error/20' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        type === t.id 
                          ? `${t.bg} ring-2 ring-offset-1 ring-primary scale-[1.02] shadow-sm` 
                          : 'bg-white border-surface-variant/60 hover:border-surface-variant'
                      }`}
                    >
                      <t.icon className={`w-4 h-4 ${type === t.id ? t.color : 'text-on-surface-variant'}`} />
                      <span className={`text-[11px] font-bold ${type === t.id ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="pt-5 flex items-center justify-between border-t border-surface-variant/40">
              <div>
                <label className="block text-sm font-bold text-on-surface">Schedule Broadcast</label>
                <p className="text-xs text-on-surface-variant mt-0.5">Send this message at a future date and time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isScheduled} 
                  onChange={() => setIsScheduled(!isScheduled)} 
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {isScheduled && (
              <div className="animate-in fade-in slide-in-from-top-2 pb-2">
                <label className="block text-sm font-bold text-on-surface mb-1.5 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" /> Scheduled Date & Time <span className="text-error">*</span>
                </label>
                <input
                  type="datetime-local"
                  min={minScheduledDateTime}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low/40 border border-surface-variant/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Schedule time must be at least 1 minute in the future.
                </p>
              </div>
            )}

            <div className="pt-5 mt-2 flex items-center justify-between border-t border-surface-variant/40">
              <div className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <Smartphone className="w-4 h-4 text-primary" />
                <span>Delivers to all active devices</span>
              </div>
              <button
                onClick={handleSend}
                disabled={isSending || !title.trim() || !content.trim() || (isScheduled && !scheduledAt)}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold hover:shadow-md hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? 'Processing...' : isScheduled ? 'Schedule Broadcast' : 'Send Broadcast'}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Scheduled Broadcasts List */}
          <div className="space-y-5">
            {/* Live Preview */}
            <div>
              <h3 className="font-['Sora',sans-serif] font-bold text-on-surface px-1 mb-2">Live Preview</h3>
              <div className="bg-white p-5 rounded-2xl border border-surface-variant/60 shadow-sm relative">
                <div className="absolute -top-2.5 -right-2.5 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                  User's View
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getPreviewBg()}`}>
                    {getPreviewIcon()}
                  </div>
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-on-surface text-sm break-all pr-2">{title || 'Broadcast Title'}</h4>
                      <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_8px_rgba(53,37,205,0.6)]"></span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed break-all">
                      {content || 'Your broadcast message will appear here...'}
                    </p>
                    
                    {actionUrl && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-primary">
                        <LinkIcon className="w-3 h-3" /> Click to view details
                      </div>
                    )}

                    <span className="text-[10px] text-on-surface-variant/70 font-medium mt-1">Just now • Today</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Instant Delivery Notice */}
            <div className="bg-surface-container-low/80 border border-surface-variant/60 rounded-xl p-4">
              <div className="flex items-start gap-2.5 text-primary">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <p className="text-xs text-on-surface font-medium leading-relaxed">
                  Broadcasts appear instantly in user notification centers across all active accounts.
                </p>
              </div>
            </div>

            {/* Scheduled Broadcasts Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-['Sora',sans-serif] font-bold text-sm text-on-surface">Scheduled Broadcasts</h3>
                  {scheduledList.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {scheduledList.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fetchScheduled()}
                  disabled={isLoadingScheduled}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
                  title="Refresh scheduled list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScheduled ? 'animate-spin text-primary' : ''}`} />
                </button>
              </div>

              {isLoadingScheduled && scheduledList.length === 0 ? (
                <div className="bg-white border border-surface-variant/60 rounded-2xl p-6 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-xs font-medium">Loading scheduled broadcasts...</p>
                </div>
              ) : scheduledList.length === 0 ? (
                <div className="bg-white border border-surface-variant/60 rounded-2xl p-6 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                    <CalendarClock className="w-4.5 h-4.5 opacity-80" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">No scheduled broadcasts</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Messages scheduled for later will appear in this list.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
                  {scheduledList.map((item) => {
                    const isDeleting = deletingId === item.job_id || deletingId === item.id;
                    const isSystem = item.type === 'SYSTEM';
                    
                    return (
                      <div 
                        key={item.id}
                        className="bg-white border border-surface-variant/60 rounded-xl p-3.5 hover:shadow-xs transition-all relative group flex flex-col gap-2"
                      >
                        {/* Header: Badge & Scheduled Time & Delete Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                              isSystem ? 'bg-error-container text-error' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {isSystem ? 'System' : 'News'}
                            </span>
                            <span className="text-[11px] font-semibold text-primary flex items-center gap-1 truncate">
                              <Clock className="w-3 h-3 shrink-0" />
                              {formatScheduledTime(item.scheduled_at)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteScheduled(item)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors shrink-0 cursor-pointer"
                            title="Delete scheduled broadcast"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-error" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Title & Preview Content with Ellipsis (...) */}
                        <div>
                          <h4 className="text-xs font-bold text-on-surface truncate" title={item.title}>
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 break-words leading-relaxed" title={item.content}>
                            {item.content}
                          </p>
                        </div>

                        {item.action_url && (
                          <div className="text-[10px] font-medium text-primary flex items-center gap-1 truncate">
                            <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.action_url}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
