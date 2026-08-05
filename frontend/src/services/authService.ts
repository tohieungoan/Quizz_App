import { apiClient } from './apiClient'
import type { TokenResponse, UserProfile, StoredUser, UserSetting } from '@/types/auth.types'

/**
 * Auth Service — Repository pattern for all Auth API calls.
 * Components only call endpoints through here, no direct fetch calls.
 */
export const authService = {
  /**
   * Log in using email & password (OAuth2 Password Flow)
   */
  login: (email: string, password: string): Promise<TokenResponse> => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return apiClient.postForm<TokenResponse>('/auth/login', params)
  },

  /**
   * Register a new user account
   */
  register: (email: string, fullName: string, password: string): Promise<unknown> =>
    apiClient.post('/auth/register', { email, fullname: fullName, password }),

  /**
   * Log in using Social (Google) token
   */
  socialLogin: (provider: string, token: string): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/social', { provider, token }),

  /**
   * Get profile details of the current user (using token in localStorage)
   */
  getProfile: (): Promise<UserProfile> =>
    apiClient.get<UserProfile>('/auth/me'),

  /**
   * Get profile with a specific access_token (used when token isn't stored yet)
   */
  getProfileWithToken: (accessToken: string): Promise<UserProfile> =>
    apiClient.get<UserProfile>('/auth/me', { Authorization: `Bearer ${accessToken}` }),

  /**
   * Refresh access_token using refresh_token
   */
  refreshToken: (refreshToken: string): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/refresh-token', { refresh_token: refreshToken }),

  /**
   * Log out — revoke refresh_token
   */
  logout: (refreshToken: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/logout', { refresh_token: refreshToken }),

  /**
   * Resend account verification email
   */
  resendVerification: (email: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/resend-verification', { email }),

  /**
   * Verify email address using token
   */
  verifyEmail: (token: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/verify-email', { token }),

  /**
   * Request password recovery (sends reset email)
   */
  forgotPassword: (email: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  /**
   * Reset password using verification token
   */
  resetPassword: (token: string, newPassword: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, new_password: newPassword }),

  /**
   * Update current user's profile details (fullname, avatar)
   */
  updateProfile: (userId: number | string, data: { fullname?: string; avatar?: string | null }): Promise<UserProfile> =>
    apiClient.put<UserProfile>(`/users/${userId}`, data),

  /**
   * Change current user's password (when logged in)
   */
  changePassword: (oldPassword: string, newPassword: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),

  /**
   * Fetch current user's notification preferences
   */
  getUserSettings: (): Promise<UserSetting> =>
    apiClient.get<UserSetting>('/users/me/settings'),

  /**
   * Update current user's notification preferences
   */
  updateUserSettings: (data: Partial<UserSetting>): Promise<UserSetting> =>
    apiClient.put<UserSetting>('/users/me/settings', data),

  /**
   * Request verification email for a new notification email address
   */
  requestNotificationEmail: (email: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/users/me/notification-email/request', { email }),

  /**
   * Verify and activate the new notification email using the token
   */
  verifyNotificationEmail: (token: string): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/verify-notification-email', { token }),
}

/**
 * Helper: Save tokens to localStorage
 */
export const saveTokens = (tokens: TokenResponse): void => {
  localStorage.setItem('token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
}

/**
 * Helper: Save user profile to localStorage
 */
export const saveUserProfile = (profile: UserProfile): void => {
  const stored: StoredUser = {
    name: profile.fullname || profile.email,
    email: profile.email,
    avatar: profile.avatar,
    role: profile.role,
  }
  localStorage.setItem('user', JSON.stringify(stored))
  localStorage.setItem('user_profile', JSON.stringify({
    id: profile.id,
    full_name: profile.fullname,
    fullname: profile.fullname,
    username: profile.fullname,
    email: profile.email,
    role: profile.role,
    avatar_url: profile.avatar,
    avatar: profile.avatar,
    status: profile.status,
    email_verified: profile.email_verified,
    study_streak: profile.study_streak,
    achievement_points: profile.achievement_points,
    auth_provider: profile.auth_provider,
    last_login: profile.last_login,
    created_at: profile.created_at,
  }))
}

/**
 * Helper: Clear all auth data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('user_profile')
}
