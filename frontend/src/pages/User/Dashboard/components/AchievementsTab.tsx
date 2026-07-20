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

export type RarityType = 'All' | 'Common' | 'Rare' | 'Epic' | 'Legendary';

interface ProfileTitle {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  unlocked: boolean;
  icon: string;
}

const DISPLAY_TITLES: ProfileTitle[] = [
  {
    id: 't1',
    name: 'Perfect Score',
    rarity: 'Legendary',
    description: 'Scored 100% accuracy on 5 official midterm exams',
    unlocked: true,
    icon: 'crown',
  },
  {
    id: 't2',
    name: 'Speed Demon',
    rarity: 'Rare',
    description: 'Answered 10 consecutive questions in under 3 seconds',
    unlocked: true,
    icon: 'zap',
  },
  {
    id: 't3',
    name: 'Unstoppable Streak',
    rarity: 'Epic',
    description: 'Achieved a 10+ question correct streak in Live Quiz',
    unlocked: true,
    icon: 'flame',
  },
  {
    id: 't4',
    name: 'Quiz Master',
    rarity: 'Legendary',
    description: 'Hosted over 20 live room quiz sessions for students',
    unlocked: true,
    icon: 'trophy',
  },
  {
    id: 't5',
    name: 'Night Owl',
    rarity: 'Common',
    description: 'Completed an exam session past midnight',
    unlocked: true,
    icon: 'moon',
  },
  {
    id: 't6',
    name: 'Bullseye Titan',
    rarity: 'Epic',
    description: 'Maintained 95%+ overall average score across all subjects',
    unlocked: true,
    icon: 'target',
  },
  {
    id: 't7',
    name: 'Shield Master',
    rarity: 'Rare',
    description: 'Successfully deployed 10 Streak Shields in live rooms',
    unlocked: true,
    icon: 'shield',
  },
  {
    id: 't8',
    name: 'Grandmaster Strategist',
    rarity: 'Legendary',
    description: 'Finished #1 on the leaderboard 15 times in a row',
    unlocked: false,
    icon: 'sparkles',
  },
  {
    id: 't9',
    name: 'Academic Scholar',
    rarity: 'Common',
    description: 'Joined 5 active student study groups',
    unlocked: true,
    icon: 'book',
  },
  {
    id: 't10',
    name: 'Early Bird',
    rarity: 'Common',
    description: 'Completed a quiz before 7:00 AM in the morning',
    unlocked: true,
    icon: 'zap',
  },
  {
    id: 't11',
    name: 'Precision Scholar',
    rarity: 'Rare',
    description: 'Answered 50 questions without making a single mistake',
    unlocked: true,
    icon: 'target',
  },
  {
    id: 't12',
    name: 'Legendary Host',
    rarity: 'Legendary',
    description: 'Created 10+ custom quiz templates for the community',
    unlocked: false,
    icon: 'crown',
  },
];

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

  // Filter Titles by Selected Tier
  const filteredTitles = DISPLAY_TITLES.filter((t) => {
    if (selectedTier === 'All') return true;
    return t.rarity === selectedTier;
  });

  // Calculate Paginated Titles
  const totalTitlePages = Math.ceil(filteredTitles.length / TITLES_PER_PAGE);
  const titleStartIndex = (titlePage - 1) * TITLES_PER_PAGE;
  const paginatedTitles = filteredTitles.slice(titleStartIndex, titleStartIndex + TITLES_PER_PAGE);

  // Filter Badges by Category/Status
  const filteredBadges = USER_ACHIEVEMENTS.filter((b) => {
    if (badgeFilter === 'Unlocked') return b.unlocked;
    if (badgeFilter === 'Locked') return !b.unlocked;
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
      case 'Legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs font-black';
      case 'Epic':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black';
      case 'Rare':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold';
      case 'Common':
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

  const unlockedTitlesCount = DISPLAY_TITLES.filter((t) => t.unlocked).length;
  const unlockedBadgesCount = USER_ACHIEVEMENTS.filter((b) => b.unlocked).length;

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
              {unlockedBadgesCount}/{USER_ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="text-center px-3">
            <span className="text-xs text-slate-300 block font-medium">Unlocked Titles</span>
            <span className="text-sm font-black text-indigo-300">
              {unlockedTitlesCount}/{DISPLAY_TITLES.length}
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
            {(['All', 'Common', 'Rare', 'Epic', 'Legendary'] as RarityType[]).map((tier) => {
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
                  {tier}
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
                    if (title.unlocked) {
                      setActiveTitle(isEquipped ? null : title.name);
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
                    !title.unlocked
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
                            title.rarity
                          )}`}
                        >
                          {title.rarity}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isEquipped ? (
                        <span className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-black shadow-xs shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current text-amber-500" /> EQUIPPED
                        </span>
                      ) : title.unlocked ? (
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
        <Pagination
          currentPage={titlePage}
          totalPages={totalTitlePages}
          totalItems={filteredTitles.length}
          startIndex={titleStartIndex}
          itemsPerPage={TITLES_PER_PAGE}
          onPageChange={(p) => setTitlePage(p)}
        />
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
            {paginatedBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border shadow-sm transition-all flex flex-col justify-between ${
                  badge.unlocked
                    ? 'bg-white border-outline-variant/30 hover:border-primary/40'
                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        badge.unlocked ? 'bg-amber-100 text-amber-600 shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {badge.icon === 'trophy' && <Trophy className="w-6 h-6" />}
                      {badge.icon === 'zap' && <Zap className="w-6 h-6" />}
                      {badge.icon === 'flame' && <Flame className="w-6 h-6" />}
                      {badge.icon === 'award' && <Award className="w-6 h-6" />}
                      {badge.icon === 'moon' && <Moon className="w-6 h-6" />}
                      {badge.icon === 'star' && <Star className="w-6 h-6" />}
                    </div>
                    <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full ${getRarityBadgeStyle(badge.rarity)}`}>
                      {badge.rarity}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-on-surface">{badge.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{badge.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">Progress</span>
                  <span className={badge.unlocked ? 'text-emerald-700 font-black flex items-center gap-1' : 'text-primary'}>
                    {badge.unlocked && <Check className="w-3.5 h-3.5" />}
                    {badge.progress}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-bright rounded-2xl border border-dashed border-outline-variant">
            <p className="text-sm text-on-surface-variant font-medium">No badges found in this category.</p>
          </div>
        )}

        {/* Badges Pagination */}
        <Pagination
          currentPage={badgePage}
          totalPages={totalBadgePages}
          totalItems={filteredBadges.length}
          startIndex={badgeStartIndex}
          itemsPerPage={BADGES_PER_PAGE}
          onPageChange={(p) => setBadgePage(p)}
        />
      </div>
    </div>
  );
};
