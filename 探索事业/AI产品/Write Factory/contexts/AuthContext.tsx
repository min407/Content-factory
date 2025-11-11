'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserManager, User, AuthState } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateApiKey: (apiKey: string) => boolean
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })

  // 初始化时检查用户登录状态
  useEffect(() => {
    refreshUser()

    // 初始化默认用户（仅用于演示）
    UserManager.initializeDefaultUser()
  }, [])

  const refreshUser = () => {
    const user = UserManager.getCurrentUser()
    setAuthState({
      user,
      isAuthenticated: user !== null,
    })
  }

  const login = async (usernameOrEmail: string, password: string) => {
    const result = UserManager.login(usernameOrEmail, password)

    if (result.success && result.user) {
      setAuthState({
        user: result.user,
        isAuthenticated: true,
      })
    }

    return result
  }

  const register = async (username: string, email: string, password: string) => {
    const result = UserManager.register(username, email, password)

    if (result.success) {
      refreshUser()
    }

    return result
  }

  const logout = () => {
    UserManager.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
    })
  }

  const updateApiKey = (apiKey: string) => {
    const success = UserManager.updateApiKey(apiKey)
    if (success) {
      refreshUser()
    }
    return success
  }

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateApiKey,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}