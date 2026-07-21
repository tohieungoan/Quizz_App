import React, { useState, useEffect } from 'react';
import { Camera, Mail, User, Lock, ShieldCheck, Flame, Trophy, Calendar, CheckCircle2, AlertCircle, Save } from 'lucide-react';

// Mock current logged-in user data
const MOCK_CURRENT_USER = {
  id: 'U-001',
  fullname: 'Fleya Nguyen',
  email: 'fleya.nguyen@enterprise.com',
  password: 'hashed_password_123',
  avatar: '',
  study_streak: 14,
  auth_provider: 'LOCAL' as 'LOCAL' | 'GOOGLE' | 'MICROSOFT',
  provider_id: null,
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  email_verified: true,
  achievement_points: 2450,
  last_login: '2026-07-21T08:00:00Z',
  created_at: '2025-01-15T10:30:00Z',
};

export const Profile: React.FC = () => {
  const [userData, setUserData] = useState(MOCK_CURRENT_USER);
  const [formData, setFormData] = useState({
    fullname: MOCK_CURRENT_USER.fullname,
    email: MOCK_CURRENT_USER.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Mock avatar upload by setting a random URL or using a dummy icon
        setUserData({ ...userData, avatar: URL.createObjectURL(file) });
        setSuccessMsg('Avatar updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    };
    input.click();
  };

  const handleSaveProfile = () => {
    setErrorMsg('');
    if (!formData.fullname.trim() || !formData.email.trim()) {
      setErrorMsg('Fullname and Email are required.');
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New passwords do not match.');
        return;
      }
      if (!formData.currentPassword) {
        setErrorMsg('Current password is required to change password.');
        return;
      }
    }

    setIsSaving(true);
    setTimeout(() => {
      setUserData({
        ...userData,
        fullname: formData.fullname,
        email: formData.email,
      });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsSaving(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1000);
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-6xl mx-auto">
        
        {/* Header */}
        <div>
          <h1 className="font-headline-xl text-[28px] text-[#3a1b7e] font-extrabold tracking-tight">
            My Profile
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
            Manage your personal information, security settings, and view your achievements.
          </p>
        </div>

        {/* Top Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/40 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden mt-2">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 to-[#8b5cf6]/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex items-center justify-center bg-surface-container-highest relative">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-primary">{userData.fullname.charAt(0).toUpperCase()}</span>
              )}
              {/* Overlay on hover */}
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]" 
                onClick={handleAvatarUpload}
              >
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </div>
            <div className="absolute -bottom-2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md left-1/2 -translate-x-1/2 border-2 border-white whitespace-nowrap tracking-wide">
              {userData.role.replace('_', ' ')}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left mt-2 md:mt-4">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{userData.fullname}</h2>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 md:gap-4 mt-3 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400" /> {userData.email}
              </span>
              {userData.email_verified && (
                <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 font-bold">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Verified
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto justify-center mt-2 md:mt-0">
             <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100/50 min-w-[120px] shadow-sm">
                <Flame className="w-7 h-7 text-orange-500 mb-2 drop-shadow-sm" />
                <span className="text-2xl font-black text-slate-800 leading-none">{userData.study_streak}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white rounded-2xl border border-yellow-100/50 min-w-[120px] shadow-sm">
                <Trophy className="w-7 h-7 text-yellow-500 mb-2 drop-shadow-sm" />
                <span className="text-2xl font-black text-slate-800 leading-none">{userData.achievement_points}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Points</span>
              </div>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="bg-error-container text-error px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
            <AlertCircle className="w-5 h-5" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" /> {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-outline-variant/40 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Personal Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                      Full Name
                    </label>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                    />
                  </div>
                  
                  <div className="relative group">
                    <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                      Email Address
                    </label>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm"
                    />
                    {userData.email_verified && formData.email !== userData.email && (
                      <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1.5 absolute -bottom-5 left-0">
                        <AlertCircle className="w-3.5 h-3.5" /> Re-verification required
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {userData.auth_provider === 'LOCAL' && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> Change Password
                  </h3>
                  <div className="space-y-6 max-w-md pt-2">
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        Current Password
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm tracking-widest placeholder:tracking-normal"
                      />
                    </div>
                    
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        New Password
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm tracking-widest placeholder:tracking-normal"
                      />
                    </div>
                    
                    <div className="relative group">
                      <label className="absolute -top-2.5 left-3 bg-white px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider z-10 group-focus-within:text-primary transition-colors">
                        Confirm New Password
                      </label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-bold shadow-sm tracking-widest placeholder:tracking-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar / Read-only Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Account Status</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    userData.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {userData.role}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    userData.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {userData.status}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Auth Provider</span>
                  <span className="font-bold text-slate-700">{userData.auth_provider}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Audit Logs
              </h3>
              <ul className="space-y-3">
                <li className="text-xs">
                  <p className="text-slate-500 font-medium mb-0.5">Last Login</p>
                  <p className="text-slate-800 font-bold">{new Date(userData.last_login).toLocaleString()}</p>
                </li>
                <li className="text-xs">
                  <p className="text-slate-500 font-medium mb-0.5">Account Created</p>
                  <p className="text-slate-800 font-bold">{new Date(userData.created_at).toLocaleString()}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
};
