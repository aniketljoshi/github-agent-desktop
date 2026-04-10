import { describe, expect, it, vi } from 'vitest'
import {
  buildDesktopAuthStartUrl,
  exchangeDesktopGrant,
  extractProtocolCallbackFromArgv,
  getDesktopAuthConfig,
  isDesktopAuthCallbackUrl
} from '../../../src/main/auth/auth-service-client'

describe('desktop auth service client', () => {
  it('builds backend auth config and start URLs', () => {
    const config = getDesktopAuthConfig({
      GITHUB_AUTH_SERVICE_URL: 'https://auth.example.com/',
      DESKTOP_AUTH_CALLBACK_URL: 'github-agent://auth/callback'
    })

    expect(config).toEqual({
      serviceUrl: 'https://auth.example.com',
      desktopCallbackUrl: 'github-agent://auth/callback'
    })
    expect(buildDesktopAuthStartUrl(config!)).toBe(
      'https://auth.example.com/auth/github/start?return_to=github-agent%3A%2F%2Fauth%2Fcallback'
    )
  })

  it('extracts and validates desktop callback URLs', () => {
    const callback = extractProtocolCallbackFromArgv(
      ['electron.exe', 'github-agent://auth/callback?grant=abc123'],
      'github-agent://auth/callback'
    )

    expect(callback).toBe('github-agent://auth/callback?grant=abc123')
    expect(isDesktopAuthCallbackUrl(callback!, 'github-agent://auth/callback')).toBe(true)
    expect(
      isDesktopAuthCallbackUrl('github-agent://other/path', 'github-agent://auth/callback')
    ).toBe(false)
  })

  it('exchanges desktop grants through the backend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'gho_test',
        authMethod: 'oauth',
        user: {
          username: 'aniket',
          avatarUrl: 'https://avatar'
        }
      })
    })

    vi.stubGlobal('fetch', fetchImpl)

    await expect(
      exchangeDesktopGrant(
        {
          serviceUrl: 'https://auth.example.com',
          desktopCallbackUrl: 'github-agent://auth/callback'
        },
        'grant-123'
      )
    ).resolves.toEqual({
      accessToken: 'gho_test',
      authMethod: 'oauth',
      user: {
        username: 'aniket',
        avatarUrl: 'https://avatar'
      }
    })
  })
})
