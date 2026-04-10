import { createHash, randomBytes } from 'node:crypto'

function base64UrlEncode(value: Buffer): string {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32))
}

export function generateCodeChallenge(codeVerifier: string): string {
  return base64UrlEncode(createHash('sha256').update(codeVerifier).digest())
}

export function generateStateToken(): string {
  return randomBytes(16).toString('hex')
}

export function generateGrantToken(): string {
  return randomBytes(24).toString('hex')
}
