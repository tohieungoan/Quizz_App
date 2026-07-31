import { apiClient } from './apiClient';

export interface UserResponse {
  id: number;
  email: string;
  fullname: string | null;
  avatar: string | null;
  role: string;
  status: string;
  email_verified: boolean;
  achievement_points: number;
  last_login: string | null;
  created_at: string;
}

export interface UserCreatePayload {
  email: string;
  fullname?: string;
  role?: string;
  status?: string;
  password?: string;
  avatar?: string;
}

export interface UserUpdatePayload {
  email?: string;
  fullname?: string;
  role?: string;
  status?: string;
  password?: string;
  avatar?: string;
  achievement_points?: number;
}

export const userService = {
  getUsers: (params?: { skip?: number; limit?: number; search?: string; role?: string; status?: string }): Promise<UserResponse[]> => {
    const query = new URLSearchParams();
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role && params.role !== 'ALL') query.append('role', params.role);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    return apiClient.get<UserResponse[]>(`/users/?${query.toString()}`);
  },

  createUser: (data: UserCreatePayload): Promise<UserResponse> =>
    apiClient.post<UserResponse>('/users/', data),

  updateUser: (id: number, data: UserUpdatePayload): Promise<UserResponse> =>
    apiClient.put<UserResponse>(`/users/${id}`, data),

  deleteUser: (id: number): Promise<any> =>
    apiClient.delete<any>(`/users/${id}`),

  importUsers: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postMultipart<any>('/users/import', formData);
  }
};
