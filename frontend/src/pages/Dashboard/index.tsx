import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, LayoutDashboard, DoorOpen, Assignment, ClipboardList,
  Trophy, Settings, LogOut, Search, HelpCircle, Bell, CheckSquare,
  History, Eye, RefreshCw, Star, Zap, Award, Flame, UserCheck,
  Plus, Upload, Shield, Users, Mail, Phone, BookOpen, ChevronRight,
  TrendingUp, Award as AwardIcon, Check, Play, Edit, Trash2, ChevronDown,
  Building, BarChart2, ArrowLeft, ArrowRight
} from 'lucide-react'

// Mock Data
const recentActivities = [
  { id: 1, name: 'Advanced Physics Ch. 4', type: 'Exam', date: 'Oct 24, 2026', score: '92%', status: 'completed' },
  { id: 2, name: 'World History Midterm', type: 'Live Quiz', date: 'Oct 22, 2026', score: '88%', status: 'completed' },
  { id: 3, name: 'Calculus Practice Sets', type: 'Practice', date: 'Oct 20, 2026', score: '100%', status: 'completed' },
  { id: 4, name: 'Biology Pop Quiz', type: 'Missed', date: 'Oct 18, 2026', score: '--', status: 'missed' },
]

const assignedExams = [
  { id: 1, title: 'Midterm Biology 101', due: 'Tomorrow, 11:59 PM', subject: 'Biology', rule: 'Strict / Locked' },
  { id: 2, title: 'Calculus III - Chapter 4 Quiz', due: 'Oct 30, 2026', subject: 'Mathematics', rule: 'Free Navigation' },
]

const mockHistory = [
  { id: 1, title: 'Introduction to Psychology Final', date: 'Oct 15, 2026', score: '95%' },
  { id: 2, title: 'European History Quiz 2', date: 'Oct 10, 2026', score: '88%' },
  { id: 3, title: 'Chemistry Lab Safety Test', date: 'Oct 05, 2026', score: '92%' },
]

const teacherQuizzes = [
  { id: 1, title: 'Cell Biology Basics', subject: 'Science', level: 'Medium', questions: 15, status: 'PUBLISHED' },
  { id: 2, title: 'World War II Overview', subject: 'History', level: 'Hard', questions: 25, status: 'DRAFT' },
  { id: 3, title: 'Algebra I - Linear Equations', subject: 'Math', level: 'Easy', questions: 10, status: 'PUBLISHED' },
]

const teacherExams = [
  { id: 1, title: 'Midterm Biology 101', classAssigned: 'Class 10A1', date: 'Oct 25, 2026', status: 'Active' },
  { id: 2, title: 'Calculus III Quiz', classAssigned: 'Eng. Int.', date: 'Oct 30, 2026', status: 'Scheduled' },
]

const teacherClasses = [
  { id: 1, name: 'Class 10A1', subject: 'Mathematics', studentsCount: 35, avgPerformance: 88 },
  { id: 2, name: 'English Intermediate', subject: 'Languages', studentsCount: 20, avgPerformance: 92 },
  { id: 3, name: 'Science 101', subject: 'Science', studentsCount: 28, avgPerformance: 85 },
]

