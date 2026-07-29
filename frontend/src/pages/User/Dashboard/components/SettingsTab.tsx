import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  User,
  Camera,
  Save,
  Mail,
  Undo,
  Info,
  FileText,
  Clock,
  Award,
  Play,
  Megaphone,
  Bell
} from 'lucide-react';
import { authService, saveUserProfile, clearAuthData } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

export const SettingsTab: React.FC = () => {
  const { setUnauthenticated } = useAuthContext();
  
  // ── Sub-tab Switcher State ──
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'notifications'>('profile');

  // ── Loading & User ID States ──
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>('');

  // ── Profile Information State ──
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentSavedAvatarUrl, setCurrentSavedAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary hook for avatar upload
  const { uploadFile, deleteFile, isUploading, progress, error: uploadError } = useCloudinaryUpload();

  // ── Password Security State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Secure Email Verification State ──
  const [currentEmail, setCurrentEmail] = useState('');
  const [dbNotificationEmail, setDbNotificationEmail] = useState<string | null>(null);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ── Notification Categories State ──
  const [notifications, setNotifications] = useState({
    email_notifications_enabled: true,
    in_app_notifications_enabled: true,
    notify_system: true,
    notify_quiz_assigned: true,
    notify_exam_reminder: true,
    notify_results_published: true,
    notify_room_invite: true,
  });
  const [notifSuccessMessage, setNotifSuccessMessage] = useState<string | null>(null);

  // Load initial settings and user profile
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // Load Profile
        const profile = await authService.getProfile();
        setUserId(profile.id);
        setFullName(profile.fullname || '');
        setAvatarUrl(profile.avatar);
        setCurrentSavedAvatarUrl(profile.avatar);
        
        // Load Notification Settings
        const settingsData = await authService.getUserSettings();
        setNotifications({
          email_notifications_enabled: settingsData.email_notifications_enabled,
          in_app_notifications_enabled: settingsData.in_app_notifications_enabled,
          notify_system: settingsData.notify_system,
          notify_quiz_assigned: settingsData.notify_quiz_assigned,
          notify_exam_reminder: settingsData.notify_exam_reminder,
          notify_results_published: settingsData.notify_results_published,
          notify_room_invite: settingsData.notify_room_invite,
        });
        const currentNotifEmail = settingsData.notification_email || profile.email;
        setCurrentEmail(currentNotifEmail);
        setDbNotificationEmail(settingsData.notification_email);
        setNewEmailInput(settingsData.notification_email || '');
      } catch (err: any) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // ── Profile Handlers ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMessage({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }
    try {
      let finalAvatarUrl = avatarUrl;
      const hadNewFile = !!selectedFile;
      const oldAvatarToClean = currentSavedAvatarUrl;
      
      // Only upload to Cloudinary if the user selected a new file
      if (selectedFile) {
        setProfileMessage({ type: 'info', text: 'Uploading avatar image...' });
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) {
          setProfileMessage({ type: 'error', text: 'Failed to upload avatar to Cloudinary.' });
          return;
        }
        finalAvatarUrl = uploadedUrl;
      }

      const updatedProfile = await authService.updateProfile(userId, {
        fullname: fullName,
        avatar: finalAvatarUrl
      });
      
      // If we uploaded a new avatar, safely delete the old one to avoid orphaned assets
      if (hadNewFile && oldAvatarToClean) {
        await deleteFile(oldAvatarToClean);
      }

      // Save profile to local storage to update other layout elements like header/sidebar
      saveUserProfile(updatedProfile);
      window.dispatchEvent(new Event('user-profile-updated'));
      setAvatarUrl(finalAvatarUrl);
      setCurrentSavedAvatarUrl(finalAvatarUrl);
      setSelectedFile(null);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setTimeout(() => setProfileMessage(null), 4000);
    }
  };

  const handleAvatarClick = () => {
    if (isUploading) return; // Block click while uploading
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous blob preview URL to free memory
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      setSelectedFile(file);
    }
  };

  // ── Password Handlers ──
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Confirm password does not match new password.' });
      return;
    }

    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully! Logging out...' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Delay logout by 1.5 seconds so the user can read the success message
      setTimeout(() => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          authService.logout(refreshToken).catch((err) => {
            console.warn('Logout API call failed:', err);
          });
        }
        clearAuthData();
        sessionStorage.clear();
        setUnauthenticated();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to update password.' });
      setTimeout(() => setPasswordMessage(null), 4000);
    }
  };

  // ── Secure Email Verification Handlers ──
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (newEmailInput === dbNotificationEmail) {
      setEmailMessage({ type: 'info', text: 'This is already your active notification email.' });
      return;
    }

    try {
      await authService.requestNotificationEmail(newEmailInput);
      setPendingEmail(newEmailInput);
      setEmailMessage({ 
        type: 'info', 
        text: 'A verification link has been sent to your new email. Please check your inbox and click the link to confirm.' 
      });
    } catch (err: any) {
      console.error(err);
      setEmailMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to request email change.' });
    }
  };

  const handleCancelEmailChange = () => {
    setPendingEmail(null);
    setNewEmailInput(dbNotificationEmail || '');
    setEmailMessage(null);
  };

  // ── Notification Categories Handlers ──
  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    try {
      await authService.updateUserSettings(notifications);
      setNotifSuccessMessage('Notification preferences updated successfully!');
    } catch (err: any) {
      console.error(err);
      setNotifSuccessMessage('Failed to update notification preferences.');
    } finally {
      setTimeout(() => setNotifSuccessMessage(null), 4000);
    }
  };

  // ── Password Strength Check ──
  const getPasswordStrength = () => {
    if (!newPassword) return { label: '', score: 0, color: '' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { label: 'Weak', score: 33, color: 'bg-rose-500' };
    if (score <= 4) return { label: 'Medium', score: 66, color: 'bg-amber-500' };
    return { label: 'Strong', score: 100, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300">
            Account Management
          </span>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            Account Settings
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Update your profile details, manage password security, and configure your notification email preferences.
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-outline-variant/20 gap-8">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 outline-none ${
            activeSubTab === 'profile'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <User className="w-4 h-4" />
          Profile & Security
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 outline-none ${
            activeSubTab === 'notifications'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notification Settings
        </button>
      </div>

      {/* Sub-tab Content Switcher */}
      {activeSubTab === 'profile' ? (
        /* ================= SUB-TAB: PROFILE & SECURITY ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
          
          {/* Card 1: Personal Profile */}
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Personal Profile</h3>
                  <p className="text-xs text-on-surface-variant">Update your public profile name and avatar</p>
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : profileMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : profileMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                {/* Hidden File Input for Avatar */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Profile Avatar Selection Row */}
                <div className="flex flex-col gap-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div onClick={handleAvatarClick} className="relative group cursor-pointer shrink-0">
                      {isUploading ? (
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex flex-col items-center justify-center shadow-md">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[9px] font-bold mt-1 text-slate-500">{progress}%</span>
                        </div>
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center text-xl shadow-md">
                          {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                        </div>
                      )}
                      {!isUploading && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-on-surface">{fullName || 'User Name'}</h4>
                      <p className="text-xs text-on-surface-variant">Click photo to upload new avatar</p>
                    </div>
                  </div>
                  {uploadError && (
                    <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full px-4 py-3 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-outline-variant/20">
              <button
                type="submit"
                form="profile-form"
                disabled={isUploading}
                className={`w-full py-3 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading Avatar ({progress}%)...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Change Password */}
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
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
                      placeholder="Minimum 8 characters"
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

            <div className="pt-6 border-t border-outline-variant/20">
              <button
                type="submit"
                form="password-form"
                className="w-full py-3 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" /> Update Password Now
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SUB-TAB: NOTIFICATION SETTINGS ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
          
          {/* Card 3: Secure Notification Email Settings */}
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Notification Email</h3>
                  <p className="text-xs text-on-surface-variant">Manage secure notification email & verification</p>
                </div>
              </div>

              {/* Secure Email Input & Verification Section */}
              <div className="space-y-4 bg-surface-bright p-5 rounded-2xl border border-outline-variant/30 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Notification Email Address
                  </label>
                  
                  {/* Verification Status Badge */}
                  {pendingEmail ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 animate-pulse">
                      Verification Pending
                    </span>
                  ) : dbNotificationEmail ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700">
                      Verified (Custom)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700">
                      Default Account Email
                    </span>
                  )}
                </div>

                {!pendingEmail ? (
                  /* Standard Email View / Edit Form */
                  <form onSubmit={handleRequestEmailChange} className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="Enter custom email (defaults to account email)"
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shrink-0 shadow-sm"
                      >
                        Verify Email
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Pending Verification State */
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl flex gap-2 text-[11px] text-amber-800 leading-relaxed">
                      <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-700" />
                      <div>
                        We have sent a verification link to <strong className="text-on-surface">{pendingEmail}</strong>.
                        Please click the link in your inbox to verify and activate this email.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEmailChange}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-on-surface-variant hover:text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Undo className="w-3.5 h-3.5" /> Cancel Request
                      </button>
                    </div>
                  </div>
                )}

                {emailMessage && (
                  <p className={`text-[11px] font-medium flex items-center gap-1.5 ${
                    emailMessage.type === 'success' ? 'text-emerald-700' : emailMessage.type === 'error' ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {emailMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {emailMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {emailMessage.type === 'info' && <Info className="w-3.5 h-3.5 shrink-0" />}
                    <span>{emailMessage.text}</span>
                  </p>
                )}

                {!pendingEmail && (
                  <div className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-2 pt-2 border-t border-outline-variant/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Notifications are actively delivered to:{' '}
                      <strong>{currentEmail}</strong>
                      {dbNotificationEmail ? ' (Custom Email)' : ' (Default Account Email)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Notification Categories Toggle */}
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Categories</h3>
                  <p className="text-xs text-on-surface-variant">Toggle which notification topics you want to receive</p>
                </div>
              </div>

              {notifSuccessMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{notifSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Master: Email Notifications */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Email Notifications</h5>
                      <p className="text-[10px] text-on-surface-variant">Enable or disable all email-based notifications</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('email_notifications_enabled')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.email_notifications_enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.email_notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Master: In-App Notifications */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">In-App Notifications</h5>
                      <p className="text-[10px] text-on-surface-variant">Enable or disable notification badges inside the app</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('in_app_notifications_enabled')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.in_app_notifications_enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.in_app_notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-outline-variant/20 my-3 pt-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Subscription Topics</span>
                </div>

                {/* 1. Quiz Assignments */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Quiz Assignments</h5>
                      <p className="text-[10px] text-on-surface-variant">Get notified when a new quiz is assigned</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('notify_quiz_assigned')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.notify_quiz_assigned ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.notify_quiz_assigned ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Exam Deadline Reminders */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Deadline Reminders</h5>
                      <p className="text-[10px] text-on-surface-variant">Get reminders 24h and 1h before deadline</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('notify_exam_reminder')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.notify_exam_reminder ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.notify_exam_reminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Exam Results & Grades */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Exam Results & Grades</h5>
                      <p className="text-[10px] text-on-surface-variant">Receive score reports and feedback</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('notify_results_published')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.notify_results_published ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.notify_results_published ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Live Room Invites */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">Live Room Invites</h5>
                      <p className="text-[10px] text-on-surface-variant">Notified when host launches a live room</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('notify_room_invite')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.notify_room_invite ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.notify_room_invite ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. System Announcements */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">System Announcements</h5>
                      <p className="text-[10px] text-on-surface-variant">Receive maintenance alerts and updates</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('notify_system')}
                    className={`w-11 h-6 rounded-full relative p-1 transition-colors ${
                      notifications.notify_system ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        notifications.notify_system ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="w-full py-3 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Notification Preferences
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
