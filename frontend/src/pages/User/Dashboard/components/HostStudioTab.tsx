import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { HOST_QUIZZES_LIST, HOST_GROUPS_LIST, HostGroup, GroupMember, USER_ASSIGNED_EXAMS, AssignedExam } from '@/data/userData';
import { groupService } from '@/services';
import { useEffect } from 'react';

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
  submissions?: {
    memberId: string;
    memberName: string;
    memberEmail: string;
    status: 'Submitted' | 'In Progress' | 'Not Started';
    score?: string;
    submittedAt?: string;
  }[];
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
  const [subTab, setSubTab] = useState<'quizzes' | 'groups' | 'exams'>('quizzes');
  const [groups, setGroups] = useState<HostGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true);
      setGroupsError(null);
      const data = await groupService.getMyGroups();
      const hostGroups = data.map((bg): HostGroup => ({
        id: String(bg.id),
        name: bg.name,
        joinCode: bg.group_code,
        isLocked: bg.status === 'CLOSED',
        membersCount: 0,
        description: bg.description || '',
        icon: bg.icon || 'GraduationCap',
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

  useEffect(() => {
    loadGroups();
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
  const [exams, setExams] = useState<HostAssignedExam[]>([
    {
      id: 1,
      title: 'Midterm Biology 101',
      due: '2026-07-25T23:59',
      subject: 'Biology',
      quizId: 'QZ-101',
      duration: 60,
      groupId: 'GRP-01',
      groupName: 'Alpha Team - Advanced Physics',


      totalMembers: 3,
      submittedCount: 2,
      status: 'Active',
      submissions: [
        { memberId: 'M-1', memberName: 'Alex Johnson', memberEmail: 'alex.j@example.com', status: 'Submitted', score: '85%', submittedAt: '2026-07-20 09:30' },
        { memberId: 'M-2', memberName: 'Sarah Smith', memberEmail: 'sarah.s@example.com', status: 'Submitted', score: '92%', submittedAt: '2026-07-20 10:15' },
        { memberId: 'M-3', memberName: 'Michael Brown', memberEmail: 'michael.b@example.com', status: 'In Progress' }
      ]
    },
    {
      id: 2,
      title: 'Calculus III Vector Calculus',
      due: '2026-07-30T18:00',
      subject: 'Mathematics',
      quizId: 'QZ-103',
      duration: 90,
      groupId: 'GRP-02',
      groupName: 'English Intensive Group B',
      totalMembers: 2,
      submittedCount: 0,
      status: 'Active',
      submissions: [
        { memberId: 'M-4', memberName: 'Emily Davis', memberEmail: 'emily.d@example.com', status: 'Not Started' },
      ]
    }
  ]);

  const [examSearchTerm, setExamSearchTerm] = useState('');

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

  // Submissions Modal State
  const [submissionsModalExam, setSubmissionsModalExam] = useState<HostAssignedExam | null>(null);
  const [submissionsViewTab, setSubmissionsViewTab] = useState<'roster' | 'analytics'>('roster');
  const [editingSubmissionMemberId, setEditingSubmissionMemberId] = useState<string | null>(null);
  const [tempScore, setTempScore] = useState('');

  // Export Excel Helpers (.xls HTML Table Spreadsheet)
  const handleExportGroupExcel = (group: HostGroup) => {
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
          td { border: 1px solid #e5e7eb; padding: 6px; }
          .title { font-size: 16pt; font-weight: bold; color: #047857; text-align: center; }
          .header-bg { background-color: #ecfdf5; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="5" class="title">ROSTER LIST</td></tr>
          <tr><td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">Exported at: ${new Date().toLocaleString('en-US')}</td></tr>
          <tr></tr>
          <tr class="header-bg">
            <td>Group Name:</td>
            <td colspan="2"><b>${group.name}</b></td>
            <td>Join Code:</td>
            <td><b>${group.joinCode || group.id}</b></td>
          </tr>
          <tr>
            <td>Description:</td>
            <td colspan="2">${group.description || 'No description provided'}</td>
            <td>Total Members:</td>
            <td>${group.members?.length || 0} Members</td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th style="width: 40px;">No.</th>
              <th style="width: 100px;">Member ID</th>
              <th style="width: 180px;">Full Name</th>
              <th style="width: 220px;">Member Email</th>
              <th style="width: 110px;">Exams Completed</th>
              <th style="width: 110px;">Average Score</th>
              <th style="width: 320px;">Detailed Exam Scores</th>
            </tr>
          </thead>
          <tbody>
            ${(group.members || []).map((m, idx) => {
      const scoresText = (m.examScores || [])
        .map((s) => `${s.examTitle}: ${s.score}`)
        .join(' | ');

      return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="text-align: center;">${m.id}</td>
                  <td><b>${m.name}</b></td>
                  <td>${m.email}</td>
                  <td style="text-align: center; font-weight: bold;">${m.examsCompleted ?? 0} / ${m.totalExamsAssigned ?? 0}</td>
                  <td style="text-align: center; font-weight: bold; color: #047857;">${m.averageScore || 'N/A'}</td>
                  <td style="font-size: 10pt;">${scoresText || 'No exams taken'}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Group_Roster_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExamExcel = (exam: HostAssignedExam) => {
    const analytics = MOCK_QUESTION_ANALYTICS[exam.id] || [
      { id: 1, question: "Biochemical reactions concepts in cells?", wrongCount: 3, totalCount: 3, wrongPercentage: 100, commonWrongAnswer: "B. Protein breakdown reaction", correctAnswer: "C. ATP synthesis reaction" },
      { id: 2, question: "How many membrane layers does a mitochondrion have?", wrongCount: 2, totalCount: 3, wrongPercentage: 67, commonWrongAnswer: "A. 1 single membrane", correctAnswer: "B. 2 double membranes" }
    ];

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
          td { border: 1px solid #e5e7eb; padding: 6px; }
          .title { font-size: 16pt; font-weight: bold; color: #047857; text-align: center; }
          .header-bg { background-color: #ecfdf5; font-weight: bold; }
          .section-title { font-size: 13pt; font-weight: bold; color: #065f46; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="title">EXAM STATISTICAL REPORT AND GRADEBOOK</td></tr>
          <tr><td colspan="7" style="text-align: center; font-style: italic; color: #6b7280;">Exported at: ${new Date().toLocaleString('en-US')}</td></tr>
          <tr></tr>
          <tr class="header-bg">
            <td colspan="2">Exam Title:</td>
            <td colspan="5"><b>${exam.title}</b></td>
          </tr>
          <tr>
            <td colspan="2">Subject:</td>
            <td colspan="2">${exam.subject}</td>
            <td colspan="2">Duration:</td>
            <td>${exam.duration} mins</td>
          </tr>
          <tr>
            <td colspan="2">Group:</td>
            <td colspan="2">${exam.groupName}</td>
            <td colspan="2">Status:</td>
            <td>${exam.status}</td>
          </tr>
          <tr>
            <td colspan="2">Due Date:</td>
            <td colspan="2">${exam.due}</td>
            <td colspan="2">Submission Rate:</td>
            <td>${exam.submittedCount} / ${exam.totalMembers} Members</td>
          </tr>
          <tr></tr>
          <tr><td colspan="7" class="section-title">I. DETAILED MEMBER GRADEBOOK</td></tr>
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th style="width: 100px;">Member ID</th>
              <th style="width: 180px;">Full Name</th>
              <th style="width: 220px;">Member Email</th>
              <th style="width: 120px;">Status</th>
              <th style="width: 100px;">Score</th>
              <th style="width: 150px;">Submission Time</th>
            </tr>
          </thead>
          <tbody>
            ${(exam.submissions || []).map((sub, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${sub.memberId}</td>
                <td><b>${sub.memberName}</b></td>
                <td>${sub.memberEmail}</td>
                <td style="text-align: center;">${sub.status}</td>
                <td style="text-align: center; font-weight: bold; color: #047857;">${sub.score || 'N/A'}</td>
                <td style="text-align: center;">${sub.submittedAt || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tr></tr>
          <tr><td colspan="7" class="section-title">II. MOST MISSED QUESTIONS STATISTICS</td></tr>
          <thead>
            <tr>
              <th>No.</th>
              <th colspan="2">Question Text</th>
              <th>Incorrect Count</th>
              <th>Error Rate</th>
              <th>Common Misconception</th>
              <th>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.map((q, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td colspan="2"><b>${q.question}</b></td>
                <td style="text-align: center;">${q.wrongCount} / ${q.totalCount}</td>
                <td style="text-align: center; font-weight: bold; color: #dc2626;">${q.wrongPercentage}%</td>
                <td style="color: #991b1b;">${q.commonWrongAnswer}</td>
                <td style="color: #065f46; font-weight: bold;">${q.correctAnswer}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
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
          date: '',
          status: es.status as any
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
      setNewMemberName('');
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

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.joinCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Exam Handlers
  const handleOpenAssignExamModal = () => {
    setEditingExam(null);
    setExamTitle('');
    setSelectedQuizId(HOST_QUIZZES_LIST[0]?.id || '');
    setSelectedGroupId(groups[0]?.id || '');
    setExamDue('');
    setExamDuration(60);
    setExamStatus('Pending');
    setNavigationRule('FREE_NAV');
    setResultsPublished(false);
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
    setIsExamModalOpen(true);
  };

  const handleToggleExamStatus = (examId: number) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== examId) return ex;
        const nextStatus: 'Pending' | 'Active' | 'Closed' =
          ex.status === 'Pending' ? 'Active' : ex.status === 'Active' ? 'Closed' : 'Pending';
        return { ...ex, status: nextStatus };
      })
    );
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedQuiz = HOST_QUIZZES_LIST.find((q) => q.id === selectedQuizId);
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    if (!selectedGroup || !selectedQuiz) return;

    const finalTitle = examTitle.trim() || selectedQuiz.title;

    if (editingExam) {
      setExams((prev) =>
        prev.map((ex) =>
          ex.id === editingExam.id
            ? {
              ...ex,
              title: finalTitle,
              subject: selectedQuiz.category,
              quizId: selectedQuiz.id,
              due: examDue,
              duration: examDuration,
              status: examStatus,
              navigationRule: navigationRule,
              resultsPublished: resultsPublished,
              groupId: selectedGroup.id,
              groupName: selectedGroup.name,
            }
            : ex
        )
      );
    } else {
      const members = selectedGroup.members || [];
      const newExam: HostAssignedExam = {
        id: Date.now(),
        title: finalTitle,
        due: examDue,
        subject: selectedQuiz.category,
        quizId: selectedQuiz.id,
        duration: examDuration,
        status: examStatus,
        navigationRule: navigationRule,
        resultsPublished: resultsPublished,
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        totalMembers: members.length,
        submittedCount: 0,
        submissions: members.map((m) => ({
          memberId: m.id,
          memberName: m.name,
          memberEmail: m.email,
          status: 'Not Started' as const,
        })),
      };
      setExams((prev) => [...prev, newExam]);
    }
    setIsExamModalOpen(false);
  };

  const handleDeleteExam = (examId: number) => {
    if (window.confirm('Are you sure you want to cancel this assigned exam?')) {
      setExams((prev) => prev.filter((ex) => ex.id !== examId));
    }
  };

  const handleResetSubmission = (memberId: string) => {
    if (!submissionsModalExam) return;
    const updated = {
      ...submissionsModalExam,
      submissions: (submissionsModalExam.submissions || []).map((s) =>
        s.memberId === memberId ? { ...s, status: 'Not Started' as const, score: undefined, submittedAt: undefined } : s
      ),
      submittedCount: Math.max(0, submissionsModalExam.submittedCount - 1),
    };
    setSubmissionsModalExam(updated);
    setExams((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
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

  const filteredExams = exams.filter(
    (ex) =>
      ex.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      ex.subject.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      ex.groupName.toLowerCase().includes(examSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left">
      {/* Host Header Banner */}
      <div className="bg-gradient-to-r from-secondary via-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Host Studio
          </span>
          <h2 className="text-3xl font-extrabold">Host Live Quiz Sessions</h2>
          <p className="text-emerald-100 text-sm max-w-xl">
            Select a quiz set, configure game settings, manage member rosters, approve join requests, and launch real-time rooms.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={onCreateQuiz}
            className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all border border-white/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Quiz
          </button>
          <button
            onClick={onOpenHostRoomModal}
            className="px-6 py-3 bg-white text-secondary hover:bg-emerald-50 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> Launch Live Room 🚀
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        <button
          onClick={() => setSubTab('quizzes')}
          className={`pb-3 text-sm font-bold transition-all relative ${subTab === 'quizzes' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          My Quizzes ({HOST_QUIZZES_LIST.length})
          {subTab === 'quizzes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>

        <button
          onClick={() => setSubTab('groups')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${subTab === 'groups' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
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
          className={`pb-3 text-sm font-bold transition-all relative ${subTab === 'exams' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          My Assigned Exams ({exams.length})
          {subTab === 'exams' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>


      </div>

      {/* Quizzes Tab Content */}
      {subTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOST_QUIZZES_LIST.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 flex flex-col justify-between hover:border-secondary/50 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">{quiz.category}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                    {quiz.level}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{quiz.title}</h3>
                <p className="text-xs text-on-surface-variant">{quiz.questions} Questions • Ready to host</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs text-outline font-medium">ID: {quiz.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (onEditQuiz ? onEditQuiz(quiz.id) : onCreateQuiz())}
                    className="p-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Edit Quiz"
                  >
                    <Edit2 className="w-4 h-4 text-secondary" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={onOpenHostRoomModal}
                    className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Host This Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exams Tab Content */}
      {subTab === 'exams' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search by title, subject, or group..."
                value={examSearchTerm}
                onChange={(e) => setExamSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <button
              onClick={handleOpenAssignExamModal}
              className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Assign New Exam
            </button>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExams.map((exam) => {
              const progressPct = exam.totalMembers > 0 ? Math.round((exam.submittedCount / exam.totalMembers) * 100) : 0;
              const inProgressCount = (exam.submissions || []).filter((s) => s.status === 'In Progress').length;
              const notStartedCount = (exam.submissions || []).filter((s) => s.status === 'Not Started').length;
              const formattedDue = exam.due ? new Date(exam.due).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline';

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col hover:border-secondary/40 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{exam.subject}</span>
                          {/* Status Badge — click to toggle status */}
                          <button
                            onClick={() => handleToggleExamStatus(exam.id)}
                            title="Click to toggle status (Pending → Active → Closed)"
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${exam.status === 'Active'
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
                        <h3 className="font-bold text-base text-on-surface leading-tight">{exam.title}</h3>
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
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Users className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span className="font-medium truncate">{exam.groupName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Calendar className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span>Due: <span className="font-semibold text-error">{formattedDue}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Clock className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span>Duration: <span className="font-semibold text-on-surface">{exam.duration} minutes</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Progress */}
                  <div className="px-5 py-3 bg-surface-container/50 border-t border-outline-variant/20 space-y-2">
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
                    <div className="flex items-center gap-3 text-[11px]">
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
                  <div className="p-4 border-t border-outline-variant/20 grid grid-cols-5 gap-2">
                    <button
                      onClick={() => {
                        setSubmissionsModalExam(exam);
                        setSubmissionsViewTab('roster');
                      }}
                      className="col-span-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" /> Submissions & Analytics ({exam.totalMembers})
                    </button>
                    <button
                      onClick={() => handleExportExamExcel(exam)}
                      className="col-span-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      title="Export Exam & Grade Report (Excel .xls)"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredExams.length === 0 && (
              <div className="col-span-full py-16 text-center text-on-surface-variant space-y-4 bg-white rounded-2xl border border-dashed border-outline-variant/40">
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
        </div>
      )}

      {/* Assign / Edit Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3.5">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-secondary" />
                {editingExam ? 'Edit Exam Assignment' : 'Assign New Exam'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3">
              {/* Quiz Selection + Group Selection — same row */}
              <div className="grid grid-cols-2 gap-3">
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
                    {HOST_QUIZZES_LIST.map((q) => (
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

              {/* Due Date + Duration — same row */}
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
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
                  <label className="flex items-center gap-2 cursor-pointer select-none mt-1.5 md:mt-4">
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

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center gap-1.5 shadow-sm"
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

                {((MOCK_QUESTION_ANALYTICS[submissionsModalExam.id] || [
                  { id: 1, question: "Biochemical reactions concepts in cells?", wrongCount: 3, totalCount: 3, wrongPercentage: 100, commonWrongAnswer: "B. Protein breakdown reaction", correctAnswer: "C. ATP synthesis reaction" },
                  { id: 2, question: "How many membrane layers does a mitochondrion have?", wrongCount: 2, totalCount: 3, wrongPercentage: 67, commonWrongAnswer: "A. 1 single membrane", correctAnswer: "B. 2 double membranes" }
                ])).map((item, idx) => (
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
                ))}
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

      {/* Groups Tab Content */}
      {subTab === 'groups' && (
        <div className="space-y-6">
          {/* Groups Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search group name or join code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
          </div>

          {/* Groups Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              const count = group.membersCount ?? group.members?.length ?? 0;
              const pendingCount = group.pendingRequests?.length || 0;

              return (
                <div
                  key={group.id}
                  className={`bg-white p-6 rounded-2xl border transition-all text-left space-y-4 flex flex-col justify-between shadow-sm relative ${group.isLocked ? 'border-amber-400/40 bg-amber-50/10' : 'border-outline-variant/30 hover:border-secondary/40'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold relative">
                        {(() => {
                          const IconComponent = GROUP_ICONS[group.icon as keyof typeof GROUP_ICONS] || Users;
                          return <IconComponent className="w-6 h-6" />;
                        })()}
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce">
                            {pendingCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Lock / Unlock Toggle Button */}
                        <button
                          onClick={() => handleToggleLock(group.id)}
                          className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${group.isLocked
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          title={group.isLocked ? 'Group is LOCKED (Click to Unlock)' : 'Group is OPEN (Click to Lock)'}
                        >
                          {group.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span className="text-[10px] uppercase tracking-wider">{group.isLocked ? 'Locked' : 'Open'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(group)}
                          className="p-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded-xl transition-all"
                          title="Edit Group"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportGroupExcel(group)}
                          className="p-2 text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Export Group Roster (Excel .xls)"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-base text-on-surface truncate">{group.name}</h3>
                      </div>

                      {/* Join Code Badge with Copy */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/30 text-xs font-mono font-bold text-on-surface">
                          <Key className="w-3 h-3 text-secondary" />
                          <span>Code: {group.joinCode || group.id}</span>
                          <button
                            onClick={() => handleCopyCode(group.joinCode || group.id)}
                            className="ml-1 text-on-surface-variant hover:text-secondary transition-colors"
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

                  <div className="space-y-3 pt-3 border-t border-outline-variant/20">
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
                        className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-amber-300/60"
                      >
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>{pendingCount} Pending Approvals Needed</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRosterModal(group, 'enrolled')}
                      className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4 text-secondary" />
                      Manage Group Roster
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="col-span-full py-12 text-center text-on-surface-variant space-y-3 bg-white rounded-2xl border border-dashed border-outline-variant/40">
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
        </div>
      )}

      {/* Create / Edit Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
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
                <div className="grid grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
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
                        <IconComponent className="w-4.5 h-4.5" />
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

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center gap-1.5 shadow-sm"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-xl space-y-6 text-left max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-on-surface">{rosterGroup.name}</h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}
                  >
                    {rosterGroup.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {rosterGroup.isLocked ? 'LOCKED' : 'OPEN'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                  <span className="font-mono font-bold bg-surface-container px-2 py-0.5 rounded">
                    Code: {rosterGroup.joinCode || rosterGroup.id}
                  </span>
                  <span>{rosterGroup.members?.length || 0} Enrolled Members</span>
                </div>
              </div>
              <button
                onClick={() => setRosterGroup(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs (Enrolled vs Pending) */}
            <div className="flex border-b border-outline-variant/30 gap-6 shrink-0">
              <button
                onClick={() => setRosterTab('enrolled')}
                className={`pb-2.5 text-xs font-bold transition-all relative ${rosterTab === 'enrolled' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Enrolled Members ({rosterGroup.members?.length || 0})
                {rosterTab === 'enrolled' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
              </button>

              <button
                onClick={() => setRosterTab('pending')}
                className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${rosterTab === 'pending' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
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
                <form onSubmit={handleAddMember} className="bg-surface-bright p-4 rounded-2xl border border-outline-variant/30 space-y-3 shrink-0">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-secondary" /> Add Member Directly
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Member Full Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="sm:col-span-2 px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <input
                      type="email"
                      required
                      placeholder="member@school.edu"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="sm:col-span-2 px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </form>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(rosterGroup.members || []).map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-white rounded-2xl border border-outline-variant/20 hover:border-outline-variant/50 transition-all space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-on-surface">{member.name}</h5>
                            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-outline" /> {member.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant" title="Number of exams completed">
                            Exams: {member.examsCompleted ?? 0}/{member.totalExamsAssigned ?? 0}
                          </span>
                          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800" title="Average score">
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
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                            Detailed Exam Scores:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {member.examScores?.map((scoreItem, sIdx) => (
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
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <p className="text-xs text-on-surface-variant mb-1">
                  Members who used Join Code <strong className="font-mono">{rosterGroup.joinCode || rosterGroup.id}</strong> requesting to join this group:
                </p>

                {rosterGroup.pendingRequests && rosterGroup.pendingRequests.length > 0 && (
                  <div className="flex gap-3 mb-4 shrink-0">
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
                    className="flex items-center justify-between p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 hover:border-amber-400 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-on-surface">{member.name}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-outline" /> {member.email}
                          </span>
                          <span>• Requested {member.joinedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveMember(member)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectMember(member.id)}
                        className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
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
            <div className="flex justify-between items-center border-t border-outline-variant/20 pt-4 shrink-0">
              <button
                onClick={() => handleToggleLock(rosterGroup.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-surface-container text-on-surface'
                  }`}
              >
                {rosterGroup.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {rosterGroup.isLocked ? 'Unlock Group' : 'Lock Group'}
              </button>

              <button
                onClick={() => setRosterGroup(null)}
                className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
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
