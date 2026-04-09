import { describe, expect, it } from 'vitest'
import { settingsStore } from '../../../src/main/services/settings-store'

describe('settings-store', () => {
  it('returns the default settings shape', () => {
    settingsStore.reset()
    expect(settingsStore.get()).toEqual({
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
    })
  })

  it('stores a replacement settings object immutably', () => {
    const next = {
      selectedProvider: {
        ask: 'byok',
        plan: 'github-models',
        agent: 'copilot-sdk'
      },
      selectedModel: {
        ask: 'openai/gpt-4.1',
        plan: 'anthropic/claude-4',
        agent: 'anthropic/claude-4'
      },
      repoPath: 'C:/repo',
      hasBYOK: true,
      byokConfig: {
        provider: 'openai' as const,
        baseUrl: 'https://api.openai.com/v1'
      },
      theme: 'dark' as const
    }

    settingsStore.set(next)
    const result = settingsStore.get()

    expect(result).toEqual(next)
    expect(result).not.toBe(next)
  })

  it('resets back to defaults', () => {
    settingsStore.set({
      selectedProvider: { ask: 'byok', plan: 'byok', agent: 'byok' },
      selectedModel: { ask: 'x', plan: 'y', agent: 'z' },
      repoPath: 'C:/repo',
      hasBYOK: true,
      byokConfig: { provider: 'ollama', baseUrl: 'http://localhost:11434/v1' },
      theme: 'dark'
    })

    settingsStore.reset()

    expect(settingsStore.get().hasBYOK).toBe(false)
    expect(settingsStore.get().repoPath).toBeNull()
  })
})
