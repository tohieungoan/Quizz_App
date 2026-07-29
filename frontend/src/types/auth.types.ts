export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserProfile {
  id: string
  email: string
  fullname: string | null
  avatar: string | null
  role: string
  status: string
  auth_provider: string | null
}

export interface StoredUser {
  name: string
  email: string
  avatar: string | null
  role: string
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

