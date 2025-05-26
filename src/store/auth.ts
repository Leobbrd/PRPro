import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'GUEST'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  login: (user: User, accessToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      login: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          })
          
          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              accessToken: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            // Try to refresh token
            const refreshed = await get().refreshToken()
            if (!refreshed) {
              set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
              })
            }
          }
        } catch (error) {
          console.error('Auth check error:', error)
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
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
            const data = await response.json()
            set({
              user: data.user,
              accessToken: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
        
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
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
    login,
    logout,
    checkAuth,
    setLoading,
  } = useAuthStore()

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    setLoading,
  }
}

export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsLoading = () => useAuthStore((state) => state.isLoading)