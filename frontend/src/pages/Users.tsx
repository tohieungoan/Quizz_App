import { Search, ChevronLeft, ChevronRight, ChevronDown, Plus, Edit2, Trash2, Eye, Upload, BookOpen } from 'lucide-react';
import { useState, useMemo } from 'react';
import { UserActionModal, UserData, UserMode } from '../components/ui/UserActionModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AssignQuizModal } from '../components/ui/AssignQuizModal';
import { AlertModal } from '../components/ui/AlertModal';

const initialUsers: UserData[] = [
  { id: 'U-001', name: 'Marcus Thorne', email: 'marcus.thorne@eduquest.io', role: 'SUPER_ADMIN', status: 'ACTIVE', initials: 'MT', email_verified: true, achievement_points: 1250, last_login: '2026-07-14 08:30:00', created_at: '2025-01-15 10:00:00', assigned_quizzes: ['QZ-204', 'QZ-109'] },
  { id: 'U-002', name: 'Sarah Jenkins', email: 's.jenkins@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'SJ', email_verified: true, achievement_points: 840, last_login: '2026-07-13 15:45:00', created_at: '2025-03-22 14:30:00', assigned_quizzes: ['QZ-301'] },
  { id: 'U-003', name: 'David Chen', email: 'david.c@eduquest.io', role: 'USER', status: 'SUSPENDED', initials: 'DC', email_verified: false, achievement_points: 120, last_login: '2026-06-01 09:15:00', created_at: '2025-11-05 08:00:00', assigned_quizzes: [] },
  { id: 'U-004', name: 'Emily White', email: 'emily.w@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'EW', email_verified: true, achievement_points: 450, last_login: '2026-07-12 11:20:00', created_at: '2026-01-10 16:45:00', assigned_quizzes: [] },
  { id: 'U-005', name: 'Robert Fox', email: 'robert.f@eduquest.io', role: 'SUPER_ADMIN', status: 'ACTIVE', initials: 'RF', email_verified: true, achievement_points: 980, last_login: '2026-07-14 07:15:00', created_at: '2025-08-18 11:30:00', assigned_quizzes: [] },
  { id: 'U-006', name: 'Alice Cooper', email: 'alice.c@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'AC', email_verified: true, achievement_points: 320, last_login: '2026-07-10 14:10:00', created_at: '2026-02-14 09:20:00', assigned_quizzes: [] },
  { id: 'U-007', name: 'Thomas Wayne', email: 'thomas.w@eduquest.io', role: 'USER', status: 'ACTIVE', initials: 'TW', email_verified: false, achievement_points: 50, last_login: '2026-05-20 10:05:00', created_at: '2026-04-01 13:10:00', assigned_quizzes: [] },
  { id: 'U-008', name: 'Nina Simone', email: 'nina.s@eduquest.io', role: 'USER', status: 'SUSPENDED', initials: 'NS', email_verified: true, achievement_points: 610, last_login: '2026-06-15 16:30:00', created_at: '2025-12-12 15:00:00', assigned_quizzes: [] },
];

export function Users() {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const itemsPerPage = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserMode>('add');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Assign Quiz Modal State
  const [assignQuizOpen, setAssignQuizOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<UserData | null>(null);

  // Alert Modal State
  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  // Derived State (Filtering & Pagination)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter ? u.role === roleFilter : true;
      const matchesStatus = statusFilter ? u.status === statusFilter : true;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Action Handlers
  const handleOpenModal = (mode: UserMode, user?: UserData) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setModalOpen(true);
  };

  const handleSaveUser = (userData: Partial<UserData>) => {
    if (modalMode === 'add') {
      const newId = `U-00${users.length + 1}`;
      const initials = (userData.name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newUser = { ...userData, id: newId, initials, created_at: now, achievement_points: 0, last_login: 'Never' } as UserData;
      setUsers([newUser, ...users]);
    } else if (modalMode === 'edit' && selectedUser) {
      const initials = (userData.name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...userData, initials } as UserData : u));
    }
    setModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete));
      // Auto adjust page if current page becomes empty
      if (currentUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setUserToDelete(null);
    }
  };

  const handleOpenAssignModal = (user: UserData) => {
    setUserToAssign(user);
    setAssignQuizOpen(true);
  };

  const handleAssignQuizzes = (userId: string, quizIds: string[]) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const current = u.assigned_quizzes || [];
        // merge and remove duplicates
        const updated = Array.from(new Set([...current, ...quizIds]));
        return { ...u, assigned_quizzes: updated };
      }
      return u;
    }));
    setAlertState({
      isOpen: true,
      title: 'Assignment Successful',
      message: `Successfully assigned ${quizIds.length} exams to User ID: ${userId}`,
      type: 'success'
    });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text.split('\n');
        const newUsers: UserData[] = [];
        let startIndex = users.length + 1;
        
        // Skip header line (i=0)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const email = parts[1].trim();
            const role = (parts[2] ? parts[2].trim().toUpperCase() : 'USER') as 'SUPER_ADMIN' | 'USER';
            const status = (parts[3] ? parts[3].trim().toUpperCase() : 'ACTIVE') as 'ACTIVE' | 'SUSPENDED';
            
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            
            newUsers.push({
              id: `U-${String(startIndex++).padStart(3, '0')}`,
              name,
              email,
              role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER',
              status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
              initials,
              created_at: now,
              achievement_points: 0,
              last_login: 'Never',
              email_verified: false
            });
          }
        }
        
        if (newUsers.length > 0) {
          setUsers(prev => [...newUsers, ...prev]);
          setAlertState({ isOpen: true, title: 'Import Successful', message: `Successfully imported ${newUsers.length} users!`, type: 'success' });
        } else {
          setAlertState({ isOpen: true, title: 'Import Failed', message: 'No valid user data found in the CSV file.', type: 'error' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold text-on-surface font-headline-lg">User Management</h1>
          <p className="text-[16px] text-on-surface-variant mt-1 font-body-md">Manage platform access, roles, and administrative statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".csv" 
            id="csv-upload" 
            className="hidden" 
            onChange={handleImportCSV} 
          />
          <button 
            onClick={() => document.getElementById('csv-upload')?.click()}
            className="bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-xl font-button flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm"
          >
            <Upload className="w-5 h-5" /> Import CSV
          </button>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-primary-container text-on-primary px-5 py-3 rounded-xl font-button flex items-center gap-2 hover:bg-primary transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center shrink-0">
        <div className="w-full sm:flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-on-surface-variant w-5 h-5" />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="flex-1 sm:w-40 bg-surface-container-low border border-outline-variant rounded-lg py-2 px-4 outline-none font-body-md"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="USER">User</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="flex-1 sm:w-40 bg-surface-container-low border border-outline-variant rounded-lg py-2 px-4 outline-none font-body-md"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 mb-8">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant/40">
                <th className="p-4 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="p-4 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {currentUsers.length > 0 ? currentUsers.map(u => (
                <tr key={u.id} className="hover:bg-surface-bright transition-colors font-body-md group">
                  <td className="p-4 text-sm font-semibold text-primary">{u.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center font-bold text-lg uppercase">{u.initials}</div>
                      <div>
                        <p className="font-semibold text-on-surface">{u.name}</p>
                        <p className="text-sm text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'SUPER_ADMIN' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {u.role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex w-max items-center gap-1.5 ${u.status === 'ACTIVE' ? 'bg-secondary-container/40 text-on-secondary-container border border-secondary-container/50' : 'bg-error-container text-error border border-error/20'}`}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'ACTIVE' ? 'bg-secondary animate-pulse' : 'bg-error'}`}></span>{u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenAssignModal(u)} title="Assign Quiz" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"><BookOpen className="w-5 h-5" /></button>
                      <button onClick={() => handleOpenModal('view', u)} title="View User" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"><Eye className="w-5 h-5" /></button>
                      <button onClick={() => handleOpenModal('edit', u)} title="Edit User" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"><Edit2 className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteUser(u.id)} title="Delete User" className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-md transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">No users found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-bright flex items-center justify-between shrink-0">
            <span className="text-sm text-on-surface-variant">
              Showing <span className="font-medium text-on-surface">{startIndex + 1}</span> to <span className="font-medium text-on-surface">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium text-on-surface">{filteredUsers.length}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                    isPageDropdownOpen 
                      ? 'border-primary text-primary ring-1 ring-primary/20' 
                      : 'border-outline-variant/50 text-on-surface hover:border-outline-variant'
                  }`}
                >
                  Page {currentPage} of {totalPages}
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                {isPageDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPageDropdownOpen(false)}></div>
                    <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1">
                      <div className="max-h-48 overflow-y-auto">
                        {pages.map(page => (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              setIsPageDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              currentPage === page
                                ? 'bg-primary/5 text-primary font-semibold'
                                : 'text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            Page {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button  
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <UserActionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        mode={modalMode} 
        user={selectedUser} 
        onSave={handleSaveUser} 
      />

      <ConfirmModal 
        isOpen={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)} 
        onConfirm={confirmDeleteUser} 
        title="Delete User" 
        message="Are you sure you want to delete this user? This action cannot be undone." 
      />

      <AssignQuizModal 
        isOpen={assignQuizOpen} 
        onClose={() => setAssignQuizOpen(false)} 
        user={userToAssign}
        onAssign={handleAssignQuizzes}
      />

      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </main>
  );
}
