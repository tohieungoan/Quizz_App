import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService, saveTokens, saveUserProfile, clearAuthData } from '@/services'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  setAuthenticated: () => void
  setUnauthenticated: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem('refresh_token') ? 'loading' : 'unauthenticated'
  )

  // Verify session on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      setStatus('unauthenticated')
      return
    }

    const verify = async () => {
      try {
        const tokens = await authService.refreshToken(refreshToken)
        saveTokens(tokens)
        const profile = await authService.getProfileWithToken(tokens.access_token)
        saveUserProfile(profile)
        setStatus('authenticated')
      } catch {
        clearAuthData()
        setStatus('unauthenticated')
      }
    }

    verify()
  }, [])

  const setAuthenticated = () => setStatus('authenticated')
  const setUnauthenticated = () => setStatus('unauthenticated')

  return (
    <AuthContext.Provider value={{ status, setAuthenticated, setUnauthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to read auth status from Context.
 * Used in App.tsx for routing orchestration.
 */
export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
