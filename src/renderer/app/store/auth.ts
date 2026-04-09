import { create } from 'zustand'
import type { AuthMethod } from '../../../shared/types'

interface AuthState {
  isAuthenticated: boolean
  user: { username: string; avatarUrl: string } | null
  authMethod: AuthMethod | null
  isLoading: boolean
  error: string | null
  checkStatus: () => Promise<void>
  loginOAuth: () => Promise<void>
  loginDevice: () => Promise<void>
  loginPAT: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  authMethod: null,
  isLoading: true,
  error: null,

  checkStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const status = await window.api['auth:status']()
      set({
        isAuthenticated: status.isAuthenticated,
        user: status.user,
        authMethod: status.authMethod,
        isLoading: false
      })
    } catch {
      set({ isAuthenticated: false, user: null, authMethod: null, isLoading: false })
    }
  },

  loginOAuth: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = (await window.api['auth:login-oauth']()) as { success: boolean; error?: string; user?: { username: string; avatarUrl: string } }
      if (!res.success) throw new Error(res.error ?? 'OAuth login failed')
      set({ isAuthenticated: true, user: res.user ?? null, authMethod: 'oauth', isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Login failed' })
    }
  },

  loginDevice: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = (await window.api['auth:login-device']()) as { success: boolean; error?: string; user?: { username: string; avatarUrl: string } }
      if (!res.success) throw new Error(res.error ?? 'Device flow failed')
      set({ isAuthenticated: true, user: res.user ?? null, authMethod: 'device-flow', isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Login failed' })
    }
  },

  loginPAT: async (token: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = (await window.api['auth:login-pat']({ token })) as { success: boolean; error?: string; user?: { username: string; avatarUrl: string } }
      if (!res.success) throw new Error(res.error ?? 'PAT validation failed')
      set({ isAuthenticated: true, user: res.user ?? null, authMethod: 'pat', isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Login failed' })
    }
  },

  logout: async () => {
    await window.api['auth:logout']()
    set({ isAuthenticated: false, user: null, authMethod: null, error: null })
  }
}))
