import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  shell: { openExternal: vi.fn() }
}))

import {
  createOAuthAuthorizeUrl,
  generatePKCE,
  generateState,
  startOAuthFlow
} from '../../../src/main/auth/github-oauth'

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
