import { safeStorage, app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

function tokensDir(): string {
  const dir = join(app.getPath('userData'), 'tokens')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function tokenPath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_')
  return join(tokensDir(), `${safe}.enc`)
}

export function storeToken(key: string, token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }
  const encrypted = safeStorage.encryptString(token)
  writeFileSync(tokenPath(key), encrypted)
}

export function getToken(key: string): string | null {
  const p = tokenPath(key)
  if (!existsSync(p)) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    const encrypted = readFileSync(p)
    return safeStorage.decryptString(Buffer.from(encrypted))
  } catch {
    return null
  }
}

export function deleteToken(key: string): void {
  const p = tokenPath(key)
  if (existsSync(p)) unlinkSync(p)
}

export function hasToken(key: string): boolean {
  return existsSync(tokenPath(key))
}
