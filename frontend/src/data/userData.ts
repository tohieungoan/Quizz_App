export interface RecentActivity {
  id: number;
  name: string;
  type: string;
  date: string;
  score: string;
  status: 'completed' | 'missed';
}

export interface AssignedExam {
  id: number;
  title: string;
  due: string;
  subject: string;
  rule: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: string;
  isUser?: boolean;
}

export interface ExamHistoryItem {
  id: number;
  title: string;
  type: 'Live Room' | 'Official Exam';
  date: string;
  score: string;
  questionsCount?: number;
  timeSpent?: string;
  correctAnswers?: number;
  hostName?: string;
  hostFeedback?: string;
  roomCode?: string;
  leaderboard?: LeaderboardEntry[];
}

export interface ExamQuestionOption {
  key: string;
  label: string;
  desc?: string;
}

export interface ExamQuestion {
  id: number;
  text: string;
  points: number;
  options: ExamQuestionOption[];
  type: 'radio' | 'checkbox';
}

export interface AchievementBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: 'TITLE' | 'BADGE';
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  points_required: number;
  type_value: string;
  target_value: number;
  
  // User badge fields
  current_progress?: number;
  is_unlocked?: boolean;
  is_equipped?: boolean;
}

export interface HostQuiz {
  id: string;
  title: string;
  questions: number;
  level: string;
  category: string;
}

export interface StudentExamRecord {
  examId: string | number;
  examTitle: string;
  score: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Missed';
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  examsCompleted?: number;
  totalExamsAssigned?: number;
  averageScore?: string;
  examScores?: StudentExamRecord[];
}

export interface HostGroup {
  id: string;
  name: string;
  joinCode: string;
  isLocked: boolean;
  membersCount: number;
  description?: string;
  members?: GroupMember[];
  pendingRequests?: GroupMember[];
}

export const USER_RECENT_ACTIVITIES: RecentActivity[] = [
  { id: 1, name: 'Advanced Physics Ch. 4', type: 'Exam', date: 'Oct 24, 2026', score: '92%', status: 'completed' },
  { id: 2, name: 'World History Midterm', type: 'Live Quiz', date: 'Oct 22, 2026', score: '88%', status: 'completed' },
  { id: 3, name: 'Calculus Practice Sets', type: 'Practice', date: 'Oct 20, 2026', score: '100%', status: 'completed' },
  { id: 4, name: 'Biology Pop Quiz', type: 'Missed', date: 'Oct 18, 2026', score: '--', status: 'missed' },
];

export const USER_ASSIGNED_EXAMS: AssignedExam[] = [
  { id: 1, title: 'Midterm Biology 101', due: 'Tomorrow, 11:59 PM', subject: 'Biology', rule: 'Strict / Locked' },
  { id: 2, title: 'Calculus III - Chapter 4 Quiz', due: 'Oct 30, 2026', subject: 'Mathematics', rule: 'Free Navigation' },
];

