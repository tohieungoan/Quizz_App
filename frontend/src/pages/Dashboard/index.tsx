import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, LayoutDashboard, DoorOpen, ClipboardList,
  Trophy, Settings, LogOut, Search, HelpCircle, Bell, CheckSquare,
  History, Eye, RefreshCw, Star, Zap, Award, Flame, UserCheck,
  Plus, Upload, Shield, Users, Mail, Phone, BookOpen, ChevronRight,
  TrendingUp, Check, Play, Edit, Trash2, ChevronDown,
  Building, BarChart2, ArrowLeft, ArrowRight, Menu, X
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
  { id: 4, title: 'Linear Algebra Midterm', date: 'Sep 28, 2026', score: '78%' },
  { id: 5, title: 'Biology Chapter 5 Quiz', date: 'Sep 22, 2026', score: '85%' },
  { id: 6, title: 'World Literature Essay', date: 'Sep 18, 2026', score: '90%' },
  { id: 7, title: 'Physics Motion & Forces', date: 'Sep 12, 2026', score: '72%' },
  { id: 8, title: 'Data Structures Quiz', date: 'Sep 05, 2026', score: '96%' },
  { id: 9, title: 'Art History Renaissance', date: 'Aug 30, 2026', score: '82%' },
  { id: 10, title: 'Statistics Final Exam', date: 'Aug 24, 2026', score: '88%' },
  { id: 11, title: 'Chemistry Organic Bonds', date: 'Aug 18, 2026', score: '79%' },
  { id: 12, title: 'Geography World Capitals', date: 'Aug 10, 2026', score: '91%' },
  { id: 13, title: 'Economics Micro Quiz', date: 'Aug 03, 2026', score: '85%' },
  { id: 14, title: 'English Grammar Advanced', date: 'Jul 28, 2026', score: '94%' },
  { id: 15, title: 'Computer Networks Midterm', date: 'Jul 20, 2026', score: '76%' },
  { id: 16, title: 'Environmental Science Quiz', date: 'Jul 14, 2026', score: '89%' },
]

const hostQuizzes = [
  { id: 1, title: 'Cell Biology Basics', subject: 'Science', level: 'Medium', questions: 15, status: 'PUBLISHED' },
  { id: 2, title: 'World War II Overview', subject: 'History', level: 'Hard', questions: 25, status: 'DRAFT' },
  { id: 3, title: 'Algebra I - Linear Equations', subject: 'Math', level: 'Easy', questions: 10, status: 'PUBLISHED' },
]

const hostExams = [
  { id: 1, title: 'Midterm Biology 101', groupAssigned: 'Group 10A1', date: 'Oct 25, 2026', status: 'Active' },
  { id: 2, title: 'Calculus III Quiz', groupAssigned: 'Eng. Int.', date: 'Oct 30, 2026', status: 'Scheduled' },
]

const hostGroups = [
  { id: 1, name: 'Group 10A1', subject: 'Mathematics', membersCount: 35, avgPerformance: 88 },
  { id: 2, name: 'English Intermediate', subject: 'Languages', membersCount: 20, avgPerformance: 92 },
  { id: 3, name: 'Science 101', subject: 'Science', membersCount: 28, avgPerformance: 85 },
]

