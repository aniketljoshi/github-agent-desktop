import { describe, expect, it } from 'vitest'
import { ExchangeGrantStore } from '../../../auth-service/src/services/grant-store'
import { OAuthStateStore } from '../../../auth-service/src/services/state-store'

describe('auth service TTL stores', () => {
  it('returns and expires OAuth state entries', () => {
    let now = 0
    const store = new OAuthStateStore(1, () => now)

    store.set('state-1', {
      codeVerifier: 'verifier',
      returnTo: 'github-agent://auth/callback'
    })

    expect(store.get('state-1')).toEqual({
      codeVerifier: 'verifier',
      returnTo: 'github-agent://auth/callback'
    })

    now = 1001
    expect(store.get('state-1')).toBeNull()
  })

  it('takes exchange grants only once', () => {
    const store = new ExchangeGrantStore(60)
    store.set('grant-1', {
      accessToken: 'gho_test',
      authMethod: 'oauth',
      user: { username: 'aniket', avatarUrl: 'https://avatar' }
    })

    expect(store.take('grant-1')).toEqual({
      accessToken: 'gho_test',
      authMethod: 'oauth',
      user: { username: 'aniket', avatarUrl: 'https://avatar' }
    })
    expect(store.take('grant-1')).toBeNull()
  })
})
