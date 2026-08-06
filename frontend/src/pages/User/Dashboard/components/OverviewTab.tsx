import React, { useState, useEffect, useMemo } from 'react';
import { Award, Flame, CheckSquare, Play, TrendingUp, PieChart, BookOpen, Clock, Sparkles, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { quizService, roomService, authService } from '@/services';
import { getDailyActivityDates } from '@/utils/streakTracker';

interface OverviewTabProps {
  onStartExam: (exam: any) => void;
  onJoinRoom: () => void;
  onViewAllExams?: () => void;
  onViewHistory?: () => void;
  assignedExams?: any[];
  isLoadingExams?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  onStartExam, 
  onJoinRoom,
  onViewAllExams,
  onViewHistory,
  assignedExams = [],
  isLoadingExams = false
}) => {
  const [createdQuizzesCount, setCreatedQuizzesCount] = useState<number>(0);
  const [hostedRoomsCount, setHostedRoomsCount] = useState<number>(0);
  const [participatedRoomsCount, setParticipatedRoomsCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>('Student');
  const [backendStreak, setBackendStreak] = useState<number | null>(null);
  const [backendPoints, setBackendPoints] = useState<number | null>(null);
  const [showAllPending, setShowAllPending] = useState<boolean>(false);
  const [showAllRecent, setShowAllRecent] = useState<boolean>(false);

  useEffect(() => {
    // 0. Fetch profile directly from Backend User table (/auth/me)
    authService.getProfile()
      .then(p => {
        if (p) {
          if (p.fullname) setUserName(p.fullname);
          if (typeof p.study_streak === 'number') setBackendStreak(p.study_streak);
          if (typeof p.achievement_points === 'number') setBackendPoints(p.achievement_points);
        }
      })
      .catch(err => console.error("Failed to fetch user profile:", err));

    // 1. Fetch user name from localStorage fallback
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUserName(u.full_name || u.name || u.username || (u.email ? u.email.split('@')[0] : 'Student'));
      } catch (e) {
        console.error("Failed to parse user profile from localStorage:", e);
      }
    }

    // 2. Fetch total quizzes created by the current user
    quizService.getQuizzes({ limit: 100 })
      .then(res => {
        if (res && typeof res.total === 'number') {
          setCreatedQuizzesCount(res.total);
        } else if (res && Array.isArray(res.items)) {
          setCreatedQuizzesCount(res.items.length);
        } else if (Array.isArray(res)) {
          setCreatedQuizzesCount(res.length);
        }
      })
      .catch(err => console.error("Failed to fetch user quizzes count:", err));

    // 3. Fetch total active & historical live rooms hosted by current user
    roomService.getMyHostedRooms()
      .then(res => {
        if (Array.isArray(res)) {
          setHostedRoomsCount(res.length);
        }
      })
      .catch(err => console.error("Failed to fetch hosted rooms count:", err));

    // 4. Fetch total live rooms joined as a participant by current user
    roomService.getMyParticipatedRooms()
      .then(res => {
        if (Array.isArray(res)) {
          setParticipatedRoomsCount(res.length);
        }
      })
      .catch(err => console.error("Failed to fetch participated rooms count:", err));
  }, []);

  // Filter pending vs completed assigned exams
  const pendingExams = useMemo(() => {
    return assignedExams.filter(e => e.status !== 'Submitted');
  }, [assignedExams]);

  const completedExams = useMemo(() => {
    return assignedExams.filter(e => e.status === 'Submitted');
  }, [assignedExams]);

  // Compute average score dynamically from submitted exams
  const averageScoreFormatted = useMemo(() => {
    const scored = completedExams.filter(e => typeof e.score === 'number' || (e.score && !isNaN(Number(e.score))));
    if (scored.length === 0) return 'N/A';
    const sum = scored.reduce((acc, curr) => acc + Number(curr.score), 0);
    return `${(sum / scored.length).toFixed(1)}%`;
  }, [completedExams]);

  // Calculate total achievement points (EXP) from backend or dynamic calculation
  const achievementPoints = useMemo(() => {
    const examPoints = completedExams.reduce((acc, curr) => {
      const scoreVal = typeof curr.score === 'number' ? curr.score : 0;
      return acc + 50 + Math.round(scoreVal * 5);
    }, 0);
    const quizPoints = createdQuizzesCount * 30;
    const roomPoints = hostedRoomsCount * 40;
    const calculated = examPoints + quizPoints + roomPoints;

    if (backendPoints !== null && backendPoints > 0) {
      return Math.max(backendPoints, calculated);
    }
    return Math.max(backendPoints || 0, calculated);
  }, [backendPoints, completedExams, createdQuizzesCount, hostedRoomsCount]);

  // Calculate consecutive daily study streak (resets to 0 if a day is missed)
  const studyStreakDays = useMemo(() => {
    if (backendStreak !== null) {
      return backendStreak;
    }
    const dates = new Set<string>();

    // 1. Completed exams dates
    completedExams.forEach(e => {
      if (e.submittedAt) {
        const dateStr = new Date(e.submittedAt).toISOString().split('T')[0];
        dates.add(dateStr);
      }
    });

    // 2. Local activity dates (joining rooms, 10-minute web session)
    const localDates = getDailyActivityDates();
    localDates.forEach(d => dates.add(d));

    if (dates.size === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If no activity today or yesterday, streak is reset to 0
    if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
      return 0;
    }

    let streak = 0;
    let checkDate = dates.has(todayStr) ? new Date(today) : new Date(yesterday);

    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (dates.has(checkStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [backendStreak, completedExams]);

  // Dynamic Quiz & Activity Distribution calculation (4 Categories)
  const quizDistribution = useMemo(() => {
    const completedExamsCount = completedExams.length;
    const joinedLiveQuizzes = participatedRoomsCount;
    const createdQuizzes = createdQuizzesCount;
    const hostedRooms = hostedRoomsCount;
    const total = completedExamsCount + joinedLiveQuizzes + createdQuizzes + hostedRooms;

    if (total === 0) {
      return [
        { label: 'Exams Completed', count: 0, percentage: 0, color: 'bg-primary', stroke: '#4f46e5' },
        { label: 'Live Quizzes Joined', count: 0, percentage: 0, color: 'bg-purple-600', stroke: '#9333ea' },
        { label: 'Quizzes Created', count: 0, percentage: 0, color: 'bg-emerald-600', stroke: '#059669' },
        { label: 'Live Rooms Hosted', count: 0, percentage: 0, color: 'bg-amber-500', stroke: '#d97706' },
      ];
    }

    const p1 = Math.round((completedExamsCount / total) * 100);
    const p2 = Math.round((joinedLiveQuizzes / total) * 100);
    const p3 = Math.round((createdQuizzes / total) * 100);
    const p4 = Math.max(0, 100 - p1 - p2 - p3);

    return [
      { label: 'Exams Completed', count: completedExamsCount, percentage: p1, color: 'bg-primary', stroke: '#4f46e5' },
      { label: 'Live Quizzes Joined', count: joinedLiveQuizzes, percentage: p2, color: 'bg-purple-600', stroke: '#9333ea' },
      { label: 'Quizzes Created', count: createdQuizzes, percentage: p3, color: 'bg-emerald-600', stroke: '#059669' },
      { label: 'Live Rooms Hosted', count: hostedRooms, percentage: p4, color: 'bg-amber-500', stroke: '#d97706' },
    ];
  }, [completedExams.length, participatedRoomsCount, createdQuizzesCount, hostedRoomsCount]);

  const totalActivities = useMemo(() => {
    return quizDistribution.reduce((acc, curr) => acc + curr.count, 0);
  }, [quizDistribution]);

  // Subject proficiency calculated dynamically from assigned exams
  const subjectProficiency = useMemo(() => {
    if (assignedExams.length === 0) {
      return [];
    }

    const map: Record<string, { totalScore: number; count: number; totalExams: number }> = {};
    assignedExams.forEach(e => {
      const sub = e.subject || 'General';
      if (!map[sub]) {
        map[sub] = { totalScore: 0, count: 0, totalExams: 0 };
      }
      map[sub].totalExams += 1;
      if (e.status === 'Submitted' && typeof e.score === 'number') {
        map[sub].totalScore += e.score;
        map[sub].count += 1;
      }
    });

    const colors = ['bg-primary', 'bg-indigo-600', 'bg-secondary', 'bg-emerald-500', 'bg-amber-500'];

    return Object.entries(map).map(([subject, stat], i) => {
      const score = stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 70;
      let level = 'Good';
      if (score >= 90) level = 'Expert';
      else if (score >= 80) level = 'Advanced';
      else if (score >= 70) level = 'Proficient';
      else level = 'Getting Started';

      return {
        subject,
        score,
        level,
        color: colors[i % colors.length]
      };
    });
  }, [assignedExams]);

  // Recent activities mapped dynamically from assignedExams
  const recentActivities = useMemo(() => {
    if (assignedExams.length === 0) {
      return [];
    }

    return [...assignedExams].map((ex) => ({
      id: ex.id,
      name: ex.title,
      type: ex.subject || 'Exam',
      date: ex.due !== 'No Deadline' ? new Date(ex.due).toLocaleDateString() : 'Assigned',
      status: ex.status === 'Submitted' ? 'completed' : ex.status === 'In Progress' ? 'in_progress' : 'pending',
      score: ex.status === 'Submitted' && ex.score != null ? `${ex.score}%` : ex.status,
    }));
  }, [assignedExams]);

  return (
    <div className="space-y-8 text-left">
      {/* 1. Banner */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-xl space-y-3 relative z-10">
          <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            User Dashboard
          </span>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            {pendingExams.length > 0 
              ? `You have ${pendingExams.length} pending assigned exams. Keep up your study streak!`
              : "You have no pending assigned exams. All clear!"}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onJoinRoom}
              className="bg-white text-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Join Live Room
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Average Score</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{averageScoreFormatted}</h3>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Real-time average
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Achievement Points</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{achievementPoints.toLocaleString()} PTS</h3>
            <span className="text-[10px] font-bold text-purple-600 mt-0.5 block">Earned EXP & Rewards</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{completedExams.length} Exams</h3>
            <span className="text-[10px] font-bold text-green-600 mt-0.5 block">
              {assignedExams.length > 0 
                ? `${Math.round((completedExams.length / assignedExams.length) * 100)}% Completion`
                : '100% Clear'}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Study Streak</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{studyStreakDays} Days</h3>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${studyStreakDays > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
              <Flame className="w-3 h-3" /> {studyStreakDays > 0 ? 'Consecutive Days' : 'Streak Reset'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Grid: Assigned Exams & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Exams */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Assigned Exams</h3>
            <span className="text-xs font-semibold text-primary">{pendingExams.length} Pending</span>
          </div>

          <div className="space-y-3">
            {isLoadingExams ? (
              <div className="py-10 flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : pendingExams.length === 0 ? (
              <div className="py-10 text-center text-xs text-on-surface-variant">
                No pending assigned exams. All clear!
              </div>
            ) : (
              (showAllPending ? pendingExams : pendingExams.slice(0, 4)).map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 bg-surface-container-lowest"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-on-surface truncate">{exam.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                      Due: <span className="font-medium text-error">{exam.due !== 'No Deadline' ? new Date(exam.due).toLocaleString('vi-VN') : 'No Deadline'}</span> • {exam.subject} • Group: <span className="font-semibold text-secondary">{exam.groupName || 'Individual'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onStartExam(exam)}
                    className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shrink-0"
                  >
                    {exam.status === 'In Progress' ? 'Continue' : 'Start'}
                  </button>
                </div>
              ))
            )}

            {pendingExams.length > 4 && (
              <button
                onClick={() => {
                  if (onViewAllExams) {
                    onViewAllExams();
                  } else {
                    setShowAllPending((prev) => !prev);
                  }
                }}
                className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-1 border border-dashed border-primary/30 mt-2"
              >
                {onViewAllExams ? (
                  <>
                    View More ({pendingExams.length - 4} more) <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : showAllPending ? (
                  <>
                    Show Less <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    View More ({pendingExams.length - 4} more) <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Recent Activity</h3>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="py-10 text-center text-xs text-on-surface-variant">
                No recent activity recorded yet.
              </div>
            ) : (
              (showAllRecent ? recentActivities : recentActivities.slice(0, 4)).map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-4 bg-surface-container-lowest"
                >
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{act.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {act.type} • {act.date}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                      act.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : act.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {act.score}
                  </span>
                </div>
              ))
            )}

            {recentActivities.length > 4 && (
              <button
                onClick={() => {
                  if (onViewHistory) {
                    onViewHistory();
                  } else {
                    setShowAllRecent((prev) => !prev);
                  }
                }}
                className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-1 border border-dashed border-primary/30 mt-2"
              >
                {onViewHistory ? (
                  <>
                    View More ({recentActivities.length - 4} more) <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : showAllRecent ? (
                  <>
                    Show Less <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    View More ({recentActivities.length - 4} more) <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: Charts & Activity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Donut Chart (Quiz & Activity Distribution) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" /> Quiz & Activity Breakdown
              </h3>
              <p className="text-xs text-on-surface-variant">Distribution of created, taken, and hosted quizzes</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-surface-container rounded-lg text-on-surface-variant">
              Total: {totalActivities} Items
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 pt-2">
            {/* SVG Donut Chart Visualizer */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Track */}
                <path
                  className="text-surface-container-highest"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Dynamic Donut Chart Segments */}
                {(() => {
                  let accumulatedOffset = 0;
                  return quizDistribution.map((item, idx) => {
                    const offset = accumulatedOffset;
                    accumulatedOffset += item.percentage;
                    return (
                      <path
                        key={idx}
                        stroke={item.stroke}
                        strokeWidth="4"
                        strokeDasharray={`${item.percentage}, 100`}
                        strokeDashoffset={`-${offset}`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Inner Center Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-on-surface">{totalActivities}</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Activities</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-3.5 flex-1 w-full">
              {quizDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-bold text-on-surface">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-on-surface">{item.count}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1 font-semibold">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Proficiency Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" /> Subject Proficiency
            </h3>
            <p className="text-xs text-on-surface-variant">Mastery level across enrolled subjects</p>
          </div>

          <div className="space-y-4">
            {subjectProficiency.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant italic">
                No subject proficiency data available yet.
              </div>
            ) : (
              subjectProficiency.map((sub, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">{sub.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {sub.level}
                      </span>
                      <span className="font-extrabold text-on-surface">{sub.score}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sub.color}`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
