import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, APIResponse } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setError: (error: string | null) => void
  login: (user: User, accessToken: string) => void
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      login: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }),
      
      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
          
          if (!response.ok) {
            console.warn('Logout request failed, clearing local state anyway')
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      checkAuth: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          })
          
          if (response.ok) {
            const data: APIResponse<{ user: User; accessToken: string }> = await response.json()
            if (data.data) {
              set({
                user: data.data.user,
                accessToken: data.data.accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
              return
            }
          }
          
          // Try to refresh token if initial check fails
          const refreshed = await get().refreshToken()
          if (!refreshed) {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        } catch (error) {
          console.error('Auth check error:', error)
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Authentication check failed',
          })
        }
      },
      
      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })
          
          if (response.ok) {
            const data: APIResponse<{ user: User; accessToken: string }> = await response.json()
            if (data.data) {
              set({
                user: data.data.user,
                accessToken: data.data.accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
              return true
            }
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
        
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        return false
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Helper hooks
export const useAuth = () => {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    setLoading,
    setError,
    clearError,
  } = useAuthStore()

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    setLoading,
    setError,
    clearError,
  }
}

// Granular selectors for better performance
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)

// Permission hooks
export const useHasRole = (roles: string[]) => {
  const user = useUser()
  return user ? roles.includes(user.role) : false
}

export const useIsAdmin = () => {
  const user = useUser()
  return user ? ['ADMIN', 'SUPER_ADMIN'].includes(user.role) : false
}

export const useIsSuperAdmin = () => {
  const user = useUser()
  return user?.role === 'SUPER_ADMIN'
}