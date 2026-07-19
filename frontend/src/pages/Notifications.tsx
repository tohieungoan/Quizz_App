import { AlertCircle, CheckCircle2, MessageSquare, Clock, Search, Filter, MoreVertical, Bell } from 'lucide-react';
import { useState } from 'react';

export function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  const notifications = [
    { id: 1, title: 'System Warning', desc: 'High traffic detected during Calculus III Exam. System is auto-scaling resources to compensate.', time: '5m ago', date: 'Today', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: true },
    { id: 2, title: 'Room Completed', desc: 'Physics 101 Final has ended successfully. 124 participants completed the exam.', time: '1h ago', date: 'Today', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: true },
    { id: 3, title: 'New Feedback', desc: 'Sarah Jenkins requested a review on Q14 for Introduction to Biology.', time: '2h ago', date: 'Today', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
    { id: 4, title: 'Server Maintenance', desc: 'Scheduled maintenance will occur in 2 days from 02:00 AM to 04:00 AM UTC.', time: '5h ago', date: 'Yesterday', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', unread: false },
    { id: 5, title: 'New Room Created', desc: 'Dr. Hayes started Room L3M4N for Calculus III Midterm.', time: '1d ago', date: 'Yesterday', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: false },
    { id: 6, title: 'Storage Alert', desc: 'Database storage is at 85% capacity. Consider upgrading the storage plan soon.', time: '2d ago', date: 'July 13, 2026', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: false },
    { id: 7, title: 'Weekly Report', desc: 'Your weekly engagement report is ready to view in the Reports section.', time: '3d ago', date: 'July 12, 2026', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
  ];

  const displayedNotifs = activeTab === 'unread' ? notifications.filter(n => n.unread) : notifications;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4 sm:gap-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-1.5 shadow-sm">
                <Bell className="w-3.5 h-3.5" />
                Notification Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-[34px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 tracking-tight pb-1 mt-1 leading-tight">
              All Notifications
            </h1>
            <p className="text-sm text-on-surface-variant font-medium mt-1">
              Stay updated with system alerts, room activities, and user feedback.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-on-surface border border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant font-bold text-sm rounded-lg shadow-sm transition-all">
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
          </div>
        </div>

        {/* Content Section */}
        <section className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
          
          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-b border-outline-variant/30 gap-4 sm:gap-0 bg-surface-container-lowest">
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'unread' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
              >
                Unread
                <span className="bg-error text-on-error text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">2</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex flex-col divide-y divide-outline-variant/20">
            {displayedNotifs.length > 0 ? displayedNotifs.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 hover:bg-surface-bright transition-colors relative group ${notif.unread ? 'bg-primary/[0.02]' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${notif.bg} ${notif.color}`}>
                  <notif.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[15px] font-bold text-on-surface mb-1 flex items-center gap-2">
                        {notif.title}
                        {notif.unread && (
                          <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0"></span>
                        )}
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed mb-2">{notif.desc}</p>
                    </div>
                    <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-outline">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {notif.time}</span>
                    <span>•</span>
                    <span>{notif.date}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-6 py-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline mb-4">
                  <Bell className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1">No unread notifications</h3>
                <p className="text-sm text-on-surface-variant">You're all caught up!</p>
              </div>
            )}
          </div>
          
        </section>
      </div>
    </main>
  );
}
