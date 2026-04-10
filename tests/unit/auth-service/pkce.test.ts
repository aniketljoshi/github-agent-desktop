import { describe, expect, it } from 'vitest'
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateGrantToken,
  generateStateToken
} from '../../../auth-service/src/lib/pkce'

describe('auth service PKCE helpers', () => {
  it('generates URL-safe verifier, challenge, state, and grant tokens', () => {
    const verifier = generateCodeVerifier()
    const challenge = generateCodeChallenge(verifier)
    const state = generateStateToken()
    const grant = generateGrantToken()

    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/)
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
    expect(state).toMatch(/^[a-f0-9]+$/)
    expect(grant).toMatch(/^[a-f0-9]+$/)
  })
})
