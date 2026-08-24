import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Settings2, ShieldCheck, Sparkles, Volume2, HelpCircle, Shuffle, Award, Users } from 'lucide-react';
import { quizService, roomService, groupService } from '@/services';

interface HostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostRoomModal: React.FC<HostRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('freedom');
  
  // Room Settings States
  const [selectedGameMode, setSelectedGameMode] = useState<'CLASSIC' | 'EXAM'>('CLASSIC');
  const [progressionMode, setProgressionMode] = useState<'manual' | 'auto'>('manual');
  const [allowShowRank, setAllowShowRank] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowSkipQuestion, setAllowSkipQuestion] = useState(true);
  const [allowAnonymousQuestion, setAllowAnonymousQuestion] = useState(true);
  const [useAiQuestion, setUseAiQuestion] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const quizRes = await quizService.getQuizzes({ pageSize: 100 });
        const quizzesList = quizRes.data || [];
        setQuizzes(quizzesList);
        if (quizzesList.length > 0) {
          setSelectedQuizId(quizzesList[0].id);
        }

        const groupsList = await groupService.getMyGroups();
        setGroups(groupsList || []);
      } catch (err) {
        console.error("Failed to load quizzes/groups:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) {
      alert("Please select a quiz set to launch.");
      return;
    }

    try {
      const roomData = await roomService.launchRoom({
        quiz_id: Number(selectedQuizId),
        group_id: selectedGroupId === 'freedom' ? null : Number(selectedGroupId),
        mode: selectedGameMode,
        progression_mode: progressionMode,
        allow_skip_question: allowSkipQuestion,
        allow_show_rank: allowShowRank,
        allow_anonymous_question: allowAnonymousQuestion,
        allow_voice_question: false,
        use_ai_question: useAiQuestion,
        shuffle_options: shuffleOptions
      });

      onClose();
      navigate('/lobby', {
        state: {
          roomCode: roomData.room_code,
          roomId: roomData.id,
          qrCodeUrl: roomData.qr_code_url,
          nickname: 'Host / Sarah Jenkins',
          isHost: true,
          quizTitle: roomData.title || 'Live Quiz Session',
          progressionMode: roomData.progression_mode,
          allowShowRank: roomData.allow_show_rank
        },
      });
    } catch (err: any) {
      console.error("Failed to connect to backend server:", err);
      alert(`Failed to launch room: ${err.response?.data?.detail || err.message || 'Connection failed'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-secondary to-emerald-700 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Settings2 className="w-5 h-5" /> Host Live Quiz Session
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">Configure room rules and launch live lobby</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleLaunch} className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Select Quiz */}
          <div>
            <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">
              Select Quiz Set
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(Number(e.target.value))}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-secondary rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-on-surface"
              disabled={isLoading}
            >
              {quizzes.length === 0 ? (
                <option value="">No quizzes found (Please create a quiz first)</option>
              ) : (
                quizzes.map((quiz) => (
                   <option key={quiz.id} value={quiz.id}>
                     {quiz.title} ({quiz.questions_count || quiz.questions?.length || 0} Qs - {quiz.difficulty || 'Medium'})
                   </option>
                ))
              )}
            </select>
          </div>

          {/* Assign to Group */}
          <div>
            <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">
              Target Study Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-secondary rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-on-surface"
              disabled={isLoading}
            >
              <option value="freedom">Freedom (Guest or members from any group can join)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Game Mode Selection */}
          <div>
            <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">
              Room Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CLASSIC', label: 'Classic', desc: 'Standard FFA Quiz' },
                { id: 'EXAM', label: 'Exam', desc: 'Strict Exam Mode' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedGameMode(m.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedGameMode === m.id
                      ? 'border-secondary bg-secondary/10 text-secondary font-bold ring-2 ring-secondary/20'
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <p className="text-xs font-bold">{m.label}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-4">
            <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2">
              Configure Room Rules & Features
            </h4>

            {/* Progression Mode */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Progression Mode</span>
                <span className="text-[10px] text-on-surface-variant">Manual host trigger vs Auto round advance</span>
              </div>
              <div className="flex bg-outline-variant/20 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setProgressionMode('manual')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    progressionMode === 'manual' ? 'bg-white shadow-xs text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setProgressionMode('auto')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    progressionMode === 'auto' ? 'bg-white shadow-xs text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Show Live Leaderboard (Disabled in EXAM mode) */}
            {selectedGameMode !== 'EXAM' && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Show Live Leaderboard</span>
                  <span className="text-[10px] text-on-surface-variant">Display standings after each round</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowShowRank(!allowShowRank)}
                  className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                    allowShowRank ? 'bg-secondary' : 'bg-outline-variant/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                      allowShowRank ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Shuffle Answer Choices */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Shuffle Answer Choices</span>
                <span className="text-[10px] text-on-surface-variant">Randomize choices order per question</span>
              </div>
              <button
                type="button"
                onClick={() => setShuffleOptions(!shuffleOptions)}
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  shuffleOptions ? 'bg-secondary' : 'bg-outline-variant/40'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    shuffleOptions ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow Skip Question (Disabled in EXAM mode) */}
            {selectedGameMode !== 'EXAM' && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Allow Skip Question</span>
                  <span className="text-[10px] text-on-surface-variant">Let participants skip question if stuck</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowSkipQuestion(!allowSkipQuestion)}
                  className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                    allowSkipQuestion ? 'bg-secondary' : 'bg-outline-variant/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                      allowSkipQuestion ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Allow Anonymous Questions */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Allow Anonymous Q&A</span>
                <span className="text-[10px] text-on-surface-variant">Enable anonymous participant Q&A submissions</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowAnonymousQuestion(!allowAnonymousQuestion)}
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  allowAnonymousQuestion ? 'bg-secondary' : 'bg-outline-variant/40'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    allowAnonymousQuestion ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Enable AI Similar Questions */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Enable AI Similar Questions</span>
                <span className="text-[10px] text-on-surface-variant">Allow generating and practicing similar questions created by AI</span>
              </div>
              <button
                type="button"
                onClick={() => setUseAiQuestion(!useAiQuestion)}
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  useAiQuestion ? 'bg-secondary' : 'bg-outline-variant/40'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    useAiQuestion ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Launch Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
