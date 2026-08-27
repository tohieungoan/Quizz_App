import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  Users,
  BookOpen,
  FileText,
  Settings,
  Upload,
  Edit2,
  Trash2,
  UserPlus,
  X,
  Check,
  Mail,
  Search,
  Lock,
  Unlock,
  Copy,
  CheckCircle2,
  UserCheck,
  UserX,
  Clock,
  Key,
  Calendar,
  Shield,
  ClipboardList,
  AlertCircle,
  Download,
  BarChart2,
  FileSpreadsheet,
  Brain,
  Trophy,
  Award,
  Globe,
  Atom,
  Calculator,
  Laptop,
  Compass,
  GraduationCap,
  Eye
} from 'lucide-react';
import { HostGroup, GroupMember, AssignedExam } from '@/data/userData';
import { groupService, quizService, examService, roomService } from '@/services';

const GROUP_ICONS = {
  GraduationCap,
  BookOpen,
  Brain,
  Trophy,
  Award,
  Globe,
  Atom,
  Calculator,
  Laptop,
  Compass,
};

export interface HostAssignedExam {
  id: number;
  title: string;
  due: string;
  subject: string;
  quizId: string;
  duration: number; // minutes
  groupId: string;
  groupName: string;
  totalMembers: number;
  submittedCount: number;
  status: 'Pending' | 'Active' | 'Closed';
  navigationRule?: 'FREE_NAV' | 'FIXED_NAV';
  resultsPublished?: boolean;
  useAiQuestion?: boolean;
  submissions?: {
    memberId: string;
    memberName: string;
    memberEmail: string;
    status: 'Submitted' | 'In Progress' | 'Not Started';
    score?: string;
    submittedAt?: string;
  }[];
}

export interface HostQuiz {
  id: string;
  title: string;
  questions: number;
  level: string;
  category: string;
}

export interface QuestionAnalytics {
  id: number;
  question: string;
  wrongCount: number;
  totalCount: number;
  wrongPercentage: number;
  commonWrongAnswer: string;
  correctAnswer: string;
}

export const MOCK_QUESTION_ANALYTICS: Record<number, QuestionAnalytics[]> = {
  1: [
    { id: 1, question: "Biochemical reactions concepts in cells?", wrongCount: 3, totalCount: 3, wrongPercentage: 100, commonWrongAnswer: "B. Protein breakdown reaction", correctAnswer: "C. ATP synthesis reaction" },
    { id: 2, question: "How many membrane layers does a mitochondrion have?", wrongCount: 2, totalCount: 3, wrongPercentage: 67, commonWrongAnswer: "A. 1 single membrane", correctAnswer: "B. 2 double membranes" },
    { id: 3, question: "Where does cellular respiration mainly occur?", wrongCount: 1, totalCount: 3, wrongPercentage: 33, commonWrongAnswer: "D. Cell nucleus", correctAnswer: "A. Mitochondria" }
  ],
  2: [
    { id: 1, question: "Formula for line integral of second kind on circular arc?", wrongCount: 2, totalCount: 2, wrongPercentage: 100, commonWrongAnswer: "A. Apply Green's theorem directly", correctAnswer: "B. Convert to polar coordinates" },
    { id: 2, question: "Condition for series convergence according to D'Alembert test?", wrongCount: 1, totalCount: 2, wrongPercentage: 50, commonWrongAnswer: "C. L = 1", correctAnswer: "A. L < 1" }
  ]
};

interface HostStudioTabProps {
  onOpenHostRoomModal: () => void;
  onCreateQuiz: () => void;
  onEditQuiz?: (quizId: string) => void;
}

