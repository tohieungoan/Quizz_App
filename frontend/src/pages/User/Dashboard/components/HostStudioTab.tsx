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
} from 'lucide-react';
import { HOST_QUIZZES_LIST, HOST_GROUPS_LIST, HostGroup, GroupMember } from '@/data/userData';

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
  const [subTab, setSubTab] = useState<'quizzes' | 'groups'>('quizzes');
  const [groups, setGroups] = useState<HostGroup[]>(HOST_GROUPS_LIST);
  const [searchTerm, setSearchTerm] = useState('');

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Group Create/Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HostGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupJoinCode, setGroupJoinCode] = useState('');
  const [groupIsLocked, setGroupIsLocked] = useState(false);

  // Roster Management Modal State
  const [rosterGroup, setRosterGroup] = useState<HostGroup | null>(null);
  const [rosterTab, setRosterTab] = useState<'enrolled' | 'pending'>('enrolled');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Copy Code Handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Toggle Group Lock Handler
  const handleToggleLock = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isLocked: !g.isLocked } : g))
    );
    if (rosterGroup && rosterGroup.id === groupId) {
      setRosterGroup((prev) => (prev ? { ...prev, isLocked: !prev.isLocked } : null));
    }
  };

  // Handlers for Group Modal (Create / Edit)
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupJoinCode(`GRP-${Math.floor(1000 + Math.random() * 9000)}`);
    setGroupIsLocked(false);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditModal = (group: HostGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setGroupJoinCode(group.joinCode || group.id);
    setGroupIsLocked(group.isLocked || false);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const finalJoinCode = groupJoinCode.trim().toUpperCase() || `GRP-${Math.floor(1000 + Math.random() * 9000)}`;

    if (editingGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? {
                ...g,
                name: groupName.trim(),
                description: groupDescription.trim(),
                joinCode: finalJoinCode,
                isLocked: groupIsLocked,
              }
            : g
        )
      );
      if (rosterGroup && rosterGroup.id === editingGroup.id) {
        setRosterGroup((prev) =>
          prev
            ? {
                ...prev,
                name: groupName.trim(),
                description: groupDescription.trim(),
                joinCode: finalJoinCode,
                isLocked: groupIsLocked,
              }
            : null
        );
      }
    } else {
      const newGroup: HostGroup = {
        id: `GRP-${(groups.length + 1).toString().padStart(2, '0')}`,
        name: groupName.trim(),
        description: groupDescription.trim() || 'No description provided.',
        joinCode: finalJoinCode,
        isLocked: groupIsLocked,
        membersCount: 0,
        members: [],
        pendingRequests: [],
      };
      setGroups((prev) => [...prev, newGroup]);
    }

    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (rosterGroup && rosterGroup.id === groupId) {
        setRosterGroup(null);
      }
    }
  };

  // Handlers for Roster Management
  const handleOpenRosterModal = (group: HostGroup, initialTab: 'enrolled' | 'pending' = 'enrolled') => {
    setRosterGroup(group);
    setRosterTab(initialTab);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterGroup || !newMemberName.trim() || !newMemberEmail.trim()) return;

    const newMember: GroupMember = {
      id: `M-${Date.now().toString().slice(-4)}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      joinedDate: new Date().toISOString().split('T')[0],
    };

    const updatedMembers = [...(rosterGroup.members || []), newMember];

    const updatedGroup: HostGroup = {
      ...rosterGroup,
      members: updatedMembers,
      membersCount: updatedMembers.length,
    };

    setRosterGroup(updatedGroup);
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (memberId: string) => {
    if (!rosterGroup) return;

    const updatedMembers = (rosterGroup.members || []).filter((m) => m.id !== memberId);

    const updatedGroup: HostGroup = {
      ...rosterGroup,
      members: updatedMembers,
      membersCount: updatedMembers.length,
    };

    setRosterGroup(updatedGroup);
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  // Student Approval Handlers
  const handleApproveStudent = (student: GroupMember) => {
    if (!rosterGroup) return;

    const updatedPending = (rosterGroup.pendingRequests || []).filter((p) => p.id !== student.id);
    const updatedMembers = [...(rosterGroup.members || []), student];

    const updatedGroup: HostGroup = {
      ...rosterGroup,
      members: updatedMembers,
      membersCount: updatedMembers.length,
      pendingRequests: updatedPending,
    };

    setRosterGroup(updatedGroup);
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const handleRejectStudent = (studentId: string) => {
    if (!rosterGroup) return;

    const updatedPending = (rosterGroup.pendingRequests || []).filter((p) => p.id !== studentId);

    const updatedGroup: HostGroup = {
      ...rosterGroup,
      pendingRequests: updatedPending,
    };

    setRosterGroup(updatedGroup);
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.joinCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 text-left">
      {/* Host Header Banner */}
      <div className="bg-gradient-to-r from-secondary via-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Teacher & Host Studio
          </span>
          <h2 className="text-3xl font-extrabold">Host Live Quiz Sessions</h2>
          <p className="text-emerald-100 text-sm max-w-xl">
            Select a quiz set, configure game settings, manage student rosters, approve join requests, and launch real-time rooms.
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
          className={`pb-3 text-sm font-bold transition-all relative ${
            subTab === 'quizzes' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          My Quizzes ({HOST_QUIZZES_LIST.length})
          {subTab === 'quizzes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
        </button>

        <button
          onClick={() => setSubTab('groups')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            subTab === 'groups' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          My Student Groups ({groups.length})
          {subTab === 'groups' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
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
                  className={`bg-white p-6 rounded-2xl border transition-all text-left space-y-4 flex flex-col justify-between shadow-sm relative ${
                    group.isLocked ? 'border-amber-400/40 bg-amber-50/10' : 'border-outline-variant/30 hover:border-secondary/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold relative">
                        <Users className="w-6 h-6" />
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
                          className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                            group.isLocked
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
                        {count} Students
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
                <p className="text-sm font-medium">No student groups found.</p>
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
                {editingGroup ? 'Edit Student Group' : 'Create New Group'}
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
                  placeholder="e.g. Group 10A1 - Advanced Physics"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Student Join Code
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. PHYS-10A1"
                    value={groupJoinCode}
                    onChange={(e) => setGroupJoinCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-xl text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">Students will use this code to request entry.</p>
              </div>

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
                    Lock Group (Khóa nhóm)
                  </span>
                  <p className="text-[11px] text-on-surface-variant">Prevent new student join requests</p>
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
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
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
                  <span>{rosterGroup.members?.length || 0} Enrolled Students</span>
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
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  rosterTab === 'enrolled' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Enrolled Students ({rosterGroup.members?.length || 0})
                {rosterTab === 'enrolled' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
              </button>

              <button
                onClick={() => setRosterTab('pending')}
                className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                  rosterTab === 'pending' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
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

            {/* Tab 1: Enrolled Students */}
            {rosterTab === 'enrolled' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
                {/* Add Member Form */}
                <form onSubmit={handleAddMember} className="bg-surface-bright p-4 rounded-2xl border border-outline-variant/30 space-y-3 shrink-0">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-secondary" /> Add Student Directly
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Student Full Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="sm:col-span-2 px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                    <input
                      type="email"
                      required
                      placeholder="student@school.edu"
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
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(rosterGroup.members || []).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-outline-variant/20 hover:border-outline-variant/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary font-bold text-xs flex items-center justify-center">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-on-surface">{member.name}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-outline" /> {member.email}
                            </span>
                            <span>• Joined {member.joinedDate}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(!rosterGroup.members || rosterGroup.members.length === 0) && (
                    <div className="py-8 text-center text-on-surface-variant text-xs space-y-1">
                      <Users className="w-8 h-8 mx-auto text-outline/40" />
                      <p>No students enrolled in this group yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Pending Approvals */}
            {rosterTab === 'pending' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <p className="text-xs text-on-surface-variant">
                  Students who used Join Code <strong className="font-mono">{rosterGroup.joinCode || rosterGroup.id}</strong> requesting to join this group:
                </p>

                {(rosterGroup.pendingRequests || []).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 hover:border-amber-400 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-on-surface">{student.name}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-outline" /> {student.email}
                          </span>
                          <span>• Requested {student.joinedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveStudent(student)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectStudent(student.id)}
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
                    <p className="text-[11px]">All student join requests have been processed.</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-outline-variant/20 pt-4 shrink-0">
              <button
                onClick={() => handleToggleLock(rosterGroup.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  rosterGroup.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-surface-container text-on-surface'
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
