export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserProfile {
  id: string | number
  email: string
  fullname: string | null
  avatar: string | null
  role: string
  status: string
  auth_provider: string | null
  provider_id?: string | null
  email_verified?: boolean
  study_streak?: number
  achievement_points?: number
  equipped_title?: string | null
  last_login?: string | null
  created_at?: string
  updated_at?: string
}

export interface StoredUser {
  name: string
  email: string
  avatar: string | null
  role: string
  equipped_title?: string | null
}

export interface UserSetting {
  id: number
  user_id: number
  notification_email: string | null
  email_notifications_enabled: boolean
  in_app_notifications_enabled: boolean
  notify_system: boolean
  notify_quiz_assigned: boolean
  notify_exam_reminder: boolean
  notify_results_published: boolean
  notify_room_invite: boolean
}

