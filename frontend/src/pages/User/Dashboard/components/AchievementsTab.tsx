import React, { useState } from 'react';
import {
  Trophy,
  Zap,
  Flame,
  Award,
  Star,
  Moon,
  Check,
  Shield,
  Sparkles,
  Lock,
  Filter,
  CheckCircle2,
  Crown,
  Target,
  BookOpen,
} from 'lucide-react';
import { USER_ACHIEVEMENTS } from '@/data/userData';
import { Pagination } from '@/components/ui/Pagination';

interface AchievementsTabProps {
  activeTitle: string | null;
  setActiveTitle: (title: string | null) => void;
}

export type RarityType = 'All' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  activeTitle,
  setActiveTitle,
}) => {
  const [selectedTier, setSelectedTier] = useState<RarityType>('All');
  const [badgeFilter, setBadgeFilter] = useState<'All' | 'Unlocked' | 'Locked'>('All');

  // Pagination states
  const [titlePage, setTitlePage] = useState(1);
  const TITLES_PER_PAGE = 6;

  const [badgePage, setBadgePage] = useState(1);
  const BADGES_PER_PAGE = 6;

  // Filter Titles by Category === 'TITLE' and Tier
  const titlesList = USER_ACHIEVEMENTS.filter((a) => a.category === 'TITLE');
  const filteredTitles = titlesList.filter((t) => {
    if (selectedTier === 'All') return true;
    return t.tier === selectedTier;
  });

  // Calculate Paginated Titles
  const totalTitlePages = Math.ceil(filteredTitles.length / TITLES_PER_PAGE);
  const titleStartIndex = (titlePage - 1) * TITLES_PER_PAGE;
  const paginatedTitles = filteredTitles.slice(titleStartIndex, titleStartIndex + TITLES_PER_PAGE);

  // Filter Badges by Category === 'BADGE' and Status
  const badgesList = USER_ACHIEVEMENTS.filter((a) => a.category === 'BADGE');
  const filteredBadges = badgesList.filter((b) => {
    if (badgeFilter === 'Unlocked') return b.is_unlocked;
    if (badgeFilter === 'Locked') return !b.is_unlocked;
    return true;
  });

  // Calculate Paginated Badges
  const totalBadgePages = Math.ceil(filteredBadges.length / BADGES_PER_PAGE);
  const badgeStartIndex = (badgePage - 1) * BADGES_PER_PAGE;
  const paginatedBadges = filteredBadges.slice(badgeStartIndex, badgeStartIndex + BADGES_PER_PAGE);

  const handleTierSelect = (tier: RarityType) => {
    setSelectedTier(tier);
    setTitlePage(1);
  };

  const handleBadgeFilterSelect = (filter: 'All' | 'Unlocked' | 'Locked') => {
    setBadgeFilter(filter);
    setBadgePage(1);
  };

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs font-black';
      case 'EPIC':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black';
      case 'RARE':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold';
      case 'COMMON':
        return 'bg-slate-200 text-slate-700 font-bold';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getTitleIcon = (iconName: string) => {
    switch (iconName) {
      case 'crown':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'flame':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'trophy':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'moon':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'target':
        return <Target className="w-4 h-4 text-emerald-500" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-cyan-500" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  };

  const unlockedTitlesCount = titlesList.filter((t) => t.is_unlocked).length;
  const unlockedBadgesCount = badgesList.filter((b) => b.is_unlocked).length;

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 w-fit">
            <Trophy className="w-3.5 h-3.5" /> Achievements Showcase
          </span>
          <h2 className="text-3xl font-black tracking-tight">Achievements & Display Titles</h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Unlock badges by taking quizzes and select a display title for your profile.
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex flex-wrap gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center px-3 border-r border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Equipped Title</span>
            <span className="text-sm font-black text-amber-400 block whitespace-nowrap">
              {activeTitle ? activeTitle : 'None'}
            </span>
          </div>
          <div className="text-center px-3 border-r border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Unlocked Badges</span>
            <span className="text-sm font-black text-emerald-400">
              {unlockedBadgesCount}/{badgesList.length}
            </span>
          </div>
          <div className="text-center px-3">
            <span className="text-xs text-slate-300 block font-medium">Unlocked Titles</span>
            <span className="text-sm font-black text-indigo-300">
              {unlockedTitlesCount}/{titlesList.length}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: EQUIP DISPLAY TITLE (WITH TIER FILTER & PAGINATION)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                Equip Display Title
              </h3>
              <p className="text-xs text-on-surface-variant">
                Click any unlocked title to equip it immediately on your profile
              </p>
            </div>
          </div>

          {/* Tier Rarity Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-bright p-1 rounded-2xl border border-outline-variant/30 overflow-x-auto">
            <span className="text-[11px] font-bold text-outline px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Tier:
            </span>
            {(['All', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as RarityType[]).map((tier) => {
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => handleTierSelect(tier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-on-surface shadow-sm font-black'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/60'
                  }`}
                >
                  {tier === 'All' ? 'All' : tier.charAt(0) + tier.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Title Cards Grid */}
        {paginatedTitles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTitles.map((title) => {
              const isEquipped = activeTitle === title.name;

              return (
                <div
                  key={title.id}
                  onClick={() => {
                    if (title.is_unlocked) {
                      setActiveTitle(isEquipped ? null : title.name);
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
                    !title.is_unlocked
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isEquipped
                      ? 'bg-amber-50/90 border-amber-400 ring-4 ring-amber-400/20 shadow-md cursor-pointer scale-[1.01]'
                      : 'bg-white border-outline-variant/30 hover:border-amber-400/60 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-surface-bright flex items-center justify-center border border-outline-variant/20 shrink-0">
                          {getTitleIcon(title.icon)}
                        </div>
                        <span
                          className={`text-[11px] uppercase px-2.5 py-0.5 rounded-lg ${getRarityBadgeStyle(
                            title.tier
                          )}`}
                        >
                          {title.tier}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isEquipped ? (
                        <span className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-black shadow-xs shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current text-amber-500" /> EQUIPPED
                        </span>
                      ) : title.is_unlocked ? (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-amber-100 hover:text-amber-800 transition-colors shrink-0">
                          Click to Equip
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className={`font-bold text-sm ${isEquipped ? 'text-amber-950 font-black' : 'text-on-surface'}`}>
                        {title.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                        {title.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-bright rounded-2xl border border-dashed border-outline-variant">
            <p className="text-sm text-on-surface-variant font-medium">No display titles found in this tier.</p>
          </div>
        )}

        {/* Titles Pagination */}
        {totalTitlePages > 1 && (
          <Pagination
            currentPage={titlePage}
            totalPages={totalTitlePages}
            totalItems={filteredTitles.length}
            startIndex={titleStartIndex}
            itemsPerPage={TITLES_PER_PAGE}
            onPageChange={(p) => setTitlePage(p)}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: BADGES & ACHIEVEMENTS GALLERY (WITH PAGINATION)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">Badges & Trophies Gallery</h3>
              <p className="text-xs text-on-surface-variant">Track your milestone accomplishments in the platform</p>
            </div>
          </div>

          {/* Badge Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-outline-variant/30 shadow-xs">
            {(['All', 'Unlocked', 'Locked'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleBadgeFilterSelect(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  badgeFilter === filter
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        {paginatedBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBadges.map((badge) => {
              // Parse progress for progress bar
              const currentProgress = badge.current_progress || 0;
              const targetValue = badge.target_value || 1;
              const progressPercentage = Math.min(100, Math.round((currentProgress / targetValue) * 100));

              return (
              <div
                key={badge.id}
                className={`p-6 rounded-[24px] border transition-all flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 ${
                  badge.is_unlocked
                    ? 'bg-white border-slate-200 hover:shadow-xl'
                    : 'bg-slate-50 border-slate-200 hover:shadow-md grayscale-[0.5]'
                }`}
              >
                {/* Decorative background glow for Legendary/Epic */}
                {badge.is_unlocked && (badge.tier === 'LEGENDARY' || badge.tier === 'EPIC') && (
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none ${badge.tier === 'LEGENDARY' ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border-2 ${
                        badge.is_unlocked ? (
                          badge.tier === 'LEGENDARY' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                          badge.tier === 'EPIC' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                          badge.tier === 'RARE' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        ) : 'bg-slate-200 text-slate-400 border-slate-300'
                      }`}
                    >
                      {getTitleIcon(badge.icon)}
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg shadow-sm border border-black/5 ${badge.is_unlocked ? getRarityBadgeStyle(badge.tier) : 'bg-slate-300 text-slate-600'}`}>
                      {badge.tier}
                    </span>
                  </div>

                  <div>
                    <h4 className={`font-extrabold text-lg leading-tight mb-1.5 ${badge.is_unlocked ? 'text-slate-800' : 'text-slate-500'}`}>{badge.name}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{badge.description}</p>
                  </div>
                </div>

                <div className={`mt-5 pt-5 border-t -mx-6 -mb-6 p-6 ${badge.is_unlocked ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-100/50 border-slate-200/60'}`}>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      <Target className={`w-3.5 h-3.5 ${badge.is_unlocked ? 'text-blue-500' : 'text-slate-400'}`} />
                      Target: <span className={badge.is_unlocked ? "text-blue-500" : ""}>{badge.target_value} {badge.type_value}</span>
                    </div>
                    {badge.points_required > 0 && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <Star className={`w-3.5 h-3.5 ${badge.is_unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                        Points: <span className={badge.is_unlocked ? "text-amber-500" : ""}>{badge.points_required}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500">Progress</span>
                    <span className={`text-[11px] font-black bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-200/60 flex items-center gap-1 ${badge.is_unlocked ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {badge.is_unlocked && <CheckCircle2 className="w-3 h-3" />}
                      {currentProgress}/{targetValue}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        !badge.is_unlocked ? 'bg-slate-400' :
                        progressPercentage === 100 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                          : 'bg-gradient-to-r from-primary to-indigo-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-bright rounded-2xl border border-dashed border-outline-variant">
            <p className="text-sm text-on-surface-variant font-medium">No badges found in this category.</p>
          </div>
        )}

        {/* Badges Pagination */}
        {totalBadgePages > 1 && (
          <Pagination
            currentPage={badgePage}
            totalPages={totalBadgePages}
            totalItems={filteredBadges.length}
            startIndex={badgeStartIndex}
            itemsPerPage={BADGES_PER_PAGE}
            onPageChange={(p) => setBadgePage(p)}
          />
        )}
      </div>
    </div>
  );
};
