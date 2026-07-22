import { AlertCircle, CheckCircle2, MessageSquare, LucideIcon } from 'lucide-react';

export interface Quiz {
  id: string;
  title: string;
  status: string;
  subject: string;
  q: number;
  diff: string;
  author: string;
  date: string;
  time: string;
}

export interface Participant {
  id: string;
  room_id: string;
  user_id?: string;
  nickname: string;
  status: 'JOINED' | 'LEFT' | 'KICKED' | 'FINISHED';
  joined_at: string;
  score: number;
}

export interface ExamAssignee {
  id: string;
  exam_id: string;
  user_id: string;
  user_name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
  started_at?: string;
  submitted_at?: string;
  score?: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  initials: string;
  email_verified?: boolean;
  achievement_points?: number;
  study_streak?: number;
  auth_provider?: 'LOCAL' | 'GOOGLE' | 'MICROSOFT';
  provider_id?: string | null;
  last_login?: string;
  created_at?: string;
  avatar?: string;
  assigned_quizzes?: string[];
}

export interface Room {
  id: string;
  room_code: string;
  title: string;
  host_name: string;
  quiz_title: string;
  status: 'WAITING' | 'RUNNING' | 'FINISHED';
  created_at: string;
  participant_count: number;
  mode?: 'EXAM' | 'GAME';
}

export interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  date: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  unread: boolean;
}

export interface QuestionReport {
  id: number;
  question: string;
  correct: string;
  incorrect: string;
  rate: string;
  rateColor: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  diffColor: string;
}

export interface HottestQuiz {
  title: string;
  plays: string;
  w: string;
  color: string;
}

export const DUMMY_PARTICIPANTS: Participant[] = [
  { id: 'P-01', room_id: 'RM-101', user_id: 'U-001', nickname: 'Marcus T.', status: 'JOINED', joined_at: '2026-07-14 09:01', score: 85 },
  { id: 'P-02', room_id: 'RM-101', nickname: 'Guest_784', status: 'JOINED', joined_at: '2026-07-14 09:02', score: 92 },
  { id: 'P-03', room_id: 'RM-101', user_id: 'U-002', nickname: 'Sarah J.', status: 'LEFT', joined_at: '2026-07-14 09:05', score: 10 },
  { id: 'P-04', room_id: 'RM-101', nickname: 'Guest_999', status: 'KICKED', joined_at: '2026-07-14 09:10', score: 0 },
  { id: 'P-05', room_id: 'RM-103', user_id: 'U-004', nickname: 'Emily W.', status: 'FINISHED', joined_at: '2026-07-13 14:02', score: 100 },
  { id: 'P-06', room_id: 'RM-103', nickname: 'MathGenius', status: 'FINISHED', joined_at: '2026-07-13 14:05', score: 98 },
];

export const DUMMY_QUIZZES: Quiz[] = [
  { id: 'QZ-204', title: 'Advanced Particle Physics', status: 'Published', subject: 'Physics', q: 25, diff: 'Hard', author: 'Dr. Elena Vance', date: 'Oct 12', time: '09:00 AM - 11:00 AM' },
  { id: 'QZ-109', title: 'Calculus III Midterm', status: 'Published', subject: 'Mathematics', q: 40, diff: 'Medium', author: 'Prof. R. Smith', date: 'Oct 14', time: '13:00 PM - 15:00 PM' },
  { id: 'QZ-301', title: 'Cellular Biology 101', status: 'Published', subject: 'Biology', q: 30, diff: 'Easy', author: 'Sarah Jenkins', date: 'Oct 15', time: 'Flexible (90 mins)' },
  { id: 'QZ-405', title: 'Modern Literature', status: 'Published', subject: 'Literature', q: 15, diff: 'Medium', author: 'David Chen', date: 'Oct 16', time: 'Tomorrow 10:00 AM' },
  { id: 'QZ-501', title: 'World History: WWII', status: 'Published', subject: 'History', q: 50, diff: 'Hard', author: 'Prof. J. Smith', date: 'Oct 17', time: 'Oct 20, 08:00 AM' },
  { id: 'QZ-602', title: 'Intro to Python', status: 'Published', subject: 'Computer Science', q: 20, diff: 'Easy', author: 'T.A. Marcus', date: 'Oct 18', time: 'Flexible (60 mins)' },
  { id: 'QZ-703', title: 'Organic Chemistry', status: 'Published', subject: 'Chemistry', q: 35, diff: 'Hard', author: 'Dr. M. Lee', date: 'Oct 19', time: 'Oct 25, 14:00 PM' },
];

