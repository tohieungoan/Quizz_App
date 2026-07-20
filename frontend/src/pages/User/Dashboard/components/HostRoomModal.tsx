import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play } from 'lucide-react';
import { HOST_QUIZZES_LIST, HOST_GROUPS_LIST } from '@/data/userData';

interface HostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostRoomModal: React.FC<HostRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [selectedQuizId, setSelectedQuizId] = useState(HOST_QUIZZES_LIST[0]?.id || 'QZ-101');
  const [selectedGroupId, setSelectedGroupId] = useState('freedom');
  const [selectedGameMode, setSelectedGameMode] = useState<'CLASSIC' | 'TEAM' | 'EXAM'>('CLASSIC');
  const [progressionMode, setProgressionMode] = useState<'manual' | 'auto'>('manual');
  const [leaderboardToggle, setLeaderboardToggle] = useState(true);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(true);

  if (!isOpen) return null;

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
    onClose();

    navigate('/lobby', {
      state: {
        roomCode: generatedRoomCode,
        nickname: 'Host / Sarah Jenkins',
        isHost: true,
        settings: {
          quizId: selectedQuizId,
          groupId: selectedGroupId,
          gameMode: selectedGameMode,
          progressionMode,
          leaderboardEnabled: leaderboardToggle,
          randomizeQuestions,
          randomizeAnswers,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        <div className="p-6 bg-gradient-to-r from-secondary to-emerald-700 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl">Host Live Quiz Session</h3>
            <p className="text-xs text-emerald-100 mt-0.5">Configure room rules and launch live lobby</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLaunch} className="p-6 space-y-5">
          {/* Select Quiz */}
          <div>
            <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">
              Select Quiz Set
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-secondary rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-on-surface"
            >
              {HOST_QUIZZES_LIST.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title} ({quiz.questions} Qs - {quiz.level})
                </option>
              ))}
            </select>
          </div>

          {/* Assign to Group */}
          <div>
            <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">
              Target Student Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-secondary rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-on-surface"
            >
              <option value="freedom">Freedom (Guest or members from any group can join)</option>
              {HOST_GROUPS_LIST.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.membersCount} members)
                </option>
              ))}
            </select>
          </div>

          {/* Settings Panel: Progression & Leaderboard */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Progression Mode</span>
                <span className="text-[10px] text-on-surface-variant">Manual vs Automatic rounds advancement</span>
              </div>
              <div className="flex bg-outline-variant/20 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setProgressionMode('manual')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    progressionMode === 'manual' ? 'bg-white shadow-xs text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setProgressionMode('auto')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    progressionMode === 'auto' ? 'bg-white shadow-xs text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Show Live Leaderboard</span>
                <span className="text-[10px] text-on-surface-variant">Show rankings after each question round</span>
              </div>
              <button
                type="button"
                onClick={() => setLeaderboardToggle(!leaderboardToggle)}
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${
                  leaderboardToggle ? 'bg-secondary' : 'bg-outline-variant/40'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    leaderboardToggle ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Shuffle Answer Choices</span>
                <span className="text-[10px] text-on-surface-variant">Randomize choice buttons order</span>
              </div>
              <button
                type="button"
                onClick={() => setRandomizeAnswers(!randomizeAnswers)}
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${
                  randomizeAnswers ? 'bg-secondary' : 'bg-outline-variant/40'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    randomizeAnswers ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Launch Room 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