export const HostStudioTab: React.FC<HostStudioTabProps> = ({
  onOpenHostRoomModal,
  onCreateQuiz,
  onEditQuiz,
}) => {
  const [subTab, setSubTabState] = useState<'quizzes' | 'groups' | 'exams'>(() => {
    const saved = sessionStorage.getItem('host_studio_active_subtab');
    return (saved as 'quizzes' | 'groups' | 'exams') || 'quizzes';
  });

  const setSubTab = (tab: 'quizzes' | 'groups' | 'exams') => {
    setSubTabState(tab);
    sessionStorage.setItem('host_studio_active_subtab', tab);
  };

  useEffect(() => {
    const handleSwitchSubTab = (e: Event) => {
      const customEvt = e as CustomEvent<{ subTab?: 'quizzes' | 'groups' | 'exams' }>;
      if (customEvt.detail?.subTab) {
        setSubTabState(customEvt.detail.subTab);
        sessionStorage.setItem('host_studio_active_subtab', customEvt.detail.subTab);
      }
    };
    window.addEventListener('quizzapp_switch_host_subtab', handleSwitchSubTab);
    return () => {
      window.removeEventListener('quizzapp_switch_host_subtab', handleSwitchSubTab);
    };
  }, []);
  const [groups, setGroups] = useState<HostGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [quizzes, setQuizzes] = useState<HostQuiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setIsLoadingExams(true);
      setExamsError(null);
      const res = await examService.getAssignedExams();
      if (res) {
        const mappedExams = res.map((ex: any): HostAssignedExam => {
          let uStatus: 'Pending' | 'Active' | 'Closed' = 'Active';
          const backStatus = (ex.status || '').toLowerCase();
          if (backStatus.includes('pending')) uStatus = 'Pending';
          else if (backStatus.includes('close')) uStatus = 'Closed';

          return {
            id: ex.id,
            title: ex.title || ex.quiz_title || 'Untitled Exam',
            due: ex.end_time ? ex.end_time.substring(0, 16) : '',
            subject: ex.quiz_subject || 'General',
            quizId: `QZ-${ex.quiz_id}`,
            duration: ex.timer || 60,
            groupId: String(ex.group_id),
            groupName: ex.group_name || 'Individual',
            totalMembers: ex.total_assignees || 0,
            submittedCount: ex.submitted_count || 0,
            status: uStatus,
            navigationRule: ex.navigation_rule || 'FREE_NAV',
            resultsPublished: ex.results_published || false,
            useAiQuestion: Boolean(ex.use_ai_question || ex.variant_set_id),
            submissions: []
          };
        });
        setExams(mappedExams);
      }
    } catch (err: any) {
      console.error("Failed to load assigned exams:", err);
      setExamsError("Failed to load exams from server.");
    } finally {
      setIsLoadingExams(false);
    }
  };

  const [quizSearchTerm, setQuizSearchTerm] = useState('');
  const [quizDifficultyFilter, setQuizDifficultyFilter] = useState('All Difficulty');
  const [quizQuestionFilter, setQuizQuestionFilter] = useState('All Questions');

  const loadQuizzes = async () => {
    try {
      setIsLoadingQuizzes(true);
      setQuizzesError(null);
      const res = await quizService.getQuizzes({ pageSize: 100 });
      if (res && res.data) {
        const mappedQuizzes = res.data.map((q: any): HostQuiz => ({
          id: `QZ-${q.id}`,
          title: q.title,
          questions: q.question_count || 0,
          level: q.difficulty || 'Medium',
          category: q.subject || 'General'
        }));
        setQuizzes(mappedQuizzes);
      }
    } catch (err: any) {
      console.error("Failed to load quizzes:", err);
      setQuizzesError("Failed to load quizzes from server.");
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true);
      setGroupsError(null);
      const data = await groupService.getMyGroups();
      const savedUserStr = localStorage.getItem('user');
      let currentUser: { name?: string; email?: string } | null = null;
      try {
        if (savedUserStr) currentUser = JSON.parse(savedUserStr);
      } catch (e) {}

      const hostGroups = data.map((bg): HostGroup => ({
        id: String(bg.id),
        name: bg.name,
        joinCode: bg.group_code,
        isLocked: bg.status === 'CLOSED',
        membersCount: 0,
        description: bg.description || '',
        icon: bg.icon || 'GraduationCap',
        ownerName: bg.owner_name || currentUser?.name || currentUser?.email || 'Unknown Host',
        ownerEmail: bg.owner_email || currentUser?.email || '',
        members: [],
        pendingRequests: []
      }));
      setGroups(hostGroups);

      // Fetch membersCount and pendingRequests asynchronously for each group
      for (const g of hostGroups) {
        try {
          const [roster, requests] = await Promise.all([
            groupService.getGroupRoster(g.id),
            groupService.getGroupJoinRequests(g.id)
          ]);

          const mappedRequests: GroupMember[] = requests.map(r => ({
            id: String(r.user_id),
            name: r.name || 'Unknown Member',
            email: r.email || 'Unknown Email',
            joinedDate: r.joined_at ? r.joined_at.split('T')[0] : '',
            avatar: r.avatar || undefined,
          }));

          setGroups(prev => prev.map(item => item.id === g.id ? {
            ...item,
            membersCount: roster.length,
            pendingRequests: mappedRequests
          } : item));
        } catch (err) {
          console.warn(`Failed to fetch details for group ${g.id}:`, err);
        }
      }
    } catch (err: any) {
      console.error("Failed to load study groups:", err);
      setGroupsError("Failed to load study groups from server.");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [isLoadingActiveRooms, setIsLoadingActiveRooms] = useState(false);

  const loadActiveRooms = async () => {
    try {
      setIsLoadingActiveRooms(true);
      const res = await roomService.getMyActiveRooms();
      if (Array.isArray(res)) {
        setActiveRooms(res);
      }
    } catch (err) {
      console.error('Failed to load active rooms:', err);
    } finally {
      setIsLoadingActiveRooms(false);
    }
  };

  useEffect(() => {
    loadGroups();
    loadQuizzes();
    loadExams();
    loadActiveRooms();
  }, []);

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Group Create/Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HostGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('GraduationCap');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupJoinCode, setGroupJoinCode] = useState('');
  const [groupIsLocked, setGroupIsLocked] = useState(false);

  // Roster Management Modal State
  const [rosterGroup, setRosterGroup] = useState<HostGroup | null>(null);
  const [rosterTab, setRosterTab] = useState<'enrolled' | 'pending'>('enrolled');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Exams State
  const [exams, setExams] = useState<HostAssignedExam[]>([]);

  const [examSearchTerm, setExamSearchTerm] = useState('');

  // Group Filters
  const [groupSizeFilter, setGroupSizeFilter] = useState('All Sizes');
  const [groupStatusFilter, setGroupStatusFilter] = useState('All Status');

  // Exam Filters
  const [examStatusFilter, setExamStatusFilter] = useState('All Status');
  const [examSubjectFilter, setExamSubjectFilter] = useState('All Subjects');

  const examSubjects = ['All Subjects', ...Array.from(new Set(exams.map(e => e.subject).filter(Boolean)))];

  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<HostAssignedExam | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [examDue, setExamDue] = useState('');
  const [examDuration, setExamDuration] = useState<number>(60);
  const [examStatus, setExamStatus] = useState<'Pending' | 'Active' | 'Closed'>('Pending');
  const [navigationRule, setNavigationRule] = useState<'FREE_NAV' | 'FIXED_NAV'>('FREE_NAV');
  const [resultsPublished, setResultsPublished] = useState<boolean>(false);
  const [useAiQuestion, setUseAiQuestion] = useState<boolean>(false);

  // Submissions Modal State
  const [submissionsModalExam, setSubmissionsModalExam] = useState<HostAssignedExam | null>(null);
  const [submissionsViewTab, setSubmissionsViewTab] = useState<'roster' | 'analytics'>('roster');
  const [editingSubmissionMemberId, setEditingSubmissionMemberId] = useState<string | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);
  const [isLoadingMissed, setIsLoadingMissed] = useState(false);
  const [tempScore, setTempScore] = useState('');

  // Student Submission Details Modal State
  const [isSubDetailsModalOpen, setIsSubDetailsModalOpen] = useState(false);
  const [selectedSubMemberId, setSelectedSubMemberId] = useState<string | null>(null);
  const [subDetails, setSubDetails] = useState<any | null>(null);
  const [isLoadingSubDetails, setIsLoadingSubDetails] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [customScore, setCustomScore] = useState<number | string>('');
  // Track per-question partial score inputs: { [questionId]: string }
  const [questionScoreInputs, setQuestionScoreInputs] = useState<Record<number, string>>({});

  // 1. Auto-open Edit Exam Modal when navigated from Global Search
  useEffect(() => {
    const pendingExamId = sessionStorage.getItem('selected_host_exam_id');
    if (pendingExamId && exams.length > 0) {
      const targetExam = exams.find((e) => String(e.id) === String(pendingExamId));
      if (targetExam) {
        setEditingExam(targetExam);
        setExamTitle(targetExam.title || '');
        setSelectedQuizId(targetExam.quizId || '');
        setSelectedGroupId(targetExam.groupId || '');
        setExamDue(targetExam.due || '');
        setExamDuration(targetExam.duration || 60);
        setExamStatus(targetExam.status || 'Active');
        setNavigationRule(targetExam.navigationRule || 'FREE_NAV');
        setResultsPublished(targetExam.resultsPublished || false);
        setIsExamModalOpen(true);
      }
      sessionStorage.removeItem('selected_host_exam_id');
    }
  }, [exams]);

  // 2. Auto-open Edit Group Modal when navigated from Global Search
  useEffect(() => {
    const pendingGroupId = sessionStorage.getItem('selected_group_id');
    if (pendingGroupId && groups.length > 0) {
      const targetGroup = groups.find((g) => String(g.id) === String(pendingGroupId));
      if (targetGroup) {
        setEditingGroup(targetGroup);
        setGroupName(targetGroup.name || '');
        setGroupIcon(targetGroup.icon || 'GraduationCap');
        setGroupDescription(targetGroup.description || '');
        setGroupJoinCode(targetGroup.joinCode || targetGroup.id);
        setGroupIsLocked(targetGroup.isLocked || false);
        setIsGroupModalOpen(true);
      }
      sessionStorage.removeItem('selected_group_id');
    }
  }, [groups]);

  // Export Excel Helpers (.xls HTML Table Spreadsheet with UTF-8 BOM for Vietnamese support)
  const handleExportGroupExcel = async (group: HostGroup) => {
    let membersToExport: GroupMember[] = group.members || [];

    // If members not loaded yet in state, fetch roster on-the-fly from backend
    if (membersToExport.length === 0) {
      try {
        const roster = await groupService.getGroupRoster(group.id);
        membersToExport = roster.map((m) => ({
          id: String(m.id),
          name: m.name || 'Unknown Member',
          email: m.email || 'Unknown Email',
          joinedDate: m.joined_at ? m.joined_at.split('T')[0] : '',
          avatar: m.avatar || undefined,
          examsCompleted: m.examsCompleted ?? 0,
          totalExamsAssigned: m.totalExamsAssigned ?? 0,
          averageScore: m.averageScore || 'N/A',
          examScores: (m.examScores || []).map((es) => ({
            examId: es.examTitle,
            examTitle: es.examTitle,
            score: es.score,
            date: es.completedAt || '',
            status: es.status as any,
            completedAt: es.completedAt || '',
            timeTaken: es.timeTaken || '',
          })),
        }));
      } catch (err) {
        console.error("Failed to fetch group roster for Excel export:", err);
      }
    }

    // Determine Group Owner info
    let currentUser: { name?: string; email?: string } | null = null;
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) currentUser = JSON.parse(savedUserStr);
    } catch (e) {}

    const ownerNameDisplay = group.ownerName || currentUser?.name || currentUser?.email || 'Unknown Host';
    const ownerEmailDisplay = group.ownerEmail || (group.ownerName ? '' : (currentUser?.email || ''));
    const ownerFullString = ownerEmailDisplay ? `${ownerNameDisplay} (${ownerEmailDisplay})` : ownerNameDisplay;

    // Collect all unique exam titles for this group
    const uniqueExams: string[] = [];

    // 1. Add all exams assigned to this group in the system
    exams
      .filter((e) => String(e.groupId) === String(group.id))
      .forEach((e) => {
        if (e.title && !uniqueExams.includes(e.title)) {
          uniqueExams.push(e.title);
        }
      });

    // 2. Add any additional exams present in members' score records
    membersToExport.forEach((m) => {
      (m.examScores || []).forEach((es) => {
        if (es.examTitle && !uniqueExams.includes(es.examTitle)) {
          uniqueExams.push(es.examTitle);
        }
      });
    });

    const fixedColCount = 5; // No., Full Name, Member Email, Exams Completed, Average Score
    const totalCols = fixedColCount + Math.max(uniqueExams.length, 1);

    const exportTimestamp = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Group Roster</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #059669; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #d1d5db; padding: 8px; }
          td { border: 1px solid #e5e7eb; padding: 6px; vertical-align: middle; }
          .title { font-size: 16pt; font-weight: bold; color: #047857; text-align: center; }
          .header-bg { background-color: #ecfdf5; font-weight: bold; }
          .meta-label { font-weight: bold; color: #065f46; background-color: #d1fae5; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="${totalCols}" class="title">STUDY GROUP ROSTER REPORT</td></tr>
          <tr><td colspan="${totalCols}" style="text-align: center; font-style: italic; color: #6b7280;">Study Group Grade Summary Report - Export Time: ${exportTimestamp}</td></tr>
          <tr></tr>
          <tr class="header-bg">
            <td class="meta-label">Group Name:</td>
            <td colspan="2"><b>${group.name}</b></td>
            <td class="meta-label">Group Owner:</td>
            <td colspan="${Math.max(totalCols - 4, 1)}"><b>${ownerFullString}</b></td>
          </tr>
          <tr class="header-bg">
            <td class="meta-label">Join Code:</td>
            <td colspan="2"><b>${group.joinCode || group.id}</b></td>
            <td class="meta-label">Export Time:</td>
            <td colspan="${Math.max(totalCols - 4, 1)}"><b>${exportTimestamp}</b></td>
          </tr>
          <tr class="header-bg">
            <td class="meta-label">Total Members:</td>
            <td colspan="2"><b>${membersToExport.length} Members</b></td>
            <td class="meta-label">Description:</td>
            <td colspan="${Math.max(totalCols - 4, 1)}">${group.description || 'No description provided'}</td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th style="width: 45px;">No.</th>
              <th style="width: 180px;">Full Name</th>
              <th style="width: 220px;">Member Email</th>
              <th style="width: 140px;">Joined Date</th>
              <th style="width: 110px;">Average Score</th>
              ${uniqueExams.length > 0
                ? uniqueExams.map((title) => `<th style="min-width: 160px;">${title}</th>`).join('')
                : '<th style="width: 180px;">Detailed Scores</th>'}
            </tr>
          </thead>
          <tbody>
            ${membersToExport.length > 0 ? membersToExport.map((m, idx) => {
              // Build lookup dictionary of examTitle -> details
              const scoreMap: Record<string, { score: string; status: string; completedAt?: string; timeTaken?: string }> = {};
              (m.examScores || []).forEach((es) => {
                if (es.examTitle) {
                  scoreMap[es.examTitle] = {
                    score: es.score,
                    status: es.status,
                    completedAt: es.completedAt || es.date,
                    timeTaken: es.timeTaken
                  };
                }
              });

              const examCells = uniqueExams.length > 0
                ? uniqueExams.map((title) => {
                    const item = scoreMap[title];
                    const val = item?.score;
                    const isPassed = val && val !== 'N/A' && val !== '--' && val !== 'Pending' && !val.includes('Missed');
                    
                    let detailsText = '';
                    if (item?.completedAt) {
                      detailsText += `<br/><span style="font-size: 8pt; font-weight: normal; color: #4b5563;">Done: ${item.completedAt}</span>`;
                    }
                    if (item?.timeTaken) {
                      detailsText += `<br/><span style="font-size: 8pt; font-weight: normal; color: #6b7280;">Time: ${item.timeTaken}</span>`;
                    }

                    return `<td style="text-align: center; font-weight: bold; ${isPassed ? 'color: #047857;' : 'color: #6b7280;'}">
                      <div>${val || '—'}</div>
                      ${detailsText}
                    </td>`;
                  }).join('')
                : '<td style="text-align: center; color: #9ca3af;">No exams taken</td>';

              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><b>${m.name}</b></td>
                  <td>${m.email}</td>
                  <td style="text-align: center;">${m.joinedDate || '—'}</td>
                  <td style="text-align: center; font-weight: bold; color: #047857;">${m.averageScore || 'N/A'}</td>
                  ${examCells}
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="${totalCols}" style="text-align: center; font-style: italic; color: #9ca3af; padding: 12px;">No members in this group yet.</td>
              </tr>
            `}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Prepend UTF-8 BOM so Excel opens Vietnamese characters correctly without encoding issues
    const blob = new Blob(['\uFEFF' + htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Group_Roster_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExamExcel = async (exam: HostAssignedExam) => {
    let submissions = exam.submissions || [];
    let analyticsData: any[] = [];

    try {
      const [detail, missed] = await Promise.all([
        submissions.length === 0 ? examService.getExamDetails(exam.id) : Promise.resolve(null),
        examService.getMissedQuestions(exam.id).catch(() => [])
      ]);

      if (detail && detail.assignees) {
        submissions = detail.assignees.map((a: any) => {
          let mStatus: 'Not Started' | 'In Progress' | 'Submitted' = 'Not Started';
          const backStatus = (a.status || '').toLowerCase();
          if (backStatus.includes('submit') || backStatus.includes('complete')) mStatus = 'Submitted';
          else if (backStatus.includes('progress') || backStatus.includes('start')) mStatus = 'In Progress';

          return {
            memberId: String(a.user_id),
            memberName: a.user_fullname || `User ${a.user_id}`,
            memberEmail: a.user_email || `user_${a.user_id}@example.com`,
            status: mStatus,
            score: a.score !== null && a.score !== undefined ? `${a.score}%` : 'N/A',
            submittedAt: a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '-'
          };
        });
      }

      if (Array.isArray(missed)) {
        analyticsData = missed;
      }
    } catch (err) {
      console.warn("Failed to fetch live exam details for export:", err);
    }

    const exportTimestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Exam Report</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #059669; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #d1d5db; padding: 8px; }
          td { border: 1px solid #e5e7eb; padding: 6px; vertical-align: middle; }
          .title { font-size: 16pt; font-weight: bold; color: #047857; text-align: center; }
          .header-bg { background-color: #ecfdf5; font-weight: bold; }
          .section-title { font-size: 13pt; font-weight: bold; color: #065f46; background-color: #f0fdf4; padding: 8px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="title">EXAM STATISTICAL REPORT AND GRADEBOOK</td></tr>
          <tr><td colspan="6" style="text-align: center; font-style: italic; color: #6b7280;">Exported at: ${exportTimestamp}</td></tr>
          <tr></tr>
          <tr class="header-bg">
            <td colspan="2">Exam Title:</td>
            <td colspan="4"><b>${exam.title}</b></td>
          </tr>
          <tr>
            <td colspan="2">Subject:</td>
            <td colspan="2">${exam.subject}</td>
            <td>Duration:</td>
            <td>${exam.duration} mins</td>
          </tr>
          <tr>
            <td colspan="2">Group:</td>
            <td colspan="2">${exam.groupName}</td>
            <td>Status:</td>
            <td>${exam.status}</td>
          </tr>
          <tr>
            <td colspan="2">Due Date:</td>
            <td colspan="2">${exam.due || 'No Deadline'}</td>
            <td>Submission Rate:</td>
            <td>${exam.submittedCount} / ${exam.totalMembers} Members</td>
          </tr>
          <tr></tr>
          <tr><td colspan="6" class="section-title">I. DETAILED MEMBER GRADEBOOK</td></tr>
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th style="width: 200px;">Full Name</th>
              <th style="width: 240px;">Member Email</th>
              <th style="width: 120px;">Status</th>
              <th style="width: 100px;">Score</th>
              <th style="width: 180px;">Submission Time</th>
            </tr>
          </thead>
          <tbody>
            ${submissions.length > 0 ? submissions.map((sub, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><b>${sub.memberName}</b></td>
                <td>${sub.memberEmail}</td>
                <td style="text-align: center;">${sub.status}</td>
                <td style="text-align: center; font-weight: bold; color: #047857;">${sub.score || 'N/A'}</td>
                <td style="text-align: center;">${sub.submittedAt || '-'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; font-style: italic; color: #9ca3af; padding: 12px;">No student submissions found.</td>
              </tr>
            `}
          </tbody>
          <tr></tr>
          <tr><td colspan="6" class="section-title">II. MOST MISSED QUESTIONS STATISTICS</td></tr>
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th style="width: 280px;">Question Text</th>
              <th style="width: 120px;">Incorrect Count</th>
              <th style="width: 100px;">Error Rate</th>
              <th style="width: 220px;">Common Misconception</th>
              <th style="width: 220px;">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            ${analyticsData.length > 0 ? analyticsData.map((q, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><b>${q.question || 'Untitled Question'}</b></td>
                <td style="text-align: center;">${q.wrongCount} / ${q.totalCount}</td>
                <td style="text-align: center; font-weight: bold; color: #dc2626;">${q.wrongPercentage}%</td>
                <td style="color: #991b1b;">${q.commonWrongAnswer || 'N/A'}</td>
                <td style="color: #065f46; font-weight: bold;">${q.correctAnswer || 'N/A'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; font-style: italic; color: #9ca3af; padding: 12px;">No missed question data available.</td>
              </tr>
            `}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Prepend UTF-8 BOM so Excel opens Vietnamese characters in titles/names without encoding issues
    const blob = new Blob(['\uFEFF' + htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Exam_Gradebook_${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Code Handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Toggle Group Lock Handler
  const handleToggleLock = async (groupId: string) => {
    const groupToToggle = groups.find(g => g.id === groupId);
    if (!groupToToggle) return;
    const nextLocked = !groupToToggle.isLocked;
    const nextStatus = nextLocked ? 'CLOSED' : 'OPEN';

    try {
      await groupService.updateGroup(groupId, { status: nextStatus });
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, isLocked: nextLocked } : g))
      );
      if (rosterGroup && rosterGroup.id === groupId) {
        setRosterGroup((prev) => (prev ? { ...prev, isLocked: nextLocked } : null));
      }
    } catch (err) {
      console.error("Failed to toggle group lock:", err);
      alert("Failed to update group status on server.");
    }
  };

  // Handlers for Group Modal (Create / Edit)
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupIcon('GraduationCap');
    setGroupDescription('');
    setGroupJoinCode('AUTO-GENERATED');
    setGroupIsLocked(false);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditModal = (group: HostGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupIcon(group.icon || 'GraduationCap');
    setGroupDescription(group.description || '');
    setGroupJoinCode(group.joinCode || group.id);
    setGroupIsLocked(group.isLocked || false);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const finalStatus = groupIsLocked ? 'CLOSED' : 'OPEN';

      if (editingGroup) {
        const bg = await groupService.updateGroup(editingGroup.id, {
          name: groupName.trim(),
          description: groupDescription.trim(),
          icon: groupIcon,
          status: finalStatus
        });

        setGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? {
                ...g,
                name: bg.name,
                description: bg.description || '',
                isLocked: bg.status === 'CLOSED',
                icon: bg.icon || 'GraduationCap',
              }
              : g
          )
        );
        if (rosterGroup && rosterGroup.id === editingGroup.id) {
          setRosterGroup((prev) =>
            prev
              ? {
                ...prev,
                name: bg.name,
                description: bg.description || '',
                isLocked: bg.status === 'CLOSED',
                icon: bg.icon || 'GraduationCap',
              }
              : null
          );
        }
      } else {
        const bg = await groupService.createGroup({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          icon: groupIcon,
          status: finalStatus
        });

        const newGroup: HostGroup = {
          id: String(bg.id),
          name: bg.name,
          description: bg.description || 'No description provided.',
          joinCode: bg.group_code,
          isLocked: bg.status === 'CLOSED',
          icon: bg.icon || 'GraduationCap',
          membersCount: 0,
          members: [],
          pendingRequests: [],
        };
        setGroups((prev) => [...prev, newGroup]);
      }
      setIsGroupModalOpen(false);
    } catch (err) {
      console.error("Failed to save study group:", err);
      alert("Failed to save study group to server.");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await groupService.deleteGroup(groupId);
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (rosterGroup && rosterGroup.id === groupId) {
          setRosterGroup(null);
        }
      } catch (err) {
        console.error("Failed to delete group:", err);
        alert("Failed to delete group from server.");
      }
    }
  };

  // Handlers for Roster Management
  const handleOpenRosterModal = async (group: HostGroup, initialTab: 'enrolled' | 'pending' = 'enrolled') => {
    setRosterGroup(group);
    setRosterTab(initialTab);
    setNewMemberName('');
    setNewMemberEmail('');

    try {
      const [roster, requests] = await Promise.all([
        groupService.getGroupRoster(group.id),
        groupService.getGroupJoinRequests(group.id)
      ]);

      const updatedMembers: GroupMember[] = roster.map(m => ({
        id: String(m.id),
        name: m.name,
        email: m.email,
        joinedDate: m.joined_at ? m.joined_at.split('T')[0] : '',
        avatar: m.avatar || undefined,
        examsCompleted: m.examsCompleted,
        totalExamsAssigned: m.totalExamsAssigned,
        averageScore: m.averageScore,
        examScores: m.examScores.map(es => ({
          examId: es.examTitle,
          examTitle: es.examTitle,
          score: es.score,
          date: es.completedAt || '',
          status: es.status as any,
          completedAt: es.completedAt || '',
          timeTaken: es.timeTaken || ''
        }))
      }));

      const updatedRequests: GroupMember[] = requests.map(r => ({
        id: String(r.user_id),
        name: r.name || 'Unknown Member',
        email: r.email || 'Unknown Email',
        joinedDate: r.joined_at ? r.joined_at.split('T')[0] : '',
        avatar: r.avatar || undefined,
      }));

      const updatedGroup: HostGroup = {
        ...group,
        members: updatedMembers,
        membersCount: updatedMembers.length,
        pendingRequests: updatedRequests
      };

      setRosterGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g));
    } catch (err) {
      console.error("Failed to fetch roster details:", err);
    }
  };

  const handleBulkApprove = async () => {
    if (!rosterGroup || !rosterGroup.pendingRequests || rosterGroup.pendingRequests.length === 0) return;
    if (window.confirm(`Are you sure you want to approve all ${rosterGroup.pendingRequests.length} pending requests?`)) {
      try {
        await groupService.bulkApproveJoinRequests(rosterGroup.id, true);

        const updatedMembers = [...(rosterGroup.members || []), ...rosterGroup.pendingRequests];
        const updatedGroup: HostGroup = {
          ...rosterGroup,
          members: updatedMembers,
          membersCount: updatedMembers.length,
          pendingRequests: [],
        };

        setRosterGroup(updatedGroup);
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      } catch (err) {
        console.error("Failed to bulk approve:", err);
        alert("Failed to approve all requests on server.");
      }
    }
  };

  const handleBulkReject = async () => {
    if (!rosterGroup || !rosterGroup.pendingRequests || rosterGroup.pendingRequests.length === 0) return;
    if (window.confirm(`Are you sure you want to decline all ${rosterGroup.pendingRequests.length} pending requests?`)) {
      try {
        await groupService.bulkRejectJoinRequests(rosterGroup.id, true);

        const updatedGroup: HostGroup = {
          ...rosterGroup,
          pendingRequests: [],
        };

        setRosterGroup(updatedGroup);
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      } catch (err) {
        console.error("Failed to bulk reject:", err);
        alert("Failed to reject all requests on server.");
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterGroup || !newMemberEmail.trim()) return;

    try {
      await groupService.inviteMember(rosterGroup.id, newMemberEmail.trim());
      alert(`Invitation sent successfully to ${newMemberEmail}! The member will be added once they accept the invitation.`);
      setNewMemberEmail('');
    } catch (err: any) {
      console.error("Failed to invite member:", err);
      alert(err?.response?.data?.detail || "Failed to send invitation on server.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!rosterGroup) return;

    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        await groupService.removeMember(rosterGroup.id, memberId);

        const updatedMembers = (rosterGroup.members || []).filter((m) => m.id !== memberId);

        const updatedGroup: HostGroup = {
          ...rosterGroup,
          members: updatedMembers,
          membersCount: updatedMembers.length,
        };

        setRosterGroup(updatedGroup);
        setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      } catch (err: any) {
        console.error("Failed to remove member from group:", err);
        alert(err?.response?.data?.detail || "Failed to remove member on server.");
      }
    }
  };

  // Member Approval Handlers
  const handleApproveMember = async (member: GroupMember) => {
    if (!rosterGroup) return;

    try {
      await groupService.approveJoinRequest(rosterGroup.id, member.id);

      const updatedPending = (rosterGroup.pendingRequests || []).filter((p) => p.id !== member.id);
      const updatedMembers = [...(rosterGroup.members || []), member];

      const updatedGroup: HostGroup = {
        ...rosterGroup,
        members: updatedMembers,
        membersCount: updatedMembers.length,
        pendingRequests: updatedPending,
      };

      setRosterGroup(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch (err) {
      console.error("Failed to approve member:", err);
      alert("Failed to approve join request on server.");
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!rosterGroup) return;

    try {
      await groupService.rejectJoinRequest(rosterGroup.id, memberId);

      const updatedPending = (rosterGroup.pendingRequests || []).filter((p) => p.id !== memberId);

      const updatedGroup: HostGroup = {
        ...rosterGroup,
        pendingRequests: updatedPending,
      };

      setRosterGroup(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch (err) {
      console.error("Failed to reject member:", err);
      alert("Failed to reject join request on server.");
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.joinCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const count = g.membersCount ?? g.members?.length ?? 0;
    let matchesSize = true;
    if (groupSizeFilter === 'Small (< 5 members)') {
      matchesSize = count < 5;
    } else if (groupSizeFilter === 'Medium (5 - 20 members)') {
      matchesSize = count >= 5 && count <= 20;
    } else if (groupSizeFilter === 'Large (> 20 members)') {
      matchesSize = count > 20;
    }

    let matchesStatus = true;
    if (groupStatusFilter === 'Open') {
      matchesStatus = !g.isLocked;
    } else if (groupStatusFilter === 'Closed') {
      matchesStatus = !!g.isLocked;
    }

    return matchesSearch && matchesSize && matchesStatus;
  });

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
      quiz.category.toLowerCase().includes(quizSearchTerm.toLowerCase());
      
    const matchesDifficulty =
      quizDifficultyFilter === 'All Difficulty' ||
      quiz.level.toLowerCase() === quizDifficultyFilter.toLowerCase();

    let matchesQuestions = true;
    if (quizQuestionFilter === '< 10 Questions') {
      matchesQuestions = quiz.questions < 10;
    } else if (quizQuestionFilter === '10 - 25 Questions') {
      matchesQuestions = quiz.questions >= 10 && quiz.questions <= 25;
    } else if (quizQuestionFilter === '> 25 Questions') {
      matchesQuestions = quiz.questions > 25;
    }

    return matchesSearch && matchesDifficulty && matchesQuestions;
  });

  // Exam Handlers
  const handleOpenAssignExamModal = () => {
    setEditingExam(null);
    setExamTitle('');
    setSelectedQuizId(quizzes[0]?.id || '');
    setSelectedGroupId(groups[0]?.id || '');
    setExamDue('');
    setExamDuration(60);
    setExamStatus('Pending');
    setNavigationRule('FREE_NAV');
    setResultsPublished(false);
    setUseAiQuestion(false);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExamModal = (exam: HostAssignedExam) => {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setSelectedQuizId(exam.quizId);
    setSelectedGroupId(exam.groupId);
    setExamDue(exam.due);
    setExamDuration(exam.duration);
    setExamStatus(exam.status);
    setNavigationRule(exam.navigationRule || 'FREE_NAV');
    setResultsPublished(exam.resultsPublished || false);
    setUseAiQuestion(exam.useAiQuestion || false);
    setIsExamModalOpen(true);
  };

  const handleToggleExamStatus = async (examId: number) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    const nextStatus: 'Pending' | 'Active' | 'Closed' =
      exam.status === 'Pending' ? 'Active' : exam.status === 'Active' ? 'Closed' : 'Pending';
      
    const backendStatus = nextStatus === 'Active' ? 'ACTIVE' : nextStatus === 'Pending' ? 'PENDING' : 'CLOSED';

    try {
      await examService.updateExam(examId, { status: backendStatus });
      await loadExams();
    } catch (err) {
      console.error("Failed to toggle exam status:", err);
      alert("Failed to update status on server.");
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    if (!selectedGroup || !selectedQuiz) return;

    const finalTitle = examTitle.trim() || selectedQuiz.title;
    const rawQuizId = Number(selectedQuiz.id.replace('QZ-', ''));
    const rawGroupId = Number(selectedGroup.id);

    try {
      if (editingExam) {
        await examService.updateExam(editingExam.id, {
          quiz_id: rawQuizId,
          group_id: rawGroupId,
          title: finalTitle,
          timer: examDuration,
          end_time: examDue ? new Date(examDue).toISOString() : undefined,
          status: examStatus === 'Active' ? 'ACTIVE' : examStatus === 'Pending' ? 'PENDING' : 'CLOSED',
          navigation_rule: navigationRule,
          results_published: resultsPublished,
          use_ai_question: useAiQuestion
        });
      } else {
        await examService.assignExam({
          quiz_id: rawQuizId,
          group_id: rawGroupId,
          title: finalTitle,
          start_time: new Date().toISOString(),
          end_time: examDue ? new Date(examDue).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          timer: examDuration,
          navigation_rule: navigationRule,
          results_published: resultsPublished,
          status: 'ACTIVE',
          use_ai_question: useAiQuestion
        });
      }
      setIsExamModalOpen(false);
      await loadExams();
    } catch (err) {
      console.error("Failed to save exam:", err);
      alert("Failed to save exam to server.");
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm('Are you sure you want to cancel this assigned exam?')) {
      try {
        await examService.deleteExam(examId);
        await loadExams();
      } catch (err) {
        console.error("Failed to delete exam:", err);
        alert("Failed to cancel assigned exam on server.");
      }
    }
  };

  const handleOpenSubmissionsModal = async (exam: HostAssignedExam) => {
    try {
      setSubmissionsModalExam(exam);
      setSubmissionsViewTab('roster');
      setMissedQuestions([]);
      setIsLoadingMissed(true);
      
      const [detail, missed] = await Promise.all([
        examService.getExamDetails(exam.id),
        examService.getMissedQuestions(exam.id).catch(() => [])
      ]);
      
      if (detail && detail.assignees) {
        const mappedSubmissions = detail.assignees.map((a: any) => {
          let mStatus: 'Not Started' | 'In Progress' | 'Submitted' = 'Not Started';
          const backStatus = (a.status || '').toLowerCase();
          if (backStatus.includes('submit') || backStatus.includes('complete')) mStatus = 'Submitted';
          else if (backStatus.includes('progress') || backStatus.includes('start')) mStatus = 'In Progress';
          
          return {
            memberId: String(a.user_id),
            memberName: a.user_fullname || `User ${a.user_id}`,
            memberEmail: a.user_email || `user_${a.user_id}@example.com`,
            status: mStatus,
            score: a.score !== null ? `${a.score}` : undefined,
            submittedAt: a.submitted_at ? new Date(a.submitted_at).toLocaleString() : undefined
          };
        });
        
        const updatedExam = {
          ...exam,
          submissions: mappedSubmissions
        };
        setSubmissionsModalExam(updatedExam);
        setExams((prev) => prev.map((ex) => (ex.id === exam.id ? updatedExam : ex)));
      }
      
      if (missed) {
        setMissedQuestions(missed);
      }
    } catch (err) {
      console.error("Failed to load exam details for submissions:", err);
    } finally {
      setIsLoadingMissed(false);
    }
  };

  const handleResetSubmission = async (memberId: string) => {
    if (!submissionsModalExam) return;
    
    if (window.confirm("Are you sure you want to reset this student's exam attempt? This will permanently delete all their submitted answers and allow them to take the exam again from scratch.")) {
      try {
        await examService.resetSubmission(submissionsModalExam.id, memberId);
        
        const updated = {
          ...submissionsModalExam,
          submissions: (submissionsModalExam.submissions || []).map((s) =>
            s.memberId === memberId ? { ...s, status: 'Not Started' as const, score: undefined, submittedAt: undefined } : s
          ),
          submittedCount: Math.max(0, submissionsModalExam.submittedCount - 1),
        };
        
        setSubmissionsModalExam(updated);
        setExams((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
        alert("Exam attempt reset successfully.");
      } catch (err) {
        console.error("Failed to reset student exam attempt:", err);
        alert("Failed to reset student exam attempt. Please try again.");
      }
    }
  };

  const handleSaveScore = (memberId: string) => {
    if (!submissionsModalExam) return;
    const updated = {
      ...submissionsModalExam,
      submissions: (submissionsModalExam.submissions || []).map((s) =>
        s.memberId === memberId ? { ...s, score: tempScore } : s
      ),
    };
    setSubmissionsModalExam(updated);
    setExams((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
    setEditingSubmissionMemberId(null);
    setTempScore('');
  };

  const handleOpenSubmissionDetails = async (memberId: string) => {
    if (!submissionsModalExam) return;
    try {
      setIsLoadingSubDetails(true);
      setSelectedSubMemberId(memberId);
      setIsSubDetailsModalOpen(true);
      setSubDetails(null);
      
      const res = await examService.getSubmissionDetails(submissionsModalExam.id, memberId);
      if (res) {
        setSubDetails(res);
        setFeedbackComment(res.feedback_comment || '');
        setCustomScore(res.score !== null ? res.score : '');
        // Pre-fill per-question score inputs from existing answer scores
        const initialScores: Record<number, string> = {};
        res.questions.forEach((q: any) => {
          if (q.user_answer?.answer_score !== undefined && q.user_answer?.answer_score !== null) {
            initialScores[q.id] = String(q.user_answer.answer_score);
          }
        });
        setQuestionScoreInputs(initialScores);
      }
    } catch (err) {
      console.error("Failed to load submission details:", err);
      alert("Failed to load student submission details from server.");
      setIsSubDetailsModalOpen(false);
    } finally {
      setIsLoadingSubDetails(false);
    }
  };

  const handleSaveFeedbackAndGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionsModalExam || !selectedSubMemberId) return;
    
    try {
      const parsedScore = customScore === '' ? null : Number(customScore);
      const res = await examService.saveSubmissionFeedback(submissionsModalExam.id, selectedSubMemberId, {
        feedback_comment: feedbackComment,
        score: parsedScore
      });
      
      if (res) {
        const updatedSubmissions = (submissionsModalExam.submissions || []).map((s) =>
          s.memberId === selectedSubMemberId ? { ...s, score: res.score !== null ? `${res.score}` : undefined } : s
        );
        const updatedExam = {
          ...submissionsModalExam,
          submissions: updatedSubmissions
        };
        
        setSubmissionsModalExam(updatedExam);
        setExams((prev) => prev.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex)));
        
        if (subDetails) {
          setSubDetails({
            ...subDetails,
            score: res.score,
            feedback_comment: res.feedback_comment
          });
        }
        
        alert("Feedback and score saved successfully!");
        setIsSubDetailsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save feedback and grade:", err);
      alert("Failed to save feedback and grade to server.");
    }
  };

  const handleGradeAnswer = async (questionId: number, isCorrect: boolean, partialScore?: number | null) => {
    if (!submissionsModalExam || !selectedSubMemberId) return;
    try {
      const res = await examService.gradeAnswer(
        submissionsModalExam.id,
        selectedSubMemberId,
        questionId,
        { is_correct: isCorrect, score: partialScore ?? undefined }
      );

      if (res) {
        // Update the question's user_answer in local state
        if (subDetails) {
          const updatedQuestions = subDetails.questions.map((q: any) => {
            if (q.id === questionId) {
              return {
                ...q,
                user_answer: q.user_answer
                  ? { ...q.user_answer, is_correct: res.is_correct, answer_score: res.answer_score }
                  : q.user_answer,
              };
            }
            return q;
          });
          setSubDetails({
            ...subDetails,
            score: res.overall_score,
            questions: updatedQuestions,
          });
        }

        // Sync score in the roster list
        if (res.overall_score !== null) {
          const updatedSubmissions = (submissionsModalExam.submissions || []).map((s) =>
            s.memberId === selectedSubMemberId
              ? { ...s, score: `${res.overall_score}%` }
              : s
          );
          setSubmissionsModalExam({ ...submissionsModalExam, submissions: updatedSubmissions });
          setExams((prev) =>
            prev.map((ex) =>
              ex.id === submissionsModalExam.id
                ? { ...ex, submissions: updatedSubmissions }
                : ex
            )
          );
          setCustomScore(res.overall_score);
        }
      }
    } catch (err) {
      console.error("Failed to grade answer:", err);
      alert("Failed to save answer grade. Please try again.");
    }
  };

  const HOST_ITEMS_PER_PAGE = 6;
  const [quizPage, setQuizPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  useEffect(() => { setQuizPage(1); }, [quizSearchTerm, quizDifficultyFilter, quizQuestionFilter]);
  useEffect(() => { setGroupPage(1); }, [searchTerm, groupSizeFilter, groupStatusFilter]);
  useEffect(() => { setExamPage(1); }, [examSearchTerm, examSubjectFilter, examStatusFilter]);

  const filteredExams = exams.filter((ex) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      ex.subject.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      ex.groupName.toLowerCase().includes(examSearchTerm.toLowerCase());

    const matchesStatus =
      examStatusFilter === 'All Status' || ex.status === examStatusFilter;

    const matchesSubject =
      examSubjectFilter === 'All Subjects' || ex.subject === examSubjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const totalQuizPages = Math.ceil(filteredQuizzes.length / HOST_ITEMS_PER_PAGE) || 1;
  const paginatedQuizzes = filteredQuizzes.slice((quizPage - 1) * HOST_ITEMS_PER_PAGE, quizPage * HOST_ITEMS_PER_PAGE);

  const totalGroupPages = Math.ceil(filteredGroups.length / HOST_ITEMS_PER_PAGE) || 1;
  const paginatedGroups = filteredGroups.slice((groupPage - 1) * HOST_ITEMS_PER_PAGE, groupPage * HOST_ITEMS_PER_PAGE);

  const totalExamPages = Math.ceil(filteredExams.length / HOST_ITEMS_PER_PAGE) || 1;
  const paginatedExams = filteredExams.slice((examPage - 1) * HOST_ITEMS_PER_PAGE, examPage * HOST_ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 sm:space-y-8 text-left">
      {/* Host Header Banner */}
      <div className="bg-gradient-to-r from-secondary via-emerald-600 to-teal-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2 min-w-0">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Host Studio
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Host Live Quiz Sessions</h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
            Select a quiz set, configure game settings, manage member rosters, approve join requests, and launch real-time rooms.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
          <button
            onClick={onCreateQuiz}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all border border-white/30 flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4" /> Create New Quiz
          </button>
          <button
            onClick={onOpenHostRoomModal}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-white text-secondary hover:bg-emerald-50 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> Launch Live Room
          </button>
        </div>
      </div>

      {/* 🔴 Active Live Rooms Management Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center relative shrink-0">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping absolute" />
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full relative" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                <span>Active Live Rooms</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-black uppercase">
                  {activeRooms.length} Live
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-1 sm:line-clamp-none">
                Manage live rooms simultaneously. Re-enter control panels or close active sessions anytime.
              </p>
            </div>
          </div>
          <button
            onClick={loadActiveRooms}
            disabled={isLoadingActiveRooms}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            Refresh List
          </button>
        </div>

        {isLoadingActiveRooms ? (
          <div className="py-6 text-center text-xs text-slate-400 font-bold animate-pulse">
            Loading active rooms...
          </div>
        ) : activeRooms.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10 px-3">
            No active live rooms running right now. Click <strong>"Launch Live Room"</strong> above to start a new session.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {activeRooms.map((room) => {
              const isWaiting = room.status === 'WAITING';
              return (
                <div key={room.id} className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-md hover:border-indigo-400/50 transition-all text-left">
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                        PIN: {room.room_code}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isWaiting ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {isWaiting ? '⏳ Lobby Waiting' : `▶ Playing (Q${room.current_question_index})`}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white truncate">
                      {room.quiz?.title || room.title || 'Live Quiz Room'}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1.5 font-bold">
                      <span className="flex items-center gap-1">
                        👥 {room.participants_count ?? room.participants?.length ?? 0} Members
                      </span>
                      <span>•</span>
                      <span className="uppercase text-amber-300 font-extrabold">{room.mode || 'CLASSIC'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        if (isWaiting) {
                          navigate('/lobby', {
                            state: {
                              roomCode: room.room_code,
                              roomId: room.id,
                              isHost: true,
                              quizTitle: room.quiz?.title || 'Quiz'
                            }
                          });
                        } else {
                          navigate('/host-panel', {
                            state: {
                              roomCode: room.room_code,
                              roomId: room.id,
                              quizTitle: room.quiz?.title || 'Quiz',
                              progressionMode: room.progression_mode || 'manual'
                            }
                          });
                        }
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> {isWaiting ? 'Open Lobby' : 'Control Panel'}
                    </button>

                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to end room PIN: ${room.room_code}?`)) {
                          try {
                            await roomService.endRoom(room.id);
                            loadActiveRooms();
                          } catch (e) {
                            alert("Failed to end room.");
                          }
                        }
                      }}
                      className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="End and close room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex overflow-x-auto border-b border-outline-variant/30 gap-4 sm:gap-6 pb-0.5 scrollbar-none">
        <button
          onClick={() => setSubTab('quizzes')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative shrink-0 whitespace-nowrap ${
            subTab === 'quizzes' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          My Quizzes ({isLoadingQuizzes ? '...' : quizzes.length})
          {subTab === 'quizzes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>

        <button
          onClick={() => setSubTab('groups')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            subTab === 'groups' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>My Study Groups ({groups.length})</span>
          {(() => {
            const totalPending = groups.reduce((acc, g) => acc + (g.pendingRequests?.length || 0), 0);
            return totalPending > 0 ? (
              <span
                className="inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[10px] font-extrabold rounded-full animate-pulse"
                title={`${totalPending} pending join requests`}
              >
                !
              </span>
            ) : null;
          })()}

          {subTab === 'groups' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>

        <button
          onClick={() => setSubTab('exams')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative shrink-0 whitespace-nowrap ${
            subTab === 'exams' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          My Assigned Exams ({exams.length})
          {subTab === 'exams' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>
      </div>

      {/* Quizzes Tab Content */}
      {subTab === 'quizzes' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-1 w-full">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="Search quizzes by title or subject..."
                  value={quizSearchTerm}
                  onChange={(e) => setQuizSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <select
                value={quizDifficultyFilter}
                onChange={(e) => setQuizDifficultyFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 min-w-[130px]"
              >
                <option value="All Difficulty">All Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                value={quizQuestionFilter}
                onChange={(e) => setQuizQuestionFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 min-w-[140px]"
              >
                <option value="All Questions">All Questions</option>
                <option value="< 10 Questions">&lt; 10 Questions</option>
                <option value="10 - 25 Questions">10 - 25 Questions</option>
                <option value="> 25 Questions">&gt; 25 Questions</option>
              </select>
            </div>
            <button
              onClick={onCreateQuiz}
              className="w-full lg:w-auto px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-98"
            >
              <Plus className="w-4 h-4" /> Create New Quiz
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {isLoadingQuizzes ? (
              <div className="col-span-full py-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
              </div>
            ) : quizzesError ? (
              <div className="col-span-full py-8 text-center text-error text-xs font-semibold">
                {quizzesError}
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant text-sm bg-white rounded-2xl border border-dashed border-outline-variant/40">
                {quizzes.length === 0 
                  ? "No quizzes found. Create your first quiz using the Quiz Creator." 
                  : "No quizzes match the current filters."}
              </div>
            ) : (
              paginatedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white p-4 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4 flex flex-col justify-between hover:border-secondary/50 transition-all text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider truncate">{quiz.category}</span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant shrink-0">
                        {quiz.level}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-on-surface leading-tight">{quiz.title}</h3>
                    <p className="text-xs text-on-surface-variant">{quiz.questions} Questions • Ready to host</p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] text-outline font-medium">ID: {quiz.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => (onEditQuiz ? onEditQuiz(quiz.id) : onCreateQuiz())}
                        className="flex-1 sm:flex-none py-2 px-3 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold border border-outline-variant/25 sm:border-none"
                        title="Edit Quiz"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-secondary" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={onOpenHostRoomModal}
                        className="flex-1 sm:flex-none px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Host This Quiz
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quizzes Pagination Controls */}
          {totalQuizPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-outline-variant/20 text-xs text-on-surface-variant font-medium">
              <div>
                Showing <span className="font-bold text-on-surface">{(quizPage - 1) * HOST_ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-bold text-on-surface">{Math.min(quizPage * HOST_ITEMS_PER_PAGE, filteredQuizzes.length)}</span> of{' '}
                <span className="font-bold text-on-surface">{filteredQuizzes.length}</span> quizzes
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setQuizPage(p => Math.max(1, p - 1))}
                  disabled={quizPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: totalQuizPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setQuizPage(p)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${quizPage === p
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setQuizPage(p => Math.min(totalQuizPages, p + 1))}
                  disabled={quizPage === totalQuizPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exams Tab Content */}
      {subTab === 'exams' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-1 w-full max-w-none lg:max-w-3xl">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="Search by title, subject, or group..."
                  value={examSearchTerm}
                  onChange={(e) => setExamSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
                />
              </div>
              <select
                value={examStatusFilter}
                onChange={(e) => setExamStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer min-w-[130px]"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
              <select
                value={examSubjectFilter}
                onChange={(e) => setExamSubjectFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer min-w-[130px]"
              >
                {examSubjects.map(sub => (
                  <option key={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpenAssignExamModal}
              className="w-full lg:w-auto px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-98"
            >
              <Plus className="w-4 h-4" /> Assign New Exam
            </button>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {paginatedExams.map((exam) => {
              const progressPct = exam.totalMembers > 0 ? Math.round((exam.submittedCount / exam.totalMembers) * 100) : 0;
              const inProgressCount = (exam.submissions || []).filter((s) => s.status === 'In Progress').length;
              const notStartedCount = (exam.submissions || []).length > 0 
                ? (exam.submissions || []).filter((s) => s.status === 'Not Started').length
                : (exam.totalMembers - exam.submittedCount);
              const formattedDue = exam.due ? new Date(exam.due).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline';

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col hover:border-secondary/40 hover:shadow-md transition-all overflow-hidden text-left"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 pb-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider truncate">{exam.subject}</span>
                          {/* Status Badge — click to toggle status */}
                          <button
                            onClick={() => handleToggleExamStatus(exam.id)}
                            title="Click to toggle status (Pending → Active → Closed)"
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1.5 ${exam.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : exam.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${exam.status === 'Active'
                              ? 'bg-emerald-500'
                              : exam.status === 'Pending'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-slate-400'
                              }`} />
                            {exam.status === 'Pending' ? 'Pending' : exam.status}
                          </button>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-on-surface leading-snug">{exam.title}</h3>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditExamModal(exam)}
                          className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded-lg transition-all"
                          title="Edit Exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span className="font-medium truncate">{exam.groupName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span>Due: <span className="font-semibold text-error">{formattedDue}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span>Duration: <span className="font-semibold text-on-surface">{exam.duration} minutes</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Progress */}
                  <div className="px-4 sm:px-5 py-3 bg-surface-container/50 border-t border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-on-surface-variant">Submissions</span>
                      <span className="font-bold text-on-surface">{exam.submittedCount} / {exam.totalMembers} Submitted</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {/* Status badges */}
                    <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3" />{exam.submittedCount} Submitted
                      </span>
                      {inProgressCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3 h-3" />{inProgressCount} In Progress
                        </span>
                      )}
                      {notStartedCount > 0 && (
                        <span className="flex items-center gap-1 text-on-surface-variant font-medium">
                          <AlertCircle className="w-3 h-3" />{notStartedCount} Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer CTA & Export */}
                  <div className="p-3.5 sm:p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleOpenSubmissionsModal(exam)}
                      className="w-full sm:flex-1 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-99"
                    >
                      <ClipboardList className="w-4 h-4" /> Submissions & Analytics ({exam.totalMembers})
                    </button>
                    <button
                      onClick={() => handleExportExamExcel(exam)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Export Exam & Grade Report (Excel .xls)"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span className="sm:hidden text-xs">Export Report</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredExams.length === 0 && (
              <div className="col-span-full py-16 text-center text-on-surface-variant space-y-4 bg-white rounded-2xl border border-dashed border-outline-variant/40 p-4">
                <ClipboardList className="w-12 h-12 mx-auto text-outline/40" />
                <div>
                  <p className="text-sm font-bold text-on-surface">No assigned exams yet</p>
                  <p className="text-xs mt-1">Assign an exam to a group to track submissions here.</p>
                </div>
                <button
                  onClick={handleOpenAssignExamModal}
                  className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Assign First Exam
                </button>
              </div>
            )}
          </div>

          {/* Exams Pagination Controls */}
          {totalExamPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-outline-variant/20 text-xs text-on-surface-variant font-medium">
              <div>
                Showing <span className="font-bold text-on-surface">{(examPage - 1) * HOST_ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-bold text-on-surface">{Math.min(examPage * HOST_ITEMS_PER_PAGE, filteredExams.length)}</span> of{' '}
                <span className="font-bold text-on-surface">{filteredExams.length}</span> exams
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setExamPage(p => Math.max(1, p - 1))}
                  disabled={examPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: totalExamPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setExamPage(p)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${examPage === p
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setExamPage(p => Math.min(totalExamPages, p + 1))}
                  disabled={examPage === totalExamPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign / Edit Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-secondary shrink-0" />
                <span>{editingExam ? 'Edit Exam Assignment' : 'Assign New Exam'}</span>
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {/* Quiz Selection + Group Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Select Quiz <span className="text-error">*</span>
                  </label>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="">-- Quiz --</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Assign to Group <span className="text-error">*</span>
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="">-- Group --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exam Title */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Test, Final Exam..."
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                <p className="text-[10px] text-on-surface-variant mt-0.5">If left blank, the quiz title will be used.</p>
              </div>

              {/* Due Date + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Deadline <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="datetime-local"
                      required
                      value={examDue}
                      onChange={(e) => setExamDue(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Duration (minutes) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={5}
                      max={300}
                      step={5}
                      placeholder="e.g. 60"
                      value={examDuration}
                      onChange={(e) => setExamDuration(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Rule + Publish Results Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Navigation Rule
                  </label>
                  <select
                    value={navigationRule}
                    onChange={(e) => setNavigationRule(e.target.value as 'FREE_NAV' | 'FIXED_NAV')}
                    className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="FREE_NAV">Free</option>
                    <option value="FIXED_NAV">Sequential</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none mt-1 sm:mt-4">
                    <input
                      type="checkbox"
                      checked={resultsPublished}
                      onChange={(e) => setResultsPublished(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/50 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Publish Results</span>
                  </label>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 ml-6">Display scores immediately.</p>
                </div>
              </div>

              {/* Enable AI Similar Questions Toggle */}
              <div className="p-3 bg-surface-container/30 rounded-xl border border-outline-variant/20 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Enable AI Similar Questions</span>
                  <span className="text-[10px] text-on-surface-variant">Generate & deliver similar question variants to candidates for exam paper diversity</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAiQuestion(!useAiQuestion)}
                  className={`w-9 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${
                    useAiQuestion ? 'bg-secondary' : 'bg-outline-variant/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                      useAiQuestion ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Selector */}
              <div className="p-3 bg-surface-container/50 rounded-xl border border-outline-variant/20 space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider">
                  Exam Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'Active', 'Closed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setExamStatus(s)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${examStatus === s
                        ? s === 'Active'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : s === 'Pending'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-500 text-white border-slate-500 shadow-sm'
                        : 'bg-white text-on-surface-variant border-outline-variant/40 hover:border-secondary/40'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${examStatus === s
                        ? 'bg-white'
                        : s === 'Active'
                          ? 'bg-emerald-400'
                          : s === 'Pending'
                            ? 'bg-amber-400'
                            : 'bg-slate-400'
                        }`} />
                      {s === 'Pending' ? 'Pending' : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-outline-variant/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  {editingExam ? 'Save Changes' : 'Assign Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Detail Modal */}
      {submissionsModalExam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl text-left max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-outline-variant/20">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">{submissionsModalExam.subject}</span>
                    <button
                      onClick={() => handleExportExamExcel(submissionsModalExam)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      title="Export Excel File (.xls)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel (.xls)
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{submissionsModalExam.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{submissionsModalExam.groupName}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{submissionsModalExam.duration} minutes</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSubmissionsModalExam(null); setEditingSubmissionMemberId(null); }}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-tab Navigation (Gradebook vs Most Missed Questions) */}
              <div className="flex border-b border-outline-variant/30 gap-6 mt-4">
                <button
                  onClick={() => setSubmissionsViewTab('roster')}
                  className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-1.5 ${submissionsViewTab === 'roster' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Member Gradebook ({submissionsModalExam.totalMembers})
                  {submissionsViewTab === 'roster' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
                </button>
                <button
                  onClick={() => setSubmissionsViewTab('analytics')}
                  className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-1.5 ${submissionsViewTab === 'analytics' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-amber-600" /> Most Missed Questions
                  {submissionsViewTab === 'analytics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
                </button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-emerald-700">{submissionsModalExam.submittedCount}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Submitted</p>
                </div>
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-amber-700">
                    {(submissionsModalExam.submissions || []).filter(s => s.status === 'In Progress').length}
                  </p>
                  <p className="text-[11px] text-amber-600 font-medium">In Progress</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-slate-600">
                    {(submissionsModalExam.submissions || []).filter(s => s.status === 'Not Started').length}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Not Started</p>
                </div>
              </div>
            </div>

            {/* View Tab 1: Member Gradebook Roster */}
            {submissionsViewTab === 'roster' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {(submissionsModalExam.submissions || []).length === 0 && (
                  <div className="py-10 text-center text-on-surface-variant text-xs">
                    <Users className="w-8 h-8 mx-auto text-outline/40 mb-2" />
                    <p>No members in this group.</p>
                  </div>
                )}
                {(submissionsModalExam.submissions || []).map((sub) => (
                  <div
                    key={sub.memberId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${sub.status === 'Submitted'
                      ? 'bg-emerald-50/40 border-emerald-200/60'
                      : sub.status === 'In Progress'
                        ? 'bg-amber-50/40 border-amber-200/60'
                        : 'bg-slate-50/60 border-slate-200/40'
                      }`}
                  >
                    {/* Member info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${sub.status === 'Submitted' ? 'bg-emerald-200 text-emerald-900'
                        : sub.status === 'In Progress' ? 'bg-amber-200 text-amber-900 animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                        }`}>
                        {sub.memberName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-on-surface">{sub.memberName}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                          <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-outline" />{sub.memberEmail}</span>
                          {sub.submittedAt && <span>• {sub.submittedAt}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status badge */}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sub.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800'
                        : sub.status === 'In Progress' ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {sub.status}
                      </span>

                      {/* Score display / edit */}
                      {sub.status === 'Submitted' && (
                        editingSubmissionMemberId === sub.memberId ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempScore}
                              onChange={(e) => setTempScore(e.target.value)}
                              placeholder="e.g. 90%"
                              className="w-16 px-2 py-1 border border-secondary/40 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-secondary"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveScore(sub.memberId)}
                              className="p-1 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingSubmissionMemberId(null); setTempScore(''); }}
                              className="p-1 text-on-surface-variant hover:text-error rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingSubmissionMemberId(sub.memberId); setTempScore(sub.score || ''); }}
                            className="text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 px-2.5 py-1 rounded-lg transition-all"
                          >
                            {sub.score || 'Grade'}
                          </button>
                        )
                      )}

                      {/* View submission details and feedback */}
                      {(sub.status === 'Submitted' || sub.status === 'In Progress') && (
                        <button
                          onClick={() => handleOpenSubmissionDetails(sub.memberId)}
                          className="p-1.5 text-secondary hover:bg-secondary/15 rounded-lg transition-all"
                          title="View Submission Details & Feedback"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Reset button */}
                      {(sub.status === 'Submitted' || sub.status === 'In Progress') && (
                        <button
                          onClick={() => handleResetSubmission(sub.memberId)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          title="Reset attempt"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View Tab 2: Most Missed Questions Analytics */}
            {submissionsViewTab === 'analytics' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Top questions that members most frequently answered incorrectly in this exam.</span>
                  </div>
                  <button
                    onClick={() => handleExportExamExcel(submissionsModalExam)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 text-[11px] shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel Report
                  </button>
                </div>

                {isLoadingMissed ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                  </div>
                ) : missedQuestions.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant text-sm">
                    No missed questions data available for this exam. (Either all answers are correct or no submissions yet).
                  </div>
                ) : (
                  missedQuestions.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-outline-variant/30 space-y-3 text-xs shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            #{idx + 1}
                          </span>
                          <div>
                            <h5 className="font-bold text-on-surface text-sm">{item.question}</h5>
                            <p className="text-on-surface-variant text-[11px] mt-0.5">
                              <strong className="text-rose-600">{item.wrongCount} / {item.totalCount}</strong> members answered incorrectly ({item.wrongPercentage}% error rate)
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-extrabold rounded-lg shrink-0 text-xs">
                          {item.wrongPercentage}% Wrong
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.wrongPercentage}%` }} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                          <span className="font-bold text-rose-800 uppercase tracking-wider block text-[10px] mb-0.5">Common Wrong Answer:</span>
                          <span className="text-rose-900 font-medium">{item.commonWrongAnswer}</span>
                        </div>
                        <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider block text-[10px] mb-0.5">Correct Answer:</span>
                          <span className="text-emerald-900 font-medium">{item.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container/30">
              <p className="text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">{submissionsModalExam.submittedCount}</span> of{' '}
                <span className="font-bold text-on-surface">{submissionsModalExam.totalMembers}</span> members submitted
              </p>
              <button
                onClick={() => { setSubmissionsModalExam(null); setEditingSubmissionMemberId(null); }}
                className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Submission Details Modal */}
      {isSubDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col max-h-[90vh] text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Submission Details
                </h3>
                {subDetails && (
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    {subDetails.student.fullname} • {subDetails.student.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsSubDetailsModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingSubDetails ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-on-surface-variant">Loading submission answers...</p>
                </div>
              ) : subDetails ? (
                <>
                  {/* Feedback and Grading Form */}
                  <form onSubmit={handleSaveFeedbackAndGrade} className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10 space-y-3.5">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                      Grade & Feedback
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
                          Score (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          required
                          value={customScore}
                          onChange={(e) => setCustomScore(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
                          Feedback & Notes
                        </label>
                        <textarea
                          placeholder="Write feedback, recommendations, or grading comments for the student..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20 h-16 resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
                      >
                        Save Evaluation
                      </button>
                    </div>
                  </form>

                  {/* Submission Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-container-low/40 rounded-xl border border-outline-variant/20 text-xs">
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Status</span>
                      <span className={`font-bold ${subDetails.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {subDetails.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Current Score</span>
                      <span className={`font-bold ${subDetails.score !== null ? 'text-secondary' : 'text-on-surface'}`}>
                        {subDetails.score !== null ? `${subDetails.score}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Started At</span>
                      <span className="font-medium text-on-surface">
                        {subDetails.started_at ? new Date(subDetails.started_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Submitted At</span>
                      <span className="font-medium text-on-surface">
                        {subDetails.submitted_at ? new Date(subDetails.submitted_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Questions list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Student Answers
                    </h4>
                    {subDetails.questions.map((q: any, qIdx: number) => {
                      const hasAns = q.user_answer !== null && q.user_answer !== undefined;
                      const qType = (q.type || '').trim().toLowerCase();
                      const isMCQ = qType === 'multiple_choice' || qType === 'true_false' || qType === 'true/false';
                      const isCorrect = q.user_answer?.is_correct;
                      const partialScoreInput = questionScoreInputs[q.id] ?? '';

                      return (
                        <div key={q.id} className={`p-4 rounded-xl border space-y-3 transition-colors ${
                          !hasAns ? 'border-outline-variant/20 bg-surface-container-low/30' :
                          isCorrect ? 'border-emerald-300/50 bg-emerald-50/20' : 'border-rose-300/50 bg-rose-50/10'
                        }`}>
                          {/* Question header */}
                          <div className="flex items-start justify-between gap-3">
                            <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-on-surface text-sm">{q.content}</h5>
                              <span className="text-[10px] text-on-surface-variant font-semibold mt-1 inline-block uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded">
                                {q.type}
                              </span>
                            </div>
                            {/* Current correctness badge */}
                            {hasAns ? (
                              <span className={`shrink-0 px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                                isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                            ) : (
                              <span className="shrink-0 px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500">
                                No Answer
                              </span>
                            )}
                          </div>

                          {/* Options (MCQ) */}
                          {isMCQ && (
                            <div className="pl-8 space-y-2">
                              {q.options.map((opt: any) => {
                                const isUserSelected = q.user_answer?.selected_option_id === opt.id;
                                const isCorrectOpt = opt.is_correct;
                                let optBg = 'bg-white border-outline-variant/30 text-on-surface';
                                if (isCorrectOpt) optBg = 'bg-emerald-50 border-emerald-400/50 text-emerald-900';
                                else if (isUserSelected && !isCorrectOpt) optBg = 'bg-rose-50 border-rose-400/50 text-rose-900';

                                return (
                                  <div key={opt.id} className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${optBg}`}>
                                    <span className={isCorrectOpt ? 'font-bold' : ''}>{opt.content}</span>
                                    {isUserSelected && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isCorrectOpt ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        Student's Choice
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Written answer */}
                          {!isMCQ && (
                            <div className="pl-8 space-y-2 text-xs">
                              <div className="p-3 bg-surface-container-low/60 rounded-lg border border-outline-variant/20">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Student's Answer:</span>
                                <p className="font-medium whitespace-pre-wrap text-on-surface">
                                  {q.user_answer?.answer_text || <span className="italic text-on-surface-variant/60">No response</span>}
                                </p>
                              </div>
                              {q.options && q.options.length > 0 && (
                                <div className="p-3 bg-emerald-50/30 rounded-lg border border-emerald-200/50">
                                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Expected Answer Template:</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {q.options.map((opt: any) => (
                                      <li key={opt.id} className="font-medium text-emerald-900">{opt.content}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── Per-question grading controls (only if student answered) ── */}
                          {hasAns && (
                            <div className="pl-8 pt-1 border-t border-outline-variant/15 mt-2">
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Manual Grading</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Toggle Correct / Incorrect */}
                                <button
                                  type="button"
                                  onClick={() => handleGradeAnswer(q.id, true, partialScoreInput !== '' ? Number(partialScoreInput) : null)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                      : 'bg-white text-emerald-700 border-emerald-400 hover:bg-emerald-50'
                                  }`}
                                >
                                  ✓ Mark Correct
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGradeAnswer(q.id, false, 0)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    hasAns && !isCorrect
                                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                      : 'bg-white text-rose-600 border-rose-400 hover:bg-rose-50'
                                  }`}
                                >
                                  ✗ Mark Incorrect
                                </button>

                                {/* Partial score input */}
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-[10px] text-on-surface-variant font-semibold">Points:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    placeholder="0–1"
                                    value={partialScoreInput}
                                    onChange={(e) =>
                                      setQuestionScoreInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                                    }
                                    className="w-16 px-2 py-1 border border-outline-variant/40 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-secondary/25 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGradeAnswer(
                                        q.id,
                                        partialScoreInput !== '' && Number(partialScoreInput) > 0,
                                        partialScoreInput !== '' ? Number(partialScoreInput) : null
                                      )
                                    }
                                    className="px-2.5 py-1 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/85 transition-all"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-on-surface-variant">
                  Failed to load submission details.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end bg-surface-container/30">
              <button
                onClick={() => setIsSubDetailsModalOpen(false)}
                className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups Tab Content */}
      {subTab === 'groups' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Groups Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-1 w-full max-w-none lg:max-w-3xl">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="Search group name or join code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
                />
              </div>
              <select
                value={groupStatusFilter}
                onChange={(e) => setGroupStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer min-w-[130px]"
              >
                <option>All Status</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
              <select
                value={groupSizeFilter}
                onChange={(e) => setGroupSizeFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer min-w-[140px]"
              >
                <option>All Sizes</option>
                <option>{"Small (< 5 members)"}</option>
                <option>{"Medium (5 - 20 members)"}</option>
                <option>{"Large (> 20 members)"}</option>
              </select>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="w-full lg:w-auto px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-98"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
          </div>

          {/* Groups Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedGroups.map((group) => {
              const count = group.membersCount ?? group.members?.length ?? 0;
              const pendingCount = group.pendingRequests?.length || 0;

              return (
                <div
                  key={group.id}
                  className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all text-left space-y-4 flex flex-col justify-between shadow-xs relative ${group.isLocked ? 'border-amber-400/40 bg-amber-50/10' : 'border-outline-variant/30 hover:border-secondary/40'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold relative shrink-0">
                        {(() => {
                          const IconComponent = GROUP_ICONS[group.icon as keyof typeof GROUP_ICONS] || Users;
                          return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />;
                        })()}
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 text-white rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center animate-bounce">
                            {pendingCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Lock / Unlock Toggle Button */}
                        <button
                          onClick={() => handleToggleLock(group.id)}
                          className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${group.isLocked
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          title={group.isLocked ? 'Group is LOCKED (Click to Unlock)' : 'Group is OPEN (Click to Lock)'}
                        >
                          {group.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span className="text-[10px] uppercase tracking-wider hidden sm:inline">{group.isLocked ? 'Locked' : 'Open'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(group)}
                          className="p-1.5 sm:p-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded-xl transition-all"
                          title="Edit Group"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleExportGroupExcel(group)}
                          className="p-1.5 sm:p-2 text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Export Group Roster (Excel .xls)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1.5 sm:p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface truncate">{group.name}</h3>
                      </div>

                      {/* Join Code Badge with Copy */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/30 text-xs font-mono font-bold text-on-surface">
                          <Key className="w-3 h-3 text-secondary shrink-0" />
                          <span className="truncate max-w-[150px]">Code: {group.joinCode || group.id}</span>
                          <button
                            onClick={() => handleCopyCode(group.joinCode || group.id)}
                            className="ml-1 text-on-surface-variant hover:text-secondary transition-colors shrink-0"
                            title="Copy Join Code"
                          >
                            {copiedCode === (group.joinCode || group.id) ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-on-surface-variant line-clamp-2 min-h-[32px]">
                        {group.description || 'No detailed description.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-on-surface-variant">Enrolled Roster</span>
                      <span className="font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                        {count} Members
                      </span>
                    </div>

                    {/* Pending Request Alert Badge */}
                    {pendingCount > 0 && (
                      <button
                        onClick={() => handleOpenRosterModal(group, 'pending')}
                        className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-amber-300/60 shadow-xs"
                      >
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{pendingCount} Pending Approvals Needed</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRosterModal(group, 'enrolled')}
                      className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4 text-secondary shrink-0" />
                      Manage Group Roster
                    </button>
                  </div>
                </div>
              );
            })}

            {paginatedGroups.length === 0 && (
              <div className="col-span-full py-12 text-center text-on-surface-variant space-y-3 bg-white rounded-2xl border border-dashed border-outline-variant/40 p-4">
                <Users className="w-10 h-10 mx-auto text-outline/50" />
                <p className="text-sm font-medium">No study groups found.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create First Group
                </button>
              </div>
            )}
          </div>

          {/* Groups Pagination Controls */}
          {totalGroupPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-outline-variant/20 text-xs text-on-surface-variant font-medium">
              <div>
                Showing <span className="font-bold text-on-surface">{(groupPage - 1) * HOST_ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-bold text-on-surface">{Math.min(groupPage * HOST_ITEMS_PER_PAGE, filteredGroups.length)}</span> of{' '}
                <span className="font-bold text-on-surface">{filteredGroups.length}</span> groups
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setGroupPage(p => Math.max(1, p - 1))}
                  disabled={groupPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: totalGroupPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setGroupPage(p)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${groupPage === p
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setGroupPage(p => Math.min(totalGroupPages, p + 1))}
                  disabled={groupPage === totalGroupPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-bold text-on-surface transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary shrink-0" />
                <span>{editingGroup ? 'Edit Group' : 'Create New Group'}</span>
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 flex-1 overflow-y-auto pr-0.5">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Group Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alpha Team - Advanced Physics"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Select Group Icon <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                  {Object.entries(GROUP_ICONS).map(([iconName, IconComponent]) => {
                    const isSelected = groupIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setGroupIcon(iconName)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSelected
                          ? 'bg-secondary text-white shadow-md scale-105 font-bold'
                          : 'bg-white text-on-surface-variant hover:text-secondary border border-outline-variant/30 hover:border-secondary/50'
                          }`}
                        title={iconName}
                      >
                        <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingGroup && (
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Member Join Code
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. PHYS-ALPHA"
                      value={groupJoinCode}
                      onChange={(e) => setGroupJoinCode(e.target.value)}
                      disabled={true}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">Members will use this code to request entry.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of group syllabus or members..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {/* Group Lock Checkbox */}
              <div className="p-3.5 bg-surface-bright rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    {groupIsLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-green-600" />}
                    Lock Group
                  </span>
                  <p className="text-[11px] text-on-surface-variant">Prevent new join requests</p>
                </div>
                <input
                  type="checkbox"
                  checked={groupIsLocked}
                  onChange={(e) => setGroupIsLocked(e.target.checked)}
                  className="w-4 h-4 text-secondary rounded focus:ring-secondary cursor-pointer"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-outline-variant/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  {editingGroup ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Group Roster & Approval Modal */}
      {rosterGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6 text-left max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 sm:pb-4 shrink-0">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-bold text-on-surface truncate">{rosterGroup.name}</h3>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}
                  >
                    {rosterGroup.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {rosterGroup.isLocked ? 'LOCKED' : 'OPEN'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-on-surface-variant mt-1 flex-wrap">
                  <span className="font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-[11px]">
                    Code: {rosterGroup.joinCode || rosterGroup.id}
                  </span>
                  <span>{rosterGroup.members?.length || 0} Enrolled</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExportGroupExcel(rosterGroup)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-200"
                  title="Export Group Roster (Excel .xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
                <button
                  onClick={() => setRosterGroup(null)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs (Enrolled vs Pending) */}
            <div className="flex border-b border-outline-variant/30 gap-4 sm:gap-6 shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setRosterTab('enrolled')}
                className={`pb-2.5 text-xs font-bold transition-all relative whitespace-nowrap ${rosterTab === 'enrolled' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Enrolled Members ({rosterGroup.members?.length || 0})
                {rosterTab === 'enrolled' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
              </button>

              <button
                onClick={() => setRosterTab('pending')}
                className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${rosterTab === 'pending' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Pending Approvals ({rosterGroup.pendingRequests?.length || 0})
                {(rosterGroup.pendingRequests?.length || 0) > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {rosterGroup.pendingRequests?.length}
                  </span>
                )}
                {rosterTab === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
              </button>
            </div>

            {/* Tab 1: Enrolled Members */}
            {rosterTab === 'enrolled' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
                {/* Add Member Form */}
                <form onSubmit={handleAddMember} className="bg-surface-bright p-3.5 sm:p-4 rounded-2xl border border-outline-variant/30 space-y-3 shrink-0">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-secondary shrink-0" /> Add Member Directly
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="email"
                      required
                      placeholder="member@school.edu"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  </div>
                </form>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(rosterGroup.members || []).map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 sm:p-4 bg-white rounded-2xl border border-outline-variant/20 hover:border-outline-variant/50 transition-all space-y-3 shadow-xs text-left"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary/10 text-secondary font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs text-on-surface truncate">{member.name}</h5>
                            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5 truncate">
                              <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-outline shrink-0" /> {member.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant" title="Number of exams completed">
                            Exams: {member.examsCompleted ?? 0}/{member.totalExamsAssigned ?? 0}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800" title="Average score">
                            AVG: {member.averageScore || 'N/A'}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Exam Scores Breakdown */}
                      {(member.examScores || []).length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/15 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                            <span className="font-bold uppercase tracking-wider">
                              Recent Exam Scores:
                            </span>
                            {(member.examScores?.length || 0) > 3 && (
                              <span className="italic text-secondary font-medium">
                                +{(member.examScores?.length || 0) - 3} more
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {member.examScores?.slice(0, 3).map((scoreItem, sIdx) => (
                              <div
                                key={sIdx}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center justify-between ${scoreItem.status === 'Completed'
                                  ? 'bg-emerald-50/50 border-emerald-200/60'
                                  : scoreItem.status === 'In Progress'
                                    ? 'bg-amber-50/50 border-amber-200/60'
                                    : 'bg-slate-50 border-slate-200/60'
                                  }`}
                              >
                                <span className="font-medium truncate text-on-surface max-w-[110px]" title={scoreItem.examTitle}>
                                  {scoreItem.examTitle}
                                </span>
                                <span className={`font-extrabold ml-1 ${scoreItem.status === 'Completed' ? 'text-emerald-700' : 'text-slate-500'
                                  }`}>
                                  {scoreItem.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!rosterGroup.members || rosterGroup.members.length === 0) && (
                    <div className="py-8 text-center text-on-surface-variant text-xs space-y-1">
                      <Users className="w-8 h-8 mx-auto text-outline/40" />
                      <p>No members enrolled in this group yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Pending Approvals */}
            {rosterTab === 'pending' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left">
                <p className="text-xs text-on-surface-variant mb-1">
                  Members who used Join Code <strong className="font-mono">{rosterGroup.joinCode || rosterGroup.id}</strong> requesting to join:
                </p>

                {rosterGroup.pendingRequests && rosterGroup.pendingRequests.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2.5 mb-4 shrink-0">
                    <button
                      onClick={handleBulkApprove}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <UserCheck className="w-4 h-4" /> Approve All ({rosterGroup.pendingRequests.length})
                    </button>
                    <button
                      onClick={handleBulkReject}
                      className="flex-1 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <UserX className="w-4 h-4" /> Decline All ({rosterGroup.pendingRequests.length})
                    </button>
                  </div>
                )}

                {(rosterGroup.pendingRequests || []).map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 hover:border-amber-400 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-on-surface truncate">{member.name}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-outline shrink-0" /> {member.email}</span>
                          <span>• Requested {member.joinedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleApproveMember(member)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <UserCheck className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectMember(member.id)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserX className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}

                {(!rosterGroup.pendingRequests || rosterGroup.pendingRequests.length === 0) && (
                  <div className="py-12 text-center text-on-surface-variant text-xs space-y-2 bg-surface-bright rounded-2xl border border-dashed border-outline-variant/40">
                    <CheckCircle2 className="w-9 h-9 mx-auto text-green-600/70" />
                    <p className="font-bold text-on-surface">No Pending Requests</p>
                    <p className="text-[11px]">All join requests have been processed.</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-outline-variant/20 pt-3 sm:pt-4 gap-2.5 shrink-0">
              <button
                onClick={() => handleToggleLock(rosterGroup.id)}
                className={`w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-surface-container text-on-surface'
                  }`}
              >
                {rosterGroup.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {rosterGroup.isLocked ? 'Unlock Group' : 'Lock Group'}
              </button>

              <button
                onClick={() => setRosterGroup(null)}
                className="w-full sm:w-auto px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
