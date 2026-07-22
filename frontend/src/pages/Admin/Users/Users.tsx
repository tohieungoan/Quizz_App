import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Upload, BookOpen, Users as UsersIcon } from 'lucide-react';
import { UserActionModal, UserData, UserMode } from '@/components/ui/UserActionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown } from '@/components/ui/Dropdown';
import { DUMMY_USERS } from '@/data/mockDb';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>(DUMMY_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserMode>('add');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleCreateNew = () => {
    setSelectedUser(null);
    setModalMode('add');
    setActionModalOpen(true);
  };

  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setModalMode('edit');
    setActionModalOpen(true);
  };

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setModalMode('view');
    setActionModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete));
      setUserToDelete(null);
    }
  };

  const handleSaveUser = (userData: Partial<UserData>) => {
    if (modalMode === 'add') {
      const newUser: UserData = {
        id: `U-${Math.floor(Math.random() * 900) + 100}`,
        name: userData.name || 'New User',
        email: userData.email || '',
        role: userData.role || 'USER',
        status: userData.status || 'ACTIVE',
        initials: (userData.name || 'NU')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
        email_verified: userData.email_verified || false,
        achievement_points: userData.achievement_points || 0,
        last_login: 'Just now',
        created_at: new Date().toISOString(),
        assigned_quizzes: [],
      };
      setUsers([newUser, ...users]);
      setAlertState({
        isOpen: true,
        title: 'User Created',
        message: 'New user has been successfully created.',
        type: 'success',
      });
    } else if (modalMode === 'edit' && selectedUser) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...userData } : u)));
      setAlertState({
        isOpen: true,
        title: 'User Updated',
        message: 'User information has been successfully updated.',
        type: 'success',
      });
    }
    setActionModalOpen(false);
  };

  const handleBatchImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setAlertState({
          isOpen: true,
          title: 'Import Successful',
          message: `Successfully imported users from ${file.name}`,
          type: 'success',
        });
      }
    };
    input.click();
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
            User Management
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
            Manage user accounts and roles.
          </p>

        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleBatchImport}
            className="border border-outline-variant/60 bg-white hover:bg-surface-container text-on-surface font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-primary" />
            Batch Import
          </button>
          <button
            onClick={handleCreateNew}
            className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-8 flex flex-col">
        {/* Table Toolbar */}
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant/40 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Dropdown
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'USER', label: 'User' },
              ]}
            />

            <Dropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">User</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Role</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                  Status
                </th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Last Login</th>
                <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {user.initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-on-surface truncate">{user.name}</span>
                          <span className="text-xs text-on-surface-variant truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-primary-container/20 text-primary border border-primary-container/30'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                      {user.last_login}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    No users found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <UserActionModal
        isOpen={actionModalOpen}
        mode={modalMode}
        user={selectedUser}
        onClose={() => setActionModalOpen(false)}
        onSave={handleSaveUser}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action will permanently remove their access."
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </main>
  );
};
