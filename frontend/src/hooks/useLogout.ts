import { authService, clearAuthData } from '@/services'
import { useAuthContext } from '@/store/AuthContext'

/**
 * Custom hook to handle user logout:
 * 1. Call POST /auth/logout API to revoke refresh_token on the server
 * 2. Clear all auth data stored in localStorage
 * 3. Update AuthContext status -> App.tsx automatically redirects to /login
 */
export const useLogout = () => {
  const { setUnauthenticated } = useAuthContext()

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token')

    // Fire-and-forget — do not block UI
    if (refreshToken) {
      authService.logout(refreshToken).catch((err) => {
        console.warn('Logout API call failed:', err)
      })
    }

    clearAuthData()
    sessionStorage.clear()
    setUnauthenticated()
  }

  return { logout }
}
