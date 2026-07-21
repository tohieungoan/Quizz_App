import { X, User, Mail, Shield, AlertCircle, CheckCircle2, Lock, Calendar, Star, Clock, BookOpen, ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { DUMMY_QUIZZES } from '../../data/mockDb';

export type UserMode = 'view' | 'edit' | 'add';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
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
        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
  onSave: (user: Partial<UserData>) => void;
}

export function UserActionModal({ isOpen, onClose, mode, user, onSave }: UserActionModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && user) {
        setFormData(user);
      } else {
        setFormData({ name: '', email: '', role: 'USER', status: 'ACTIVE', email_verified: false, avatar: '', achievement_points: 0 });
        setPassword('');
      }
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
                    disabled={isReadOnly}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest"
                    placeholder="e.g. John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <Mail className="w-4 h-4" /> Email Address <span className="text-error">*</span>
                  </label>
                  <input 
                    required
                    type="email"
                    disabled={isReadOnly}
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest"
                    placeholder="e.g. john@example.com"
                  />
                </div>

                {/* Password (Only in Add mode) */}
                {mode === 'add' && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                      <Lock className="w-4 h-4" /> Initial Password <span className="text-error">*</span>
                    </label>
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                      placeholder="Enter a secure password..."
                    />
                  </div>
                )}

                {/* Avatar URL */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <User className="w-4 h-4" /> Avatar URL
                  </label>
                  <input 
                    type="url"
                    disabled={isReadOnly}
                    value={formData.avatar || ''}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest"
                    placeholder="https://example.com/avatar.png"
                  />
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
                    disabled={isReadOnly}
                    value={formData.role || 'USER'}
                    onChange={val => setFormData({ ...formData, role: val as any })}
                    options={[
                      { value: 'USER', label: 'User' },
                      { value: 'SUPER_ADMIN', label: 'Super Admin' }
                    ]}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <AlertCircle className="w-4 h-4" /> Status <span className="text-error">*</span>
                  </label>
                  <CustomSelect 
                    disabled={isReadOnly}
                    value={formData.status || 'ACTIVE'}
                    onChange={val => setFormData({ ...formData, status: val as any })}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'SUSPENDED', label: 'Suspended' }
                    ]}
                  />
                </div>

                {/* Achievement Points */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-label-bold text-on-surface-variant mb-1.5">
                    <Star className="w-4 h-4" /> Achievement Points
                  </label>
                  <input 
                    type="number"
                    disabled={isReadOnly}
                    value={formData.achievement_points || 0}
                    onChange={e => setFormData({ ...formData, achievement_points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface disabled:opacity-70 disabled:bg-surface-container-lowest"
                    placeholder="0"
                  />
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
                  {formData.assigned_quizzes && formData.assigned_quizzes.length > 0 ? (
                    formData.assigned_quizzes.map(quizId => {
                      const quiz = DUMMY_QUIZZES.find(q => q.id === quizId);
                      if (!quiz) return null;
                      return (
                        <div key={quizId} className="bg-surface-container-lowest border border-outline-variant/50 p-3 rounded-lg flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-on-surface">{quiz.title}</span>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{quiz.subject}</span>
                              <span className="text-[11px] font-medium text-primary flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.time}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">{quiz.id}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-on-surface-variant italic py-2 text-center bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
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
                  onClick={onClose}
                  className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {mode === 'add' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