const classRoster = [
  { id: 1, name: 'Alex Johnson', email: 'alex.j@student.edu', scores: [85, 92, 78, 95] },
  { id: 2, name: 'Maria Garcia', email: 'm.garcia@student.edu', scores: [70, 88, 82, 75] },
  { id: 3, name: 'Liam Smith', email: 'l.smith@student.edu', scores: [95, 98, 92, 100] },
]

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  
  // States
  const [activeTab, setActiveTab] = useState<'overview' | 'join_room' | 'assigned_exams' | 'history' | 'achievements' | 'settings' | 'teacher_studio'>('overview')
  const [teacherSubTab, setTeacherSubTab] = useState<'quizzes' | 'exams' | 'classes' | 'students'>('quizzes')
  const [examView, setExamView] = useState<'manage' | 'create' | 'report'>('manage')
  const [classView, setClassView] = useState<'list' | 'details'>('list')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
  // Modals
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<any>(null)

  // Host Session Settings
  const [selectedGameMode, setSelectedGameMode] = useState<'classic' | 'fun' | 'team'>('classic')
  const [progressionMode, setProgressionMode] = useState<'manual' | 'auto'>('manual')
  const [leaderboardToggle, setLeaderboardToggle] = useState(true)

  // Interactive 6-digit Code inputs
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSignOut = () => {
    navigate('/')
  }

  const handleReviewClick = (item: any) => {
    setActiveReviewItem(item)
    setReviewModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#f9f9ff] text-on-surface font-body-md overflow-hidden w-full">
      {/* 1. SIDE NAVIGATION BAR */}
      <nav className="h-screen w-66 flex-shrink-0 bg-white border-r border-outline-variant/20 flex flex-col py-6 px-5 z-40">
        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-headline-md text-base font-extrabold text-primary leading-tight">QuizzApp v2</h1>
            <p className="text-[10.5px] font-bold text-secondary uppercase tracking-wider">Premium Scholar</p>
          </div>
        </div>

        {/* Navigation Links Group */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Learner Workspace Section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold text-outline/80 uppercase tracking-widest pl-3 mb-2">Learner Workspace</p>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'overview'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <LayoutDashboard className={`w-[18px] h-[18px] ${activeTab === 'overview' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('join_room')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'join_room'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <DoorOpen className={`w-[18px] h-[18px] ${activeTab === 'join_room' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Join Room
            </button>

            <button
              onClick={() => setActiveTab('assigned_exams')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'assigned_exams'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <ClipboardList className={`w-[18px] h-[18px] ${activeTab === 'assigned_exams' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Assigned Exams
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'history'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <History className={`w-[18px] h-[18px] ${activeTab === 'history' ? 'text-primary' : 'text-on-surface-variant'}`} />
              History
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'achievements'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Trophy className={`w-[18px] h-[18px] ${activeTab === 'achievements' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Achievements
            </button>
          </div>

          {/* Teacher Studio Accordion Section */}
          <div className="space-y-1.5">
            <div
              onClick={() => {
                setActiveTab('teacher_studio')
              }}
              className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border-l-4 ${
                activeTab === 'teacher_studio'
                  ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <p className="text-[10.5px] font-extrabold uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5" /> Teacher Studio
              </p>
            </div>
            
            {activeTab === 'teacher_studio' && (
              <div className="pl-4 space-y-1 animate-in slide-in-from-top-3 duration-250">
                <button
                  onClick={() => setTeacherSubTab('quizzes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    teacherSubTab === 'quizzes' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Star className="w-4 h-4" /> Manage Quizzes
                </button>
                <button
                  onClick={() => {
                    setTeacherSubTab('exams')
                    setExamView('manage')
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    teacherSubTab === 'exams' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Create &amp; Manage Exams
                </button>
                <button
                  onClick={() => {
                    setTeacherSubTab('classes')
                    setClassView('list')
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    teacherSubTab === 'classes' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Users className="w-4 h-4" /> Manage Classes
                </button>
                <button
                  onClick={() => setTeacherSubTab('students')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    teacherSubTab === 'students' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Students Directory
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Account Actions */}
        <div className="mt-auto pt-4 border-t border-outline-variant/10">
          <p className="text-[10px] font-extrabold text-outline/80 uppercase tracking-widest pl-3 mb-2">Account</p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${
                activeTab === 'settings'
                  ? 'text-primary bg-primary/5 font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Settings className="w-[18px] h-[18px]" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top Header Navigation */}
        <header className="h-16 border-b border-outline-variant/10 bg-white flex justify-between items-center px-10 flex-shrink-0">
          {/* Search Input Bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search quizzes, rooms, or classes..."
              className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-full py-2 pl-10 pr-4 text-sm font-body-md placeholder:text-outline-variant shadow-sm transition-colors"
            />
          </div>

          {/* Action Icons and Avatar */}
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-[#f9f9ff]">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="relative">
              <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-[#f9f9ff]">
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </div>
            
            <div className="h-6 w-px bg-outline-variant/20 mx-2" />
            
            <div className="flex items-center gap-2">
              <img
                alt="Sarah Jenkins Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfaFPBDooRGLvDmcVP4_fNcfUexhBlWhogiWecBA007JUsD_KBoANvn5YElbqXehZRc657MDywN7u7bd-nBDgzNhmJgJ-jFAw7EENxs_7en60M9XkErKfqG_W_NkHA9i1cO8tohFTHYhoiLf0pZmPTPp1RWMCIOgeIa5SqE5fckTmYAJyHvXWDSJQwhXXpwisxYeJ9J9nHbo4tOTok45r_vWidt_edDFTqHAj6qKUjIHVRlamL6gzqG-0ELUzk7FaArbYm5ZqJyps"
                className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 cursor-pointer shadow-sm hover:scale-105 transition-transform"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-on-surface leading-none">Sarah Jenkins</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">sarah.j@school.edu</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Sub-Views Area */}
        <main className="flex-grow overflow-y-auto p-10 bg-[#f9f9ff]">
          <div className="max-w-[1200px] mx-auto">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Overview</h2>
                    <p className="font-body-md text-on-surface-variant text-sm mt-1">Welcome back, Sarah. Here's your learning pulse.</p>
                  </div>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Completed Quizzes */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <span className="bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-1 rounded-full">+12%</span>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold text-on-surface">42</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">Completed Quizzes</p>
                  </div>

                  {/* Active Rooms */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <DoorOpen className="w-6 h-6" />
                      </div>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">Active Now</span>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold text-on-surface">3</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">Active Rooms</p>
                  </div>

                  {/* Upcoming Exams */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#fcf4e6] flex items-center justify-center text-orange-600">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <span className="bg-[#fcf4e6] text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">This Week</span>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold text-on-surface">5</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">Upcoming Exams</p>
                  </div>

                  {/* Total Points (Featured Gradient Card) */}
                  <div className="bg-gradient-to-br from-primary to-[#7c3aed] rounded-2xl p-6 shadow-md flex flex-col relative overflow-hidden group text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full -ml-4 -mb-4" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold relative z-10">12,450</h3>
                    <p className="font-body-md text-sm text-indigo-100 relative z-10 mt-1">Total Points Earned</p>
                  </div>
                </div>

                {/* Bento layout (Recent Activities + Join Room widget) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Join Room Widget (1/3 width) */}
                  <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#f9f9ff] to-transparent opacity-60" />
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 shadow-sm z-10">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2 z-10">Enter Room Code</h3>
                    <p className="font-body-md text-on-surface-variant text-xs mb-6 z-10 leading-relaxed max-w-[200px]">Join a live game session or proctored exam.</p>
                    
                    <div className="w-full space-y-5 z-10">
                      <div className="flex justify-center gap-2">
                        {code.map((num, i) => (
                          <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            value={num}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            maxLength={1}
                            placeholder="•"
                            className="w-10 h-12 text-center font-headline-md text-xl font-bold rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none bg-white shadow-sm transition-colors"
                            type="text"
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const enteredCode = code.join('')
                          if (enteredCode.length === 6) {
                            alert(`Joining room: ${enteredCode}`)
                          } else {
                            alert('Please enter a 6-digit code.')
                          }
                        }}
                        className="w-full bg-secondary hover:bg-secondary/95 text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm relative"
                      >
                        Join Live Session
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activities List (2/3 width) */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                      <h3 className="font-headline-md text-lg font-bold text-on-surface">Recent Activities</h3>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-primary font-bold text-xs hover:underline uppercase tracking-wider"
                      >
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                            <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Activity Name</th>
                            <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Type</th>
                            <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Date</th>
                            <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Score</th>
                            <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {recentActivities.map((act) => (
                            <tr key={act.id} className="hover:bg-primary/5 transition-colors group">
                              <td className="py-4 px-6 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  act.type === 'Exam' ? 'bg-primary/10 text-primary' : act.type === 'Live Quiz' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                }`}>
                                  {act.type === 'Exam' ? <ClipboardList className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                </div>
                                <span className="font-semibold text-sm text-on-surface">{act.name}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  act.type === 'Exam' ? 'bg-indigo-50 text-indigo-700' : act.type === 'Live Quiz' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                                }`}>
                                  {act.type}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-xs text-on-surface-variant">{act.date}</td>
                              <td className="py-4 px-6 font-bold text-sm text-on-surface">{act.score}</td>
                              <td className="py-4 px-6 text-right">
                                {act.type !== 'Missed' ? (
                                  <button
                                    onClick={() => handleReviewClick(act)}
                                    className="text-primary hover:text-primary-container font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                  >
                                    Review <Eye className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => alert(`Retaking: ${act.name}`)}
                                    className="text-secondary hover:text-secondary-container font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                  >
                                    Retake <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: JOIN ROOM */}
            {activeTab === 'join_room' && (
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                {/* Left Card: Join Room */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 shadow-sm">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h2 className="font-headline-md text-lg font-bold text-on-surface mb-1">Join a Room</h2>
                  <p className="font-body-md text-xs text-on-surface-variant mb-6">Enter the 6-digit code from your instructor.</p>
                  
                  <div className="w-full space-y-4">
                    <div className="flex justify-center gap-2">
                      {code.map((num, i) => (
                        <input
                          key={i}
                          ref={(el) => (inputRefs.current[i] = el)}
                          value={num}
                          onChange={(e) => handleCodeChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          maxLength={1}
                          placeholder="0"
                          className="w-10 h-12 text-center font-headline-md text-xl font-bold rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none bg-white shadow-sm"
                          type="text"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => alert(`Connecting with code ${code.join('')}...`)}
                      className="w-full bg-secondary text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      Join Session
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Card: Host a Session */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-8 flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-headline-md text-base font-bold text-on-surface">Host a Session</h2>
                      <p className="font-body-md text-xs text-on-surface-variant">Create a room for your students.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Game Mode */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-3">Game Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['classic', 'fun', 'team'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setSelectedGameMode(mode)}
                            className={`flex flex-col items-center gap-1.5 p-3.5 border rounded-xl transition-all ${
                              selectedGameMode === mode
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                                : 'border-outline-variant/30 hover:bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            {mode === 'classic' && <Trophy className="w-5 h-5" />}
                            {mode === 'fun' && <Zap className="w-5 h-5" />}
                            {mode === 'team' && <Users className="w-5 h-5" />}
                            <span className="text-[11px] uppercase tracking-wide">{mode}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Settings Panel */}
                    <div className="space-y-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/10">
                      {/* Progression Mode */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">Progression</span>
                          <span className="text-[10px] text-on-surface-variant">Manual vs Automatic rounds</span>
                        </div>
                        <div className="flex bg-outline-variant/20 p-1 rounded-lg">
                          <button
                            onClick={() => setProgressionMode('manual')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                              progressionMode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Manual
                          </button>
                          <button
                            onClick={() => setProgressionMode('auto')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                              progressionMode === 'auto' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Auto
                          </button>
                        </div>
                      </div>

                      {/* Leaderboard Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">Leaderboard</span>
                          <span className="text-[10px] text-on-surface-variant">Show rankings after rounds</span>
                        </div>
                        <button
                          onClick={() => setLeaderboardToggle(!leaderboardToggle)}
                          className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${
                            leaderboardToggle ? 'bg-secondary' : 'bg-outline-variant/40'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            leaderboardToggle ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => alert(`Room created in ${selectedGameMode} mode!`)}
                      className="w-full bg-primary text-white font-button py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      Create Room
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ASSIGNED EXAMS */}
            {activeTab === 'assigned_exams' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Assigned Exams</h2>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">Pending examinations requiring your attention.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Exam Title</th>
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Subject</th>
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Navigation Rule</th>
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {assignedExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-sm text-on-surface">{exam.title}</p>
                            <p className="text-xs text-on-surface-variant mt-1">Due: {exam.due}</p>
                          </td>
                          <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.subject}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-low text-on-surface-variant">
                              <Shield className="w-3.5 h-3.5 text-on-surface-variant" /> {exam.rule}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => alert(`Starting exam: ${exam.title}`)}
                              className="bg-primary hover:bg-primary-container text-white text-xs font-bold py-2 px-4.5 rounded-lg shadow-sm hover:shadow-md transition-shadow active:scale-95 duration-100"
                            >
                              Start Exam
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">History</h2>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">Review your past performance.</p>
                </div>

                <div className="space-y-4">
                  {mockHistory.map((hist) => (
                    <div key={hist.id} className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                      <div>
                        <h4 className="font-semibold text-sm text-on-surface">{hist.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Completed on {hist.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-headline-md text-lg font-bold text-secondary">{hist.score}</span>
                        <button
                          onClick={() => handleReviewClick(hist)}
                          className="text-primary hover:text-primary-container font-bold text-xs border border-primary/20 rounded-lg px-3.5 py-2 hover:bg-primary/5"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Achievements</h2>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">Badges and milestones you've earned.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* Achievement 1 */}
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group">
                    <div className="w-16 h-16 mx-auto bg-[#fcf4e6] text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Award className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Perfect Score</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Achieved 100% on any proctored exam.</p>
                  </div>

                  {/* Achievement 2 */}
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group">
                    <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Flame className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">On Fire</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">5 consecutive days of learning activity.</p>
                  </div>

                  {/* Achievement 3 (Locked) */}
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-6 text-center shadow-sm opacity-50 grayscale relative">
                    <div className="w-16 h-16 mx-auto bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Speed Demon</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Finish an exam in half of the limit time.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Settings</h2>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">Manage your account preferences.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-8 max-w-2xl">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-3 font-body-md text-sm outline-none"
                        type="text"
                        defaultValue="Sarah Jenkins"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface-variant font-body-md text-sm cursor-not-allowed"
                        disabled
                        type="email"
                        defaultValue="sarah.j@school.edu"
                      />
                      <p className="text-[10px] text-outline mt-1.5 pl-1">Contact your administrator to change your registered email.</p>
                    </div>
                    
                    <hr className="border-outline-variant/10 my-6" />
                    
                    <div>
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">New Password</label>
                      <input
                        className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-3 font-body-md text-sm outline-none"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Confirm Password</label>
                      <input
                        className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-3 font-body-md text-sm outline-none"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => alert('Changes saved successfully!')}
                        className="bg-primary hover:bg-primary-container text-white font-button py-3 px-8 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 duration-100 text-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: TEACHER STUDIO */}
            {activeTab === 'teacher_studio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Teacher Studio</h2>
                    <p className="font-body-md text-on-surface-variant text-sm mt-1">Manage content, classes, and student performance.</p>
                  </div>
                </div>

                {/* Horizontal Navigation */}
                <div className="border-b border-outline-variant/10 mb-6">
                  <nav className="flex gap-6">
                    {(['quizzes', 'exams', 'classes', 'students'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setTeacherSubTab(tab)
                          if (tab === 'exams') setExamView('manage')
                          if (tab === 'classes') setClassView('list')
                        }}
                        className={`pb-3.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                          teacherSubTab === tab
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                        }`}
                      >
                        {tab === 'quizzes' && 'Manage Quizzes'}
                        {tab === 'exams' && 'Manage Exams'}
                        {tab === 'classes' && 'Manage Classes'}
                        {tab === 'students' && 'Students'}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Sub Tab: Quizzes */}
                {teacherSubTab === 'quizzes' && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => alert('Creating a new quiz...')}
                        className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Create New Quiz
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teacherQuizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white border border-outline-variant/10 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                              quiz.status === 'PUBLISHED' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                            }`}>
                              {quiz.status}
                            </span>
                            <button className="text-on-surface-variant hover:text-primary"><Plus className="w-4 h-4 rotate-45" /></button>
                          </div>
                          <h3 className="font-bold text-base text-on-surface mb-1">{quiz.title}</h3>
                          <p className="text-xs text-on-surface-variant mb-4">Subject: {quiz.subject} • {quiz.level}</p>
                          <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center text-xs">
                            <span className="text-outline">{quiz.questions} Questions</span>
                            <button
                              onClick={() => alert(`Editing quiz: ${quiz.title}`)}
                              className="text-primary font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub Tab: Exams */}
                {teacherSubTab === 'exams' && (
                  <div className="space-y-6">
                    {examView === 'manage' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-base text-on-surface">Exams Schedule</h3>
                          <div className="flex gap-3">
                            <button
                              onClick={() => alert('Exporting report...')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                            >
                              <Upload className="w-4 h-4" /> Export Report
                            </button>
                            <button
                              onClick={() => setExamView('create')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                              <Plus className="w-4 h-4" /> Create New
                            </button>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Exam Title</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Class</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Date</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {teacherExams.map((exam) => (
                                <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                                  <td className="py-4 px-6 font-semibold text-sm text-on-surface">{exam.title}</td>
                                  <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.classAssigned}</td>
                                  <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.date}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      exam.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                                    }`}>
                                      {exam.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right space-x-3">
                                    <button
                                      onClick={() => setExamView('report')}
                                      className="text-primary font-bold text-xs hover:underline"
                                    >
                                      View Report
                                    </button>
                                    <button className="text-on-surface-variant hover:text-primary inline-block"><Edit className="w-4 h-4" /></button>
                                    <button className="text-on-surface-variant hover:text-error inline-block"><Trash2 className="w-4 h-4" /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {examView === 'create' && (
                      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-8 max-w-3xl mx-auto animate-in zoom-in-95 duration-200">
                        <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6">Create New Exam</h3>
                        <form onSubmit={(e) => { e.preventDefault(); setExamView('manage'); }} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Exam Title</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                placeholder="e.g. Semester 1 Final Exam"
                                type="text"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Exam Duration (minutes)</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                placeholder="60"
                                type="number"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Subject/Quiz Template</label>
                              <select className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none">
                                <option>Select a template...</option>
                                <option>Biology 101</option>
                                <option>Calculus III</option>
                                <option>World History</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Assigned Class</label>
                              <select className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none">
                                <option>Select a class...</option>
                                <option>Class 10A1</option>
                                <option>English Intensive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Start Date &amp; Time</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                type="datetime-local"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <hr className="border-outline-variant/10 my-2" />
                            </div>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setExamView('manage')}
                              className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
                            >
                              Create Exam
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {examView === 'report' && (
                      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-8 text-center max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart2 className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-base text-on-surface mb-2">Performance Report</h4>
                        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Detailed analytics for Midterm Biology 101 will appear here once students start submit.</p>
                        <button
                          onClick={() => setExamView('manage')}
                          className="text-primary font-bold hover:underline text-sm flex items-center gap-1 mx-auto"
                        >
                          <ArrowLeft className="w-4 h-4" /> Return to Exams
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab: Classes */}
                {teacherSubTab === 'classes' && (
                  <div className="space-y-6">
                    {classView === 'list' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-end">
                          <button
                            onClick={() => alert('Creating class...')}
                            className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Create New Class
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {teacherClasses.map((cls) => (
                            <div key={cls.id} className="bg-white border border-outline-variant/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between min-h-[220px]">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                    <Building className="w-6 h-6" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button className="text-on-surface-variant hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
                                    <button className="text-on-surface-variant hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                                <h3 className="font-bold text-base text-on-surface mb-1">{cls.name}</h3>
                                <p className="text-xs text-on-surface-variant mb-4">Subject: {cls.subject} • {cls.studentsCount} Students</p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-outline">Avg. Performance</span>
                                  <span className="text-secondary">{cls.avgPerformance}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                  <div className="h-full bg-secondary" style={{ width: `${cls.avgPerformance}%` }} />
                                </div>
                                <div className="pt-2 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls.name)
                                      setClassView('details')
                                    }}
                                    className="text-primary font-bold hover:underline text-xs"
                                  >
                                    View Roster
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {classView === 'details' && (
                      <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setClassView('list')}
                              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                              <h3 className="font-bold text-base text-on-surface">{selectedClass}</h3>
                              <p className="text-xs text-on-surface-variant mt-0.5">Student Performance &amp; Roster</p>
                            </div>
                          </div>
                          <button
                            onClick={() => alert('Exporting grades...')}
                            className="bg-primary/10 text-primary font-button py-2 px-4 rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-xs font-bold"
                          >
                            <Upload className="w-4 h-4 rotate-180" /> Export Grades
                          </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Student</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Email</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Score Profile</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {classRoster.map((st) => (
                                <tr key={st.id} className="hover:bg-primary/5 transition-colors">
                                  <td className="py-4 px-6 font-semibold text-sm text-on-surface">{st.name}</td>
                                  <td className="py-4 px-6 text-xs text-on-surface-variant">{st.email}</td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-end gap-1.5 h-8">
                                      {st.scores.map((score, sIdx) => (
                                        <div
                                          key={sIdx}
                                          className="w-3.5 bg-primary/40 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"
                                          style={{ height: `${score}%` }}
                                          title={`Quiz ${sIdx + 1}: ${score}%`}
                                        />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button
                                      onClick={() => alert(`Viewing student profile: ${st.name}`)}
                                      className="text-primary font-bold text-xs hover:underline"
                                    >
                                      View Profile
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab: Students Directory */}
                {teacherSubTab === 'students' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base text-on-surface">Student Directory</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">Manage student enrollment and track performance across classes.</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setImportModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                        >
                          <Upload className="w-4 h-4" /> Import Students
                        </button>
                        <button
                          onClick={() => setStudentModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add New Student
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Student Name</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Email</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Class</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Performance</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {classRoster.map((st) => (
                            <tr key={st.id} className="hover:bg-primary/5 transition-colors">
                              <td className="py-4 px-6 font-semibold text-sm text-on-surface">{st.name}</td>
                              <td className="py-4 px-6 text-xs text-on-surface-variant">{st.email}</td>
                              <td className="py-4 px-6">
                                <span className="px-2 py-1 bg-outline-variant/20 rounded text-[10px] font-bold text-on-surface-variant">10A1</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex-grow h-1.5 bg-outline-variant/20 rounded-full overflow-hidden max-w-[120px]">
                                    <div className="h-full bg-secondary" style={{ width: '85%' }} />
                                  </div>
                                  <span className="text-xs font-bold text-secondary">85%</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right space-x-3">
                                <button className="text-on-surface-variant hover:text-primary inline-block"><Edit className="w-4 h-4" /></button>
                                <button className="text-on-surface-variant hover:text-error inline-block"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>

      {/* 3. MODALS SYSTEM */}
      {/* Modal: Review Attempt */}
      {reviewModalOpen && activeReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Review Attempt</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-on-surface-variant hover:text-error p-1.5 hover:bg-surface-container-low rounded-lg transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded-xl">
                <p className="text-xs text-on-surface-variant">Activity Name</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{activeReviewItem.name || activeReviewItem.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant">Completed On</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{activeReviewItem.date || 'Oct 15, 2026'}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant">Score Achieved</p>
                  <p className="text-sm font-bold text-secondary mt-0.5">{activeReviewItem.score || '95%'}</p>
                </div>
              </div>
              <p className="text-xs text-outline leading-relaxed mt-2">
                This is a mock screen representing detail question-by-question review results, including correct answers, response duration, and accuracy rates.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="bg-primary hover:bg-primary-container text-white font-button text-xs py-2.5 px-6 rounded-lg shadow-sm"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Student */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-6">Add New Student</h3>
            <form onSubmit={(e) => { e.preventDefault(); setStudentModalOpen(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-on-surface-variant">Full Name</label>
                <input
                  required
                  placeholder="e.g. Alex Smith"
                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-on-surface-variant">Email Address</label>
                <input
                  required
                  placeholder="student@school.edu"
                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-on-surface-variant">Assign Class</label>
                <select className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option>Class 10A1</option>
                  <option>English Intensive</option>
                  <option>Science 101</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Students CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full m-4 text-center border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">Import Students</h3>
            <p className="text-xs text-on-surface-variant mb-6">Upload a CSV or Excel file to bulk enroll students.</p>
            
            <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-8 mb-6 hover:border-primary transition-colors cursor-pointer bg-[#f9f9ff]">
              <Upload className="w-10 h-10 text-outline-variant mx-auto mb-2" />
              <p className="text-xs font-bold text-outline">Click or drag file to upload</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => { setImportModalOpen(false); alert('Imported mock students data.'); }}
                className="px-6 py-2 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