const groupRoster = [
  { id: 1, name: 'Alex Johnson', email: 'alex.j@member.edu', scores: [85, 92, 78, 95] },
  { id: 2, name: 'Maria Garcia', email: 'm.garcia@member.edu', scores: [70, 88, 82, 75] },
  { id: 3, name: 'Liam Smith', email: 'l.smith@member.edu', scores: [95, 98, 92, 100] },
]

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  // States
  const [activeTab, setActiveTab] = useState<'overview' | 'join_room' | 'assigned_exams' | 'history' | 'achievements' | 'settings' | 'host_studio'>('overview')
  const [hostSubTab, setHostSubTab] = useState<'quizzes' | 'exams' | 'groups' | 'members'>('quizzes')
  const [examView, setExamView] = useState<'manage' | 'create' | 'report'>('manage')
  const [groupView, setGroupView] = useState<'list' | 'details'>('list')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Achievements
  const [activeTitle, setActiveTitle] = useState<string | null>('Perfect Score')

  // Modals
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<any>(null)
  
  // Create Room Configuration Modal States
  const [hostRoomModalOpen, setHostRoomModalOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string>('1')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('1')
  const [roomTimeLimit, setRoomTimeLimit] = useState<number>(30)
  const [roomPassword, setRoomPassword] = useState<string>('')
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(true)
  const [randomizeAnswers, setRandomizeAnswers] = useState<boolean>(false)

  // AI Chat and Mobile Sidebar States
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    { sender: 'ai', text: 'Hi Sarah! I am QuizzApp\'s AI assistant. How can I help you with your exams or class management today?' }
  ])
  const [newMessageText, setNewMessageText] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim()) return
    const userMsg = newMessageText.trim()
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setNewMessageText('')

    setTimeout(() => {
      let reply = 'Got it! Would you like me to help you create a study outline or review your class scores?'
      if (userMsg.toLowerCase().includes('exam')) {
        reply = 'You have 5 upcoming exams this week. The nearest one is Midterm Biology 101 tomorrow.'
      } else if (userMsg.toLowerCase().includes('class') || userMsg.toLowerCase().includes('group')) {
        reply = 'Group 10A1\'s average performance is 88%. Top scorer is Liam Smith with 100%.'
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }])
    }, 1000)
  }

  // Host Session Settings
  const [selectedGameMode, setSelectedGameMode] = useState<'classic' | 'fun' | 'team'>('classic')
  const [progressionMode, setProgressionMode] = useState<'manual' | 'auto'>('manual')
  const [leaderboardToggle, setLeaderboardToggle] = useState(true)

  // Interactive 6-digit Code inputs
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (digit && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 0)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newCode = [...code]
      if (code[index]) {
        newCode[index] = ''
        setCode(newCode)
      } else if (index > 0) {
        newCode[index - 1] = ''
        setCode(newCode)
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newCode = [...code]
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || ''
    }
    setCode(newCode)
    const focusIndex = Math.min(pasted.length, 5)
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0)
  }

  const handleSignOut = () => {
    navigate('/')
  }

  const handleReviewClick = (item: any) => {
    setActiveReviewItem(item)
    setReviewModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#f9f9ff] text-on-surface font-body-md overflow-hidden w-full relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 1. SIDE NAVIGATION BAR (Responsive: slides off on mobile, fixed on desktop) */}
      <nav className={`fixed md:sticky top-0 bottom-0 left-0 h-screen w-66 flex-shrink-0 bg-white border-r border-outline-variant/20 flex flex-col py-6 px-5 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-headline-md text-base font-extrabold text-primary leading-tight">QuizzApp</h1>
              <p className="text-[10.5px] font-bold text-secondary uppercase tracking-wider">Premium Scholar</p>
            </div>
          </div>
          {/* Close Sidebar button (Mobile only) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Group */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Learner Workspace Section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold text-outline/80 uppercase tracking-widest pl-3 mb-2">Learner Workspace</p>
            <button
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'overview'
                ? 'text-primary bg-primary/5 font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <LayoutDashboard className={`w-[18px] h-[18px] ${activeTab === 'overview' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Overview
            </button>

            <button
              onClick={() => { setActiveTab('join_room'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'join_room'
                ? 'text-primary bg-primary/5 font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <DoorOpen className={`w-[18px] h-[18px] ${activeTab === 'join_room' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Join Room
            </button>

            <button
              onClick={() => { setActiveTab('assigned_exams'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'assigned_exams'
                ? 'text-primary bg-primary/5 font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <ClipboardList className={`w-[18px] h-[18px] ${activeTab === 'assigned_exams' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Assigned Exams
            </button>

            <button
              onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'history'
                ? 'text-primary bg-primary/5 font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <History className={`w-[18px] h-[18px] ${activeTab === 'history' ? 'text-primary' : 'text-on-surface-variant'}`} />
              History
            </button>

            <button
              onClick={() => { setActiveTab('achievements'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'achievements'
                ? 'text-primary bg-primary/5 font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <Trophy className={`w-[18px] h-[18px] ${activeTab === 'achievements' ? 'text-primary' : 'text-on-surface-variant'}`} />
              Achievements
            </button>
          </div>

          {/* Host Studio Accordion Section */}
          <div className="space-y-1.5">
            <div
              onClick={() => {
                setActiveTab('host_studio')
              }}
              className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border-l-4 ${activeTab === 'host_studio'
                ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm'
                : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'
                }`}
            >
              <p className="text-[10.5px] font-extrabold uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5" /> Host Studio
              </p>
            </div>

            {activeTab === 'host_studio' && (
              <div className="pl-4 space-y-1 animate-in slide-in-from-top-3 duration-250">
                <button
                  onClick={() => { setHostSubTab('quizzes'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${hostSubTab === 'quizzes' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                  <Star className="w-4 h-4" /> Manage Quizzes
                </button>
                <button
                  onClick={() => {
                    setHostSubTab('exams')
                    setExamView('manage')
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${hostSubTab === 'exams' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                  <Plus className="w-4 h-4" /> Create &amp; Manage Exams
                </button>
                <button
                  onClick={() => {
                    setHostSubTab('groups')
                    setGroupView('list')
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${hostSubTab === 'groups' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                  <Users className="w-4 h-4" /> Manage Group
                </button>
                <button
                  onClick={() => { setHostSubTab('members'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${hostSubTab === 'members' ? 'text-primary bg-primary/5 font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                  <UserCheck className="w-4 h-4" /> Members Directory
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
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-button text-sm ${activeTab === 'settings'
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
      <div className="flex-grow flex flex-col h-screen overflow-hidden w-full">
        {/* Top Header Navigation */}
        <header className="h-16 border-b border-outline-variant/10 bg-white flex justify-between items-center px-4 md:px-10 flex-shrink-0">
          {/* Header Left: Hamburger Toggle & Search */}
          <div className="flex items-center gap-3">
            {/* Hamburger (Mobile only) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-on-surface-variant hover:text-primary p-2 rounded-xl hover:bg-[#f9f9ff] transition-colors focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Input Bar */}
            <div className="relative w-40 sm:w-72 md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-full py-1.5 pl-10 pr-4 text-xs md:text-sm font-body-md placeholder:text-outline-variant shadow-sm transition-colors"
              />
            </div>
          </div>

          {/* Action Icons and Avatar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Help Button (AI Chat Trigger) */}
            <button
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className={`transition-colors p-2 rounded-full hover:bg-[#f9f9ff] ${isAiChatOpen ? 'text-primary bg-primary/5' : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications (Bell Dropdown on hover) */}
            <div className="relative group">
              <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-[#f9f9ff]">
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />

              {/* Notifications Dropdown (Hover) */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-outline-variant/20 rounded-2xl shadow-xl py-3 z-50 hidden group-hover:block animate-in fade-in duration-200">
                <div className="px-4 py-2 border-b border-outline-variant/10 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider text-on-surface">Notifications</span>
                  <span className="text-[10px] text-primary font-bold">3 new</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                  <div className="px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-on-surface">📝 Group 10A1 just completed the Midterm Biology exam.</p>
                    <span className="text-[10px] text-outline mt-1 block">10 minutes ago</span>
                  </div>
                  <div className="px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-on-surface">📅 Calculus III Quiz is scheduled for tomorrow.</p>
                    <span className="text-[10px] text-outline mt-1 block">2 hours ago</span>
                  </div>
                  <div className="px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-on-surface">🏆 You just unlocked the "Perfect Score" badge!</p>
                    <span className="text-[10px] text-outline mt-1 block">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-outline-variant/20 mx-1 sm:mx-2" />

            {/* Profile (Settings/Signout Dropdown on hover) */}
            <div className="relative group flex items-center gap-2">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  alt="Sarah Jenkins Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfaFPBDooRGLvDmcVP4_fNcfUexhBlWhogiWecBA007JUsD_KBoANvn5YElbqXehZRc657MDywN7u7bd-nBDgzNhmJgJ-jFAw7EENxs_7en60M9XkErKfqG_W_NkHA9i1cO8tohFTHYhoiLf0pZmPTPp1RWMCIOgeIa5SqE5fckTmYAJyHvXWDSJQwhXXpwisxYeJ9J9nHbo4tOTok45r_vWidt_edDFTqHAj6qKUjIHVRlamL6gzqG-0ELUzk7FaArbYm5ZqJyps"
                  className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-sm group-hover:scale-105 transition-transform"
                />
                <div className="hidden md:block text-left select-none">
                  <p className="text-sm font-bold text-on-surface leading-none">Sarah Jenkins</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">sarah.j@school.edu</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors hidden md:block" />
              </div>

              {/* Profile Dropdown Menu (Hover) */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-outline-variant/20 rounded-2xl shadow-xl py-2 z-50 hidden group-hover:block animate-in fade-in duration-200">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-on-surface hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </button>
                <hr className="border-outline-variant/10 my-1.5" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Sub-Views Area */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-10 bg-[#f9f9ff]">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

                  {/* Average Score */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">+3.2%</span>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold text-on-surface">88%</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">Average Score</p>
                  </div>

                  {/* Accuracy Rate */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#fcf4e6] flex items-center justify-center text-orange-600">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="bg-[#fcf4e6] text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">Stable</span>
                    </div>
                    <h3 className="font-headline-md text-3xl font-extrabold text-on-surface">91.5%</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">Accuracy Rate</p>
                  </div>

                  {/* Total Points (Featured Gradient Card) */}
                  <div className="bg-gradient-to-br from-primary to-[#7c3aed] rounded-2xl p-6 shadow-md flex flex-col relative overflow-hidden group text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full -ml-4 -mb-4" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Trophy className="w-6 h-6 text-white" />
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
                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                            onPaste={handlePaste}
                            placeholder="•"
                            className="w-10 h-12 text-center font-headline-md text-xl font-bold rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none bg-white shadow-sm transition-colors"
                            type="text"
                            inputMode="numeric"
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const enteredCode = code.join('')
                          if (enteredCode.length === 6) {
                            navigate('/lobby', {
                              state: { roomCode: enteredCode, nickname: 'Sarah Jenkins' }
                            })
                          }
                        }}
                        disabled={code.join('').length < 6}
                        className="w-full bg-secondary hover:bg-secondary/95 text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
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
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.type === 'Exam' ? 'bg-primary/10 text-primary' : act.type === 'Live Quiz' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                  }`}>
                                  {act.type === 'Exam' ? <ClipboardList className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                </div>
                                <span className="font-semibold text-sm text-on-surface">{act.name}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${act.type === 'Exam' ? 'bg-indigo-50 text-indigo-700' : act.type === 'Live Quiz' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
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

                {/* 3. Performance / Progress Tracking Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in duration-300">
                  {/* Line Chart Card */}
                  <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-headline-md text-lg font-bold text-on-surface">Score Trend</h3>
                        <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Performance across your recent exams.</p>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                        <span className="w-3.5 h-1.5 bg-gradient-to-r from-primary to-secondary inline-block rounded-full" /> Score
                      </span>
                    </div>

                    {/* SVG Line Chart */}
                    <div className="relative w-full flex-1 min-h-[220px]">
                      <svg className="w-full h-full" viewBox="0 0 520 240" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3525cd" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3525cd" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Grid Lines (range 60%-100%) */}
                        {[20, 70, 120, 170, 220].map((y, idx) => (
                          <g key={idx}>
                            <line x1="55" y1={y} x2="500" y2={y} stroke="#f1f1f8" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="45" y={y + 4} className="text-[10px] font-bold fill-outline/60" textAnchor="end">
                              {100 - idx * 10}%
                            </text>
                          </g>
                        ))}

                        {/* Area Fill Gradient under Curve */}
                        <path
                          d="M 55 150 C 130 150, 130 85, 157 85 C 185 85, 185 120, 212 120 C 240 120, 240 120, 268 120 C 296 120, 296 50, 323 50 C 350 50, 350 70, 378 70 C 405 70, 405 70, 433 70 C 460 70, 460 35, 488 35 L 488 220 L 55 220 Z"
                          fill="url(#chartAreaGradient)"
                        />

                        {/* Main Line Stroke (smooth curve) */}
                        <path
                          d="M 55 150 C 130 150, 130 85, 157 85 C 185 85, 185 120, 212 120 C 240 120, 240 120, 268 120 C 296 120, 296 50, 323 50 C 350 50, 350 70, 378 70 C 405 70, 405 70, 433 70 C 460 70, 460 35, 488 35"
                          fill="none"
                          stroke="url(#chartLineGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data Nodes & Interaction circles */}
                        {[
                          { x: 55, y: 150, score: 72, label: 'Attempt 1' },
                          { x: 157, y: 85, score: 85, label: 'Attempt 2' },
                          { x: 268, y: 120, score: 78, label: 'Attempt 3' },
                          { x: 323, y: 50, score: 92, label: 'Attempt 4' },
                          { x: 378, y: 70, score: 88, label: 'Attempt 5' },
                          { x: 488, y: 35, score: 95, label: 'Attempt 6' },
                        ].map((pt, idx) => (
                          <g key={idx} className="group/point cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="10"
                              className="fill-primary/20 opacity-0 group-hover/point:opacity-100 transition-opacity"
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              className="fill-white stroke-primary stroke-[2.5]"
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="20"
                              className="fill-transparent"
                            />

                            {/* Tooltip */}
                            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <rect
                                x={pt.x - 36}
                                y={pt.y - 32}
                                width="72"
                                height="22"
                                rx="6"
                                fill="#1e1b4b"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 17}
                                className="text-[9px] font-bold fill-white"
                                textAnchor="middle"
                              >
                                {pt.score}%
                              </text>
                            </g>

                            {/* X-Axis labels */}
                            <text
                              x={pt.x}
                              y="236"
                              className="text-[10px] font-bold fill-outline-variant/80"
                              textAnchor="middle"
                            >
                              {pt.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Chart Summary Meta */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-outline-variant/10 text-xs text-outline px-1">
                      <span className="flex items-center gap-1">
                        Trend: <strong className="text-secondary font-bold flex items-center gap-0.5">Up (+23%) <TrendingUp className="w-3.5 h-3.5 inline" /></strong>
                      </span>
                      <span>Latest: <strong className="text-primary font-bold">Exam 6 (95%)</strong></span>
                    </div>
                  </div>

                  {/* Pie Chart Card */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6 flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-headline-md text-lg font-bold text-on-surface">Score Distribution</h3>
                      <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Breakdown of results by score range.</p>
                    </div>

                    {/* Donut Pie Chart */}
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <svg viewBox="0 0 200 200" className="w-44 h-44">
                        <defs>
                          <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
                          </filter>
                        </defs>

                        {/* Excellent (>=90%): 2/6 = 33.3% -> 120deg. Start at -90 (top) */}
                        {/* Angle: 0 to 120 degrees */}
                        <circle
                          cx="100" cy="100" r="70"
                          fill="none"
                          stroke="#3525cd"
                          strokeWidth="28"
                          strokeDasharray="146.6 293.2"
                          strokeDashoffset="0"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-500"
                          filter="url(#donutShadow)"
                        />

                        {/* Good (80-89%): 2/6 = 33.3% -> 120deg. Start at 30deg (after first segment) */}
                        <circle
                          cx="100" cy="100" r="70"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="28"
                          strokeDasharray="146.6 293.2"
                          strokeDashoffset="-146.6"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-500"
                          filter="url(#donutShadow)"
                        />

                        {/* Average (<80%): 2/6 = 33.3% -> 120deg */}
                        <circle
                          cx="100" cy="100" r="70"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="28"
                          strokeDasharray="146.6 293.2"
                          strokeDashoffset="-293.2"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-500"
                          filter="url(#donutShadow)"
                        />

                        {/* Center text */}
                        <text x="100" y="94" textAnchor="middle" className="text-[22px] font-extrabold fill-on-surface" fontWeight="800">6</text>
                        <text x="100" y="112" textAnchor="middle" className="text-[9px] fill-on-surface-variant">exams</text>
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 space-y-2.5">
                      {[
                        { color: 'bg-primary', label: 'Excellent (≥90%)', count: 2, pct: '33%' },
                        { color: 'bg-[#10b981]', label: 'Good (80-89%)', count: 2, pct: '33%' },
                        { color: 'bg-amber-500', label: 'Fair (<80%)', count: 2, pct: '33%' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-on-surface-variant">{item.label}</span>
                          </span>
                          <span className="font-bold text-on-surface">{item.count} ({item.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
               {/* TAB: JOIN ROOM */}
            {activeTab === 'join_room' && (
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                {/* Left Card: Join Room */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-8 flex flex-col justify-between text-center min-h-[320px]">
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 shadow-sm mx-auto">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="font-headline-md text-lg font-bold text-on-surface mb-1">Join a Room</h2>
                    <p className="font-body-md text-xs text-on-surface-variant mb-6">Enter the 6-digit code from your instructor.</p>

                    <div className="flex justify-center gap-2 mb-6">
                      {code.map((num, i) => (
                        <input
                          key={i}
                          ref={(el) => (inputRefs.current[i] = el)}
                          value={num}
                          onChange={(e) => handleCodeChange(i, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(i, e)}
                          onPaste={handlePaste}
                          placeholder="0"
                          className="w-10 h-12 text-center font-headline-md text-xl font-bold rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none bg-white shadow-sm"
                          type="text"
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const enteredCode = code.join('')
                      if (enteredCode.length === 6) {
                        navigate('/lobby', {
                          state: { roomCode: enteredCode, nickname: 'Sarah Jenkins' }
                        })
                      }
                    }}
                    disabled={code.join('').length < 6}
                    className="w-full bg-secondary text-white font-button py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                  >
                    Join Session
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Card: Host a Session */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-8 flex flex-col justify-between min-h-[320px]">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-headline-md text-base font-bold text-on-surface">Host a Session</h2>
                        <p className="font-body-md text-xs text-on-surface-variant">Create a room for your members.</p>
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
                              className={`flex flex-col items-center gap-1.5 p-3.5 border rounded-xl transition-all ${selectedGameMode === mode
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
                    </div>
                  </div>

                  <button
                    onClick={() => setHostRoomModalOpen(true)}
                    className="w-full bg-primary text-white font-button py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm mt-6"
                  >
                    Create Room
                    <Plus className="w-4 h-4" />
                  </button>
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
                        <th className="py-4 px-8 font-bold text-xs text-outline uppercase tracking-wider">Exam Title</th>
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Subject</th>
                        <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Navigation Rule</th>
                        <th className="py-4 px-8 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {assignedExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-8">
                            <p className="font-semibold text-sm text-on-surface">{exam.title}</p>
                            <p className="text-xs text-on-surface-variant mt-1">Due: {exam.due}</p>
                          </td>
                          <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.subject}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-low text-on-surface-variant">
                              <Shield className="w-3.5 h-3.5 text-on-surface-variant" /> {exam.rule}
                            </span>
                          </td>
                          <td className="py-4 px-8 text-right">
                            <button
                              onClick={() => navigate('/exam', { state: { examTitle: exam.title, subject: exam.subject } })}
                              className="bg-primary hover:bg-primary-container text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-shadow active:scale-95 duration-100"
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
            {activeTab === 'history' && (() => {
              const totalPages = Math.ceil(mockHistory.length / ITEMS_PER_PAGE)
              const startIdx = (historyPage - 1) * ITEMS_PER_PAGE
              const pagedHistory = mockHistory.slice(startIdx, startIdx + ITEMS_PER_PAGE)

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">History</h2>
                    <p className="font-body-md text-on-surface-variant text-sm mt-1">Review your past performance.</p>
                  </div>

                  <div className="space-y-4">
                    {pagedHistory.map((hist) => (
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-on-surface-variant">
                        Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, mockHistory.length)} of {mockHistory.length}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setHistoryPage(i + 1)}
                            className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${historyPage === i + 1
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'text-on-surface-variant hover:bg-surface-container-low'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                          disabled={historyPage === totalPages}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* TAB: ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Achievements</h2>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">Badges and milestones you've earned.</p>
                </div>

                {activeTitle && (
                  <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                    <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-sm font-semibold text-primary">
                      Active title: <span className="font-extrabold">{activeTitle}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* Achievement 1 - Perfect Score */}
                  {(() => {
                    const title = 'Perfect Score'
                    const isActive = activeTitle === title
                    return (
                      <div
                        className={`bg-white rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group transition-all duration-200 ${
                          isActive
                            ? 'border-2 border-primary shadow-md ring-2 ring-primary/20'
                            : 'border border-outline-variant/10 hover:shadow-md hover:border-primary/30'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                            In Use
                          </span>
                        )}
                        <div className="w-16 h-16 mx-auto bg-[#fcf4e6] text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                          <Award className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-sm text-on-surface mb-1">{title}</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Achieved 100% on any proctored exam.</p>
                        <button
                          onClick={() => setActiveTitle(isActive ? null : title)}
                          className={`w-full text-xs font-bold py-2 px-4 rounded-lg transition-all duration-150 active:scale-95 ${
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                          }`}
                        >
                          {isActive ? '✓ Currently Active' : 'Use This Title'}
                        </button>
                      </div>
                    )
                  })()}

                  {/* Achievement 2 - On Fire */}
                  {(() => {
                    const title = 'On Fire'
                    const isActive = activeTitle === title
                    return (
                      <div
                        className={`bg-white rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group transition-all duration-200 ${
                          isActive
                            ? 'border-2 border-primary shadow-md ring-2 ring-primary/20'
                            : 'border border-outline-variant/10 hover:shadow-md hover:border-primary/30'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                            In Use
                          </span>
                        )}
                        <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                          <Flame className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-sm text-on-surface mb-1">{title}</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">5 consecutive days of learning activity.</p>
                        <button
                          onClick={() => setActiveTitle(isActive ? null : title)}
                          className={`w-full text-xs font-bold py-2 px-4 rounded-lg transition-all duration-150 active:scale-95 ${
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                          }`}
                        >
                          {isActive ? '✓ Currently Active' : 'Use This Title'}
                        </button>
                      </div>
                    )
                  })()}

                  {/* Achievement 3 - Speed Demon (Locked) */}
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-6 text-center shadow-sm opacity-50 grayscale relative">
                    <div className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-gray-400 text-white px-2 py-0.5 rounded-full">
                      Locked
                    </div>
                    <div className="w-16 h-16 mx-auto bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Speed Demon</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Finish an exam in half of the limit time.</p>
                    <button
                      disabled
                      className="w-full text-xs font-bold py-2 px-4 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Not Unlocked Yet
                    </button>
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
            {activeTab === 'host_studio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">Host Studio</h2>
                    <p className="font-body-md text-on-surface-variant text-sm mt-1">Manage content, group, and member performance.</p>
                  </div>
                </div>

                {/* Horizontal Navigation */}
                <div className="border-b border-outline-variant/10 mb-6">
                  <nav className="flex gap-6">
                    {(['quizzes', 'exams', 'groups', 'members'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setHostSubTab(tab)
                          if (tab === 'exams') setExamView('manage')
                          if (tab === 'groups') setGroupView('list')
                        }}
                        className={`pb-3.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${hostSubTab === tab
                          ? 'border-primary text-primary font-bold'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                          }`}
                      >
                        {tab === 'quizzes' && 'Manage Quizzes'}
                        {tab === 'exams' && 'Manage Exams'}
                        {tab === 'groups' && 'Manage Group'}
                        {tab === 'members' && 'Members'}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Sub Tab: Quizzes */}
                {hostSubTab === 'quizzes' && (
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
                      {hostQuizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white border border-outline-variant/10 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${quiz.status === 'PUBLISHED' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
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
                {hostSubTab === 'exams' && (
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
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Group</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Date</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {hostExams.map((exam) => (
                                <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                                  <td className="py-4 px-6 font-semibold text-sm text-on-surface">{exam.title}</td>
                                  <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.groupAssigned}</td>
                                  <td className="py-4 px-6 text-xs text-on-surface-variant">{exam.date}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${exam.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
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
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Assigned Group</label>
                              <select className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none">
                                <option>Select a group...</option>
                                <option>Group 10A1</option>
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
                        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Detailed analytics for Midterm Biology 101 will appear here once members start submitting.</p>
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
                {hostSubTab === 'groups' && (
                  <div className="space-y-6">
                    {groupView === 'list' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-end">
                          <button
                            onClick={() => alert('Creating class...')}
                            className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Create New Group
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {hostGroups.map((cls) => (
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
                                <p className="text-xs text-on-surface-variant mb-4">Subject: {cls.subject} • {cls.membersCount} Members</p>
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
                                      setSelectedGroup(cls.name)
                                      setGroupView('details')
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

                    {groupView === 'details' && (
                      <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setGroupView('list')}
                              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                              <h3 className="font-bold text-base text-on-surface">{selectedGroup}</h3>
                              <p className="text-xs text-on-surface-variant mt-0.5">Member Performance &amp; Roster</p>
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
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Member</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Email</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Score Profile</th>
                                <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {groupRoster.map((st) => (
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
                                      onClick={() => alert(`Viewing member profile: ${st.name}`)}
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

                {/* Sub Tab: Members Directory */}
                {hostSubTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base text-on-surface">Member Directory</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">Manage member enrollment and track performance across classes.</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setImportModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                        >
                          <Upload className="w-4 h-4" /> Import Member
                        </button>
                        <button
                          onClick={() => setMemberModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add New Member
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Member Name</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Email</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Group</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider">Performance</th>
                            <th className="py-4 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {groupRoster.map((st) => (
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
              <div className="p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Instructor Feedback</p>
                <p className="text-sm text-on-surface leading-relaxed">
                  {activeReviewItem.type === 'Exam'
                    ? 'Good effort overall, but there is room for improvement in the essay questions. I recommend reviewing Chapter 3 and completing additional practice exercises to strengthen your understanding.'
                    : activeReviewItem.type === 'Live Quiz'
                      ? 'Great participation during the live session. Your response time was impressive, though I suggest reading the questions more carefully before answering, especially on trickier items.'
                      : 'Excellent work! Your scores have shown significant improvement compared to previous attempts. Keep up the great momentum!'}
                </p>
              </div>
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

      {/* Modal: Add New Member */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-6">Add New Member</h3>
            <form onSubmit={(e) => { e.preventDefault(); setMemberModalOpen(false); }} className="space-y-4">
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
                  placeholder="member@school.edu"
                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-on-surface-variant">Assign Group</label>
                <select className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option>Group 10A1</option>
                  <option>English Intensive</option>
                  <option>Science 101</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Members CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full m-4 text-center border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">Import Members</h3>
            <p className="text-xs text-on-surface-variant mb-6">Upload a CSV or Excel file to bulk enroll members.</p>

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
                onClick={() => { setImportModalOpen(false); alert('Imported mock members data.'); }}
                className="px-6 py-2 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbox Floating Container */}
      {isAiChatOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[480px] bg-white border border-outline-variant/30 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Chatbox Header */}
          <div className="bg-gradient-to-r from-primary to-[#7c3aed] text-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-headline-md text-sm font-bold leading-tight">QuizzApp AI Agent</h4>
                <p className="text-[9px] text-indigo-100 mt-0.5">Always online to assist you</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiChatOpen(false)}
              className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm text-left ${msg.sender === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-white text-on-surface rounded-bl-none border border-outline-variant/10'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/10 flex gap-2 bg-white">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Ask AI about exams, scores..."
              className="flex-grow bg-slate-50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs font-body-md placeholder:text-outline-variant transition-colors"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-white px-4 py-2.5 rounded-xl transition-colors font-button text-xs font-bold active:scale-95 duration-100"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Modal: Create Room Configuration Setup */}
      {hostRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Room Customization</h3>
                  <p className="text-xs text-on-surface-variant">Configure settings before hosting your live session</p>
                </div>
              </div>
              <button
                onClick={() => setHostRoomModalOpen(false)}
                className="text-on-surface-variant hover:text-error p-1.5 hover:bg-surface-container-low rounded-lg transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                // Sinh mã phòng random 6 chữ số
                const generatedRoomCode = Math.floor(100000 + Math.random() * 900000).toString()
                setHostRoomModalOpen(false)
                
                // Điều hướng sang trang Lobby Waiting với vai trò là Host/Teacher
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
                      randomizeAnswers
                    }
                  }
                })
              }}
              className="space-y-5"
            >
              {/* Select Quiz */}
              <div>
                <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">Select Quiz</label>
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  {hostQuizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>{quiz.title} ({quiz.questions} Qs - {quiz.level})</option>
                  ))}
                </select>
              </div>

              {/* Assign to Group */}
              <div>
                <label className="block text-xs font-extrabold mb-1.5 uppercase tracking-wider text-on-surface-variant">Target Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="freedom">Freedom (Guest or members from other groups can join)</option>
                  {hostGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name} ({group.membersCount} members)</option>
                  ))}
                </select>
              </div>

              {/* Settings Panel: Progression & Leaderboard */}
              <div className="bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/10 space-y-4">
                {/* Progression Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Progression</span>
                    <span className="text-[10px] text-on-surface-variant">Manual vs Automatic rounds</span>
                  </div>
                  <div className="flex bg-outline-variant/20 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setProgressionMode('manual')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${progressionMode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgressionMode('auto')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${progressionMode === 'auto' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
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
                    type="button"
                    onClick={() => setLeaderboardToggle(!leaderboardToggle)}
                    className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${leaderboardToggle ? 'bg-secondary' : 'bg-outline-variant/40'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${leaderboardToggle ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Switches: AI-Generated Questions & Answer Order */}
              <div className="bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">AI-Generated Similar Questions</span>
                    <span className="text-[10px] text-on-surface-variant">Use AI to generate similar questions dynamically</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRandomizeQuestions(!randomizeQuestions)}
                    className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${randomizeQuestions ? 'bg-secondary' : 'bg-outline-variant/40'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${randomizeQuestions ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Randomize Answer Options</span>
                    <span className="text-[10px] text-on-surface-variant">Shuffle choice buttons values dynamically</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRandomizeAnswers(!randomizeAnswers)}
                    className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${randomizeAnswers ? 'bg-secondary' : 'bg-outline-variant/40'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${randomizeAnswers ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setHostRoomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-button text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                  Launch Room 🚀
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
