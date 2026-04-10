import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { createAuthService } from '../../../auth-service/src/server'
import type { AuthServiceConfig } from '../../../auth-service/src/config'

const config: AuthServiceConfig = {
  port: 3001,
  appBaseUrl: 'http://127.0.0.1:39001',
  githubClientId: 'client-id',
  githubClientSecret: 'client-secret',
  githubCallbackUrl: 'http://127.0.0.1:39001/auth/github/callback',
  desktopProtocol: 'github-agent://auth/callback',
  stateTtlSeconds: 600,
  grantTtlSeconds: 60
}

const servers: Array<{ close: () => void }> = []

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close()
  }
})

describe('auth service server', () => {
  it('starts GitHub auth and redirects to GitHub authorize URL', async () => {
    const { server, stateStore } = createAuthService({
      config,
      fetchImpl: vi.fn() as typeof fetch
    })
    servers.push(server)
    server.listen(39001)
    await once(server, 'listening')

    const response = await fetch('http://127.0.0.1:39001/auth/github/start', {
      redirect: 'manual'
    })

    expect(response.status).toBe(302)
    const location = response.headers.get('location')
    expect(location).toContain('https://github.com/login/oauth/authorize')
    const redirectUrl = new URL(location ?? '')
    const state = redirectUrl.searchParams.get('state')
    expect(state).toBeTruthy()
    expect(state ? stateStore.get(state) : null).not.toBeNull()
  })

  it('completes callback and exchanges a one-time desktop grant', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'gho_test' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ login: 'aniket', avatar_url: 'https://avatar' })
      })

    const { server, stateStore } = createAuthService({
      config,
      fetchImpl: fetchImpl as typeof fetch
    })
    servers.push(server)
    server.listen(39001)
    await once(server, 'listening')

    stateStore.set('state-123', {
      codeVerifier: 'verifier-123',
      returnTo: 'github-agent://auth/callback'
    })

    const callbackResponse = await fetch(
      'http://127.0.0.1:39001/auth/github/callback?state=state-123&code=code-123',
      {
        redirect: 'manual'
      }
    )

    expect(callbackResponse.status).toBe(302)
    const location = callbackResponse.headers.get('location')
    expect(location).toContain('github-agent://auth/callback')
    const grant = new URL(location ?? '').searchParams.get('grant')
    expect(grant).toBeTruthy()

    const exchangeResponse = await fetch('http://127.0.0.1:39001/auth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant })
    })

    expect(exchangeResponse.status).toBe(200)
    await expect(exchangeResponse.json()).resolves.toEqual({
      accessToken: 'gho_test',
      authMethod: 'oauth',
      user: {
        username: 'aniket',
        avatarUrl: 'https://avatar'
      }
    })
  })
})
