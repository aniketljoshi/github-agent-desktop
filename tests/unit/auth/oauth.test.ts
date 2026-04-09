import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import http from 'http'

const { openExternalMock } = vi.hoisted(() => ({
  openExternalMock: vi.fn()
}))

vi.mock('electron', () => ({
  shell: { openExternal: openExternalMock }
}))

import {
  createOAuthAuthorizeUrl,
  generatePKCE,
  generateState,
  startDeviceFlow,
  startOAuthFlow
} from '../../../src/main/auth/github-oauth'

beforeEach(() => {
  vi.restoreAllMocks()
  openExternalMock.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('OAuth PKCE helpers', () => {
  it('generates a code verifier of at least 43 characters', () => {
    const { codeVerifier } = generatePKCE()
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43)
  })

  it('generates a code challenge that differs from the verifier', () => {
    const { codeVerifier, codeChallenge } = generatePKCE()
    expect(codeChallenge).not.toBe(codeVerifier)
  })

  it('generates a base64url-encoded code challenge (no +, /, = chars)', () => {
    const { codeChallenge } = generatePKCE()
    expect(codeChallenge).not.toMatch(/[+/=]/)
  })

  it('returns both codeVerifier and codeChallenge', () => {
    const result = generatePKCE()
    expect(result).toHaveProperty('codeVerifier')
    expect(result).toHaveProperty('codeChallenge')
    expect(typeof result.codeVerifier).toBe('string')
    expect(typeof result.codeChallenge).toBe('string')
  })

  it('generates unique values each call', () => {
    const a = generatePKCE()
    const b = generatePKCE()
    expect(a.codeVerifier).not.toBe(b.codeVerifier)
  })
})

describe('OAuth state', () => {
  it('generates a 32 hex char state string', () => {
    const state = generateState()
    expect(state).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generates unique state each call', () => {
    const a = generateState()
    const b = generateState()
    expect(a).not.toBe(b)
  })
})

describe('OAuth authorize URL', () => {
  it('includes client id, callback, state, and PKCE challenge', () => {
    const url = createOAuthAuthorizeUrl({
      clientId: 'client-123',
      callbackUrl: 'http://127.0.0.1:48163/callback',
      state: 'abc123',
      codeChallenge: 'challenge123'
    })

    expect(url).toContain('client_id=client-123')
    expect(url).toContain('redirect_uri=http%3A%2F%2F127.0.0.1%3A48163%2Fcallback')
    expect(url).toContain('state=abc123')
    expect(url).toContain('code_challenge=challenge123')
    expect(url).toContain('code_challenge_method=S256')
  })
})

describe('OAuth browser flow guards', () => {
  it('requires a client secret for browser redirect login', async () => {
    await expect(
      startOAuthFlow('client-123', '', 'http://127.0.0.1:48163/callback')
    ).rejects.toThrow(/GITHUB_CLIENT_SECRET/)
  })
})

describe('OAuth browser flow', () => {
  it('opens the browser, receives the callback, and exchanges the code', async () => {
    const callbackPort = 48180
    const callbackUrl = `http://127.0.0.1:${callbackPort}/callback`

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'oauth-token' })
      })
    )

    openExternalMock.mockImplementation(async (authorizeUrl: string) => {
      const parsed = new URL(authorizeUrl)
      const state = parsed.searchParams.get('state')
      const redirectUri = parsed.searchParams.get('redirect_uri')

      setTimeout(() => {
        http.get(`${redirectUri}?state=${state}&code=oauth-code`)
      }, 5)
      return true
    })

    await expect(
      startOAuthFlow('client-123', 'client-secret', callbackUrl)
    ).resolves.toBe('oauth-token')

    expect(openExternalMock).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(
      'https://github.com/login/oauth/access_token',
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('rejects when GitHub redirects back with an OAuth error', async () => {
    const callbackPort = 48181
    const callbackUrl = `http://127.0.0.1:${callbackPort}/callback`

    openExternalMock.mockImplementation(async (authorizeUrl: string) => {
      const parsed = new URL(authorizeUrl)
      const state = parsed.searchParams.get('state')
      const redirectUri = parsed.searchParams.get('redirect_uri')

      setTimeout(() => {
        http.get(`${redirectUri}?state=${state}&error=access_denied`)
      }, 5)
      return true
    })

    await expect(
      startOAuthFlow('client-123', 'client-secret', callbackUrl)
    ).rejects.toThrow('GitHub login failed: access_denied')
  })
})

describe('Device flow', () => {
  it('requires a client id for device login', async () => {
    await expect(startDeviceFlow('', vi.fn())).rejects.toThrow('GITHUB_CLIENT_ID is not configured')
  })

  it('shows the device code and returns an access token on the first successful poll', async () => {
    const onCode = vi.fn()
    const fetchMock = vi.fn()
    vi.stubGlobal(
      'fetch',
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            device_code: 'device-code',
            user_code: 'ABCD-EFGH',
            verification_uri: 'https://github.com/login/device',
            interval: 0,
            expires_in: 60
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ access_token: 'device-token' })
        })
    )
    openExternalMock.mockResolvedValue(true)

    await expect(startDeviceFlow('client-123', onCode)).resolves.toBe('device-token')
    expect(onCode).toHaveBeenCalledWith('ABCD-EFGH', 'https://github.com/login/device')
    expect(openExternalMock).toHaveBeenCalledWith('https://github.com/login/device')
  })

  it('rejects when requesting the device code fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      })
    )

    await expect(startDeviceFlow('client-123', vi.fn())).rejects.toThrow(
      'Failed to start GitHub login: 500 Server Error'
    )
  })

  it('rejects when the poll response denies access', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            device_code: 'device-code',
            user_code: 'ABCD-EFGH',
            verification_uri: 'https://github.com/login/device',
            interval: 0,
            expires_in: 60
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ error: 'access_denied' })
        })
    )
    openExternalMock.mockResolvedValue(true)

    await expect(startDeviceFlow('client-123', vi.fn())).rejects.toThrow('Login was denied')
  })
})
