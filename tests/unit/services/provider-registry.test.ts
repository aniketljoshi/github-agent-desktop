import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/main/copilot/adapter', () => ({
  isAvailable: vi.fn(() => false)
}))

vi.mock('../../../src/main/auth/token-store', () => ({
  hasToken: vi.fn((key: string) => key === 'github')
}))

describe('provider-registry', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns github-models for ask when configured', async () => {
    const { getProviderForMode } = await import(
      '../../../src/main/services/provider-registry'
    )
    const settings = {
      selectedProvider: { ask: 'github-models' as const, plan: 'github-models' as const, agent: 'copilot-sdk' as const },
      selectedModel: { ask: '', plan: '', agent: '' },
      repoPath: null,
      hasBYOK: false,
      byokConfig: null,
      theme: 'dark' as const
    }
    expect(getProviderForMode('ask', settings)).toBe('github-models')
  })

  it('returns byok for plan when configured', async () => {
    const { getProviderForMode } = await import(
      '../../../src/main/services/provider-registry'
    )
    const settings = {
      selectedProvider: { ask: 'github-models' as const, plan: 'byok' as const, agent: 'copilot-sdk' as const },
      selectedModel: { ask: '', plan: '', agent: '' },
      repoPath: null,
      hasBYOK: true,
      byokConfig: { provider: 'openai' as const, baseUrl: 'https://api.openai.com/v1' },
      theme: 'dark' as const
    }
    expect(getProviderForMode('plan', settings)).toBe('byok')
  })

  it('isProviderAvailable returns true for github-models when authenticated', async () => {
    const { isProviderAvailable } = await import(
      '../../../src/main/services/provider-registry'
    )
    expect(isProviderAvailable('github-models')).toBe(true)
  })

  it('isProviderAvailable returns false for copilot-sdk when SDK unavailable', async () => {
    const { isProviderAvailable } = await import(
      '../../../src/main/services/provider-registry'
    )
    expect(isProviderAvailable('copilot-sdk')).toBe(false)
  })

  it('isProviderAvailable returns false for byok when no key', async () => {
    const { isProviderAvailable } = await import(
      '../../../src/main/services/provider-registry'
    )
    expect(isProviderAvailable('byok')).toBe(false)
  })
})