export const DUMMY_EXAM_ASSIGNEES: ExamAssignee[] = [
  { id: 'EA-01', exam_id: 'EX-101', user_id: 'U-001', user_name: 'Marcus T.', status: 'SUBMITTED', started_at: '2026-07-14 09:00', submitted_at: '2026-07-14 09:45', score: 85 },
  { id: 'EA-02', exam_id: 'EX-101', user_id: 'U-002', user_name: 'Sarah J.', status: 'IN_PROGRESS', started_at: '2026-07-14 09:15' },
  { id: 'EA-03', exam_id: 'EX-101', user_id: 'U-003', user_name: 'David C.', status: 'NOT_STARTED' },
  { id: 'EA-04', exam_id: 'EX-102', user_id: 'U-004', user_name: 'Elena R.', status: 'SUBMITTED', started_at: '2026-07-13 14:00', submitted_at: '2026-07-13 15:00', score: 92 },
];

export const DUMMY_USERS: UserData[] = [
  { id: 'U-001', name: 'Marcus Thorne', email: 'marcus.thorne@eduquest.io', role: 'SUPER_ADMIN', status: 'ACTIVE', initials: 'MT', email_verified: true, achievement_points: 1250, last_login: '2026-07-14 08:30:00', created_at: '2025-01-15 10:00:00', assigned_quizzes: ['QZ-204', 'QZ-109'] },
  { id: 'U-002', name: 'Sarah Jenkins', email: 's.jenkins@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'SJ', email_verified: true, achievement_points: 840, last_login: '2026-07-13 15:45:00', created_at: '2025-03-22 14:30:00', assigned_quizzes: ['QZ-301'] },
  { id: 'U-003', name: 'David Chen', email: 'david.c@eduquest.io', role: 'USER', status: 'SUSPENDED', initials: 'DC', email_verified: false, achievement_points: 120, last_login: '2026-06-01 09:15:00', created_at: '2025-11-05 08:00:00', assigned_quizzes: [] },
  { id: 'U-004', name: 'Emily White', email: 'emily.w@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'EW', email_verified: true, achievement_points: 450, last_login: '2026-07-12 11:20:00', created_at: '2026-01-10 16:45:00', assigned_quizzes: [] },
  { id: 'U-005', name: 'Robert Fox', email: 'robert.f@eduquest.io', role: 'SUPER_ADMIN', status: 'ACTIVE', initials: 'RF', email_verified: true, achievement_points: 980, last_login: '2026-07-14 07:15:00', created_at: '2025-08-18 11:30:00', assigned_quizzes: [] },
  { id: 'U-006', name: 'Alice Cooper', email: 'alice.c@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'AC', email_verified: true, achievement_points: 320, last_login: '2026-07-10 14:10:00', created_at: '2026-02-14 09:20:00', assigned_quizzes: [] },
  { id: 'U-007', name: 'Thomas Wayne', email: 'thomas.w@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'TW', email_verified: false, achievement_points: 50, last_login: '2026-05-20 10:05:00', created_at: '2026-04-01 13:10:00', assigned_quizzes: [] },
  { id: 'U-008', name: 'Nina Simone', email: 'nina.s@eduquest.io', role: 'USER', status: 'SUSPENDED', initials: 'NS', email_verified: true, achievement_points: 610, last_login: '2026-06-15 16:30:00', created_at: '2025-12-12 15:00:00', assigned_quizzes: [] },
];

export const DUMMY_ROOMS: Room[] = [
  { id: 'RM-101', room_code: '#EDU-4921', title: 'Modern Neuroscience 101', host_name: 'Prof. D. Thorne', quiz_title: 'Advanced Particle Physics', status: 'RUNNING', created_at: '2026-07-14 09:00', participant_count: 24, mode: 'EXAM' },
  { id: 'RM-102', room_code: '#EDU-3810', title: 'World History: WWII', host_name: 'Dr. Sarah Jenkins', quiz_title: 'World History 1939-1945', status: 'RUNNING', created_at: '2026-07-14 10:15', participant_count: 12, mode: 'GAME' },
  { id: 'RM-103', room_code: '#EDU-9924', title: 'Intro to Python', host_name: 'T.A. Marcus', quiz_title: 'Python Fundamentals', status: 'RUNNING', created_at: '2026-07-13 14:00', participant_count: 45, mode: 'GAME' },
  { id: 'RM-104', room_code: '#EDU-1123', title: 'Advanced Calculus', host_name: 'Prof. J. Smith', quiz_title: 'Calculus III Integrals', status: 'RUNNING', created_at: '2026-07-14 11:30', participant_count: 30, mode: 'EXAM' },
  { id: 'RM-105', room_code: '#EDU-4452', title: 'Biology 101: Cells', host_name: 'Dr. M. Lee', quiz_title: 'Cellular Structures', status: 'RUNNING', created_at: '2026-07-12 16:20', participant_count: 18, mode: 'GAME' },
  { id: 'RM-106', room_code: '#EDU-7731', title: 'Physics Basics', host_name: 'T.A. Marcus', quiz_title: 'Kinematics', status: 'FINISHED', created_at: '2026-07-14 12:00', participant_count: 22, mode: 'EXAM' },
  { id: 'RM-107', room_code: '#EDU-8812', title: 'Literature: Shakespeare', host_name: 'Prof. D. Thorne', quiz_title: 'Hamlet & Macbeth', status: 'WAITING', created_at: '2026-07-14 13:00', participant_count: 15, mode: 'GAME' },
];

export const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, title: 'System Warning', desc: 'High traffic detected during Calculus III Exam. System is auto-scaling resources to compensate.', time: '5m ago', date: 'Today', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: true },
  { id: 2, title: 'Room Completed', desc: 'Physics 101 Final has ended successfully. 124 participants completed the exam.', time: '1h ago', date: 'Today', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: true },
  { id: 3, title: 'New Feedback', desc: 'Sarah Jenkins requested a review on Q14 for Introduction to Biology.', time: '2h ago', date: 'Today', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
  { id: 4, title: 'Server Maintenance', desc: 'Scheduled maintenance will occur in 2 days from 02:00 AM to 04:00 AM UTC.', time: '5h ago', date: 'Yesterday', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', unread: false },
  { id: 5, title: 'New Room Created', desc: 'Dr. Hayes started Room L3M4N for Calculus III Midterm.', time: '1d ago', date: 'Yesterday', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', unread: false },
  { id: 6, title: 'Storage Alert', desc: 'Database storage is at 85% capacity. Consider upgrading the storage plan soon.', time: '2d ago', date: 'July 13, 2026', icon: AlertCircle, color: 'text-error', bg: 'bg-error-container', unread: false },
  { id: 7, title: 'Weekly Report', desc: 'Your weekly engagement report is ready to view in the Reports section.', time: '3d ago', date: 'July 12, 2026', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', unread: false },
];

export const DUMMY_REPORT_QUESTIONS: QuestionReport[] = [
  { id: 1, question: "What is the primary function of a reverse proxy in a microservices architecture?", correct: "35", incorrect: "5", rate: "87%", rateColor: "bg-green-100 text-green-700", difficulty: "Easy", diffColor: "bg-green-100 text-green-700" },
  { id: 2, question: "Explain the difference between OAuth 2.0 and OpenID Connect in modern web authentication.", correct: "18", incorrect: "22", rate: "45%", rateColor: "bg-red-100 text-red-700", difficulty: "Hard", diffColor: "bg-red-100 text-red-700" },
  { id: 3, question: "Which SQL constraint ensures unique values in a column while allowing exactly one NULL value?", correct: "30", incorrect: "8", rate: "79%", rateColor: "bg-green-100 text-green-700", difficulty: "Medium", diffColor: "bg-orange-100 text-orange-700" },
  { id: 4, question: "Identify the correct sequence for a TCP 3-way handshake process.", correct: "28", incorrect: "10", rate: "73%", rateColor: "bg-orange-100 text-orange-700", difficulty: "Medium", diffColor: "bg-orange-100 text-orange-700" },
  { id: 5, question: "In React, what hook is used to handle side effects and how does its dependency array work?", correct: "38", incorrect: "2", rate: "95%", rateColor: "bg-green-100 text-green-700", difficulty: "Easy", diffColor: "bg-green-100 text-green-700" },
];

export const DUMMY_HOTTEST_QUIZZES: HottestQuiz[] = [
  { title: 'Modern Neuroscience 101', plays: '2.4k', w: '100%', color: 'bg-primary' },
  { title: 'Advanced Calculus Prep', plays: '1.8k', w: '75%', color: 'bg-primary/80' },
  { title: 'World History: WWII', plays: '1.2k', w: '50%', color: 'bg-primary/60' },
  { title: 'AP Chemistry Basics', plays: '950', w: '40%', color: 'bg-primary/40' },
  { title: 'Intro to Python', plays: '820', w: '35%', color: 'bg-primary/20' },
];
