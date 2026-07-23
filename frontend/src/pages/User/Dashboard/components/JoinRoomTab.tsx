import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, ArrowRight, ShieldCheck, User, Users, PlusCircle, CheckCircle2, BookOpen, Trash2 } from 'lucide-react';

interface EnrolledGroup {
  id: string;
  name: string;
  host: string;
  membersCount: number;
  lastActivity: string;
  status: 'ACTIVE' | 'PENDING';
}

export const JoinRoomTab: React.FC = () => {
  const navigate = useNavigate();

  // Part 1: Room Code State
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [nickname, setNickname] = useState('Alex Johnson');
  const [roomError, setRoomError] = useState('');

  // Part 2: Group Invite Code State
  const [groupInviteCode, setGroupInviteCode] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');
  const [groupError, setGroupError] = useState('');

  // Part 3: Enrolled Groups List State
  const [enrolledGroups, setEnrolledGroups] = useState<EnrolledGroup[]>([
    {
      id: 'GRP-PHYS-ALPHA',
      name: 'Alpha Team - Advanced Physics',
      host: 'Sarah Jenkins',
      membersCount: 32,
      lastActivity: 'Physics Ch. 4 Exam (Yesterday)',
      status: 'ACTIVE',
    },
    {
      id: 'GRP-ENG-B',
      name: 'English Intensive Group B',
      host: 'Marcus Thorne',
      membersCount: 28,
      lastActivity: 'Grammar Quiz 3 (3 days ago)',
      status: 'ACTIVE',
    },

    {
      id: 'GRP-CS-2026',
      name: 'Computer Science Honors 2026',
      host: 'T.A. Marcus',
      membersCount: 45,
      lastActivity: 'Data Structures Quiz (5 days ago)',
      status: 'ACTIVE',
    },
  ]);

  // Handle PIN Digit Change
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1);
    setPinDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleJoinLiveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = pinDigits.join('');
    if (fullCode.length < 6) {
      setRoomError('Please enter the full 6-digit PIN code.');
      return;
    }
    setRoomError('');
    sessionStorage.setItem('dashboard_active_tab', 'join_room');
    navigate('/lobby', {
      state: {
        roomCode: fullCode,
        nickname: nickname.trim() || 'Alex Johnson',
        isHost: false,
        fromSource: 'dashboard',
        activeTab: 'join_room',
      },
    });
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = groupInviteCode.trim().toUpperCase();
    if (!cleanCode) return;

    setGroupError('');
    setGroupSuccess('');

    // Check if group is locked (e.g. ENG-CLASSB is locked in demo)
    if (cleanCode === 'ENG-CLASSB' || cleanCode === 'LOCKED') {
      setGroupError('This group has been LOCKED by the teacher. New join requests are not accepted.');
      return;
    }

    const newGroup: EnrolledGroup = {
      id: `GRP-${cleanCode}`,
      name: `Class Group (${cleanCode})`,
      host: 'Instructor / Host',
      membersCount: 16,
      lastActivity: 'Join request pending approval',
      status: 'PENDING',
    };

    setEnrolledGroups([newGroup, ...enrolledGroups]);
    setGroupSuccess(`Join request submitted for group #${cleanCode}! Waiting for host approval.`);
    setGroupInviteCode('');
    setTimeout(() => setGroupSuccess(''), 5000);
  };

  const handleLeaveGroup = (id: string) => {
    setEnrolledGroups(enrolledGroups.filter((g) => g.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10 text-left">
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-on-surface">Join Rooms & Study Groups</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Enter a 6-digit room code for live instant quizzes, or join a host's managed group.
        </p>
      </div>

      {/* Grid: Part 1 & Part 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PART 1: 6-Digit PIN Code Live Join */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface">1. Join Live Room by 6-Digit PIN</h3>
              <p className="text-xs text-on-surface-variant">Instant entry to live quiz rooms hosted by creators</p>
            </div>
          </div>


          <form onSubmit={handleJoinLiveRoom} className="space-y-6">
            {roomError && (
              <div className="p-3.5 bg-error-container/20 border border-error text-error text-xs font-bold rounded-xl">
                {roomError}
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 text-center">
                Enter 6-Digit PIN Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-mono font-black border-2 border-outline-variant/50 focus:border-primary rounded-2xl bg-surface-container-lowest outline-none transition-all shadow-2xs"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Your Display Nickname
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname..."
                  className="w-full pl-10 pr-4 py-3 border border-outline-variant/60 focus:border-primary rounded-xl outline-none text-sm text-on-surface font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-extrabold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Enter Live Room Lobby 🚀 <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Anti-cheat live monitoring active</span>
          </div>
        </div>

        {/* PART 2: Join Study Group by Code */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface">2. Join Study Group</h3>
              <p className="text-xs text-on-surface-variant">Enroll in a group managed by your host</p>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Joining a study group allows your host to automatically assign homework exams, track your progress, and view rankings.
          </p>


          <form onSubmit={handleJoinGroup} className="space-y-4">
            {groupError && (
              <div className="p-3.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                {groupError}
              </div>
            )}

            {groupSuccess && (
              <div className="p-3.5 bg-green-100 border border-green-300 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {groupSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Group Invite Code
              </label>
              <input
                type="text"
                value={groupInviteCode}
                onChange={(e) => setGroupInviteCode(e.target.value)}
                placeholder="e.g. GRP-ALPHA-2026"

                className="w-full px-4 py-3 border border-outline-variant/60 focus:border-secondary rounded-xl outline-none text-sm text-on-surface font-semibold uppercase tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={!groupInviteCode.trim()}
              className="w-full py-3.5 bg-secondary hover:bg-secondary/90 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
            >
              <PlusCircle className="w-4 h-4" /> Request to Join Group
            </button>
          </form>
        </div>
      </div>

      {/* PART 3: My Enrolled Groups List (Show below) */}
      <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-xl text-on-surface flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> My Enrolled Study Groups ({enrolledGroups.length})
            </h3>
            <p className="text-xs text-on-surface-variant">
              Groups and teams you are currently participating in as a member
            </p>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {enrolledGroups.map((group) => (
            <div
              key={group.id}
              className="p-6 rounded-2xl border border-outline-variant/30 hover:border-primary/40 transition-all bg-surface-container-lowest flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    {group.status}
                  </span>
                  <span className="text-xs text-outline font-mono font-bold">{group.id}</span>
                </div>
                <h4 className="font-bold text-base text-on-surface">{group.name}</h4>
                <p className="text-xs text-on-surface-variant">Host: <span className="font-semibold text-on-surface">{group.host}</span></p>
                <p className="text-xs text-on-surface-variant">
                  {group.membersCount} Enrolled Students
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant font-medium">{group.lastActivity}</span>
                <button
                  onClick={() => handleLeaveGroup(group.id)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                  title="Leave Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
