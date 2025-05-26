'use client'

import { useEffect } from 'react'
import { useAuth } from '@/store/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuth()

  useEffect(() => {
    // Check authentication status on app initialization
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}