export const USER_EXAM_HISTORY: ExamHistoryItem[] = [
  {
    id: 1,
    title: 'Introduction to Psychology Final',
    type: 'Official Exam',
    date: 'Oct 15, 2026',
    score: '95%',
    questionsCount: 20,
    timeSpent: '25m',
    correctAnswers: 19,
    hostName: 'Prof. David Thorne',
    hostFeedback: 'Outstanding work! Excellent comprehension of cognitive behavior theories and experimental methods.',
  },
  {
    id: 2,
    title: 'European History Live Challenge',
    type: 'Live Room',
    date: 'Oct 10, 2026',
    score: '88%',
    questionsCount: 15,
    timeSpent: '18m',
    correctAnswers: 13,
    hostName: 'Dr. Sarah Jenkins',
    roomCode: '#EDU-3810',
    leaderboard: [
      { rank: 1, name: 'Liam Smith', score: 950, accuracy: '95%' },
      { rank: 2, name: 'Alex Johnson (You)', score: 880, accuracy: '88%', isUser: true },
      { rank: 3, name: 'Maria Garcia', score: 820, accuracy: '82%' },
      { rank: 4, name: 'Emma Watson', score: 760, accuracy: '76%' },
      { rank: 5, name: 'John Doe', score: 700, accuracy: '70%' },
    ],
  },
  {
    id: 3,
    title: 'Chemistry Lab Safety Test',
    type: 'Official Exam',
    date: 'Oct 05, 2026',
    score: '92%',
    questionsCount: 25,
    timeSpent: '30m',
    correctAnswers: 23,
    hostName: 'Dr. M. Lee',
    hostFeedback: 'Great safety knowledge demonstrated. Make sure to double check chemical storage rules.',
  },
  {
    id: 4,
    title: 'Linear Algebra Live Battle',
    type: 'Live Room',
    date: 'Sep 28, 2026',
    score: '78%',
    questionsCount: 20,
    timeSpent: '40m',
    correctAnswers: 15,
    hostName: 'Prof. R. Smith',
    roomCode: '#EDU-1123',
    leaderboard: [
      { rank: 1, name: 'MathGenius', score: 980, accuracy: '98%' },
      { rank: 2, name: 'Marcus T.', score: 850, accuracy: '85%' },
      { rank: 3, name: 'Alex Johnson (You)', score: 780, accuracy: '78%', isUser: true },
      { rank: 4, name: 'Emily White', score: 720, accuracy: '72%' },
    ],
  },
  {
    id: 5,
    title: 'Biology Chapter 5 Quiz',
    type: 'Official Exam',
    date: 'Sep 22, 2026',
    score: '85%',
    questionsCount: 10,
    timeSpent: '12m',
    correctAnswers: 8,
    hostName: 'Sarah Jenkins',
    hostFeedback: 'Good effort. Review cell division mechanisms for the upcoming midterm.',
  },
  {
    id: 6,
    title: 'World Literature Live Room',
    type: 'Live Room',
    date: 'Sep 18, 2026',
    score: '90%',
    questionsCount: 10,
    timeSpent: '20m',
    correctAnswers: 9,
    hostName: 'David Chen',
    roomCode: '#EDU-7731',
    leaderboard: [
      { rank: 1, name: 'Alex Johnson (You)', score: 920, accuracy: '90%', isUser: true },
      { rank: 2, name: 'BookWorm_99', score: 890, accuracy: '89%' },
      { rank: 3, name: 'ShakespeareFan', score: 810, accuracy: '81%' },
    ],
  },
];

export const USER_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 1,
    name: 'First Blood',
    description: 'Complete your first quiz with any score.',
    icon: 'target',
    category: 'BADGE',
    tier: 'COMMON',
    points_required: 0,
    type_value: 'QUIZ_COUNT',
    target_value: 1,
    current_progress: 1,
    is_unlocked: true,
    is_equipped: false
  },
  {
    id: 2,
    name: 'Sharpshooter',
    description: 'Achieve a 100% score on 5 different quizzes.',
    icon: 'zap',
    category: 'BADGE',
    tier: 'RARE',
    points_required: 50,
    type_value: 'PERFECT_SCORE',
    target_value: 5,
    current_progress: 3,
    is_unlocked: false,
    is_equipped: false
  },
  {
    id: 3,
    name: 'Unstoppable',
    description: 'Maintain a learning streak of 30 consecutive days.',
    icon: 'flame',
    category: 'TITLE',
    tier: 'EPIC',
    points_required: 100,
    type_value: 'STREAK',
    target_value: 30,
    current_progress: 12,
    is_unlocked: false,
    is_equipped: false
  },
  {
    id: 4,
    name: 'Night Owl',
    description: 'Complete 10 quizzes between midnight and 4 AM.',
    icon: 'moon',
    category: 'BADGE',
    tier: 'RARE',
    points_required: 20,
    type_value: 'NIGHT_OWL',
    target_value: 10,
    current_progress: 10,
    is_unlocked: true,
    is_equipped: false
  },
  {
    id: 5,
    name: 'Quiz Master',
    description: 'Successfully complete 100 quizzes across any subjects.',
    icon: 'crown',
    category: 'TITLE',
    tier: 'LEGENDARY',
    points_required: 500,
    type_value: 'QUIZ_COUNT',
    target_value: 100,
    current_progress: 89,
    is_unlocked: false,
    is_equipped: false
  }
];

