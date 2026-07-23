import React from 'react';
import { Award, Flame, CheckSquare, Play, TrendingUp, PieChart, BookOpen, Clock, Layers } from 'lucide-react';
import { USER_RECENT_ACTIVITIES, USER_ASSIGNED_EXAMS } from '@/data/userData';

interface OverviewTabProps {
  onStartExam: (exam: any) => void;
  onJoinRoom: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onStartExam, onJoinRoom }) => {
  const quizDistribution = [
    { label: 'Quizzes Participated', count: 28, percentage: 58, color: 'bg-primary', stroke: '#4f46e5' },
    { label: 'Quizzes Created', count: 14, percentage: 29, color: 'bg-emerald-600', stroke: '#059669' },
    { label: 'Live Rooms Hosted', count: 6, percentage: 13, color: 'bg-amber-500', stroke: '#d97706' },
  ];

  const totalActivities = quizDistribution.reduce((acc, curr) => acc + curr.count, 0);

  const subjectProficiency = [
    { subject: 'Mathematics & Calculus', score: 96, level: 'Expert', color: 'bg-primary' },
    { subject: 'Computer Science & Web', score: 95, level: 'Expert', color: 'bg-indigo-600' },
    { subject: 'Physics & Mechanics', score: 92, level: 'Advanced', color: 'bg-secondary' },
    { subject: 'Cellular Biology', score: 88, level: 'Proficient', color: 'bg-emerald-500' },
    { subject: 'World History', score: 84, level: 'Good', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* 1. Banner */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-xl space-y-3 relative z-10">
          <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            User Dashboard
          </span>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Welcome back, Alex! 👋
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            You have 2 pending assigned exams for this week. Keep up your study streak!
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
            <h3 className="text-2xl font-extrabold text-on-surface">94.5%</h3>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +3.2% vs last week
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Study Streak</p>
            <h3 className="text-2xl font-extrabold text-on-surface">12 Days</h3>
            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5 mt-0.5">
              <Flame className="w-3 h-3" /> Personal Best!
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-on-surface">28 Quizzes</h3>
            <span className="text-[10px] font-bold text-green-600 mt-0.5 block">100% Passed</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Study Time</p>
            <h3 className="text-2xl font-extrabold text-on-surface">42.5 hrs</h3>
            <span className="text-[10px] font-bold text-purple-600 mt-0.5 block">This Month</span>
          </div>
        </div>
      </div>

      {/* 3. Grid: Assigned Exams & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Exams */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Assigned Exams</h3>
            <span className="text-xs font-semibold text-primary">{USER_ASSIGNED_EXAMS.length} Active</span>
          </div>

          <div className="space-y-3">
            {USER_ASSIGNED_EXAMS.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 bg-surface-container-lowest"
              >
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{exam.title}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Due: <span className="font-medium text-error">{exam.due}</span> • {exam.subject}
                  </p>
                </div>
                <button
                  onClick={() => onStartExam(exam)}
                  className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shrink-0"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Recent Activity</h3>
          </div>

          <div className="space-y-3">
            {USER_RECENT_ACTIVITIES.map((act) => (
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
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {act.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: Charts & Activity Analytics (Moved to Bottom) */}
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
                {/* Segment 1: Participated (58%) */}
                <path
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeDasharray="58, 100"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Segment 2: Created (29%) */}
                <path
                  stroke="#059669"
                  strokeWidth="4"
                  strokeDasharray="29, 100"
                  strokeDashoffset="-58"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Segment 3: Hosted (13%) */}
                <path
                  stroke="#d97706"
                  strokeWidth="4"
                  strokeDasharray="13, 100"
                  strokeDashoffset="-87"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
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
            {subjectProficiency.map((sub, i) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
