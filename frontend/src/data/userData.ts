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
  mediaUrl?: string | null;
  audioUrl?: string | null;
}

export interface ExamQuestion {
  id: number;
  text: string;
  points: number;
  options: ExamQuestionOption[];
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  mediaUrl?: string | null;
  audioUrl?: string | null;
  audioPlayLimit?: number;
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

export interface MemberExamRecord {
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
  avatar?: string;
  examsCompleted?: number;
  totalExamsAssigned?: number;
  averageScore?: string;
  examScores?: MemberExamRecord[];
}

export interface HostGroup {
  id: string;
  name: string;
  joinCode: string;
  isLocked: boolean;
  membersCount: number;
  description?: string;
  icon?: string;
  members?: GroupMember[];
  pendingRequests?: GroupMember[];
}

export const USER_RECENT_ACTIVITIES: RecentActivity[] = [];
export const USER_ASSIGNED_EXAMS: AssignedExam[] = [];
export const USER_EXAM_HISTORY: ExamHistoryItem[] = [];
export const USER_ACHIEVEMENTS: AchievementBadge[] = [];
export const HOST_QUIZZES_LIST: HostQuiz[] = [];
export const HOST_GROUPS_LIST: HostGroup[] = [];
export const USER_FORMAL_EXAM_QUESTIONS: ExamQuestion[] = [];