export const HOST_QUIZZES_LIST: HostQuiz[] = [
  { id: 'QZ-101', title: 'Advanced Physics Chapter 4 - Thermodynamics', questions: 20, level: 'Medium', category: 'Physics' },
  { id: 'QZ-102', title: 'World History Midterm Review', questions: 30, level: 'Hard', category: 'History' },
  { id: 'QZ-103', title: 'Calculus III Vector Calculus', questions: 15, level: 'Hard', category: 'Mathematics' },
  { id: 'QZ-104', title: 'Biology Cell Structure & Function', questions: 25, level: 'Easy', category: 'Biology' },
];

export const HOST_GROUPS_LIST: HostGroup[] = [
  {
    id: 'GRP-01',
    name: 'Alpha Team - Advanced Physics',
    joinCode: 'PHYS-ALPHA',
    isLocked: false,
    membersCount: 3,
    description: 'Alpha team members taking advanced physics coursework.',
    members: [
      {
        id: 'M-1',
        name: 'Alex Johnson',
        email: 'alex.j@example.com',
        joinedDate: '2026-09-01',
        examsCompleted: 3,
        totalExamsAssigned: 3,
        averageScore: '92%',
        examScores: [
          { examId: 1, examTitle: 'Midterm Biology 101', score: '85%', date: '2026-07-20', status: 'Completed' },
          { examId: 2, examTitle: 'Advanced Physics Ch. 4', score: '95%', date: '2026-07-15', status: 'Completed' },
          { examId: 3, examTitle: 'Calculus III Vector Calculus', score: '96%', date: '2026-07-10', status: 'Completed' },
        ],
      },
      {
        id: 'M-2',
        name: 'Sarah Smith',
        email: 'sarah.s@example.com',
        joinedDate: '2026-09-01',
        examsCompleted: 2,
        totalExamsAssigned: 3,
        averageScore: '89%',
        examScores: [
          { examId: 1, examTitle: 'Midterm Biology 101', score: '92%', date: '2026-07-20', status: 'Completed' },
          { examId: 2, examTitle: 'Advanced Physics Ch. 4', score: '86%', date: '2026-07-15', status: 'Completed' },
          { examId: 3, examTitle: 'Calculus III Vector Calculus', score: '--', date: '2026-07-10', status: 'In Progress' },
        ],
      },
      {
        id: 'M-3',
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        joinedDate: '2026-09-03',
        examsCompleted: 1,
        totalExamsAssigned: 3,
        averageScore: '78%',
        examScores: [
          { examId: 1, examTitle: 'Midterm Biology 101', score: '--', date: '2026-07-20', status: 'In Progress' },
          { examId: 2, examTitle: 'Advanced Physics Ch. 4', score: '78%', date: '2026-07-15', status: 'Completed' },
          { examId: 3, examTitle: 'Calculus III Vector Calculus', score: '--', date: '2026-07-10', status: 'Missed' },
        ],
      },
    ],
    pendingRequests: [
      { id: 'P-1', name: 'Kevin Lee', email: 'kevin.l@example.com', joinedDate: '2026-10-18' },
      { id: 'P-2', name: 'Maria Garcia', email: 'maria.g@example.com', joinedDate: '2026-10-19' },
    ],
  },
  {
    id: 'GRP-02',
    name: 'English Intensive Group B',
    joinCode: 'ENG-GROUPB',
    isLocked: true,
    membersCount: 2,
    description: 'Intensive English language & literature study group.',
    members: [

      {
        id: 'M-4',
        name: 'Emily Davis',
        email: 'emily.d@school.edu',
        joinedDate: '2026-09-05',
        examsCompleted: 2,
        totalExamsAssigned: 2,
        averageScore: '94%',
        examScores: [
          { examId: 1, examTitle: 'English Literature Midterm', score: '95%', date: '2026-07-18', status: 'Completed' },
          { examId: 2, examTitle: 'Grammar & Vocabulary Test', score: '93%', date: '2026-07-12', status: 'Completed' },
        ],
      },
      {
        id: 'M-5',
        name: 'David Wilson',
        email: 'david.w@school.edu',
        joinedDate: '2026-09-05',
        examsCompleted: 1,
        totalExamsAssigned: 2,
        averageScore: '82%',
        examScores: [
          { examId: 1, examTitle: 'English Literature Midterm', score: '82%', date: '2026-07-18', status: 'Completed' },
          { examId: 2, examTitle: 'Grammar & Vocabulary Test', score: '--', date: '2026-07-12', status: 'Missed' },
        ],
      },
    ],
    pendingRequests: [],
  },
  {
    id: 'GRP-03',
    name: 'Computer Science Honors 2026',
    joinCode: 'CS-HONORS',
    isLocked: false,
    membersCount: 2,
    description: 'CS honors section focusing on algorithms and web dev.',
    members: [
      {
        id: 'M-6',
        name: 'Jessica Taylor',
        email: 'jessica.t@school.edu',
        joinedDate: '2026-09-10',
        examsCompleted: 2,
        totalExamsAssigned: 2,
        averageScore: '98%',
        examScores: [
          { examId: 1, examTitle: 'Data Structures & Algorithms', score: '100%', date: '2026-07-19', status: 'Completed' },
          { examId: 2, examTitle: 'Web Development Basics', score: '96%', date: '2026-07-14', status: 'Completed' },
        ],
      },
      {
        id: 'M-7',
        name: 'Daniel Martinez',
        email: 'daniel.m@school.edu',
        joinedDate: '2026-09-12',
        examsCompleted: 2,
        totalExamsAssigned: 2,
        averageScore: '91%',
        examScores: [
          { examId: 1, examTitle: 'Data Structures & Algorithms', score: '90%', date: '2026-07-19', status: 'Completed' },
          { examId: 2, examTitle: 'Web Development Basics', score: '92%', date: '2026-07-14', status: 'Completed' },
        ],
      },
    ],
    pendingRequests: [
      { id: 'P-3', name: 'Tommy Chen', email: 'tommy.c@school.edu', joinedDate: '2026-10-20' },
    ],
  },
];

export const USER_FORMAL_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    text: 'What does HTML stand for in web development?',
    points: 0.5,
    options: [
      { key: 'A', label: 'Hyper Text Markup Language', desc: 'Standard markup language for documents designed to be displayed in a web browser.' },
      { key: 'B', label: 'High Tech Modern Language', desc: 'Incorrect non-standard term.' },
      { key: 'C', label: 'Hyperlink and Text Management Language', desc: 'Descriptive but incorrect.' },
      { key: 'D', label: 'Home Tool Markup Language', desc: 'Early misconception name.' }
    ],
    type: 'radio'
  },
  {
    id: 2,
    text: 'Which HTTP method is idempotent and primarily used to fetch data without side effects?',
    points: 0.5,
    options: [
      { key: 'A', label: 'POST', desc: 'Creates new resources, not idempotent.' },
      { key: 'B', label: 'GET', desc: 'Safe and idempotent method to request representation of specified resource.' },
      { key: 'C', label: 'PUT', desc: 'Idempotent, but used to update/replace resources.' },
      { key: 'D', label: 'DELETE', desc: 'Idempotent, but deletes specified resource.' }
    ],
    type: 'radio'
  }
];
