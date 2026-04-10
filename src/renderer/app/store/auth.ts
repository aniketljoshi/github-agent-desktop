import { create } from 'zustand'
import type { AuthMethod } from '../../../shared/types'

interface AuthState {
  isAuthenticated: boolean
  user: { username: string; avatarUrl: string } | null
  authMethod: AuthMethod | null
  isLoading: boolean
  authPending: boolean
  error: string | null
  checkStatus: () => Promise<void>
  bindDesktopAuthEvents: () => void
  loginOAuth: () => Promise<void>
  loginDevice: () => Promise<void>
  loginPAT: (token: string) => Promise<void>
  logout: () => Promise<void>
}

const AUTH_STATUS_TIMEOUT_MS = 10000
let authEventsBound = false

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  authMethod: null,
  isLoading: true,
  authPending: false,
  error: null,

  checkStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const status = await withTimeout(
        window.api['auth:status']() as Promise<{
          isAuthenticated: boolean
          user: { username: string; avatarUrl: string } | null
          authMethod: AuthMethod | null
        }>,
        AUTH_STATUS_TIMEOUT_MS,
        'Sign-in check timed out'
      )
      set({
        isAuthenticated: status.isAuthenticated,
        user: status.user,
        authMethod: status.authMethod,
        isLoading: false,
        authPending: false
      })
    } catch (err) {
      set({
        isAuthenticated: false,
        user: null,
        authMethod: null,
        isLoading: false,
        authPending: false,
        error: err instanceof Error ? err.message : 'Could not verify sign-in status'
      })
    }
  },

  bindDesktopAuthEvents: () => {
    if (authEventsBound) {
      return
    }

    authEventsBound = true

    window.api.on('auth:completed', (payload: unknown) => {
      const data = payload as {
        user?: { username: string; avatarUrl: string }
        authMethod?: AuthMethod
      }

      set({
        isAuthenticated: true,
        user: data.user ?? null,
        authMethod: data.authMethod ?? 'oauth',
        isLoading: false,
        authPending: false,
        error: null
      })
    })

    window.api.on('auth:error', (message: unknown) => {
      set({
        isAuthenticated: false,
        authMethod: null,
        user: null,
        isLoading: false,
        authPending: false,
        error: typeof message === 'string' ? message : 'Login failed'
      })
    })
  },

  loginOAuth: async () => {
    set({ authPending: true, error: null })
    try {
      const res = (await window.api['auth:login-oauth']()) as {
        success: boolean
        pending?: boolean
        error?: string
        authMethod?: AuthMethod
        user?: { username: string; avatarUrl: string }
      }
      if (!res.success) throw new Error(res.error ?? 'OAuth login failed')
      if (res.pending) {
        set({
          isAuthenticated: false,
          user: null,
          authMethod: null,
          isLoading: false,
          authPending: true,
          error: null
        })
        return
      }
      set({
        isAuthenticated: true,
        user: res.user ?? null,
        authMethod: res.authMethod ?? 'device-flow',
        isLoading: false,
        authPending: false
      })
    } catch (err) {
      set({
        isLoading: false,
        authPending: false,
        error: err instanceof Error ? err.message : 'Login failed'
      })
    }
  },

  loginDevice: async () => {
    set({ authPending: true, error: null })
    try {
      const res = (await window.api['auth:login-device']()) as {
        success: boolean
        error?: string
        authMethod?: AuthMethod
        user?: { username: string; avatarUrl: string }
      }
      if (!res.success) throw new Error(res.error ?? 'Device flow failed')
      set({
        isAuthenticated: true,
        user: res.user ?? null,
        authMethod: res.authMethod ?? 'device-flow',
        isLoading: false,
        authPending: false
      })
    } catch (err) {
      set({
        isLoading: false,
        authPending: false,
        error: err instanceof Error ? err.message : 'Login failed'
      })
    }
  },

  loginPAT: async (token: string) => {
    set({ authPending: true, error: null })
    try {
      const res = (await window.api['auth:login-pat']({ token })) as {
        success: boolean
        error?: string
        authMethod?: AuthMethod
        user?: { username: string; avatarUrl: string }
      }
      if (!res.success) throw new Error(res.error ?? 'PAT validation failed')
      set({
        isAuthenticated: true,
        user: res.user ?? null,
        authMethod: res.authMethod ?? 'pat',
        isLoading: false,
        authPending: false
      })
    } catch (err) {
      set({
        isLoading: false,
        authPending: false,
        error: err instanceof Error ? err.message : 'Login failed'
      })
    }
  },

  logout: async () => {
    await window.api['auth:logout']()
    set({
      isAuthenticated: false,
      user: null,
      authMethod: null,
      authPending: false,
      error: null
    })
  }
}))
