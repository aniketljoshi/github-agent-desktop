import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('validatePAT', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  it('returns user info for a valid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ login: 'testuser', avatar_url: 'https://avatar.test/u.png' })
    })

    const { validatePAT } = await import('../../../src/main/auth/pat-auth')
    const result = await validatePAT('ghp_validtoken')
    expect(result).toEqual({ username: 'testuser', avatarUrl: 'https://avatar.test/u.png' })
  })

  it('throws for an invalid token (401)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    })

    const { validatePAT } = await import('../../../src/main/auth/pat-auth')
    await expect(validatePAT('bad-token')).rejects.toThrow('401')
  })

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const { validatePAT } = await import('../../../src/main/auth/pat-auth')
    await expect(validatePAT('ghp_token')).rejects.toThrow('Network failure')
  })

  it('throws for empty token', async () => {
    const { validatePAT } = await import('../../../src/main/auth/pat-auth')
    await expect(validatePAT('')).rejects.toThrow('Token is required')
  })
})
