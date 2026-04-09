import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

const adapterMock = vi.hoisted(() => ({
  loadSDK: vi.fn(),
  initClient: vi.fn(),
  listModels: vi.fn()
}))

vi.mock('../../../src/main/copilot/adapter', () => adapterMock)

describe('model catalog', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    adapterMock.loadSDK.mockReset()
    adapterMock.initClient.mockReset()
    adapterMock.listModels.mockReset()
  })

  it('fetches and maps models correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          publisher: 'OpenAI',
          capabilities: ['streaming', 'tool-calling'],
          limits: { max_tokens: 4096 },
          rate_limit_tier: 'standard',
          supported_input_modalities: ['text', 'image'],
          tags: ['flagship']
        }
      ]
    })

    const { fetchModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchModelCatalog('token')

    expect(catalog).toHaveLength(1)
    expect(catalog[0]).toEqual({
      id: 'gpt-4o',
      name: 'GPT-4o',
      publisher: 'OpenAI',
      capabilities: ['streaming', 'tool-calling'],
      limits: { max_tokens: 4096 },
      rateLimitTier: 'standard',
      supportedInputModalities: ['text', 'image'],
      tags: ['flagship'],
      source: 'github-models'
    })
  })

  it('handles API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' })

    const { fetchModelCatalog } = await import('../../../src/main/github/models')
    await expect(fetchModelCatalog('token')).rejects.toThrow('500')
  })

  it('handles empty catalog', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })

    const { fetchModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchModelCatalog('token')
    expect(catalog).toEqual([])
  })

  it('returns cached results within the TTL and fills default values for sparse models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'model-x' }]
    })

    const { fetchModelCatalog } = await import('../../../src/main/github/models')
    const first = await fetchModelCatalog('token')
    const second = await fetchModelCatalog('token')

    expect(first[0]).toEqual({
      id: 'model-x',
      name: 'model-x',
      publisher: 'Unknown',
      capabilities: [],
      limits: {},
      rateLimitTier: 'default',
      supportedInputModalities: ['text'],
      tags: [],
      source: 'github-models'
    })
    expect(second).toEqual(first)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('prefers Copilot-accessible models from the SDK and filters disabled policy models', async () => {
    adapterMock.loadSDK.mockResolvedValue(true)
    adapterMock.initClient.mockResolvedValue(undefined)
    adapterMock.listModels.mockResolvedValue([
      {
        id: 'claude-opus-4.6',
        name: 'Claude Opus 4.6',
        capabilities: {
          supports: { vision: true, reasoningEffort: true },
          limits: { max_context_window_tokens: 200000 }
        },
        policy: { state: 'enabled' },
        billing: { multiplier: 3 }
      },
      {
        id: 'blocked-model',
        name: 'Blocked Model',
        capabilities: {
          supports: { vision: false, reasoningEffort: false },
          limits: { max_context_window_tokens: 64000 }
        },
        policy: { state: 'disabled' }
      }
    ])

    const { fetchAccessibleModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchAccessibleModelCatalog('token')

    expect(adapterMock.initClient).toHaveBeenCalledWith('token')
    expect(catalog).toEqual([
      {
        id: 'claude-opus-4.6',
        name: 'Claude Opus 4.6',
        publisher: 'Anthropic',
        capabilities: ['tool-calling', 'vision', 'reasoning-effort'],
        limits: { max_context_tokens: 200000 },
        rateLimitTier: 'copilot',
        supportedInputModalities: ['text', 'image'],
        tags: [],
        requestMultiplier: 3,
        policyState: 'enabled',
        source: 'copilot-sdk'
      }
    ])
  })

  it('maps multiple Copilot models across publishers and SDK capability branches', async () => {
    adapterMock.loadSDK.mockResolvedValue(true)
    adapterMock.initClient.mockResolvedValue(undefined)
    adapterMock.listModels.mockResolvedValue([
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        capabilities: {
          supports: { vision: false, reasoningEffort: false },
          limits: { max_context_window_tokens: 173000 }
        }
      },
      {
        id: 'gpt-5.3-codex',
        name: 'GPT-5.3-Codex',
        capabilities: {
          supports: { vision: false, reasoningEffort: true },
          limits: { max_context_window_tokens: 400000 }
        },
        billing: { multiplier: 1 }
      },
      {
        id: 'llama-3',
        name: 'Llama 3',
        capabilities: {
          supports: { vision: false, reasoningEffort: false },
          limits: { max_context_window_tokens: 128000 }
        },
        policy: { state: 'enabled' }
      },
      {
        id: 'mistral-large',
        name: 'Mistral Large',
        capabilities: {
          supports: { vision: false, reasoningEffort: false },
          limits: { max_context_window_tokens: 128000 }
        },
        policy: { state: 'enabled' }
      },
      {
        id: 'mystery-model',
        name: 'Custom Workspace Model',
        capabilities: {
          supports: { vision: false, reasoningEffort: false },
          limits: { max_context_window_tokens: 64000 }
        },
        policy: { state: 'unconfigured' }
      }
    ])

    const { fetchAccessibleModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchAccessibleModelCatalog('token')

    expect(catalog).toEqual([
      expect.objectContaining({
        id: 'gemini-2.5-pro',
        publisher: 'Google',
        capabilities: ['tool-calling'],
        supportedInputModalities: ['text']
      }),
      expect.objectContaining({
        id: 'gpt-5.3-codex',
        publisher: 'OpenAI',
        capabilities: ['tool-calling', 'reasoning-effort'],
        requestMultiplier: 1
      }),
      expect.objectContaining({
        id: 'llama-3',
        publisher: 'Meta'
      }),
      expect.objectContaining({
        id: 'mistral-large',
        publisher: 'Mistral'
      })
    ])
  })

  it('falls back to the GitHub Models catalog when the SDK cannot provide models', async () => {
    adapterMock.loadSDK.mockResolvedValue(false)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'gpt-4.1',
          name: 'GPT-4.1',
          publisher: 'OpenAI',
          capabilities: ['streaming', 'tool-calling'],
          limits: { max_tokens: 4096 },
          rate_limit_tier: 'standard',
          supported_input_modalities: ['text'],
          tags: []
        }
      ]
    })

    const { fetchAccessibleModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchAccessibleModelCatalog('token')

    expect(catalog[0]?.source).toBe('github-models')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to the GitHub Models catalog when the SDK loads but returns no models', async () => {
    adapterMock.loadSDK.mockResolvedValue(true)
    adapterMock.initClient.mockResolvedValue(undefined)
    adapterMock.listModels.mockResolvedValue([])
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    const { fetchAccessibleModelCatalog } = await import('../../../src/main/github/models')
    const catalog = await fetchAccessibleModelCatalog('token')

    expect(adapterMock.initClient).toHaveBeenCalledWith('token')
    expect(catalog).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to the GitHub Models catalog when the SDK model lookup stalls', async () => {
    vi.useFakeTimers()
    adapterMock.loadSDK.mockResolvedValue(true)
    adapterMock.initClient.mockResolvedValue(undefined)
    adapterMock.listModels.mockImplementation(
      () => new Promise(() => undefined) as Promise<never[]>
    )
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'claude-opus-4.6',
          name: 'Claude Opus 4.6',
          publisher: 'Anthropic',
          capabilities: ['streaming', 'tool-calling'],
          limits: { max_tokens: 4096 },
          rate_limit_tier: 'premium',
          supported_input_modalities: ['text'],
          tags: []
        }
      ]
    })

    const { fetchAccessibleModelCatalog } = await import('../../../src/main/github/models')
    const pending = fetchAccessibleModelCatalog('token')

    await vi.advanceTimersByTimeAsync(4000)

    const catalog = await pending

    expect(catalog).toEqual([
      expect.objectContaining({
        id: 'claude-opus-4.6',
        publisher: 'Anthropic',
        source: 'github-models'
      })
    ])
    expect(mockFetch).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
