import { Search, Download, Percent, Users as UsersIcon, Library, TrendingUp, Minus, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, MonitorPlay, BarChart2, Settings, AlertTriangle, Clock, Filter, FileText } from 'lucide-react';
import { useState } from 'react';
import { ViewState } from '../types';
import { DUMMY_PARTICIPANTS, DUMMY_EXAM_ASSIGNEES } from '../data/mockDb';
import { Dropdown } from '../components/ui/Dropdown';

export function Reports({ context, onNavigate }: { context?: any, onNavigate?: (view: ViewState, context?: any) => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'questions'>('users');
  const [globalSearch, setGlobalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('All');

  const [questionPage, setQuestionPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [isQuestionDropdownOpen, setIsQuestionDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const questionsData = [
    { id: 1, question: "What is the primary function of a reverse proxy in a microservices architecture?", correct: "35", incorrect: "5", rate: "87%", rateColor: "bg-green-100 text-green-700", difficulty: "Easy", diffColor: "bg-green-100 text-green-700" },
    { id: 2, question: "Explain the difference between OAuth 2.0 and OpenID Connect in modern web authentication.", correct: "18", incorrect: "22", rate: "45%", rateColor: "bg-red-100 text-red-700", difficulty: "Hard", diffColor: "bg-red-100 text-red-700" },
    { id: 3, question: "Which SQL constraint ensures unique values in a column while allowing exactly one NULL value?", correct: "30", incorrect: "8", rate: "79%", rateColor: "bg-green-100 text-green-700", difficulty: "Medium", diffColor: "bg-orange-100 text-orange-700" },
    { id: 4, question: "Identify the correct sequence for a TCP 3-way handshake process.", correct: "28", incorrect: "10", rate: "73%", rateColor: "bg-orange-100 text-orange-700", difficulty: "Medium", diffColor: "bg-orange-100 text-orange-700" },
    { id: 5, question: "In React, what hook is used to handle side effects and how does its dependency array work?", correct: "38", incorrect: "2", rate: "95%", rateColor: "bg-green-100 text-green-700", difficulty: "Easy", diffColor: "bg-green-100 text-green-700" },
  ];

  const usersData = [
    { id: 1, name: "Sarah Jenkins", email: "s.jenkins@academy.edu", score: "92/100", progress: "Completed", progColor: "bg-indigo-100 text-indigo-700 border-indigo-200", status: "Passed", statColor: "bg-green-100 text-green-700", avatar: "SJ", timeTaken: "42m 15s", warnings: 0 },
    { id: 2, name: "Marcus Thorne", email: "m.thorne@academy.edu", score: "45/100", progress: "In Progress", progColor: "bg-surface-variant text-on-surface-variant", status: "Pending", statColor: "bg-surface-variant text-on-surface-variant", avatar: "MT", timeTaken: "55m 02s", warnings: 2 },
    { id: 3, name: "David Chen", email: "d.chen@academy.edu", score: "88/100", progress: "Completed", progColor: "bg-indigo-100 text-indigo-700 border-indigo-200", status: "Passed", statColor: "bg-green-100 text-green-700", avatar: "DC", timeTaken: "38m 45s", warnings: 0 },
    { id: 4, name: "Elena Rostova", email: "e.rostova@academy.edu", score: "62/100", progress: "Completed", progColor: "bg-indigo-100 text-indigo-700 border-indigo-200", status: "Failed", statColor: "bg-red-100 text-red-700", avatar: "ER", timeTaken: "60m 00s", warnings: 1 },
  ];

  const recentReportsData = [
    { id: 'RM-103', type: 'ROOM', roomCode: 'L3M4N', roomTitle: 'Math Practice', quizTitle: 'Calculus III Midterm', host: 'Dr. Evelyn Hayes', date: '2026-07-13 14:00', participants: 42, avgScore: '78.5%' },
    { id: 'EX-101', type: 'EXAM', roomCode: 'EX-101', roomTitle: 'Advanced Particle Physics Exam', quizTitle: 'Advanced Particle Physics', host: 'Prof. R. Smith', date: '2026-07-14 09:00', participants: 120, avgScore: '85.2%' },
    { id: 'RM-098', type: 'ROOM', roomCode: 'Z9A1B', roomTitle: 'Physics Study Group', quizTitle: 'Physics 101 Final', host: 'Marcus Thorne', date: '2026-07-12 09:30', participants: 124, avgScore: '82.0%' },
    { id: 'RM-095', type: 'ROOM', roomCode: 'C4D5E', roomTitle: 'Bio Freshman Session', quizTitle: 'Introduction to Biology', host: 'Sarah Jenkins', date: '2026-07-10 15:00', participants: 85, avgScore: '65.4%' },
  ];

  const filteredUsers = usersData.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredParticipants = DUMMY_PARTICIPANTS.filter(p => p.nickname.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredAssignees = DUMMY_EXAM_ASSIGNEES.filter(a => a.user_name.toLowerCase().includes(userSearch.toLowerCase()));

  const filteredQuestions = questionsData.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesDifficulty = questionDifficultyFilter === 'All' || q.difficulty === questionDifficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4 sm:gap-0">
          <div>
            {context ? (
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => onNavigate && onNavigate('reports')}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface-variant bg-white border border-outline-variant/60 hover:border-primary hover:text-primary px-3 py-1.5 rounded-lg transition-all shadow-sm mb-1.5 w-fit group"
                >
                  <ChevronLeft className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:-translate-x-0.5 transition-all" /> 
                  Back to Reports
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg flex items-center justify-center ${context.type === 'EXAM' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                    {context.type === 'EXAM' ? <FileText className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface-variant">
                      {context.type === 'EXAM' ? 'Exam: ' : 'Room: '} <strong className="text-on-surface text-base">{context.roomTitle || 'N/A'}</strong>
                    </span>
                    <span className="text-on-surface-variant/50">•</span>
                    <span className="text-sm font-medium text-on-surface-variant">
                      ID: <strong className="text-on-surface tracking-wide text-base">{context.roomId}</strong>
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-[34px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 tracking-tight pb-1 mt-1 leading-tight truncate">
                  {context.quizTitle}
                </h1>
              </div>
            ) : (
              <div>
                <h1 className="font-headline-xl text-[32px] text-on-surface font-bold mb-1 tracking-tight">
                  Reports
                </h1>
                <p className="font-body-lg text-[16px] text-on-surface-variant">
                  Platform-wide quiz reports and analytics
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-[#1a0b82] hover:bg-[#2a1b92] text-white font-medium text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Average Score</span>
              <Percent className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">78.5%</div>
              <p className="text-green-600 flex items-center gap-1 text-sm font-medium"><TrendingUp className="w-4 h-4" /> +2.4% from last month</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">{context?.type === 'EXAM' ? 'Total Assignees' : 'Total Participants'}</span>
              <UsersIcon className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">{context ? '42' : '1,240'}</div>
              <p className="text-on-surface-variant flex items-center gap-1 text-sm font-medium"><Minus className="w-4 h-4" /> Steady enrollment</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Total Questions</span>
              <Library className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">50</div>
              <p className="text-on-surface-variant flex items-center gap-1 text-sm font-medium">Across 4 active modules</p>
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto whitespace-nowrap border-b border-outline-variant/50 mb-4 relative z-10">
          {!context ? (
            <button className="px-6 py-3 font-bold text-sm border-b-2 border-primary text-primary transition-colors">
              Recent Reports
            </button>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'}`}
              >
                User Progress
              </button>
              <button 
                onClick={() => setActiveTab('questions')}
                className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'}`}
              >
                Question Analysis
              </button>
            </>
          )}
        </div>

        {!context ? (
          <section className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col mt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Exam Title</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Host</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Participants</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Avg Score</th>
                      <th className="px-3 md:px-4 py-4 w-10 md:w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {recentReportsData.map(r => (
                      <tr key={r.id} className="hover:bg-surface-bright transition-colors cursor-pointer group" onClick={() => onNavigate && onNavigate('reports', { type: r.type, roomId: r.roomCode, quizTitle: r.quizTitle, roomTitle: r.roomTitle })}>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-on-surface leading-tight mb-1.5 group-hover:text-primary transition-colors flex items-center flex-wrap gap-2">
                              {r.quizTitle}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.type === 'EXAM' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                {r.type}
                              </span>
                            </span>
                            <span className="text-xs text-on-surface-variant leading-relaxed flex items-center flex-wrap gap-x-2 gap-y-1">
                              <span>{r.type === 'EXAM' ? 'Exam:' : 'Room:'} <strong className="font-semibold text-on-surface">{r.roomTitle || r.roomCode}</strong></span>
                              <span className="text-outline-variant/50">•</span>
                              <span>ID: <strong className="font-semibold">{r.roomCode}</strong></span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">{r.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-on-surface text-center whitespace-nowrap">
                          {r.host}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm font-bold text-on-surface text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <UsersIcon className="w-3.5 h-3.5 opacity-70" /> {r.participants}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-12 sm:w-16 bg-surface-container-high text-on-surface-variant">
                            {r.avgScore}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-4 text-right">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Recent Reports Pagination */}
              <div className="px-6 py-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                <span className="text-sm text-on-surface-variant">Showing 1 to {recentReportsData.length} of 124 entries</span>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-md text-on-surface-variant/50 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="relative">
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-outline-variant/50 text-sm font-medium text-on-surface hover:border-outline-variant transition-colors bg-white shadow-sm"
                    >
                      Page 1 of 12 <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  </div>
                  <button className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {activeTab === 'questions' && (
          <section className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full p-1">
              <h2 className="text-xl font-bold text-on-surface hidden sm:block">Question Analysis</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full pl-9 px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary transition-colors text-sm shadow-sm" 
                    placeholder="Search questions..." 
                    type="text" 
                  />
                </div>
                <Dropdown
                  value={questionDifficultyFilter}
                  onChange={(val) => setQuestionDifficultyFilter(val)}
                  options={[
                    { value: 'All', label: 'All Levels' },
                    { value: 'Easy', label: 'Easy' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Hard', label: 'Hard' }
                  ]}
                  icon={<Filter className="w-4 h-4" />}
                  className="w-36"
                />
              </div>
            </div>

            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col mt-2">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Correct</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Incorrect</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Correct Rate</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Difficulty</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                    <tr key={q.id} className="hover:bg-surface-bright transition-colors group">
                      <td className="px-6 py-4 cursor-pointer">
                        <div className="text-[15px] font-bold text-on-surface max-w-[200px] sm:max-w-[300px] md:max-w-[400px] line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                          {q.question}
                        </div>
                      </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant text-center">{q.correct}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant text-center">{q.incorrect}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold w-14 ${q.rateColor}`}>
                        {q.rate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-20 border border-current/10 ${q.diffColor}`}>
                        {q.difficulty}
                      </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                        No questions match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Question Table Pagination */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <span className="text-sm text-on-surface-variant">Showing 1 to {filteredQuestions.length} of 50 entries</span>
              <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div className="relative">
                <button 
                  onClick={() => setIsQuestionDropdownOpen(!isQuestionDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-outline-variant/50 text-sm font-medium text-on-surface hover:border-outline-variant transition-colors bg-white shadow-sm"
                >
                  Page {questionPage} of 10 <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>
                {isQuestionDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsQuestionDropdownOpen(false)}></div>
                    <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1 max-h-48 overflow-y-auto">
                      {[...Array(10)].map((_, i) => (
                        <button key={i} onClick={() => { setQuestionPage(i+1); setIsQuestionDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low transition-colors ${questionPage === i+1 ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface'}`}>Page {i+1}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          </div>
        </section>
        )}

        {activeTab === 'users' && (
        <section className="mt-2 flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full p-1">
            <h2 className="text-xl font-bold text-on-surface hidden sm:block">User Progress Directory</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary transition-colors text-sm shadow-sm" 
                placeholder="Search user by name or email..." 
                type="text" 
              />
            </div>
          </div>

          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                    {context?.type === 'EXAM' ? (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Score</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Started At</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Submitted At</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                      </>
                    ) : context?.type === 'ROOM' ? (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Participant</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Score</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Joined At</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Score</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Time Taken</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Progress</th>
                        <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                      </>
                    )}
                    <th className="px-4 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {context?.type === 'EXAM' ? (
                    filteredAssignees.length > 0 ? filteredAssignees.map(a => (
                      <tr key={a.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {a.user_name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-on-surface leading-tight">{a.user_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">{a.score !== undefined ? `${a.score}/100` : '-'}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant text-center font-medium">
                          {a.started_at ? <div className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-70" /> {a.started_at}</div> : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant text-center font-medium">
                          {a.submitted_at ? <div className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-70" /> {a.submitted_at}</div> : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-24 border border-current/10 ${
                            a.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
                            a.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-surface-variant text-on-surface-variant'
                          }`}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">No assignees found matching "{userSearch}"</td></tr>
                    )
                  ) : context?.type === 'ROOM' ? (
                    filteredParticipants.length > 0 ? filteredParticipants.map(p => (
                      <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {p.nickname.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-on-surface leading-tight">{p.nickname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">{p.score}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant text-center font-medium">
                          <div className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-70" /> {p.joined_at}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-20 border border-current/10 ${
                            p.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                            p.status === 'JOINED' ? 'bg-indigo-100 text-indigo-700' :
                            p.status === 'LEFT' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-medium">No participants found matching "{userSearch}"</td></tr>
                    )
                  ) : (
                    filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold overflow-hidden shadow-sm shrink-0">
                              {u.id === 1 ? <img src="https://i.pravatar.cc/150?u=sarah" alt="avatar" /> : 
                               u.id === 2 ? <img src="https://i.pravatar.cc/150?u=marcus" alt="avatar" /> :
                               u.id === 3 ? <img src="https://i.pravatar.cc/150?u=david" alt="avatar" /> :
                               <img src="https://i.pravatar.cc/150?u=elena" alt="avatar" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-on-surface leading-tight mb-0.5">{u.name}</span>
                              <span className="text-xs text-on-surface-variant leading-tight">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">{u.score}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant text-center font-medium">
                          <div className="flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-70" /> {u.timeTaken}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border border-current/20 ${u.progColor}`}>
                            {u.progress}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-20 border border-current/10 ${u.statColor}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                          No users found matching "{userSearch}"
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            {/* User Table Pagination */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <span className="text-sm text-on-surface-variant">
                Showing 1 to {context?.type === 'EXAM' ? filteredAssignees.length : context?.type === 'ROOM' ? filteredParticipants.length : filteredUsers.length} of {context?.type === 'EXAM' ? '120' : context?.type === 'ROOM' ? '42' : '1,240'} entries
              </span>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md text-on-surface-variant/50 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></button>
                <div className="relative">
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-outline-variant/50 text-sm font-medium text-on-surface hover:border-outline-variant transition-colors bg-white shadow-sm"
                  >
                    Page {userPage} of {context?.type === 'ROOM' ? '7' : context?.type === 'EXAM' ? '20' : '1'} <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  {isUserDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserDropdownOpen(false)}></div>
                      <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1 max-h-40 overflow-y-auto">
                        <button onClick={() => { setUserPage(1); setIsUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm bg-primary/5 text-primary font-semibold">Page 1</button>
                        <button onClick={() => { setUserPage(2); setIsUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low text-on-surface">Page 2</button>
                        <button onClick={() => { setUserPage(3); setIsUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low text-on-surface">Page 3</button>
                      </div>
                    </>
                  )}
                </div>
                <button className={`p-1.5 rounded-md transition-colors ${context?.type === 'ROOM' || context?.type === 'EXAM' ? 'text-primary hover:bg-surface-container cursor-pointer' : 'text-on-surface-variant/50 cursor-not-allowed'}`}><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </section>
        )}
          </>
        )}
        
      </div>
    </main>
  );
}
