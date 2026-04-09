import { create } from 'zustand'
import type { BYOKConfig, UserSettings } from '../../../shared/types'

interface SettingsState {
  settings: UserSettings | null
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>
  setBYOK: (config: BYOKConfig & { apiKey: string }) => Promise<void>
  clearBYOK: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = (await window.api['settings:get']()) as UserSettings
      set({ settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    await window.api['settings:set'](partial)
    const current = get().settings
    if (current) {
      set({ settings: { ...current, ...partial } })
    }
  },

  setBYOK: async (config) => {
    await window.api['settings:set-byok'](config)
    const current = get().settings
    if (current) {
      const { apiKey, ...byokConfig } = config
      void apiKey
      set({ settings: { ...current, hasBYOK: true, byokConfig } })
    }
  },

  clearBYOK: async () => {
    await window.api['settings:clear-byok']()
    const current = get().settings
    if (current) {
      set({ settings: { ...current, hasBYOK: false, byokConfig: null } })
    }
  }
}))
