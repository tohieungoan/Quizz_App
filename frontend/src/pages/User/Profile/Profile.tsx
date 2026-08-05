import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mail,
  User as UserIcon,
  Lock,
  ShieldCheck,
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService, saveUserProfile } from '@/services';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import type { UserProfile } from '@/types/auth.types';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullname, setFullname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary upload hook
  const { uploadFile, isUploading, progress } = useCloudinaryUpload();

  // 1. Fetch current profile from backend
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await authService.getProfile();
      setProfile(data);
      setFullname(data.fullname || '');
      setAvatarUrl(data.avatar || null);
      saveUserProfile(data);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      // Try loading from localStorage as fallback
      const storedStr = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (storedStr) {
        try {
          const parsed = JSON.parse(storedStr);
          setProfile(parsed);
          setFullname(parsed.full_name || parsed.fullname || parsed.name || '');
          setAvatarUrl(parsed.avatar_url || parsed.avatar || null);
        } catch (e) {
          setErrorMsg('Failed to load profile data.');
        }
      } else {
        setErrorMsg('Failed to load profile data. Please refresh or log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 2. Handle Avatar File Select & Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB.');
      return;
    }

    try {
      toast.loading('Uploading avatar...', { id: 'avatar-upload' });
      const uploaded = await uploadFile(file);
      if (uploaded) {
        setAvatarUrl(uploaded);
        toast.success('Avatar uploaded! Click "Save Changes" to apply.', { id: 'avatar-upload' });
      } else {
        toast.error('Failed to upload image. Please try again.', { id: 'avatar-upload' });
      }
    } catch (err) {
      toast.error('Upload failed.', { id: 'avatar-upload' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove avatar handler
  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    toast.success('Avatar removed. Click "Save Changes" to apply.');
  };

  // 3. Save profile & password changes
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!profile) {
      toast.error('User profile not loaded.');
      return;
    }

    const trimmedName = fullname.trim();
    if (!trimmedName) {
      setErrorMsg('Full Name cannot be empty.');
      toast.error('Full Name cannot be empty.');
      return;
    }

    const hasPasswordInput = isChangingPassword && (currentPassword || newPassword || confirmPassword);
    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password.');
        toast.error('Please enter your current password.');
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        setErrorMsg('New password must be at least 8 characters long.');
        toast.error('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match.');
        toast.error('New passwords do not match.');
        return;
      }
    }

    setIsSaving(true);
    let updatedProfileData = profile;

    try {
      // Step A: Update Profile Info (Fullname, Avatar) if changed
      const nameChanged = trimmedName !== (profile.fullname || '');
      const avatarChanged = avatarUrl !== (profile.avatar || null);

      if (nameChanged || avatarChanged) {
        const res = await authService.updateProfile(profile.id, {
          fullname: trimmedName,
          avatar: avatarUrl,
        });
        updatedProfileData = { ...profile, ...res, fullname: trimmedName, avatar: avatarUrl };
      }

      // Step B: Change Password if requested
      if (isChangingPassword && currentPassword && newPassword) {
        await authService.changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
      }

      // Step C: Update local state & storage & broadcast event
      setProfile(updatedProfileData);
      saveUserProfile(updatedProfileData);
      window.dispatchEvent(new CustomEvent('user-profile-updated'));

      const msg = hasPasswordInput
        ? 'Profile and password updated successfully!'
        : 'Profile updated successfully!';
      setSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to update profile. Please try again.';
      setErrorMsg(detail);
      toast.error(detail);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[500px] w-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const userRole = profile?.role || 'USER';
  const roleBadgeColor =
    userRole === 'SUPER_ADMIN'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : userRole === 'ADMIN'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : userRole === 'TEACHER'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const userInitial = (fullname || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-6xl mx-auto">
        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Account Management
          </div>
          <h1 className="font-headline-xl text-[28px] text-[#3a1b7e] font-extrabold tracking-tight">
            My Profile
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
            Manage your personal credentials, identity, security settings, and view account overview.
          </p>
        </div>

        {/* Top Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/40 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden mt-1">
          {/* Subtle background decorative gradient */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-primary/10 via-purple-50 to-transparent rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4"></div>

          {/* Avatar Container with Upload Hover */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex items-center justify-center bg-surface-container-highest relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullname || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-primary">{userInitial}</span>
              )}

              {/* Uploading Spinner Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
                  <span className="text-[11px] font-bold text-white">{progress}%</span>
                </div>
              )}

              {/* Hover Overlay to Trigger Upload */}
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change profile avatar"
                  className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="w-7 h-7 text-white drop-shadow-md mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Change
                  </span>
                </button>
              )}
            </div>

            {/* Role Badge */}
            <div className="absolute -bottom-2.5 bg-primary text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full shadow-md left-1/2 -translate-x-1/2 border-2 border-white whitespace-nowrap tracking-wide uppercase">
              {userRole.replace('_', ' ')}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left mt-2 md:mt-2">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {fullname || 'Anonymous User'}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-2.5 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-semibold text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" /> {profile?.email}
                  </span>
                  {profile?.email_verified ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Account
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Remove Avatar Button if custom avatar is set */}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100/70 border border-rose-200 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Avatar
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-3.5 w-full md:w-auto justify-center mt-2 md:mt-0">
            <div className="flex flex-col items-center justify-center p-3.5 md:p-4 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100 min-w-[110px] shadow-sm">
              <Flame className="w-6 h-6 text-orange-500 mb-1.5 drop-shadow-sm" />
              <span className="text-2xl font-black text-slate-800 leading-none">
                {profile?.study_streak ?? 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Day Streak
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 md:p-4 bg-gradient-to-b from-yellow-50 to-white rounded-2xl border border-yellow-100 min-w-[110px] shadow-sm">
              <Trophy className="w-6 h-6 text-yellow-500 mb-1.5 drop-shadow-sm" />
              <span className="text-2xl font-black text-slate-800 leading-none">
                {profile?.achievement_points ?? 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Points
              </span>
            </div>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form & Sidebar Grid */}
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center: Editable Credentials & Security Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal Information */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/40 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" /> Personal Information
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Update your public display name. This will be shown across all courses, quizzes, and leaderboards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="relative group">
                  <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                  />
                </div>

                {/* Email (Read-Only) */}
                <div className="relative group">
                  <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10">
                    Email Address
                  </label>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    readOnly
                    placeholder="name@domain.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-[14px] text-slate-500 font-bold shadow-sm cursor-not-allowed select-none opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Change Password (If LOCAL Account) */}
            {profile?.auth_provider === 'LOCAL' && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/40 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" /> Security & Password
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isChangingPassword
                        ? 'Enter your current password and choose a new strong password.'
                        : 'Your account is secured with a password.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isChangingPassword) {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                      setIsChangingPassword(!isChangingPassword);
                    }}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                      isChangingPassword
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
                  </button>
                </div>

                {isChangingPassword && (
                  <div className="space-y-5 max-w-lg pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Current Password */}
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        Current Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* New Password */}
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        New Password (Min 8 characters) <span className="text-rose-500">*</span>
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Confirm New Password */}
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex items-center gap-2.5 px-7 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Right Column: Account Status & Metadata */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/40 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-base">Account Status</h3>
              <ul className="space-y-3.5">
                <li className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${roleBadgeColor}`}>
                    {userRole.replace('_', ' ')}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      profile?.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {profile?.status || 'ACTIVE'}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-500 font-medium">Auth Provider</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                    {profile?.auth_provider || 'LOCAL'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Audit & Timestamps Card */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/40 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-slate-400" /> Account Audit Logs
              </h3>
              <ul className="space-y-3.5">
                <li className="text-xs pb-3 border-b border-slate-100">
                  <p className="text-slate-500 font-medium mb-1">Last Login</p>
                  <p className="text-slate-800 font-bold">
                    {profile?.last_login
                      ? new Date(profile.last_login).toLocaleString()
                      : 'Recently active'}
                  </p>
                </li>
                <li className="text-xs">
                  <p className="text-slate-500 font-medium mb-1">Account Created</p>
                  <p className="text-slate-800 font-bold">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};
export default Profile;
