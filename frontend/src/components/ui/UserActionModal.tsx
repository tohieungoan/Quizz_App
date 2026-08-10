import { X, User, Mail, Shield, AlertCircle, CheckCircle2, Lock, Calendar, Star, Clock, BookOpen, ChevronDown, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';

export type UserMode = 'view' | 'edit' | 'add';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'USER' | string;
  status: 'ACTIVE' | 'SUSPENDED' | string;
  initials: string;
  email_verified?: boolean;
  achievement_points?: number;
  last_login?: string;
  created_at?: string;
  avatar?: string;
  assigned_quizzes?: string[];
}

const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  disabled 
}: { 
  value: string, 
  options: {value: string, label: string}[], 
  onChange: (val: string) => void,
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button 
        type="button" 
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)} 
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none transition-all ${isOpen ? 'ring-1 ring-primary border-primary' : ''} text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest disabled:cursor-not-allowed`}
      >
        <span>{selectedOption?.label}</span>
        {!disabled && <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>
      
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: UserMode;
  user?: UserData | null;
  onSave: (user: Partial<UserData> & { password?: string }) => void;
  fieldErrors?: Record<string, string>;
  isSaving?: boolean;
  isSelf?: boolean;
  isLastSuperAdmin?: boolean;
}

export function UserActionModal({
  isOpen,
  onClose,
  mode,
  user,
  onSave,
  fieldErrors = {},
  isSaving = false,
  isSelf = false,
  isLastSuperAdmin = false,
}: UserActionModalProps) {
  const [formData, setFormData] = useState<Partial<UserData>>({
    name: '',
    email: '',
    role: 'USER',
    status: 'ACTIVE',
    email_verified: false,
    avatar: '',
    achievement_points: 0
  });

  const [password, setPassword] = useState('');
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && user) {
        setFormData(user);
        if (mode === 'view' && user.id) {
          setIsLoadingExams(true);
          userService.getUserAssignedExams(user.id)
            .then((data) => {
              setAssignedExams(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
              console.error('Failed to load assigned exams for user:', err);
              setAssignedExams([]);
            })
            .finally(() => {
              setIsLoadingExams(false);
            });
        }
      } else {
        setFormData({ name: '', email: '', role: 'USER', status: 'ACTIVE', email_verified: false, avatar: '', achievement_points: 0 });
        setPassword('');
        setAssignedExams([]);
      }
    } else {
      setAssignedExams([]);
    }
  }, [isOpen, mode, user]);

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadOnly) {
      onSave({ ...formData, password } as any);
    }
  };

  const titles = {
    add: 'Create New User',
    edit: 'Edit User Profile',
    view: 'User Details'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/30">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <h2 className="text-xl font-headline-lg font-bold text-on-surface">
            {titles[mode]}
          </h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Basic Info Section */}
            <div>
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <User className="w-4 h-4" /> Full Name <span className="text-error">*</span>
                  </label>
                  <input 
                    required
                    type="text"
                    disabled={isReadOnly || isSaving}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 outline-none focus:ring-1 text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest ${fieldErrors.fullname ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    placeholder="e.g. John Doe"
                  />
                  {fieldErrors.fullname && <p className="text-xs text-error mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {fieldErrors.fullname}</p>}
                </div>

                {/* Email (Only in Add mode) */}
                {mode === 'add' && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                      <Mail className="w-4 h-4" /> Email Address <span className="text-error">*</span>
                    </label>
                    <input 
                      required
                      type="email"
                      disabled={isReadOnly || isSaving}
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 outline-none focus:ring-1 text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest ${fieldErrors.email ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                      placeholder="e.g. john@example.com"
                    />
                    {fieldErrors.email && <p className="text-xs text-error mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {fieldErrors.email}</p>}
                  </div>
                )}

                {/* Password (Only in Add mode) */}
                {mode === 'add' && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                      <Lock className="w-4 h-4" /> Initial Password <span className="text-error">*</span>
                    </label>
                    <input 
                      required
                      type="password"
                      minLength={8}
                      disabled={isSaving}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 outline-none focus:ring-1 text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest ${fieldErrors.password ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                      placeholder="Enter a secure password..."
                    />
                    {fieldErrors.password && <p className="text-xs text-error mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {fieldErrors.password}</p>}
                  </div>
                )}

                {/* Avatar URL */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <User className="w-4 h-4" /> Avatar URL
                  </label>
                  <input 
                    type="url"
                    disabled={isReadOnly || isSaving}
                    value={formData.avatar || ''}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 outline-none focus:ring-1 text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest ${fieldErrors.avatar ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    placeholder="https://example.com/avatar.png"
                  />
                  {fieldErrors.avatar && <p className="text-xs text-error mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {fieldErrors.avatar}</p>}
                </div>
              </div>
            </div>

            {/* Account Settings Section */}
            <div>
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-2">Account Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <Shield className="w-4 h-4" /> Role <span className="text-error">*</span>
                  </label>
                  <CustomSelect 
                    disabled={isReadOnly || (mode === 'edit' && (isSelf || isLastSuperAdmin))}
                    value={formData.role || 'USER'}
                    onChange={val => setFormData({ ...formData, role: val as any })}
                    options={[
                      { value: 'USER', label: 'User' },
                      { value: 'SUPER_ADMIN', label: 'Super Admin' }
                    ]}
                  />
                  {mode === 'edit' && isSelf && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> You cannot demote your own Super Admin role.
                    </p>
                  )}
                  {mode === 'edit' && !isSelf && isLastSuperAdmin && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Cannot demote the last remaining active Super Admin.
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <AlertCircle className="w-4 h-4" /> Status <span className="text-error">*</span>
                  </label>
                  <CustomSelect 
                    disabled={isReadOnly || (mode === 'edit' && (isSelf || isLastSuperAdmin))}
                    value={formData.status || 'ACTIVE'}
                    onChange={val => setFormData({ ...formData, status: val as any })}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'SUSPENDED', label: 'Suspended' }
                    ]}
                  />
                  {mode === 'edit' && isSelf && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> You cannot suspend your own account.
                    </p>
                  )}
                  {mode === 'edit' && !isSelf && isLastSuperAdmin && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Cannot suspend the last remaining active Super Admin.
                    </p>
                  )}
                </div>

                {/* Achievement Points */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <Star className="w-4 h-4" /> Achievement Points
                  </label>
                  <input 
                    type="number"
                    disabled={isReadOnly || isSaving}
                    value={formData.achievement_points || 0}
                    onChange={e => setFormData({ ...formData, achievement_points: parseInt(e.target.value) || 0 })}
                    className={`w-full bg-surface-container-low border rounded-lg px-4 py-2.5 outline-none focus:ring-1 text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest ${fieldErrors.achievement_points ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    placeholder="0"
                  />
                  {fieldErrors.achievement_points && <p className="text-xs text-error mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {fieldErrors.achievement_points}</p>}
                </div>

              </div>
            </div>

            {/* Read-only Statistics Section (Only in View Mode) */}
            {isReadOnly && (
              <div>
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-2">Activity & Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-lowest border border-outline-variant/50 p-4 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">Achievement Points</p>
                      <p className="text-lg font-bold text-on-surface">{formData.achievement_points || 0}</p>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-lowest border border-outline-variant/50 p-4 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant font-medium">Last Login</p>
                      <p className="text-[13px] font-bold text-on-surface break-words">{formData.last_login || 'Never'}</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/50 p-4 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant font-medium">Created At</p>
                      <p className="text-[13px] font-bold text-on-surface break-words">{formData.created_at || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-2 mt-8">Assigned Exams</h3>
                <div className="space-y-2">
                  {isLoadingExams ? (
                    <div className="flex items-center justify-center py-6 text-on-surface-variant bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                      <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                      <span className="text-sm">Loading assigned exams...</span>
                    </div>
                  ) : assignedExams.length > 0 ? (
                    assignedExams.map((exam) => (
                      <div key={exam.id} className="bg-surface-container-lowest border border-outline-variant/50 p-3 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-on-surface truncate">{exam.title}</span>
                          <div className="flex flex-wrap gap-2 items-center mt-1">
                            {exam.subject && (
                              <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{exam.subject}</span>
                            )}
                            {exam.group_name && (
                              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Group: {exam.group_name}</span>
                            )}
                            {exam.timer && (
                              <span className="text-[11px] font-medium text-primary flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.timer} mins</span>
                            )}
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                              {exam.status || 'ASSIGNED'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {exam.score !== null && exam.score !== undefined ? (
                            <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                              Score: {exam.score}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                              Exam #{exam.id}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-on-surface-variant italic py-4 text-center bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                      No exams assigned to this user.
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isReadOnly && (
              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/30">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={onClose}
                  className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : (mode === 'add' ? 'Create User' : 'Save Changes')}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
