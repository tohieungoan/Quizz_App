import { Search, Download, Percent, Users as UsersIcon, Library, TrendingUp, Minus, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, MonitorPlay, BarChart2, Settings, AlertTriangle, Clock, Filter, FileText, Eye } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ViewState } from '@/types';
import { DUMMY_PARTICIPANTS, DUMMY_EXAM_ASSIGNEES, DUMMY_USERS } from '@/data/mockDb';
import { Dropdown } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { UserActionModal, UserData } from '@/components/ui/UserActionModal';

export function Reports({ context: propContext, onNavigate: propOnNavigate }: { context?: any, onNavigate?: (view: ViewState, context?: any) => void }) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  
  const context = propContext || location.state;
  
  const handleNavigate = (view: ViewState, ctx?: any) => {
    if (propOnNavigate) {
      propOnNavigate(view, ctx);
      return;
    }
    
    if (view === 'reports') {
      if (ctx && (ctx.roomId || ctx.id)) {
        routerNavigate(`/admin/reports/${ctx.roomId || ctx.id}`, { state: ctx });
      } else {
        routerNavigate(`/admin/reports`);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<'users' | 'questions'>('users');
  const [globalSearch, setGlobalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('All');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');

  const [questionPage, setQuestionPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 5;
  
  const [isQuestionDropdownOpen, setIsQuestionDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserData | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const handleViewUser = (userId?: string, userName?: string) => {
    let foundUser = null;
    if (userId) {
      foundUser = DUMMY_USERS.find(u => u.id === userId);
    }
    if (!foundUser && userName) {
      foundUser = DUMMY_USERS.find(u => u.name === userName || u.initials === userName);
    }
    
    if (foundUser) {
      setSelectedUserDetails(foundUser as UserData);
      setIsUserModalOpen(true);
    } else {
      // Fallback for mock data without explicit matches
      setSelectedUserDetails({
        id: userId || `U-${Math.random().toString(36).substr(2, 5)}`,
        name: userName || 'Unknown User',
        email: 'user@example.com',
        role: 'USER',
        status: 'ACTIVE',
        initials: userName ? userName.substring(0, 2).toUpperCase() : 'U',
      });
      setIsUserModalOpen(true);
    }
  };

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
    { id: 'EX-102', type: 'EXAM', roomCode: 'EX-102', roomTitle: 'History Midterm', quizTitle: 'World History 101', host: 'Dr. John Doe', date: '2026-07-15 10:00', participants: 95, avgScore: '72.1%' },
    { id: 'RM-092', type: 'ROOM', roomCode: 'F8G9H', roomTitle: 'Chemistry Prep', quizTitle: 'Organic Chem Review', host: 'Jane Smith', date: '2026-07-09 13:00', participants: 50, avgScore: '88.3%' }
  ];

  const filteredReports = recentReportsData.filter(r => {
    const matchesSearch = r.quizTitle.toLowerCase().includes(globalSearch.toLowerCase()) || 
                          r.roomTitle.toLowerCase().includes(globalSearch.toLowerCase()) || 
                          r.host.toLowerCase().includes(globalSearch.toLowerCase());
    const matchesType = reportTypeFilter === 'ALL' || r.type === reportTypeFilter;
    return matchesSearch && matchesType;
  });

  const reportTotalPages = Math.max(1, Math.ceil(filteredReports.length / reportsPerPage));
  const reportStartIndex = (reportPage - 1) * reportsPerPage;
  const paginatedReports = filteredReports.slice(reportStartIndex, reportStartIndex + reportsPerPage);

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

  const questionsPerPage = 5;
  const questionTotalPages = Math.max(1, Math.ceil(filteredQuestions.length / questionsPerPage));
  const questionStartIndex = (questionPage - 1) * questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(questionStartIndex, questionStartIndex + questionsPerPage);

  const usersListToPaginate = context?.type === 'EXAM' ? filteredAssignees : context?.type === 'ROOM' ? filteredParticipants : filteredUsers;
  const usersPerPage = 5;
  const userTotalPages = Math.max(1, Math.ceil(usersListToPaginate.length / usersPerPage));
  const userStartIndex = (userPage - 1) * usersPerPage;
  const paginatedUsersList = usersListToPaginate.slice(userStartIndex, userStartIndex + usersPerPage);

  const handleDownload = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    const content = `Report for ${title}\nName,Score,Time\nJohn Doe,90,45m\nJane Smith,85,50m\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4 sm:gap-0">
          <div>
            <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
              Analytics & Reports
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
              Platform-wide quiz reports and analytics.
            </p>
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
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Total Participants</span>
              <UsersIcon className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">1,240</div>
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

        <section className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm flex flex-col">
              <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="flex items-center w-full sm:w-auto bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/40">
                  <button 
                    onClick={() => setReportTypeFilter('ALL')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'ALL' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    All Types
                  </button>
                  <button 
                    onClick={() => setReportTypeFilter('EXAM')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'EXAM' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    Exam
                  </button>
                  <button 
                    onClick={() => setReportTypeFilter('ROOM')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'ROOM' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    Room
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
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
                    {paginatedReports.map(r => (
                      <tr key={r.id} className="hover:bg-surface-bright transition-colors group">
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
                          <button onClick={(e) => handleDownload(e, r.quizTitle)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors" title="Download Excel">
                            <Download className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={reportPage}
                totalPages={reportTotalPages}
                totalItems={recentReportsData.length}
                startIndex={reportStartIndex}
                itemsPerPage={reportsPerPage}
                onPageChange={(page) => setReportPage(page)}
              />
            </div>
          </section>

        {/* User Details Modal */}
        {selectedUserDetails && (
          <UserActionModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            onSave={() => setIsUserModalOpen(false)}
            mode="view"
            user={selectedUserDetails}
          />
        )}
      </div>
    </main>
  );
}
