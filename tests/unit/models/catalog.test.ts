import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('model catalog', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
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
      tags: ['flagship']
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
})
