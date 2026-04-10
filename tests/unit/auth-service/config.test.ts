import { describe, expect, it } from 'vitest'
import { loadAuthServiceConfig } from '../../../auth-service/src/config'

const baseEnv = {
  APP_BASE_URL: 'https://auth.example.com',
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  GITHUB_CALLBACK_URL: 'https://auth.example.com/auth/github/callback',
  DESKTOP_PROTOCOL: 'github-agent://auth/callback'
}

describe('auth service config', () => {
  it('loads valid config with defaults', () => {
    const config = loadAuthServiceConfig(baseEnv)

    expect(config).toEqual({
      port: 3001,
      appBaseUrl: 'https://auth.example.com',
      githubClientId: 'client-id',
      githubClientSecret: 'client-secret',
      githubCallbackUrl: 'https://auth.example.com/auth/github/callback',
      desktopProtocol: 'github-agent://auth/callback',
      stateTtlSeconds: 600,
      grantTtlSeconds: 60
    })
  })

  it('throws when required values are missing', () => {
    expect(() => loadAuthServiceConfig({ ...baseEnv, GITHUB_CLIENT_SECRET: '' })).toThrow(
      'GITHUB_CLIENT_SECRET is required'
    )
  })

  it('throws for invalid callback URL or desktop protocol', () => {
    expect(() =>
      loadAuthServiceConfig({ ...baseEnv, GITHUB_CALLBACK_URL: 'not-a-url' })
    ).toThrow('GITHUB_CALLBACK_URL must be a valid URL')
    expect(() => loadAuthServiceConfig({ ...baseEnv, DESKTOP_PROTOCOL: 'https://example.com' })).toThrow(
      'DESKTOP_PROTOCOL must be a custom desktop callback URL'
    )
  })
})
