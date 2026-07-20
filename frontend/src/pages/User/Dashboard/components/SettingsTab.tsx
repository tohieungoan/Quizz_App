import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Award,
  Play,
  Megaphone,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification Email State
  const [notificationEmail, setNotificationEmail] = useState('alex.j@student.edu');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  // Notification Types State
  const [notifications, setNotifications] = useState({
    newExamAssigned: true,
    deadlineReminder: true,
    examResults: true,
    liveRoomInvites: true,
    systemAnnouncements: false,
  });

  const [notifSuccessMessage, setNotifSuccessMessage] = useState<string | null>(null);

  // Handlers
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Confirm password does not match new password.' });
      return;
    }

    setPasswordMessage({ type: 'success', text: 'Password has been updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationEmail.trim() || !notificationEmail.includes('@')) {
      setEmailMessage('Please enter a valid email address.');
      return;
    }
    setEmailMessage('Notification email address saved successfully!');
    setTimeout(() => setEmailMessage(null), 4000);
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = () => {
    setNotifSuccessMessage('Notification preferences updated successfully!');
    setTimeout(() => setNotifSuccessMessage(null), 4000);
  };

  // Password Strength Check
  const getPasswordStrength = () => {
    if (!newPassword) return { label: '', score: 0, color: '' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { label: 'Weak', score: 33, color: 'bg-rose-500' };
    if (score <= 4) return { label: 'Medium', score: 66, color: 'bg-amber-500' };
    return { label: 'Strong', score: 100, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300">
            Account & Security
          </span>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            Account Settings
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Manage your account password security and customize your email notification preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Change Password */}
        <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Change Password</h3>
                <p className="text-xs text-on-surface-variant">Update your password to keep your account secure</p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form id="password-form" onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  New Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium">
                      <span>Password Strength:</span>
                      <span className="font-bold">{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-outline-variant/20">
            <button
              type="submit"
              form="password-form"
              className="w-full py-3 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" /> Update Password Now
            </button>
          </div>
        </div>

        {/* Section 2: Notification Settings */}
        <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Notification Preferences</h3>
                <p className="text-xs text-on-surface-variant">Customize email address and notification types you receive</p>
              </div>
            </div>

            {/* Notification Email */}
            <form onSubmit={handleSaveEmail} className="space-y-3 bg-surface-bright p-4 rounded-2xl border border-outline-variant/30">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                Notification Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl transition-all shrink-0"
                >
                  Save Email
                </button>
              </div>
              {emailMessage && (
                <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {emailMessage}
                </p>
              )}
            </form>

            {/* Notification Categories */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                Notification Categories
              </label>

              {notifSuccessMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{notifSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* 1. New Exam Assigned */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">New Exam Assigned</h5>
                      <p className="text-[11px] text-on-surface-variant">Receive email when instructor assigns a new exam</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('newExamAssigned')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.newExamAssigned ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.newExamAssigned ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Exam Deadline Reminders */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Exam Deadline Reminders</h5>
                      <p className="text-[11px] text-on-surface-variant">Get reminders 24h and 1h before deadline</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('deadlineReminder')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.deadlineReminder ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.deadlineReminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Exam Results & Grades */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Exam Results & Grade Reports</h5>
                      <p className="text-[11px] text-on-surface-variant">Receive score reports and feedback from instructor</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('examResults')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.examResults ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.examResults ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Live Room Invites */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Live Room Invitations</h5>
                      <p className="text-[11px] text-on-surface-variant">Get notified when host launches a live room</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('liveRoomInvites')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.liveRoomInvites ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.liveRoomInvites ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. System Announcements */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">System & Class Announcements</h5>
                      <p className="text-[11px] text-on-surface-variant">Receive maintenance alerts and class updates</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('systemAnnouncements')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.systemAnnouncements ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.systemAnnouncements ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20">
            <button
              onClick={handleSaveNotifications}
              className="w-full py-3 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" /> Save Notification Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
