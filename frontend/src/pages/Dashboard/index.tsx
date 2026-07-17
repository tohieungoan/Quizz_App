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




// groupRoster moved to component state below

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  // States
  const [activeTab, setActiveTab] = useState<'overview' | 'join_room' | 'assigned_exams' | 'history' | 'achievements' | 'settings' | 'host_studio'>('overview')
  const [hostSubTab, setHostSubTab] = useState<'quizzes' | 'exams' | 'groups' | 'members'>('quizzes')
  const [examView, setExamView] = useState<'manage' | 'create' | 'report'>('manage')
  const [groupView, setGroupView] = useState<'list' | 'details' | 'create'>('list')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // History Tab States
  const [historySearch, setHistorySearch] = useState('')
  const [historyScoreFilter, setHistoryScoreFilter] = useState<'all' | 'high' | 'avg' | 'low'>('all')
  const [historySort, setHistorySort] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc')

  // Achievements
  const [activeTitle, setActiveTitle] = useState<string | null>('Perfect Score')

  // Modals
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<any>(null)

  // Group Roster (dynamic state)
  const [groupRoster, setGroupRoster] = useState([
    { id: 1, name: 'Alex Johnson', email: 'alex.j@member.edu', group: 'Group 10A1', scores: [85, 92, 78, 95, 88, 90, 82, 94] },
    { id: 2, name: 'Maria Garcia', email: 'm.garcia@member.edu', group: 'Group 10A1', scores: [70, 88, 82, 75] },
    { id: 3, name: 'Liam Smith', email: 'l.smith@member.edu', group: 'Group 10A1', scores: [95, 98, 92, 100, 96, 99, 97, 95, 100, 98] },
    { id: 4, name: 'John Doe', email: 'j.doe@member.edu', group: 'English Intensive', scores: [65, 72, 60, 68, 70, 58] },
    { id: 5, name: 'Emma Watson', email: 'e.watson@member.edu', group: 'English Intensive', scores: [90, 92] },
  ])

  // Add Member to Roster Modal States
  const [addRosterMemberOpen, setAddRosterMemberOpen] = useState(false)
  const [addMemberTab, setAddMemberTab] = useState<'select' | 'manual' | 'import'>('select')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [addMemberError, setAddMemberError] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [memberSearchInModal, setMemberSearchInModal] = useState('')
  const [importedFileMembers, setImportedFileMembers] = useState<{ name: string; email: string }[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importPreviewVisible, setImportPreviewVisible] = useState(false)

  const closeAddMemberModal = () => {
    setAddRosterMemberOpen(false)
    setAddMemberTab('select')
    setNewMemberName('')
    setNewMemberEmail('')
    setAddMemberError('')
    setSelectedMemberIds(new Set())
    setMemberSearchInModal('')
    setImportedFileMembers([])
    setImportFileName('')
    setImportPreviewVisible(false)
  }

  const handleAddRosterMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) { setAddMemberError('Name is required.'); return }
    if (!newMemberEmail.trim()) { setAddMemberError('Email is required.'); return }
    const newMember = {
      id: Date.now(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      group: selectedGroup || 'Unknown',
      scores: [],
    }
    setGroupRoster(prev => [...prev, newMember])
    setGroupsList(prev => prev.map(g =>
      g.name === selectedGroup ? { ...g, membersCount: g.membersCount + 1 } : g
    ))
    closeAddMemberModal()
  }

  const handleAddSelectedMembers = () => {
    const alreadyInGroup = new Set(groupRoster.filter(m => m.group === selectedGroup).map(m => m.id))
    const toAdd = groupRoster.filter(m => selectedMemberIds.has(m.id) && !alreadyInGroup.has(m.id))
    const newMembers = toAdd.map(m => ({ ...m, group: selectedGroup || 'Unknown' }))
    // Add new entries with new IDs for the group
    const withNewIds = newMembers.map(m => ({ ...m, id: Date.now() + Math.random() }))
    setGroupRoster(prev => [...prev, ...withNewIds])
    setGroupsList(prev => prev.map(g =>
      g.name === selectedGroup ? { ...g, membersCount: g.membersCount + withNewIds.length } : g
    ))
    closeAddMemberModal()
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      // Skip header row, parse name,email
      const parsed = lines.slice(1).map(line => {
        const cols = line.split(',')
        return { name: (cols[0] || '').trim().replace(/"/g, ''), email: (cols[1] || '').trim().replace(/"/g, '') }
      }).filter(r => r.name && r.email)
      setImportedFileMembers(parsed)
      setImportPreviewVisible(true)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmImport = () => {
    const newMembers = importedFileMembers.map((m, i) => ({
      id: Date.now() + i,
      name: m.name,
      email: m.email,
      group: selectedGroup || 'Unknown',
      scores: [],
    }))
    setGroupRoster(prev => [...prev, ...newMembers])
    setGroupsList(prev => prev.map(g =>
      g.name === selectedGroup ? { ...g, membersCount: g.membersCount + newMembers.length } : g
    ))
    closeAddMemberModal()
  }

  // Join Group States
  const [joinGroupCode, setJoinGroupCode] = useState('')
  const [joinGroupError, setJoinGroupError] = useState('')
  const [joinFoundGroup, setJoinFoundGroup] = useState<typeof groupsList[0] | null>(null)
  const [joinedGroupCodes, setJoinedGroupCodes] = useState<string[]>(['MTH10A', 'ENG2IM', 'HIS22A'])
  const [viewingGroupScores, setViewingGroupScores] = useState<string | null>(null)

  const getStudentScoresForGroup = (groupName: string) => {
    if (groupName === 'Group 10A1') {
      return [
        { title: 'Algebra I - Linear Equations', type: 'Quiz', score: 90, date: 'Oct 10, 2026' },
        { title: 'Cell Biology Basics', type: 'Practice', score: 85, date: 'Oct 12, 2026' },
        { title: 'Quadratic Equations Pop Quiz', type: 'Quiz', score: 95, date: 'Oct 08, 2026' },
      ]
    }
    if (groupName === 'English Intermediate') {
      return [
        { title: 'Grammar & Vocabulary Test', type: 'Exam', score: 92, date: 'Oct 14, 2026' },
        { title: 'Reading Comprehension Practice', type: 'Practice', score: 88, date: 'Oct 11, 2026' },
        { title: 'English Speaking Practice', type: 'Quiz', score: 96, date: 'Oct 05, 2026' },
      ]
    }
    if (groupName === 'Science 101') {
      return [
        { title: 'Physics Mechanics Quiz', type: 'Quiz', score: 78, date: 'Oct 15, 2026' },
        { title: 'Chemical Elements Test', type: 'Exam', score: 84, date: 'Oct 09, 2026' },
      ]
    }
    if (groupName === 'History Archive') {
      return [
        { title: 'World War II Overview', type: 'Exam', score: 72, date: 'Jan 15, 2026' },
        { title: 'Ancient Civilizations Quiz', type: 'Quiz', score: 80, date: 'Jan 10, 2026' },
      ]
    }
    return []
  }

  const handleJoinGroupCodeChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setJoinGroupCode(clean)
    setJoinGroupError('')
    if (clean.length === 6) {
      const found = groupsList.find(g => g.code === clean)
      setJoinFoundGroup(found || null)
      if (!found) setJoinGroupError('No group found with this code.')
    } else {
      setJoinFoundGroup(null)
    }
  }

  const handleJoinGroup = () => {
    if (!joinFoundGroup) return
    if (joinFoundGroup.status === 'Archived') { setJoinGroupError('This group is archived and not accepting new members.'); return }
    if (joinedGroupCodes.includes(joinFoundGroup.code)) { setJoinGroupError('You are already a member of this group.'); return }
    setJoinedGroupCodes(prev => [...prev, joinFoundGroup.code])
    setGroupRoster(prev => [...prev, {
      id: Date.now(),
      name: 'Sarah Jenkins',
      email: 'sarah.j@student.edu',
      group: joinFoundGroup.name,
      scores: [],
    }])
    setGroupsList(prev => prev.map(g => g.code === joinFoundGroup.code ? { ...g, membersCount: g.membersCount + 1 } : g))
    setJoinGroupCode('')
    setJoinFoundGroup(null)
    setJoinGroupError('')
  }

  const handleLeaveGroup = (gcode: string) => {
    const g = groupsList.find(x => x.code === gcode)
    if (!g) return
    setJoinedGroupCodes(prev => prev.filter(c => c !== gcode))
    setGroupRoster(prev => {
      // remove one entry of current user from this group
      const idx = prev.findIndex(m => m.group === g.name && m.email === 'sarah.j@student.edu')
      if (idx === -1) return prev
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })
    setGroupsList(prev => prev.map(x => x.code === gcode ? { ...x, membersCount: Math.max(0, x.membersCount - 1) } : x))
  }

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

  // Host Quizzes Subtab Filter States
  const [quizSearch, setQuizSearch] = useState('')
  const [quizFilterLevel, setQuizFilterLevel] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all')
  const [quizFilterStatus, setQuizFilterStatus] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [quizSort, setQuizSort] = useState<'title_asc' | 'title_desc' | 'questions_desc' | 'questions_asc'>('title_asc')

  const [quizzesList, setQuizzesList] = useState([
    { id: 1, title: 'Cell Biology Basics', subject: 'Science', level: 'Medium', questions: 15, status: 'PUBLISHED' },
    { id: 2, title: 'World War II Overview', subject: 'History', level: 'Hard', questions: 25, status: 'DRAFT' },
    { id: 3, title: 'Algebra I - Linear Equations', subject: 'Math', level: 'Easy', questions: 10, status: 'PUBLISHED' },
  ])

  // Host Exams Subtab Filter States
  const [examSearch, setExamSearch] = useState('')
  const [examFilterStatus, setExamFilterStatus] = useState<'all' | 'Active' | 'Scheduled'>('all')
  const [examSort, setExamSort] = useState<'title_asc' | 'title_desc' | 'date_desc' | 'date_asc'>('title_asc')

  // Host Group Subtab Filter States
  const [groupSearch, setGroupSearch] = useState('')
  const [groupSort, setGroupSort] = useState<'name_asc' | 'name_desc' | 'members_desc' | 'performance_desc'>('name_asc')

  // Members Directory Subtab Filter States
  const [memberSearch, setMemberSearch] = useState('')
  const [memberSort, setMemberSort] = useState<'name_asc' | 'name_desc' | 'performance_desc' | 'performance_asc'>('name_asc')
  const [memberFilterGroup, setMemberFilterGroup] = useState<string>('all')

  // Question Bank Modal State
  const [questionBankOpen, setQuestionBankOpen] = useState(false)
  const [questionBankSearch, setQuestionBankSearch] = useState('')
  const [questionBankCategory, setQuestionBankCategory] = useState<string>('All')
  const [questionBank, setQuestionBank] = useState([
    // HTML
    { id: 1, text: 'What is the purpose of Semantic HTML?', type: 'Multiple Choice', category: 'HTML', dateCreated: '2026-06-15' },
    { id: 6, text: 'What does the <meta charset="UTF-8"> tag do?', type: 'Multiple Choice', category: 'HTML', dateCreated: '2026-07-01' },
    { id: 7, text: 'Explain the difference between <div> and <section> tags.', type: 'Essay', category: 'HTML', dateCreated: '2026-07-03' },
    // React
    { id: 2, text: 'Explain the concept of Virtual DOM in React.', type: 'Essay', category: 'React', dateCreated: '2026-06-18' },
    { id: 8, text: 'What is the difference between useState and useEffect hooks?', type: 'Multiple Choice', category: 'React', dateCreated: '2026-07-05' },
    { id: 9, text: 'What is prop drilling and how can it be avoided?', type: 'Essay', category: 'React', dateCreated: '2026-07-08' },
    { id: 10, text: 'How does React reconciliation work?', type: 'Multiple Choice', category: 'React', dateCreated: '2026-07-10' },
    // CSS / Web Fundamentals
    { id: 3, text: 'Which CSS unit is relative to the font-size of the root element?', type: 'Multiple Choice', category: 'CSS / Web Fundamentals', dateCreated: '2026-06-20' },
    { id: 5, text: 'Describe how flex-grow property works in CSS Flexbox.', type: 'Essay', category: 'CSS / Web Fundamentals', dateCreated: '2026-06-25' },
    { id: 11, text: 'What is the CSS Box Model and how does box-sizing affect it?', type: 'Essay', category: 'CSS / Web Fundamentals', dateCreated: '2026-07-02' },
    { id: 12, text: 'What is the difference between position: absolute and position: fixed?', type: 'Multiple Choice', category: 'CSS / Web Fundamentals', dateCreated: '2026-07-06' },
    // Javascript Basics
    { id: 4, text: 'What is the difference between let and var in JS?', type: 'Multiple Choice', category: 'Javascript Basics', dateCreated: '2026-06-22' },
    { id: 13, text: 'Explain closures in JavaScript with an example.', type: 'Essay', category: 'Javascript Basics', dateCreated: '2026-06-28' },
    { id: 14, text: 'What is event bubbling and how does stopPropagation work?', type: 'Multiple Choice', category: 'Javascript Basics', dateCreated: '2026-07-04' },
    // TypeScript
    { id: 15, text: 'What is the difference between interface and type in TypeScript?', type: 'Multiple Choice', category: 'TypeScript', dateCreated: '2026-07-07' },
    { id: 16, text: 'How do Generics work in TypeScript? Provide an example.', type: 'Essay', category: 'TypeScript', dateCreated: '2026-07-09' },
    { id: 17, text: 'What is the purpose of the unknown type vs. any in TypeScript?', type: 'Multiple Choice', category: 'TypeScript', dateCreated: '2026-07-11' },
  ])

  // New Exam Form States
  const [examTitleInput, setExamTitleInput] = useState('')
  const [examDurationInput, setExamDurationInput] = useState('60')
  const [examSubjectInput, setExamSubjectInput] = useState('Biology 101')
  const [examGroupInput, setExamGroupInput] = useState('Group 10A1')
  const [examStartDateInput, setExamStartDateInput] = useState('')
  const [examEndDateInput, setExamEndDateInput] = useState('')
  const [newExamPublished, setNewExamPublished] = useState(false)

  // Move hostExams to state so it is dynamic
  const [examsList, setExamsList] = useState([
    { id: 1, title: 'Midterm Biology 101', groupAssigned: 'Group 10A1', date: 'Oct 25, 2026 09:00 AM', status: 'Active', published: true },
    { id: 2, title: 'Calculus III Quiz', groupAssigned: 'Eng. Int.', date: 'Oct 30, 2026 02:00 PM', status: 'Scheduled', published: false },
  ])

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Format date string for display
    const formattedDate = examStartDateInput
      ? new Date(examStartDateInput).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      : 'Oct 25, 2026'

    const newExam = {
      id: examsList.length + 1,
      title: examTitleInput || 'Unnamed Exam',
      groupAssigned: examGroupInput,
      date: formattedDate,
      status: newExamPublished ? 'Active' : 'Scheduled',
      published: newExamPublished
    }

    setExamsList(prev => [...prev, newExam])
    setExamView('manage')

    // Reset Form
    setExamTitleInput('')
    setExamDurationInput('60')
    setExamStartDateInput('')
    setExamEndDateInput('')
    setNewExamPublished(false)
  }

  // New Group Form States
  const [groupNameInput, setGroupNameInput] = useState('')
  const [groupDescriptionInput, setGroupDescriptionInput] = useState('')
  const [groupSubjectInput, setGroupSubjectInput] = useState('Mathematics')
  const [groupMaxMemberInput, setGroupMaxMemberInput] = useState('30')
  const [groupStatusInput, setGroupStatusInput] = useState<'Active' | 'Archived'>('Active')
  const [groupAvatarInput, setGroupAvatarInput] = useState('🎓')
  const [groupCodeInput, setGroupCodeInput] = useState('')

  // Helper: generate random 6-char join code
  const generateGroupCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // Move hostGroups to state so it is dynamic
  const [groupsList, setGroupsList] = useState([
    { id: 1, name: 'Group 10A1', description: 'Advanced Mathematics – Semester 1', subject: 'Mathematics', membersCount: 35, avgPerformance: 88, code: 'MTH10A', status: 'Active' as const, avatar: '📐', maxMember: 40, ownerId: 'sarah.j', createdAt: '2026-01-15', updatedAt: '2026-10-01' },
    { id: 2, name: 'English Intermediate', description: 'English speaking and writing practice', subject: 'Languages', membersCount: 20, avgPerformance: 92, code: 'ENG2IM', status: 'Active' as const, avatar: '🗣️', maxMember: 30, ownerId: 'sarah.j', createdAt: '2026-02-10', updatedAt: '2026-09-20' },
    { id: 3, name: 'Science 101', description: 'Introduction to Natural Sciences', subject: 'Science', membersCount: 28, avgPerformance: 85, code: 'SCI101', status: 'Active' as const, avatar: '🔬', maxMember: 35, ownerId: 'sarah.j', createdAt: '2026-03-05', updatedAt: '2026-09-15' },
    { id: 4, name: 'History Archive', description: 'World History – Previous Semester', subject: 'History', membersCount: 22, avgPerformance: 79, code: 'HIS22A', status: 'Archived' as const, avatar: '🏛️', maxMember: 25, ownerId: 'sarah.j', createdAt: '2025-09-01', updatedAt: '2026-01-30' },
  ])

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString().slice(0, 10)
    const newGroup = {
      id: groupsList.length + 1,
      name: groupNameInput || 'Unnamed Group',
      description: groupDescriptionInput,
      subject: groupSubjectInput,
      membersCount: 0,
      avgPerformance: 0,
      code: groupCodeInput || generateGroupCode(),
      status: groupStatusInput,
      avatar: groupAvatarInput,
      maxMember: Number(groupMaxMemberInput) || 30,
      ownerId: 'sarah.j',
      createdAt: now,
      updatedAt: now,
    }
    setGroupsList(prev => [...prev, newGroup])
    setGroupView('list')

    // Reset Form
    setGroupNameInput('')
    setGroupDescriptionInput('')
    setGroupSubjectInput('Mathematics')
    setGroupMaxMemberInput('30')
    setGroupStatusInput('Active')
    setGroupAvatarInput('🎓')
    setGroupCodeInput('')
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
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Card 1: Join a Room (Session) */}
                  <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-7 flex flex-col justify-between text-center min-h-[320px]">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 shadow-sm mx-auto">
                        <Zap className="w-7 h-7" />
                      </div>
                      <h2 className="font-bold text-base text-on-surface mb-1">Join a Room</h2>
                      <p className="text-xs text-on-surface-variant mb-5">Enter the 6-digit code from your instructor.</p>

                      <div className="flex justify-center gap-1.5 mb-4">
                        {code.map((num, i) => (
                          <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            value={num}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                            onPaste={handlePaste}
                            placeholder="0"
                            className="w-9 h-11 text-center font-bold text-lg rounded-xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none bg-white shadow-sm"
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
                          navigate('/lobby', { state: { roomCode: enteredCode, nickname: 'Sarah Jenkins' } })
                        }
                      }}
                      disabled={code.join('').length < 6}
                      className="w-full bg-secondary text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                    >
                      Join Session <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card 2: Join a Group */}
                  <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-7 flex flex-col justify-between text-center min-h-[320px] relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm mx-auto">
                        <Users className="w-7 h-7" />
                      </div>
                      <h2 className="font-bold text-base text-on-surface mb-1">Join a Group</h2>
                      <p className="text-xs text-on-surface-variant mb-5">Enter the 6-character group code to join.</p>

                      {/* Code input */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={joinGroupCode}
                          onChange={e => handleJoinGroupCodeChange(e.target.value)}
                          placeholder="e.g. MTH10A"
                          maxLength={6}
                          className={`w-full text-center font-mono font-extrabold text-xl tracking-[0.35em] py-3.5 px-4 rounded-xl border-2 outline-none transition-all uppercase bg-[#f9f9ff] ${
                            joinGroupError
                              ? 'border-error text-error'
                              : joinFoundGroup
                                ? 'border-secondary text-secondary'
                                : 'border-outline-variant/40 focus:border-primary text-on-surface'
                          }`}
                        />
                        {joinGroupCode.length > 0 && (
                          <button
                            onClick={() => { setJoinGroupCode(''); setJoinFoundGroup(null); setJoinGroupError('') }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                        )}
                      </div>

                      {joinGroupError && (
                        <p className="text-error text-xs font-bold mb-3">{joinGroupError}</p>
                      )}

                      {/* Group Preview Card */}
                      {joinFoundGroup && !joinGroupError && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-2 text-left">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{joinFoundGroup.avatar || '🎓'}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-on-surface truncate">{joinFoundGroup.name}</p>
                              <p className="text-[10px] text-on-surface-variant">{joinFoundGroup.subject} • {joinFoundGroup.membersCount}/{joinFoundGroup.maxMember} members</p>
                            </div>
                            <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                              joinFoundGroup.status === 'Active'
                                ? 'bg-secondary/10 text-secondary border-secondary/20'
                                : 'bg-outline/10 text-outline border-outline/20'
                            }`}>
                              {joinFoundGroup.status === 'Active' ? '🟢 Active' : '🔒 Archived'}
                            </span>
                          </div>
                          {joinFoundGroup.description && (
                            <p className="text-[10px] text-on-surface-variant mt-2 line-clamp-1">{joinFoundGroup.description}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleJoinGroup}
                      disabled={!joinFoundGroup || !!joinGroupError}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Users className="w-4 h-4" /> Join Group
                    </button>
                  </div>

                  {/* Card 3: Host a Session */}
                  <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-7 flex flex-col justify-between min-h-[320px]">
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="font-bold text-base text-on-surface">Host a Session</h2>
                          <p className="text-xs text-on-surface-variant">Create a room for your members.</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-3">Game Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['classic', 'fun', 'team'] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setSelectedGameMode(mode)}
                                className={`flex flex-col items-center gap-1.5 p-3 border rounded-xl transition-all ${selectedGameMode === mode
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                                  : 'border-outline-variant/30 hover:bg-surface-container-low text-on-surface-variant'
                                }`}
                              >
                                {mode === 'classic' && <Trophy className="w-4 h-4" />}
                                {mode === 'fun' && <Zap className="w-4 h-4" />}
                                {mode === 'team' && <Users className="w-4 h-4" />}
                                <span className="text-[10px] uppercase tracking-wide">{mode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setHostRoomModalOpen(true)}
                      className="w-full bg-primary text-white font-button py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm mt-6"
                    >
                      Create Room <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* My Groups Panel */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-on-surface">My Groups</p>
                        <p className="text-[10px] text-on-surface-variant">Groups you have joined</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {joinedGroupCodes.length} group{joinedGroupCodes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Empty state */}
                  {joinedGroupCodes.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-3">
                        <Users className="w-7 h-7 text-outline-variant" />
                      </div>
                      <p className="text-sm font-semibold text-on-surface-variant">You haven't joined any groups yet</p>
                      <p className="text-xs text-outline mt-1">Enter a group code above to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/10">
                      {joinedGroupCodes.map(gcode => {
                        const g = groupsList.find(x => x.code === gcode)
                        if (!g) return null
                        const fillPct = Math.round((g.membersCount / g.maxMember) * 100)
                        return (
                          <div
                            key={gcode}
                            onClick={() => setViewingGroupScores(g.name)}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 cursor-pointer transition-all group"
                            title="Click to view your grades in this group"
                          >
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                              {g.avatar || '🎓'}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">{g.name}</p>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                  g.status === 'Active'
                                    ? 'bg-secondary/10 text-secondary'
                                    : 'bg-outline/10 text-outline'
                                }`}>
                                  {g.status === 'Active' ? '🟢 Active' : '🔒 Archived'}
                                </span>
                              </div>
                              <p className="text-[10px] text-on-surface-variant mb-2">{g.subject} • Code: <span className="font-mono font-bold">{gcode}</span></p>

                              {/* Members progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                    style={{ width: `${fillPct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-on-surface-variant font-bold whitespace-nowrap">{g.membersCount}/{g.maxMember}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setViewingGroupScores(g.name)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
                              >
                                <Award className="w-3.5 h-3.5" /> View Grades
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`Leave "${g.name}"? You will need the group code to rejoin.`)) {
                                    handleLeaveGroup(gcode)
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-error border border-error/30 hover:bg-error/10 rounded-lg transition-all"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Leave
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
            {/* TAB: HISTORY */}
            {activeTab === 'history' && (() => {
              // 1. Filter history list
              const filtered = mockHistory.filter(hist => {
                const matchesSearch = hist.title.toLowerCase().includes(historySearch.toLowerCase())
                
                const numScore = parseInt(hist.score.replace('%', ''), 10)
                let matchesScore = true
                if (historyScoreFilter === 'high') matchesScore = numScore >= 90
                else if (historyScoreFilter === 'avg') matchesScore = numScore >= 70 && numScore < 90
                else if (historyScoreFilter === 'low') matchesScore = numScore < 70

                return matchesSearch && matchesScore
              })

              // 2. Sort history list
              const sorted = [...filtered].sort((a, b) => {
                const scoreA = parseInt(a.score.replace('%', ''), 10)
                const scoreB = parseInt(b.score.replace('%', ''), 10)
                const dateA = new Date(a.date).getTime()
                const dateB = new Date(b.date).getTime()

                if (historySort === 'score_desc') return scoreB - scoreA
                if (historySort === 'score_asc') return scoreA - scoreB
                if (historySort === 'date_asc') return dateA - dateB
                return dateB - dateA // default: date_desc
              })

              // 3. Paginate
              const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
              const currentPage = Math.min(historyPage, totalPages)
              const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
              const pagedHistory = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE)

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface text-left">History</h2>
                    <p className="font-body-md text-on-surface-variant text-sm mt-1 text-left">Review your past performance.</p>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80 flex items-center">
                      <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                      <input 
                        type="text"
                        value={historySearch}
                        onChange={(e) => {
                          setHistorySearch(e.target.value)
                          setHistoryPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none"
                        placeholder="Search exam name..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                      {/* Filter by score */}
                      <select
                        value={historyScoreFilter}
                        onChange={(e) => {
                          setHistoryScoreFilter(e.target.value as any)
                          setHistoryPage(1)
                        }}
                        className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                      >
                        <option value="all">All Scores</option>
                        <option value="high">High Performance (≥ 90%)</option>
                        <option value="avg">Average Performance (70% - 89%)</option>
                        <option value="low">Low Performance (&lt; 70%)</option>
                      </select>

                      {/* Sort dropdown */}
                      <select
                        value={historySort}
                        onChange={(e) => {
                          setHistorySort(e.target.value as any)
                          setHistoryPage(1)
                        }}
                        className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                      >
                        <option value="date_desc">Newest Date</option>
                        <option value="date_asc">Oldest Date</option>
                        <option value="score_desc">Highest Score</option>
                        <option value="score_asc">Lowest Score</option>
                      </select>
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="space-y-4">
                    {pagedHistory.length > 0 ? (
                      pagedHistory.map((hist) => (
                        <div key={hist.id} className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="text-left">
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
                      ))
                    ) : (
                      <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                        <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-sm text-on-surface">No history items found</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords.</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-on-surface-variant">
                        Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setHistoryPage(i + 1)}
                            className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${currentPage === i + 1
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'text-on-surface-variant hover:bg-surface-container-low'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
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
                        className={`bg-white rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group transition-all duration-200 ${isActive
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
                          className={`w-full text-xs font-bold py-2 px-4 rounded-lg transition-all duration-150 active:scale-95 ${isActive
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
                        className={`bg-white rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group transition-all duration-200 ${isActive
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
                          className={`w-full text-xs font-bold py-2 px-4 rounded-lg transition-all duration-150 active:scale-95 ${isActive
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
                {hostSubTab === 'quizzes' && (() => {
                  const filteredQuizzes = quizzesList.filter(quiz => {
                    const matchesSearch = quiz.title.toLowerCase().includes(quizSearch.toLowerCase()) || quiz.subject.toLowerCase().includes(quizSearch.toLowerCase())
                    const matchesLevel = quizFilterLevel === 'all' || quiz.level === quizFilterLevel
                    const matchesStatus = quizFilterStatus === 'all' || quiz.status === quizFilterStatus
                    return matchesSearch && matchesLevel && matchesStatus
                  })

                  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
                    if (quizSort === 'title_desc') return b.title.localeCompare(a.title)
                    if (quizSort === 'questions_desc') return b.questions - a.questions
                    if (quizSort === 'questions_asc') return a.questions - b.questions
                    return a.title.localeCompare(b.title)
                  })

                  return (
                    <div className="space-y-6 text-left">
                      <div className="flex justify-between items-center gap-3">
                        <h3 className="font-bold text-base text-on-surface">Manage Quizzes</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setQuestionBankOpen(true)}
                            className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 font-button py-2.5 px-6 rounded-xl transition-all text-xs flex items-center gap-1.5 font-bold"
                          >
                            <BookOpen className="w-4 h-4" /> Question Bank
                          </button>
                          <button
                            onClick={() => {
                              const title = prompt('Enter quiz title:')
                              if (!title) return
                              const subject = prompt('Enter subject:') || 'General'
                              const level = (prompt('Enter level (Easy, Medium, Hard):') || 'Medium') as any
                              const newQuiz = {
                                id: quizzesList.length + 1,
                                title,
                                subject,
                                level,
                                questions: 10,
                                status: 'DRAFT' as const
                              }
                              setQuizzesList(prev => [...prev, newQuiz])
                            }}
                            className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Create New Quiz
                          </button>
                        </div>
                      </div>

                      {/* Filter Toolbar */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
                        <div className="relative w-full sm:w-80 flex items-center">
                          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                          <input 
                            type="text"
                            value={quizSearch}
                            onChange={(e) => setQuizSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none text-on-surface"
                            placeholder="Search by title or subject..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                          <select
                            value={quizFilterLevel}
                            onChange={(e) => setQuizFilterLevel(e.target.value as any)}
                            className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                          >
                            <option value="all">All Levels</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>

                          <select
                            value={quizFilterStatus}
                            onChange={(e) => setQuizFilterStatus(e.target.value as any)}
                            className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                          >
                            <option value="all">All Status</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="DRAFT">Draft</option>
                          </select>

                          <select
                            value={quizSort}
                            onChange={(e) => setQuizSort(e.target.value as any)}
                            className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                          >
                            <option value="title_asc">Name: A to Z</option>
                            <option value="title_desc">Name: Z to A</option>
                            <option value="questions_desc">Questions: High to Low</option>
                            <option value="questions_asc">Questions: Low to High</option>
                          </select>
                        </div>
                      </div>

                      {/* Quizzes List */}
                      {sortedQuizzes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sortedQuizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white border border-outline-variant/10 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${quiz.status === 'PUBLISHED' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                                  }`}>
                                  {quiz.status}
                                </span>
                                <button 
                                  onClick={() => setQuizzesList(prev => prev.filter(q => q.id !== quiz.id))}
                                  className="text-on-surface-variant hover:text-error transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                      ) : (
                        <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                          <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-sm text-on-surface">No quizzes found</h4>
                          <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords.</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Sub Tab: Exams */}
                {hostSubTab === 'exams' && (
                  <div className="space-y-6">
                    {examView === 'manage' && (() => {
                      const filteredExams = examsList.filter(exam => {
                        const matchesSearch = exam.title.toLowerCase().includes(examSearch.toLowerCase()) || exam.groupAssigned.toLowerCase().includes(examSearch.toLowerCase())
                        let matchesStatus = true
                        if (examFilterStatus === 'Active') matchesStatus = exam.published
                        else if (examFilterStatus === 'Scheduled') matchesStatus = !exam.published
                        return matchesSearch && matchesStatus
                      })

                      const sortedExams = [...filteredExams].sort((a, b) => {
                        if (examSort === 'title_desc') return b.title.localeCompare(a.title)
                        if (examSort === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
                        if (examSort === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
                        return a.title.localeCompare(b.title) // default: title_asc
                      })

                      return (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center gap-3">
                            <h3 className="font-bold text-base text-on-surface">Exams Schedule</h3>
                            <div className="flex gap-3">
                              <button
                                onClick={() => alert('Exporting report...')}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                              >
                                <Upload className="w-4 h-4" /> Export Report
                              </button>
                              <button
                                onClick={() => setExamView('create')}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-button text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                              >
                                <Plus className="w-4 h-4" /> Create New
                              </button>
                            </div>
                          </div>

                          {/* Filter Toolbar */}
                          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                            {/* Search */}
                            <div className="relative w-full sm:w-80 flex items-center">
                              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                              <input 
                                type="text"
                                value={examSearch}
                                onChange={(e) => setExamSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none text-on-surface"
                                placeholder="Search by exam title or group..."
                              />
                            </div>

                            <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                              {/* Filter by status */}
                              <select
                                value={examFilterStatus}
                                onChange={(e) => setExamFilterStatus(e.target.value as any)}
                                className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                              >
                                <option value="all">All Exams</option>
                                <option value="Active">Published (Active)</option>
                                <option value="Scheduled">Draft (Scheduled)</option>
                              </select>

                              {/* Sort dropdown */}
                              <select
                                value={examSort}
                                onChange={(e) => setExamSort(e.target.value as any)}
                                className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                              >
                                <option value="title_asc">Title: A to Z</option>
                                <option value="title_desc">Title: Z to A</option>
                                <option value="date_desc">Date: Newest First</option>
                                <option value="date_asc">Date: Oldest First</option>
                              </select>
                            </div>
                          </div>

                          {sortedExams.length > 0 ? (
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
                                  {sortedExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                                      <td className="py-4 px-6 font-semibold text-sm text-on-surface">
                                        <div className="flex flex-col text-left">
                                          <span>{exam.title}</span>
                                          <span className={`text-[10px] font-bold mt-0.5 ${exam.published ? 'text-secondary' : 'text-outline'}`}>
                                            {exam.published ? '• Published' : '• Draft'}
                                          </span>
                                        </div>
                                      </td>
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
                                        <button
                                          onClick={() => setExamsList(prev => prev.filter(e => e.id !== exam.id))}
                                          className="text-on-surface-variant hover:text-error inline-block"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                              <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardList className="w-6 h-6" />
                              </div>
                              <h4 className="font-bold text-sm text-on-surface">No exams scheduled</h4>
                              <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords.</p>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {examView === 'create' && (
                      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-8 max-w-3xl mx-auto animate-in zoom-in-95 duration-200">
                        <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6 text-left">Create New Exam</h3>
                        <form onSubmit={handleCreateExamSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">Exam Title</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                placeholder="e.g. Semester 1 Final Exam"
                                type="text"
                                value={examTitleInput}
                                onChange={(e) => setExamTitleInput(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">Exam Duration (minutes)</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                placeholder="60"
                                type="number"
                                value={examDurationInput}
                                onChange={(e) => setExamDurationInput(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">Subject/Quiz Template</label>
                              <select
                                value={examSubjectInput}
                                onChange={(e) => setExamSubjectInput(e.target.value)}
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none text-left"
                              >
                                <option value="Biology 101">Biology 101</option>
                                <option value="Calculus III">Calculus III</option>
                                <option value="World History">World History</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">Assigned Group</label>
                              <select
                                value={examGroupInput}
                                onChange={(e) => setExamGroupInput(e.target.value)}
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none text-left"
                              >
                                <option value="Group 10A1">Group 10A1</option>
                                <option value="English Intensive">English Intensive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">Start Date &amp; Time</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                type="datetime-local"
                                value={examStartDateInput}
                                onChange={(e) => setExamStartDateInput(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2 text-left">End Date &amp; Time</label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                type="datetime-local"
                                value={examEndDateInput}
                                onChange={(e) => setExamEndDateInput(e.target.value)}
                                required
                              />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#f9f9ff] rounded-xl border border-outline-variant/20 mt-2">
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-on-surface">Publish Immediately</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">If enabled, members will see this exam on their dashboard immediately.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newExamPublished}
                                  onChange={(e) => setNewExamPublished(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-outline-variant/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
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
                    {groupView === 'list' && (() => {
                      const filteredGroups = groupsList.filter(group => 
                        group.name.toLowerCase().includes(groupSearch.toLowerCase()) || 
                        group.subject.toLowerCase().includes(groupSearch.toLowerCase())
                      )

                      const sortedGroups = [...filteredGroups].sort((a, b) => {
                        if (groupSort === 'name_desc') return b.name.localeCompare(a.name)
                        if (groupSort === 'members_desc') return b.membersCount - a.membersCount
                        if (groupSort === 'performance_desc') return b.avgPerformance - a.avgPerformance
                        return a.name.localeCompare(b.name)
                      })

                      return (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center gap-3">
                            <h3 className="font-bold text-base text-on-surface">Groups List</h3>
                            <button
                              onClick={() => setGroupView('create')}
                              className="bg-primary hover:bg-primary-container text-white font-button py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Create New Group
                            </button>
                          </div>

                          {/* Filter Toolbar */}
                          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                            {/* Search */}
                            <div className="relative w-full sm:w-80 flex items-center">
                              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                              <input 
                                type="text"
                                value={groupSearch}
                                onChange={(e) => setGroupSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none text-on-surface"
                                placeholder="Search group name or subject..."
                              />
                            </div>

                            <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                              {/* Sort dropdown */}
                              <select
                                value={groupSort}
                                onChange={(e) => setGroupSort(e.target.value as any)}
                                className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                              >
                                <option value="name_asc">Name: A to Z</option>
                                <option value="name_desc">Name: Z to A</option>
                                <option value="members_desc">Members: High to Low</option>
                                <option value="performance_desc">Performance: High to Low</option>
                              </select>
                            </div>
                          </div>

                          {sortedGroups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {sortedGroups.map((cls) => (
                                <div key={cls.id} className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[240px] ${
                                  cls.status === 'Archived' ? 'border-outline-variant/20 opacity-75' : 'border-outline-variant/10 hover:-translate-y-0.5'
                                }`}>
                                  <div>
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                                          {cls.avatar || '🎓'}
                                        </div>
                                        <div className="text-left">
                                          <h3 className="font-bold text-sm text-on-surface leading-tight">{cls.name}</h3>
                                          <p className="text-[10px] text-on-surface-variant mt-0.5">{cls.subject}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5 items-center">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                          cls.status === 'Active'
                                            ? 'bg-secondary/10 text-secondary border-secondary/20'
                                            : 'bg-outline/10 text-outline border-outline/20'
                                        }`}>
                                          {cls.status === 'Active' ? '🟢 Active' : '🔒 Archived'}
                                        </span>
                                        <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
                                        <button
                                          onClick={() => setGroupsList(prev => prev.filter(g => g.id !== cls.id))}
                                          className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-error/5"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Description */}
                                    {'description' in cls && cls.description && (
                                      <p className="text-[11px] text-on-surface-variant text-left mb-3 line-clamp-2">{cls.description}</p>
                                    )}

                                    {/* Meta row */}
                                    <div className="flex items-center gap-3 flex-wrap mb-3">
                                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                                        <Users className="w-3 h-3" />
                                        {cls.membersCount}{'maxMember' in cls ? `/${cls.maxMember}` : ''} members
                                      </span>
                                      {'code' in cls && cls.code && (
                                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-lg border border-primary/10">
                                          🔑 {cls.code}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Performance Bar */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-outline">Avg. Performance</span>
                                      <span className="text-secondary">{cls.avgPerformance}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500" style={{ width: `${cls.avgPerformance}%` }} />
                                    </div>
                                    <div className="pt-1.5 flex justify-between items-center">
                                      {'createdAt' in cls && (
                                        <span className="text-[9px] text-outline">Created {cls.createdAt}</span>
                                      )}
                                      <button
                                        onClick={() => {
                                          setSelectedGroup(cls.name)
                                          setGroupView('details')
                                        }}
                                        className="text-primary font-bold hover:underline text-xs ml-auto"
                                      >
                                        View Roster →
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                              <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building className="w-6 h-6" />
                              </div>
                              <h4 className="font-bold text-sm text-on-surface">No groups found</h4>
                              <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords.</p>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {groupView === 'create' && (
                      <div className="animate-in zoom-in-95 duration-200 max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <button
                            type="button"
                            onClick={() => setGroupView('list')}
                            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div>
                            <h3 className="font-bold text-lg text-on-surface text-left">Create New Group</h3>
                            <p className="text-xs text-on-surface-variant text-left">Fill in the details below to create a new study group</p>
                          </div>
                        </div>

                        <form onSubmit={handleCreateGroupSubmit} className="space-y-5">
                          {/* Avatar + Name row */}
                          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 space-y-5">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-outline/70 text-left">Basic Information</p>

                            {/* Avatar Emoji Picker */}
                            <div className="text-left">
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Group Avatar</label>
                              <div className="flex flex-wrap gap-2">
                                {['🎓', '📚', '🔬', '📐', '🗣️', '💻', '🎨', '🏛️', '⚗️', '🌍', '📊', '🧠'].map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setGroupAvatarInput(emoji)}
                                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                                      groupAvatarInput === emoji
                                        ? 'border-primary bg-primary/10 scale-110 shadow-sm'
                                        : 'border-transparent bg-[#f9f9ff] hover:border-outline-variant'
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Group Name */}
                            <div className="text-left">
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Group Name <span className="text-error">*</span></label>
                              <input
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                placeholder="e.g. CS Class K21, English Advanced, Math Group A..."
                                type="text"
                                value={groupNameInput}
                                onChange={(e) => setGroupNameInput(e.target.value)}
                                required
                              />
                            </div>

                            {/* Description */}
                            <div className="text-left">
                              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Description</label>
                              <textarea
                                className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none resize-none"
                                placeholder="A short description about this group..."
                                rows={3}
                                value={groupDescriptionInput}
                                onChange={(e) => setGroupDescriptionInput(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Settings */}
                          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 space-y-5">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-outline/70 text-left">Group Settings</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              {/* Subject */}
                              <div className="text-left">
                                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Subject / Category <span className="text-error">*</span></label>
                                <select
                                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                  value={groupSubjectInput}
                                  onChange={(e) => setGroupSubjectInput(e.target.value)}
                                  required
                                >
                                  <option value="Mathematics">Mathematics</option>
                                  <option value="Science">Science</option>
                                  <option value="Languages">Languages</option>
                                  <option value="History">History</option>
                                  <option value="Computer Science">Computer Science</option>
                                  <option value="Art">Art</option>
                                  <option value="Physics">Physics</option>
                                  <option value="Chemistry">Chemistry</option>
                                  <option value="Biology">Biology</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              {/* Max Members */}
                              <div className="text-left">
                                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Max Members <span className="text-error">*</span></label>
                                <input
                                  className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none"
                                  placeholder="30"
                                  type="number"
                                  min="1"
                                  max="500"
                                  value={groupMaxMemberInput}
                                  onChange={(e) => setGroupMaxMemberInput(e.target.value)}
                                  required
                                />
                              </div>

                              {/* Status */}
                              <div className="text-left">
                                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Status</label>
                                <div className="flex gap-3">
                                  {(['Active', 'Archived'] as const).map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setGroupStatusInput(s)}
                                      className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                        groupStatusInput === s
                                          ? s === 'Active'
                                            ? 'border-secondary bg-secondary/10 text-secondary'
                                            : 'border-outline bg-outline/10 text-outline'
                                          : 'border-outline-variant/30 bg-[#f9f9ff] text-on-surface-variant hover:border-outline-variant'
                                      }`}
                                    >
                                      {s === 'Active' ? '🟢 Active' : '🔒 Archived'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Join Code */}
                              <div className="text-left">
                                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Join Code</label>
                                <div className="flex gap-2">
                                  <input
                                    className="flex-1 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2.5 font-body-md text-sm outline-none font-mono tracking-widest uppercase"
                                    placeholder="Auto-generate"
                                    type="text"
                                    maxLength={6}
                                    value={groupCodeInput}
                                    onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setGroupCodeInput(generateGroupCode())}
                                    className="px-3 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors text-xs font-bold whitespace-nowrap flex items-center gap-1"
                                    title="Generate random code"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-on-surface-variant mt-1">Leave blank to auto-generate. Members use this code to join the group.</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setGroupView('list')
                                setGroupNameInput('')
                                setGroupDescriptionInput('')
                                setGroupSubjectInput('Mathematics')
                                setGroupMaxMemberInput('30')
                                setGroupStatusInput('Active')
                                setGroupAvatarInput('🎓')
                                setGroupCodeInput('')
                              }}
                              className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-primary hover:bg-primary/90 text-white font-button py-2.5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Create Group
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {groupView === 'details' && (() => {
                      const rosterForGroup = groupRoster.filter(m => m.group === selectedGroup)
                      const currentGroupData = groupsList.find(g => g.name === selectedGroup)
                      return (
                        <div className="space-y-6 animate-in zoom-in-95 duration-200">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setGroupView('list')}
                                className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                              >
                                <ArrowLeft className="w-5 h-5" />
                              </button>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
                                  {currentGroupData?.avatar || '🎓'}
                                </div>
                                <div>
                                  <h3 className="font-bold text-base text-on-surface">{selectedGroup}</h3>
                                  <p className="text-xs text-on-surface-variant mt-0.5">
                                    {rosterForGroup.length}{currentGroupData?.maxMember ? `/${currentGroupData.maxMember}` : ''} members
                                    {currentGroupData?.code && <span className="ml-2 font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">🔑 {currentGroupData.code}</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => alert('Exporting grades...')}
                                className="bg-surface-container-low text-on-surface-variant font-button py-2 px-4 rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-1.5 text-xs font-bold border border-outline-variant/20"
                              >
                                <Upload className="w-4 h-4 rotate-180" /> Export Grades
                              </button>
                              <button
                                onClick={() => { setAddRosterMemberOpen(true); setAddMemberError('') }}
                                className="bg-primary hover:bg-primary/90 text-white font-button py-2 px-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5 text-xs font-bold"
                              >
                                <Plus className="w-4 h-4" /> Add Member
                              </button>
                            </div>
                          </div>

                          {/* Stats bar */}
                          {rosterForGroup.length > 0 && (() => {
                            const allScores = rosterForGroup.flatMap(m => m.scores)
                            const avg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
                            const topPerformer = [...rosterForGroup].sort((a, b) => {
                              const avgA = a.scores.length > 0 ? a.scores.reduce((x, y) => x + y, 0) / a.scores.length : 0
                              const avgB = b.scores.length > 0 ? b.scores.reduce((x, y) => x + y, 0) / b.scores.length : 0
                              return avgB - avgA
                            })[0]
                            return (
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-2xl border border-outline-variant/10 p-4 text-left shadow-sm">
                                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Members</p>
                                  <p className="text-2xl font-extrabold text-on-surface mt-1">{rosterForGroup.length}</p>
                                  {currentGroupData?.maxMember && <p className="text-[10px] text-on-surface-variant">of {currentGroupData.maxMember} max</p>}
                                </div>
                                <div className="bg-white rounded-2xl border border-outline-variant/10 p-4 text-left shadow-sm">
                                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Avg. Score</p>
                                  <p className={`text-2xl font-extrabold mt-1 ${avg >= 85 ? 'text-secondary' : avg >= 70 ? 'text-primary' : 'text-error'}`}>{avg}%</p>
                                  <p className="text-[10px] text-on-surface-variant">across all quizzes</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-outline-variant/10 p-4 text-left shadow-sm">
                                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Top Performer</p>
                                  <p className="text-sm font-extrabold text-on-surface mt-1 truncate">{topPerformer?.name || '—'}</p>
                                  <p className="text-[10px] text-on-surface-variant">
                                    {topPerformer?.scores.length > 0
                                      ? `${Math.round(topPerformer.scores.reduce((a, b) => a + b, 0) / topPerformer.scores.length)}% avg`
                                      : 'No scores yet'}
                                  </p>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Roster Table */}
                          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
                              <h4 className="font-bold text-sm text-on-surface">Member Roster</h4>
                              <span className="text-xs text-on-surface-variant">{rosterForGroup.length} members</span>
                            </div>
                            {rosterForGroup.length === 0 ? (
                              <div className="py-16 text-center">
                                <Users className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                                <h4 className="font-bold text-sm text-on-surface">No members yet</h4>
                                <p className="text-xs text-on-surface-variant mt-1 mb-4">Add members to get started.</p>
                                <button
                                  onClick={() => { setAddRosterMemberOpen(true); setAddMemberError('') }}
                                  className="bg-primary text-white font-button text-xs py-2 px-6 rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" /> Add First Member
                                </button>
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                                    <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Member</th>
                                    <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Email</th>
                                    <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider">Score Profile</th>
                                    <th className="py-3.5 px-6 font-bold text-xs text-outline uppercase tracking-wider text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                  {rosterForGroup.map((st) => (
                                    <tr key={st.id} className="hover:bg-primary/5 transition-colors group">
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                                            {st.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                          </div>
                                          <span className="font-semibold text-sm text-on-surface">{st.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-xs text-on-surface-variant">{st.email}</td>
                                      <td className="py-4 px-6">
                                        {st.scores.length === 0 ? (
                                          <span className="text-xs text-outline italic">No scores yet</span>
                                        ) : (() => {
                                          const avgScore = Math.round(st.scores.reduce((sum, val) => sum + val, 0) / st.scores.length)
                                          return (
                                            <div className="flex flex-col gap-1.5 text-left">
                                              <div className="flex items-center gap-3">
                                                <span className={`text-sm font-extrabold ${avgScore >= 85 ? 'text-secondary' : avgScore >= 70 ? 'text-primary' : 'text-error'}`}>
                                                  {avgScore}% Avg
                                                </span>
                                                <div className="flex gap-1 items-center">
                                                  {st.scores.slice(0, 4).map((score, sIdx) => (
                                                    <span
                                                      key={sIdx}
                                                      className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface-variant border border-outline-variant/25"
                                                      title={`Quiz ${sIdx + 1}: ${score}%`}
                                                    >
                                                      {score}
                                                    </span>
                                                  ))}
                                                  {st.scores.length > 4 && (
                                                    <span
                                                      className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-extrabold text-primary border border-primary/20 cursor-help"
                                                      title={st.scores.slice(4).map((s, idx) => `Quiz ${5 + idx}: ${s}%`).join('\n')}
                                                    >
                                                      +{st.scores.length - 4}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="w-44 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full rounded-full ${avgScore >= 85 ? 'bg-secondary' : avgScore >= 70 ? 'bg-primary' : 'bg-error'}`}
                                                  style={{ width: `${avgScore}%` }}
                                                />
                                              </div>
                                            </div>
                                          )
                                        })()}
                                      </td>
                                      <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                          <button
                                            onClick={() => alert(`Viewing profile: ${st.name}`)}
                                            className="text-primary font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            View Profile
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm(`Remove ${st.name} from this group?`)) {
                                                setGroupRoster(prev => prev.filter(m => m.id !== st.id))
                                                setGroupsList(prev => prev.map(g =>
                                                  g.name === selectedGroup ? { ...g, membersCount: Math.max(0, g.membersCount - 1) } : g
                                                ))
                                              }
                                            }}
                                            className="text-error font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Sub Tab: Members Directory */}
                {hostSubTab === 'members' && (() => {
                  const filteredMembers = groupRoster.filter(st => {
                    const matchesSearch = st.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                          st.email.toLowerCase().includes(memberSearch.toLowerCase())
                    const matchesGroup = memberFilterGroup === 'all' || st.group === memberFilterGroup
                    return matchesSearch && matchesGroup
                  })

                  const sortedMembers = [...filteredMembers].sort((a, b) => {
                    const avgA = Math.round(a.scores.reduce((sum, val) => sum + val, 0) / a.scores.length)
                    const avgB = Math.round(b.scores.reduce((sum, val) => sum + val, 0) / b.scores.length)

                    if (memberSort === 'name_desc') return b.name.localeCompare(a.name)
                    if (memberSort === 'performance_desc') return avgB - avgA
                    if (memberSort === 'performance_asc') return avgA - avgB
                    return a.name.localeCompare(b.name)
                  })

                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center gap-3">
                        <div className="text-left">
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

                      {/* Filter Toolbar */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                        {/* Search */}
                        <div className="relative w-full sm:w-80 flex items-center">
                          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                          <input 
                            type="text"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none text-on-surface"
                            placeholder="Search by name or email..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                          {/* Filter by class/group */}
                          <select
                            value={memberFilterGroup}
                            onChange={(e) => setMemberFilterGroup(e.target.value)}
                            className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                          >
                            <option value="all">All Groups</option>
                            <option value="Group 10A1">Group 10A1</option>
                            <option value="English Intensive">English Intensive</option>
                          </select>

                          {/* Sort dropdown */}
                          <select
                            value={memberSort}
                            onChange={(e) => setMemberSort(e.target.value as any)}
                            className="bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-on-surface"
                          >
                            <option value="name_asc">Name: A to Z</option>
                            <option value="name_desc">Name: Z to A</option>
                            <option value="performance_desc">Performance: High to Low</option>
                            <option value="performance_asc">Performance: Low to High</option>
                          </select>
                        </div>
                      </div>

                      {sortedMembers.length > 0 ? (
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
                              {sortedMembers.map((st) => {
                                const avgScore = Math.round(st.scores.reduce((sum, val) => sum + val, 0) / st.scores.length)
                                return (
                                  <tr key={st.id} className="hover:bg-primary/5 transition-colors">
                                    <td className="py-4 px-6 font-semibold text-sm text-on-surface">{st.name}</td>
                                    <td className="py-4 px-6 text-xs text-on-surface-variant">{st.email}</td>
                                    <td className="py-4 px-6">
                                      <span className="px-2 py-1 bg-outline-variant/20 rounded text-[10px] font-bold text-on-surface-variant">{st.group}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-grow h-1.5 bg-outline-variant/20 rounded-full overflow-hidden max-w-[120px]">
                                          <div 
                                            className={`h-full rounded-full ${avgScore >= 85 ? 'bg-secondary' : avgScore >= 70 ? 'bg-primary' : 'bg-error'}`} 
                                            style={{ width: `${avgScore}%` }} 
                                          />
                                        </div>
                                        <span className={`text-xs font-bold ${avgScore >= 85 ? 'text-secondary' : avgScore >= 70 ? 'text-primary' : 'text-error'}`}>{avgScore}%</span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6 text-right space-x-3">
                                      <button className="text-on-surface-variant hover:text-primary inline-block"><Edit className="w-4 h-4" /></button>
                                      <button className="text-on-surface-variant hover:text-error inline-block"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                          <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-sm text-on-surface">No members found</h4>
                          <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or search keywords.</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
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

      {/* Modal: Add Member to Roster */}
      {addRosterMemberOpen && (() => {
        const availableMembers = groupRoster.filter(m => m.group !== selectedGroup)
        const filteredAvailable = availableMembers.filter(m =>
          m.name.toLowerCase().includes(memberSearchInModal.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearchInModal.toLowerCase())
        )
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden">

              {/* Header */}
              <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-outline-variant/10 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Add Member
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Adding to <span className="font-bold text-primary">{selectedGroup}</span>
                  </p>
                </div>
                <button onClick={closeAddMemberModal} className="text-on-surface-variant hover:text-error p-1.5 hover:bg-surface-container-low rounded-lg transition-all">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-outline-variant/10 flex-shrink-0 px-7">
                {([
                  { key: 'select' as const, label: '👥 Select Members' },
                  { key: 'manual' as const, label: '✏️ Manual Entry' },
                  { key: 'import' as const, label: '📂 Import File' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setAddMemberTab(tab.key)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      addMemberTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto px-7 py-5">

                {/* TAB 1: Select from Members Directory */}
                {addMemberTab === 'select' && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">Select existing members from your directory to add to this group.</p>

                    <div className="relative">
                      <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={memberSearchInModal}
                        onChange={e => setMemberSearchInModal(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none"
                      />
                    </div>

                    {filteredAvailable.length > 0 && (
                      <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filteredAvailable.length > 0 && filteredAvailable.every(m => selectedMemberIds.has(m.id))}
                            onChange={e => {
                              const newSet = new Set(selectedMemberIds)
                              filteredAvailable.forEach(m => e.target.checked ? newSet.add(m.id) : newSet.delete(m.id))
                              setSelectedMemberIds(newSet)
                            }}
                            className="w-4 h-4 rounded accent-primary"
                          />
                          <span className="text-xs font-bold text-on-surface-variant">Select all ({filteredAvailable.length})</span>
                        </label>
                        {selectedMemberIds.size > 0 && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedMemberIds.size} selected</span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {filteredAvailable.length === 0 ? (
                        <div className="py-10 text-center">
                          <Users className="w-8 h-8 text-outline-variant mx-auto mb-2" />
                          <p className="text-xs text-on-surface-variant">
                            {availableMembers.length === 0 ? 'No other members in directory.' : 'No members match your search.'}
                          </p>
                        </div>
                      ) : filteredAvailable.map(m => {
                        const isSelected = selectedMemberIds.has(m.id)
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-[#f9f9ff] hover:border-outline-variant'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const newSet = new Set(selectedMemberIds)
                                e.target.checked ? newSet.add(m.id) : newSet.delete(m.id)
                                setSelectedMemberIds(newSet)
                              }}
                              className="w-4 h-4 rounded accent-primary flex-shrink-0"
                            />
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                              {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">{m.name}</p>
                              <p className="text-[10px] text-on-surface-variant truncate">{m.email}</p>
                            </div>
                            <span className="ml-auto text-[9px] font-bold text-outline bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/20 flex-shrink-0 truncate max-w-[80px]">{m.group}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Manual Entry */}
                {addMemberTab === 'manual' && (
                  <form id="manualAddForm" onSubmit={handleAddRosterMember} className="space-y-4">
                    <p className="text-xs text-on-surface-variant">Manually enter a new member's details.</p>
                    <div className="text-left">
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Full Name <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={e => { setNewMemberName(e.target.value); setAddMemberError('') }}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-3 text-sm outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Email Address <span className="text-error">*</span></label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={e => { setNewMemberEmail(e.target.value); setAddMemberError('') }}
                        placeholder="e.g. alex.j@school.edu"
                        className="w-full bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    {addMemberError && (
                      <div className="px-4 py-2.5 bg-error/10 border border-error/20 rounded-xl">
                        <span className="text-error text-xs font-bold">{addMemberError}</span>
                      </div>
                    )}
                  </form>
                )}

                {/* TAB 3: Import from File */}
                {addMemberTab === 'import' && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Upload a <span className="font-bold">.csv</span> file with columns: <span className="font-mono bg-surface-container-low px-1.5 py-0.5 rounded text-[11px]">name, email</span>
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        const csv = 'name,email\nAlex Johnson,alex.j@school.edu\nMaria Garcia,m.garcia@school.edu'
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = 'member_import_template.csv'; a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-180" /> Download CSV template
                    </button>

                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl p-8 cursor-pointer transition-all bg-[#f9f9ff] hover:bg-primary/5 group">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-on-surface">Click to upload CSV</p>
                        <p className="text-xs text-on-surface-variant mt-1">Supports .csv and .txt files</p>
                      </div>
                      {importFileName && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">📄 {importFileName}</span>
                      )}
                      <input type="file" accept=".csv,.txt" onChange={handleImportFile} className="hidden" />
                    </label>

                    {importPreviewVisible && importedFileMembers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-on-surface">{importedFileMembers.length} member{importedFileMembers.length !== 1 ? 's' : ''} found in file</p>
                          <button
                            type="button"
                            onClick={() => { setImportedFileMembers([]); setImportFileName(''); setImportPreviewVisible(false) }}
                            className="text-xs text-error hover:underline font-bold"
                          >Clear</button>
                        </div>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low/50 sticky top-0">
                              <tr>
                                <th className="py-2 px-3 text-[10px] font-bold text-outline uppercase tracking-wider">Name</th>
                                <th className="py-2 px-3 text-[10px] font-bold text-outline uppercase tracking-wider">Email</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {importedFileMembers.map((m, i) => (
                                <tr key={i} className="hover:bg-primary/5">
                                  <td className="py-2 px-3 text-xs font-semibold text-on-surface">{m.name}</td>
                                  <td className="py-2 px-3 text-xs text-on-surface-variant">{m.email}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {importPreviewVisible && importedFileMembers.length === 0 && (
                      <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-center">
                        <p className="text-xs font-bold text-error">No valid rows found. Make sure the file has columns: name, email</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-7 py-4 border-t border-outline-variant/10 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeAddMemberModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-button text-xs hover:bg-surface-container-low transition-colors font-bold"
                >
                  Cancel
                </button>

                {addMemberTab === 'select' && (
                  <button
                    type="button"
                    onClick={handleAddSelectedMembers}
                    disabled={selectedMemberIds.size === 0}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-button py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add {selectedMemberIds.size > 0 ? `${selectedMemberIds.size} ` : ''}Member{selectedMemberIds.size !== 1 ? 's' : ''}
                  </button>
                )}
                {addMemberTab === 'manual' && (
                  <button
                    type="submit"
                    form="manualAddForm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-button py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                )}
                {addMemberTab === 'import' && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importedFileMembers.length === 0}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-button py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import {importedFileMembers.length > 0 ? `${importedFileMembers.length} ` : ''}Member{importedFileMembers.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal: View Student Grades for Group */}
      {viewingGroupScores && (() => {
        const groupName = viewingGroupScores
        const scores = getStudentScoresForGroup(groupName)
        const avg = scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
          : null
        const passedCount = scores.filter(s => s.score >= 50).length

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-outline-variant/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                    {groupsList.find(g => g.name === groupName)?.avatar || '🎓'}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-base text-on-surface">My Grades</h3>
                    <p className="text-xs text-on-surface-variant">Class: <span className="font-bold text-primary">{groupName}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingGroupScores(null)}
                  className="text-on-surface-variant hover:text-error p-1.5 hover:bg-surface-container-low rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-7 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Average Score</p>
                    <p className="text-xl font-black text-primary">{avg !== null ? `${avg}%` : '--'}</p>
                  </div>
                  <div className="bg-secondary/5 border border-secondary/10 p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-xl font-black text-secondary">{scores.length}</p>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Status</p>
                    <p className="text-xl font-black text-green-600">{scores.length > 0 ? (avg && avg >= 70 ? 'Passed' : 'Active') : 'No Data'}</p>
                  </div>
                </div>

                {/* Score List */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-surface uppercase tracking-wider text-left">Completed Activities</p>
                  
                  {scores.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-outline-variant/30 rounded-2xl bg-[#f9f9ff]">
                      <Award className="w-8 h-8 text-outline-variant mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-on-surface-variant font-semibold">No scores available yet</p>
                      <p className="text-[10px] text-outline mt-1">Scores will appear once you complete quizzes or exams assigned to this group.</p>
                    </div>
                  ) : (
                    <div className="border border-outline-variant/10 rounded-xl overflow-hidden divide-y divide-outline-variant/10">
                      {scores.map((item, index) => {
                        const isHigh = item.score >= 90
                        const isMid = item.score >= 70 && item.score < 90
                        return (
                          <div key={index} className="flex items-center justify-between p-3.5 hover:bg-[#f9f9ff] transition-colors">
                            <div className="text-left min-w-0 pr-3">
                              <p className="text-xs font-bold text-on-surface truncate">{item.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-outline bg-surface-container-low px-1.5 py-0.5 rounded border border-outline-variant/10">{item.type}</span>
                                <span className="text-[10px] text-on-surface-variant">{item.date}</span>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0 text-right">
                              <span className={`inline-block font-mono text-sm font-extrabold px-2.5 py-1 rounded-lg border ${
                                isHigh
                                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                  : isMid
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-error/10 text-error border-error/20'
                              }`}>
                                {item.score}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-7 py-4 border-t border-outline-variant/10 flex-shrink-0 bg-white flex justify-end">
                <button
                  onClick={() => setViewingGroupScores(null)}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-button text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* Modal: Question Bank */}
      {questionBankOpen && (() => {
        // Lấy danh sách category duy nhất
        const allCategories = Array.from(new Set(questionBank.map(q => q.category)))

        // Filter theo category và search
        const filteredQuestions = questionBank.filter(q => {
          const matchesCategory = questionBankCategory === 'All' || q.category === questionBankCategory
          const matchesSearch = q.text.toLowerCase().includes(questionBankSearch.toLowerCase()) ||
            q.category.toLowerCase().includes(questionBankSearch.toLowerCase())
          return matchesCategory && matchesSearch
        })

        // Nhóm câu hỏi theo category (khi đang ở All)
        const groupedByCategory = allCategories.reduce<Record<string, typeof questionBank>>((acc, cat) => {
          acc[cat] = filteredQuestions.filter(q => q.category === cat)
          return acc
        }, {})

        // Màu sắc cho từng category
        const categoryColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
          'HTML': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🌐' },
          'React': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '⚛️' },
          'CSS / Web Fundamentals': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🎨' },
          'Javascript Basics': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⚡' },
          'TypeScript': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '📘' },
        }
        const defaultColor = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '📂' }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh] overflow-hidden">

              {/* Modal Header */}
              <div className="flex justify-between items-center px-8 pt-7 pb-5 border-b border-outline-variant/10 flex-shrink-0">
                <div className="text-left">
                  <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> Question Bank
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {questionBank.length} questions across {allCategories.length} categories
                  </p>
                </div>
                <button
                  onClick={() => { setQuestionBankOpen(false); setQuestionBankCategory('All'); setQuestionBankSearch('') }}
                  className="text-on-surface-variant hover:text-error p-1.5 hover:bg-surface-container-low rounded-lg transition-all"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Body: Sidebar + Content */}
              <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar: Category List */}
                <div className="w-52 flex-shrink-0 border-r border-outline-variant/10 bg-[#f9f9ff] flex flex-col overflow-y-auto py-3 px-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-outline/70 px-2 mb-2">Categories</p>
                  {/* All button */}
                  <button
                    onClick={() => setQuestionBankCategory('All')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all mb-1 ${
                      questionBankCategory === 'All'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:bg-white hover:text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>📚</span> All Questions
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      questionBankCategory === 'All' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {questionBank.length}
                    </span>
                  </button>

                  {/* Category buttons */}
                  {allCategories.map(cat => {
                    const color = categoryColors[cat] || defaultColor
                    const count = questionBank.filter(q => q.category === cat).length
                    const isActive = questionBankCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setQuestionBankCategory(cat)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all mb-1 ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-on-surface-variant hover:bg-white hover:text-on-surface'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{color.icon}</span>
                          <span className="truncate">{cat}</span>
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search bar */}
                  <div className="px-6 pt-5 pb-4 flex-shrink-0">
                    <div className="relative">
                      <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={questionBankSearch}
                        onChange={(e) => setQuestionBankSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl text-xs outline-none text-on-surface"
                        placeholder={`Search in ${questionBankCategory === 'All' ? 'all categories' : questionBankCategory}...`}
                      />
                    </div>
                  </div>

                  {/* Questions grouped by category or flat list */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    {filteredQuestions.length === 0 ? (
                      <div className="py-16 text-center">
                        <BookOpen className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                        <h4 className="font-bold text-sm text-on-surface">No questions found</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Try searching with different keywords.</p>
                      </div>
                    ) : questionBankCategory === 'All' ? (
                      // Show grouped by category
                      allCategories.filter(cat => groupedByCategory[cat]?.length > 0).map(cat => {
                        const color = categoryColors[cat] || defaultColor
                        const questions = groupedByCategory[cat]
                        return (
                          <div key={cat}>
                            {/* Category Header */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color.bg} ${color.border} mb-3`}>
                              <span className="text-base">{color.icon}</span>
                              <span className={`font-extrabold text-xs uppercase tracking-wider ${color.text}`}>{cat}</span>
                              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
                                {questions.length} questions
                              </span>
                            </div>
                            {/* Questions in this category */}
                            <div className="space-y-2.5 pl-1">
                              {questions.map(q => (
                                <div key={q.id} className="p-4 rounded-xl border border-outline-variant/15 hover:border-primary/30 bg-white transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-left shadow-sm hover:shadow-md">
                                  <div className="space-y-1 flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        q.type === 'Essay' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                                      }`}>
                                        {q.type}
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-on-surface">{q.text}</p>
                                    <p className="text-[10px] text-outline">Created on {q.dateCreated}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setQuizzesList(prev => prev.map((quiz, idx) => idx === 0 ? { ...quiz, questions: quiz.questions + 1 } : quiz))
                                      alert(`"${q.text}" successfully added to your active Quiz Template!`)
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-white font-button text-xs py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all font-bold shrink-0 self-start md:self-center whitespace-nowrap"
                                  >
                                    + Reuse
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      // Show flat list for selected category
                      <div className="space-y-2.5">
                        {filteredQuestions.map(q => {
                          const color = categoryColors[q.category] || defaultColor
                          return (
                            <div key={q.id} className="p-4 rounded-xl border border-outline-variant/15 hover:border-primary/30 bg-white transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-left shadow-sm hover:shadow-md">
                              <div className="space-y-1 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    q.type === 'Essay' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                                  }`}>
                                    {q.type}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                                    {color.icon} {q.category}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-on-surface">{q.text}</p>
                                <p className="text-[10px] text-outline">Created on {q.dateCreated}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setQuizzesList(prev => prev.map((quiz, idx) => idx === 0 ? { ...quiz, questions: quiz.questions + 1 } : quiz))
                                  alert(`"${q.text}" successfully added to your active Quiz Template!`)
                                }}
                                className="bg-primary hover:bg-primary/90 text-white font-button text-xs py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all font-bold shrink-0 self-start md:self-center whitespace-nowrap"
                              >
                                + Reuse
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant/10 flex-shrink-0 bg-white">
                    <button
                      onClick={() => { setQuestionBankOpen(false); setQuestionBankCategory('All'); setQuestionBankSearch('') }}
                      className="px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-button text-xs hover:bg-surface-container-highest transition-colors font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
                  {quizzesList.map(quiz => (
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
                  {groupsList.map(group => (
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
