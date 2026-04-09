import type { UserSettings } from '../../shared/types'

const DEFAULT_SETTINGS: UserSettings = {
  selectedProvider: {
    ask: 'github-models',
    plan: 'github-models',
    agent: 'copilot-sdk'
  },
  selectedModel: {
    ask: '',
    plan: '',
    agent: ''
  },
  repoPath: null,
  hasBYOK: false,
  byokConfig: null,
  theme: 'dark'
}

let current: UserSettings = { ...DEFAULT_SETTINGS }

export const settingsStore = {
  get: (): UserSettings => ({ ...current }),
  set: (next: UserSettings): void => {
    current = { ...next }
  },
  reset: (): void => {
    current = { ...DEFAULT_SETTINGS }
  }
}
