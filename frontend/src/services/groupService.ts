import { apiClient } from './apiClient';

export interface GroupCreateData {
  name: string;
  description?: string;
  icon?: string;
  status?: string; // "OPEN" or "CLOSED"
}

export interface GroupUpdateData {
  name?: string;
  description?: string;
  icon?: string;
  status?: string;
}

export interface BackendGroupResponse {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  icon: string;
  status: string; // "OPEN" or "CLOSED"
  group_code: string;
  created_at: string;
  updated_at: string;
}

export interface ExamScoreDetail {
  examTitle: string;
  score: string;
  status: string;
}

export interface BackendRosterMember {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string | null;
  examsCompleted: number;
  totalExamsAssigned: number;
  averageScore: string;
  avatar?: string;
  examScores: ExamScoreDetail[];
}

export interface BackendGroupMemberResponse {
  id: number;
  group_id: number;
  user_id: number;
  role_in_group: string;
  status: string; // PENDING, APPROVED, INVITED, BLOCKED
  joined_at: string | null;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface EnrolledGroupResponse {
  id: number;
  name: string;
  host: string;
  membersCount: number;
  lastActivity: string;
  status: 'ACTIVE' | 'PENDING';
  group_code: string;
}

export const groupService = {
  getMyGroups: async (): Promise<BackendGroupResponse[]> => {
    return apiClient.get<BackendGroupResponse[]>('/groups');
  },

  getMyMemberships: async (): Promise<EnrolledGroupResponse[]> => {
    return apiClient.get<EnrolledGroupResponse[]>('/groups/my-memberships');
  },

  createGroup: async (data: GroupCreateData): Promise<BackendGroupResponse> => {
    return apiClient.post<BackendGroupResponse>('/groups', data);
  },

  updateGroup: async (groupId: number | string, data: GroupUpdateData): Promise<BackendGroupResponse> => {
    return apiClient.put<BackendGroupResponse>(`/groups/${groupId}`, data);
  },

  deleteGroup: async (groupId: number | string): Promise<BackendGroupResponse> => {
    return apiClient.delete<BackendGroupResponse>(`/groups/${groupId}`);
  },

  getGroupRoster: async (groupId: number | string): Promise<BackendRosterMember[]> => {
    return apiClient.get<BackendRosterMember[]>(`/groups/${groupId}/roster`);
  },

  getGroupJoinRequests: async (groupId: number | string): Promise<BackendGroupMemberResponse[]> => {
    return apiClient.get<BackendGroupMemberResponse[]>(`/groups/${groupId}/requests`);
  },

  approveJoinRequest: async (groupId: number | string, memberId: number | string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/requests/${memberId}/approve`, {});
  },

  rejectJoinRequest: async (groupId: number | string, memberId: number | string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/requests/${memberId}/reject`, {});
  },

  inviteMember: async (groupId: number | string, email: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/invite`, { email });
  },

  requestToJoinGroup: async (groupCode: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/groups/join-request', { group_code: groupCode });
  },

  bulkApproveJoinRequests: async (groupId: number | string, allMembers: boolean, memberIds: (number | string)[] = []): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/requests/bulk-approve`, {
      all_members: allMembers,
      member_ids: memberIds.map(id => Number(id))
    });
  },

  bulkRejectJoinRequests: async (groupId: number | string, allMembers: boolean, memberIds: (number | string)[] = []): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/requests/bulk-reject`, {
      all_members: allMembers,
      member_ids: memberIds.map(id => Number(id))
    });
  },

  removeMember: async (groupId: number | string, memberId: number | string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/groups/${groupId}/members/${memberId}`);
  }
};
