import { describe, expect, it, vi } from 'vitest'
import {
  createGitHubAuthorizeUrl,
  exchangeOAuthCode,
  fetchGitHubUserProfile
} from '../../../auth-service/src/services/github-oauth'

describe('auth service GitHub OAuth helpers', () => {
  it('builds authorize URLs with PKCE and state', () => {
    const url = new URL(
      createGitHubAuthorizeUrl({
        clientId: 'client-id',
        callbackUrl: 'https://auth.example.com/auth/github/callback',
        state: 'state-123',
        codeChallenge: 'challenge-123'
      })
    )

    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('client-id')
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://auth.example.com/auth/github/callback'
    )
    expect(url.searchParams.get('state')).toBe('state-123')
    expect(url.searchParams.get('code_challenge')).toBe('challenge-123')
  })

  it('exchanges codes for access tokens', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'gho_test' })
    })

    await expect(
      exchangeOAuthCode(fetchImpl as typeof fetch, {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        callbackUrl: 'https://auth.example.com/auth/github/callback',
        code: 'code-123',
        codeVerifier: 'verifier-123'
      })
    ).resolves.toBe('gho_test')
  })

  it('loads GitHub user profiles', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ login: 'aniket', avatar_url: 'https://avatar' })
    })

    await expect(fetchGitHubUserProfile(fetchImpl as typeof fetch, 'gho_test')).resolves.toEqual({
      username: 'aniket',
      avatarUrl: 'https://avatar'
    })
  })
})
