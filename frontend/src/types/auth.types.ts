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
