import React, { useState } from 'react';
import { Search, Download, Percent, Users as UsersIcon, Library, TrendingUp, Clock, AlertTriangle, FileText } from 'lucide-react';
import { ViewState } from '@/types';
import { DUMMY_PARTICIPANTS, DUMMY_EXAM_ASSIGNEES, DUMMY_REPORT_QUESTIONS, QuestionReport } from '@/data/mockDb';
import { Dropdown } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';

interface ReportsProps {
  context?: any;
  onNavigate?: (view: ViewState, context?: any) => void;
}

export const Reports: React.FC<ReportsProps> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'questions'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('All');

  const [questionPage, setQuestionPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const [questionsData] = useState<QuestionReport[]>(DUMMY_REPORT_QUESTIONS);
  const itemsPerPage = 5;

  // Filtered Questions
  const filteredQuestions = questionsData.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesDiff = questionDifficultyFilter === 'All' || q.difficulty === questionDifficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const questionTotalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const questionStartIndex = (questionPage - 1) * itemsPerPage;
  const currentQuestions = filteredQuestions.slice(questionStartIndex, questionStartIndex + itemsPerPage);

  // Filtered Users (Participants or Exam Assignees)
  const isExam = context?.mode === 'EXAM';
  const participantsList = isExam ? DUMMY_EXAM_ASSIGNEES : DUMMY_PARTICIPANTS;

  const filteredUsers = participantsList.filter((u) => {
    const name = (u as any).name || (u as any).user_name || (u as any).nickname || '';
    return (
      name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u as any).rank?.toString().includes(userSearch)
    );
  });

  const userTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const userStartIndex = (userPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(userStartIndex, userStartIndex + itemsPerPage);

  const exportReport = (format: 'pdf' | 'csv') => {
    const reportName = context?.title || 'System_Analytics_Report';
    const content = `Report Title: ${reportName}\nDate: ${new Date().toLocaleDateString()}\n`;
    const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#3a1b7e] font-extrabold tracking-tight">
              {context ? `Room Report: ${context.title}` : 'Analytics & System Reports'}
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant">
              {context
                ? `Room Code: ${context.room_code || context.code || 'N/A'} • Host: ${
                    context.host_name || context.host || 'Admin'
                  }`
                : 'Comprehensive metrics across live rooms, quiz performance, and user engagement.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Participants</p>
              <h3 className="text-2xl font-black text-on-surface mt-0.5">
                {context?.part || context?.participant_count || '1,420'}
              </h3>
              <span className="text-xs text-green-600 font-semibold inline-flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +14.2% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-on-secondary-container shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Average Score</p>
              <h3 className="text-2xl font-black text-on-surface mt-0.5">78.5%</h3>
              <span className="text-xs text-green-600 font-semibold inline-flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +3.1% overall
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Quizzes Played</p>
              <h3 className="text-2xl font-black text-on-surface mt-0.5">384</h3>
              <span className="text-xs text-on-surface-variant font-medium inline-flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Across 42 live rooms
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Completion Rate</p>
              <h3 className="text-2xl font-black text-on-surface mt-0.5">92.4%</h3>
              <span className="text-xs text-green-600 font-semibold inline-flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> High engagement
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/40 gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-base font-bold transition-all relative ${
              activeTab === 'users' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            User Performance ({participantsList.length})
            {activeTab === 'users' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-3 text-base font-bold transition-all relative ${
              activeTab === 'questions' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Question Breakdown ({questionsData.length})
            {activeTab === 'questions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>}
          </button>
        </div>

        {/* Tab Content: Users Performance */}
        {activeTab === 'users' && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant/40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
              <h3 className="text-headline-md text-base text-on-surface">Participant Scores & Ranks</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search user name or rank..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30">User Name</th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Score / Points</th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                      Correct Answers
                    </th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Accuracy</th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((u: any, i) => (
                      <tr key={i} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4 font-semibold text-on-surface flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {(u.user_name || u.nickname || u.name || 'User').substring(0, 2).toUpperCase()}
                          </div>
                          {u.user_name || u.nickname || u.name || 'User'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-primary">{u.score || u.points || 'N/A'}</td>
                        <td className="px-6 py-4 text-center text-on-surface-variant">
                          {u.correct || u.correct_count || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">
                          <span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            {u.accuracy || '85%'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-container/30 text-primary">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                        No participants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={userPage}
              totalPages={userTotalPages}
              totalItems={filteredUsers.length}
              startIndex={userStartIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setUserPage(page)}
            />
          </div>
        )}

        {/* Tab Content: Questions Breakdown */}
        {activeTab === 'questions' && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant/40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
              <h3 className="text-headline-md text-base text-on-surface">Question Difficulty & Success Rate</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search question text..."
                    value={questionSearch}
                    onChange={(e) => {
                      setQuestionSearch(e.target.value);
                      setQuestionPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <Dropdown
                  value={questionDifficultyFilter}
                  onChange={(val) => {
                    setQuestionDifficultyFilter(val);
                    setQuestionPage(1);
                  }}
                  options={[
                    { value: 'All', label: 'All Difficulty' },
                    { value: 'Easy', label: 'Easy' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Hard', label: 'Hard' },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30">Question</th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Difficulty</th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                      Correct Answers
                    </th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                      Incorrect Answers
                    </th>
                    <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4 font-medium max-w-md">{q.question}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${q.diffColor}`}>{q.difficulty}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-green-600">{q.correct}</td>
                        <td className="px-6 py-4 text-center font-bold text-red-600">{q.incorrect}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${q.rateColor}`}>{q.rate}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                        No questions matched search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={questionPage}
              totalPages={questionTotalPages}
              totalItems={filteredQuestions.length}
              startIndex={questionStartIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setQuestionPage(page)}
            />
          </div>
        )}
      </div>
    </main>
  );
};
