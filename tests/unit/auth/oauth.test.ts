import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  shell: { openExternal: vi.fn() }
}))

import { generatePKCE, generateState } from '../../../src/main/auth/github-oauth'

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
