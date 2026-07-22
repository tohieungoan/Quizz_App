import React, { useState } from 'react';
import { Send, Megaphone, AlertCircle, Info, CheckCircle2, Radio, Smartphone, Monitor, Link as LinkIcon, Users, UsersRound, User, CalendarClock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function Broadcast() {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [targetType, setTargetType] = useState('ALL_USERS');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSend = () => {
    if (!title.trim() || !content.trim()) return;
    if (targetType === 'GROUP' && !targetGroupId.trim()) return;
    if (isScheduled && !scheduledAt) return;
    
    setIsSending(true);
    // Simulate network delay
    setTimeout(() => {
      let iconName = 'Megaphone';
      let color = 'text-primary';
      let bg = 'bg-primary/10';

      if (type === 'SYSTEM') {
        iconName = 'AlertCircle';
        color = 'text-error';
        bg = 'bg-error-container';
      } else if (type === 'ANNOUNCEMENT') {
        iconName = 'Megaphone';
        color = 'text-orange-600';
        bg = 'bg-orange-100';
      }

      // Add to local state (Mocking DB insertion)
      addNotification({
        title,
        desc: content,
        time: isScheduled ? 'Scheduled' : 'Just now',
        date: isScheduled ? new Date(scheduledAt).toLocaleDateString() : 'Today',
        iconName,
        color,
        bg,
        unread: true
      });

      setTitle('');
      setContent('');
      setType('ANNOUNCEMENT');
      setTargetType('ALL_USERS');
      setTargetGroupId('');
      setActionUrl('');
      setIsScheduled(false);
      setScheduledAt('');
      
      setIsSending(false);
      const targetStr = targetType === 'ALL_USERS' ? 'all users' : targetType === 'GROUP' ? 'group' : 'user';
      setSuccessMsg(`Broadcast ${isScheduled ? 'scheduled' : 'sent'} successfully to ${targetStr}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
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
      case 'SYSTEM': return 'bg-error-container';
      case 'ANNOUNCEMENT': return 'bg-orange-100';
      default: return 'bg-primary/10';
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-5xl">
        
        {/* Header */}
        <div>
          <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
            System Broadcast
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
            Send real-time alerts or announcements to users.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-outline-variant/40 shadow-sm relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>

            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Audience <span className="text-error">*</span></label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTargetType('ALL_USERS')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-bold transition-colors ${targetType === 'ALL_USERS' ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Users className="w-4 h-4" /> All Users
                    </button>
                    <button
                      onClick={() => setTargetType('GROUP')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-bold transition-colors ${targetType === 'GROUP' ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-slate-600 hover:bg-slate-50'}`}
                    >
                      <UsersRound className="w-4 h-4" /> Group
                    </button>
                  </div>
                </div>

                {targetType === 'GROUP' && (
                  <div className="animate-in fade-in zoom-in-95">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Group ID <span className="text-error">*</span></label>
                    <input
                      type="text"
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Broadcast Title <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Message Content <span className="text-error">*</span></label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type the detailed message here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Action URL (Optional)
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /exam/101"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { id: 'ANNOUNCEMENT', label: 'News', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
                    { id: 'SYSTEM', label: 'System', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container/50 hover:bg-error-container border-error/20' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                        type === t.id 
                          ? `${t.bg} ring-2 ring-offset-1 ring-primary scale-[1.02] shadow-sm` 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <t.icon className={`w-4 h-4 ${type === t.id ? t.color : 'text-slate-400'}`} />
                      <span className={`text-[11px] font-bold ${type === t.id ? 'text-slate-800' : 'text-slate-500'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="pt-5 flex items-center justify-between border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700">Schedule Broadcast</label>
                <p className="text-xs text-slate-500 mt-0.5">Send this message at a future date and time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isScheduled} onChange={() => setIsScheduled(!isScheduled)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {isScheduled && (
              <div className="animate-in fade-in slide-in-from-top-2 pb-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" /> Date & Time <span className="text-error">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>
            )}

            <div className="pt-5 mt-2 flex items-center justify-between border-t border-slate-100">
              <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <Smartphone className="w-4 h-4" />
                Delivers to {targetType === 'ALL_USERS' ? 'all' : 'group'} devices
              </div>
              <button
                onClick={handleSend}
                disabled={isSending || !title.trim() || !content.trim() || (targetType === 'GROUP' && !targetGroupId.trim()) || (isScheduled && !scheduledAt)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-[#8b5cf6] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? 'Processing...' : isScheduled ? 'Schedule Broadcast' : 'Send Broadcast'}
              </button>
            </div>
            
            {successMsg && (
              <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
                {successMsg}
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 px-1">Live Preview</h3>
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm relative">
              <div className="absolute -top-3 -right-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm transform rotate-6">
                User's View
              </div>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getPreviewBg()}`}>
                  {getPreviewIcon()}
                </div>
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-on-surface text-sm break-all pr-2">{title || 'Broadcast Title'}</h4>
                    <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed break-all">
                    {content || 'Your broadcast message will appear here...'}
                  </p>
                  
                  {actionUrl && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-primary">
                      <LinkIcon className="w-3 h-3" /> Click to view details
                    </div>
                  )}

                  <span className="text-[10px] text-outline font-medium mt-1">Just now • Today</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2 text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  Broadcasts appear instantly in the user's notification bell. Group broadcasts will only be delivered to users within the specified Group ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
