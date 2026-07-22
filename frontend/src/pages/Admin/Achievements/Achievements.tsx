import React, { useState } from 'react';
import { Award, Search, Plus, Trophy, Zap, Flame, Moon, Star, Shield, MoreVertical, Edit2, Trash2, ChevronDown, Type, AlignLeft, Sliders, Target, Sparkles, Users, AlertTriangle } from 'lucide-react';
import { USER_ACHIEVEMENTS, AchievementBadge } from '@/data/userData';

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  zap: Zap,
  flame: Flame,
  award: Award,
  moon: Moon,
  star: Star,
  shield: Shield
};

const rarityColors: Record<string, string> = {
  COMMON: 'bg-slate-100 text-slate-700 border-slate-200',
  RARE: 'bg-blue-50 text-blue-700 border-blue-200',
  EPIC: 'bg-purple-50 text-purple-700 border-purple-200',
  LEGENDARY: 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
};

const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  renderOption 
}: { 
  value: string, 
  options: {value: string, label: string, icon?: React.ElementType, colorClass?: string}[], 
  onChange: (val: string) => void, 
  renderOption?: (opt: any) => React.ReactNode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none transition-all ${isOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : 'hover:border-slate-300'} text-on-surface`}
      >
        <div className="flex items-center gap-2">
          {renderOption ? renderOption(selectedOption) : selectedOption.label}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${value === opt.value ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                {renderOption ? renderOption(opt) : opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export function Achievements() {
  const [achievements, setAchievements] = useState<AchievementBadge[]>(USER_ACHIEVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementBadge | null>(null);
  
  const [viewingAchievement, setViewingAchievement] = useState<AchievementBadge | null>(null);
  const [unlockedUsers, setUnlockedUsers] = useState<{id: string, name: string, date: string, color: string}[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const filteredAchievements = achievements.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'All' || a.tier === filterRarity;
    return matchesSearch && matchesRarity;
  });

  const stats = {
    total: achievements.length,
    legendary: achievements.filter(a => a.tier === 'LEGENDARY').length,
    epic: achievements.filter(a => a.tier === 'EPIC').length,
    rare: achievements.filter(a => a.tier === 'RARE').length,
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAchievement) {
      const savedAchievement = {
        ...editingAchievement,
        current_progress: editingAchievement.current_progress || 0
      };
      
      if (editingAchievement.id) {
        // Edit existing
        setAchievements(achievements.map(a => a.id === editingAchievement.id ? savedAchievement : a));
      } else {
        // Add new
        setAchievements([{ ...savedAchievement, id: Date.now() }, ...achievements]);
      }
    }
    setIsModalOpen(false);
    setEditingAchievement(null);
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Achievement',
      message: 'Are you sure you want to permanently delete this achievement? This action cannot be undone.',
      onConfirm: () => {
        setAchievements(prev => prev.filter(a => a.id !== id));
        setConfirmDialog(null);
      }
    });
  };

  const handleViewUsers = (badge: AchievementBadge) => {
    setViewingAchievement(badge);
    const count = (badge.id % 20) + 5; // Fake number of users for mock
    setUnlockedUsers(Array.from({ length: count }).map((_, i) => ({
      id: `u-${badge.id}-${i}`,
      name: `Student ${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      color: ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'][Math.floor(Math.random() * 4)]
    })));
  };

  const handleRevokeUser = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revoke Badge',
      message: 'Are you sure you want to revoke this badge from the user? They will lose all associated perks.',
      onConfirm: () => {
        setUnlockedUsers(prev => prev.filter(u => u.id !== userId));
        setConfirmDialog(null);
      }
    });
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-[28px] text-primary font-extrabold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-white" />
              </div>
              Achievement Management
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
              Create and manage badges and titles that users can earn.
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingAchievement({
                id: 0,
                name: '',
                description: '',
                icon: 'award',
                category: 'BADGE',
                tier: 'COMMON',
                points_required: 0,
                type_value: 'QUIZ_COUNT',
                target_value: 1
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-[#8b5cf6] text-white rounded-xl font-bold hover:shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Achievement
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-bold text-slate-500 mb-1">Total Badges</span>
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-bold text-amber-600 mb-1 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Legendary</span>
            <span className="text-2xl font-black text-slate-800">{stats.legendary}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-bold text-purple-600 mb-1">Epic</span>
            <span className="text-2xl font-black text-slate-800">{stats.epic}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <span className="text-sm font-bold text-blue-600 mb-1">Rare</span>
            <span className="text-2xl font-black text-slate-800">{stats.rare}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm">
          <div className="flex bg-surface-container-low p-1 rounded-xl">
            {['All', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'].map(r => (
              <button
                key={r}
                onClick={() => { setFilterRarity(r); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filterRarity === r
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {r === 'All' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface font-medium transition-all"
            />
          </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAchievements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => {
            const Icon = iconMap[item.icon] || Award;
            
            const mockUnlockedCount = (item.id % 890) + 124; // Generate a deterministic fake count based on ID

            return (
              <div key={item.id} className="group bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
                {/* Decorative background glow for Legendary/Epic */}
                {(item.tier === 'LEGENDARY' || item.tier === 'EPIC') && (
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none ${item.tier === 'LEGENDARY' ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                )}
                
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 z-10">
                  <button 
                    onClick={() => {
                      setEditingAchievement(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-error hover:text-white hover:border-error transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm ${rarityColors[item.tier].replace('text-', 'text-').replace('bg-', 'bg-').split(' ')[0]} ${rarityColors[item.tier].split(' ')[1]}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm border ${rarityColors[item.tier]}`}>
                      {item.tier}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1.5 pr-14 group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
                  </div>
                </div>
                
                <div className="mt-5 pt-5 border-t border-slate-100/80 bg-slate-50/50 -mx-6 -mb-6 p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      Target: <span className="text-blue-500">{item.target_value} {item.type_value}</span>
                    </div>
                    {item.points_required > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        Pts: <span className="text-amber-500">{item.points_required}</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleViewUsers(item)}
                    className="w-full flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all group/users text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 shrink-0">
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center">
                          <Star className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 group-hover/users:bg-primary group-hover/users:text-white transition-colors">
                          +99
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 group-hover/users:text-primary/70">Unlocked By</div>
                        <div className="text-xs font-black text-slate-800">
                          {mockUnlockedCount.toLocaleString()} <span className="font-bold text-slate-500">players</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover/users:text-primary group-hover/users:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {Math.ceil(filteredAchievements.length / itemsPerPage) > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(filteredAchievements.length / itemsPerPage) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === i + 1 ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredAchievements.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(filteredAchievements.length / itemsPerPage)}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
        
        {filteredAchievements.length === 0 && (
          <div className="py-20 text-center">
            <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-600">No achievements found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}

      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingAchievement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-4xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 flex flex-col max-h-[95dvh] sm:max-h-[90dvh]">
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center relative overflow-hidden shrink-0 rounded-t-[32px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {editingAchievement.id === 0 ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </div>
                {editingAchievement.id === 0 ? 'Create New Badge' : 'Edit Achievement'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-5 sm:p-8 bg-slate-50/30 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left Column: Basic Info Card */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Type className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-extrabold text-slate-800">Basic Information</h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editingAchievement.name}
                        onChange={e => setEditingAchievement({...editingAchievement, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 shadow-sm"
                        placeholder="e.g. Quiz Master"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <textarea
                        value={editingAchievement.description}
                        onChange={e => setEditingAchievement({...editingAchievement, description: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 resize-none shadow-sm"
                        placeholder="What does the user need to do to get this?"
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Visuals & Rules Card */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-extrabold text-slate-800">Visuals & Rules</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="z-30 relative">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rarity Tier</label>
                      <CustomSelect
                        value={editingAchievement.tier}
                        onChange={(val) => setEditingAchievement({...editingAchievement, tier: val as any})}
                        options={[
                          { value: 'COMMON', label: 'Common', colorClass: 'text-slate-600' },
                          { value: 'RARE', label: 'Rare', colorClass: 'text-blue-600' },
                          { value: 'EPIC', label: 'Epic', colorClass: 'text-purple-600' },
                          { value: 'LEGENDARY', label: 'Legendary', colorClass: 'text-amber-500' }
                        ]}
                        renderOption={(opt) => (
                          <span className={`font-bold ${opt.colorClass}`}>{opt.label}</span>
                        )}
                      />
                    </div>
                    <div className="z-30 relative">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Badge Icon</label>
                      <CustomSelect
                        value={editingAchievement.icon}
                        onChange={(val) => setEditingAchievement({...editingAchievement, icon: val})}
                        options={[
                          { value: 'trophy', label: 'Trophy', icon: Trophy },
                          { value: 'award', label: 'Award', icon: Award },
                          { value: 'zap', label: 'Zap', icon: Zap },
                          { value: 'flame', label: 'Flame', icon: Flame },
                          { value: 'moon', label: 'Moon', icon: Moon },
                          { value: 'star', label: 'Star', icon: Star },
                          { value: 'shield', label: 'Shield', icon: Shield }
                        ]}
                        renderOption={(opt) => (
                          <div className="flex items-center gap-2">
                            {opt.icon && <opt.icon className="w-4 h-4" />}
                            <span>{opt.label}</span>
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="z-20 relative">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                        <CustomSelect
                          value={editingAchievement.category}
                          onChange={(val) => setEditingAchievement({...editingAchievement, category: val as any})}
                          options={[
                            { value: 'TITLE', label: 'Title (Profile equip)' },
                            { value: 'BADGE', label: 'Badge (Achievement)' }
                          ]}
                        />
                      </div>
                      <div className="z-20 relative">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Condition Type</label>
                        <CustomSelect
                          value={editingAchievement.type_value}
                          onChange={(val) => setEditingAchievement({...editingAchievement, type_value: val})}
                          options={[
                            { value: 'STREAK', label: 'Daily Streak' },
                            { value: 'QUIZ_COUNT', label: 'Quiz Count' },
                            { value: 'PERFECT_SCORE', label: 'Perfect Score' },
                            { value: 'TOTAL_POINTS', label: 'Total Points' }
                          ]}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Target Value</label>
                        <input
                          type="number"
                          value={editingAchievement.target_value}
                          onChange={e => setEditingAchievement({...editingAchievement, target_value: parseInt(e.target.value) || 1})}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 shadow-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Points Required</label>
                        <input
                          type="number"
                          value={editingAchievement.points_required}
                          onChange={e => setEditingAchievement({...editingAchievement, points_required: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 shadow-sm"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-[#4f39b1] hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                >
                  Save Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Users Modal */}
      {viewingAchievement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Unlocked By
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Players who earned the <span className="font-bold text-slate-700">{viewingAchievement.name}</span> badge.
                </p>
              </div>
              <button onClick={() => setViewingAchievement(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4 opacity-0" /> {/* Spacer or close icon */}
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1">
              {unlockedUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">No one has unlocked this yet.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {unlockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.color}`}>
                          {user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{user.name}</div>
                          <div className="text-[11px] font-medium text-slate-500">Earned on {user.date}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRevokeUser(user.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Revoke badge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewingAchievement(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Confirm Dialog Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">{confirmDialog.title}</h2>
              <p className="text-sm font-medium text-slate-500">{confirmDialog.message}</p>
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
