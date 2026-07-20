import React from 'react';
import { Trophy, Zap, Flame, Award, Star, Moon, Check } from 'lucide-react';
import { USER_ACHIEVEMENTS } from '@/data/userData';

interface AchievementsTabProps {
  activeTitle: string | null;
  setActiveTitle: (title: string | null) => void;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  activeTitle,
  setActiveTitle,
}) => {
  const titles = ['Perfect Score', 'Speed Demon', 'Unstoppable Streak', 'Quiz Master', 'Night Owl'];

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-on-surface">Achievements</h2>
        <p className="text-sm text-on-surface-variant">
          Unlock badges by taking quizzes and select a display title for your profile.
        </p>
      </div>

      {/* Title Selection Card */}
      <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Equip Display Title
        </h3>
        <div className="flex flex-wrap gap-3">
          {titles.map((title) => {
            const isEquipped = activeTitle === title;
            return (
              <button
                key={title}
                onClick={() => setActiveTitle(isEquipped ? null : title)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${isEquipped
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/50 hover:border-amber-400'
                  }`}
              >
                {isEquipped && <Check className="w-3.5 h-3.5" />}
                {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {USER_ACHIEVEMENTS.map((badge) => (
          <div
            key={badge.id}
            className={`p-6 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${badge.unlocked
                ? 'bg-white border-outline-variant/30 hover:border-primary/40'
                : 'bg-surface-container-low/50 border-outline-variant/20 opacity-60'
              }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${badge.unlocked ? 'bg-amber-100 text-amber-600' : 'bg-surface-container text-on-surface-variant'
                    }`}
                >
                  {badge.icon === 'trophy' && <Trophy className="w-6 h-6" />}
                  {badge.icon === 'zap' && <Zap className="w-6 h-6" />}
                  {badge.icon === 'flame' && <Flame className="w-6 h-6" />}
                  {badge.icon === 'award' && <Award className="w-6 h-6" />}
                  {badge.icon === 'moon' && <Moon className="w-6 h-6" />}
                  {badge.icon === 'star' && <Star className="w-6 h-6" />}
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${badge.rarity === 'Legendary'
                      ? 'bg-purple-100 text-purple-700'
                      : badge.rarity === 'Epic'
                        ? 'bg-indigo-100 text-indigo-700'
                        : badge.rarity === 'Rare'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                >
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
              <span className={badge.unlocked ? 'text-green-600 font-bold' : 'text-primary'}>
                {badge.progress}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
