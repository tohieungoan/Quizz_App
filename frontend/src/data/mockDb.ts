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

export const DUMMY_EXAM_ASSIGNEES: ExamAssignee[] = [
  { id: 'EA-01', exam_id: 'EX-101', user_id: 'U-001', user_name: 'Marcus T.', status: 'SUBMITTED', started_at: '2026-07-14 09:00', submitted_at: '2026-07-14 09:45', score: 85 },
  { id: 'EA-02', exam_id: 'EX-101', user_id: 'U-002', user_name: 'Sarah J.', status: 'IN_PROGRESS', started_at: '2026-07-14 09:15' },
  { id: 'EA-03', exam_id: 'EX-101', user_id: 'U-003', user_name: 'David C.', status: 'NOT_STARTED' },
  { id: 'EA-04', exam_id: 'EX-102', user_id: 'U-004', user_name: 'Elena R.', status: 'SUBMITTED', started_at: '2026-07-13 14:00', submitted_at: '2026-07-13 15:00', score: 92 },
];
