import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((s: string) => Buffer.from(`enc:${s}`)),
    decryptString: vi.fn((buf: Buffer) => buf.toString().replace('enc:', ''))
  },
  app: {
    getPath: vi.fn(() => '/tmp/test-app')
  }
}))

// Mock fs
const mockFiles = new Map<string, Buffer>()
vi.mock('fs', () => ({
  existsSync: vi.fn((p: string) => mockFiles.has(p)),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn((p: string, data: Buffer) => mockFiles.set(p, data)),
  readFileSync: vi.fn((p: string) => {
    const d = mockFiles.get(p)
    if (!d) throw new Error('ENOENT')
    return d
  }),
  unlinkSync: vi.fn((p: string) => mockFiles.delete(p))
}))

beforeEach(() => {
  mockFiles.clear()
})

describe('token-store', () => {
  it('stores and retrieves a token', async () => {
    const { storeToken, getToken } = await import(
      '../../../src/main/auth/token-store'
    )
    storeToken('test', 'my-secret-token')
    const result = getToken('test')
    expect(result).toBe('my-secret-token')
  })

  it('returns null for a missing token', async () => {
    const { getToken } = await import('../../../src/main/auth/token-store')
    expect(getToken('nonexistent')).toBeNull()
  })

  it('deletes a token', async () => {
    const { storeToken, deleteToken, hasToken } = await import(
      '../../../src/main/auth/token-store'
    )
    storeToken('del-test', 'token')
    deleteToken('del-test')
    expect(hasToken('del-test')).toBe(false)
  })

  it('hasToken returns true for existing key', async () => {
    const { storeToken, hasToken } = await import(
      '../../../src/main/auth/token-store'
    )
    storeToken('exists', 'token')
    expect(hasToken('exists')).toBe(true)
  })

  it('handles encryption unavailable', async () => {
    const { safeStorage } = await import('electron')
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValueOnce(false)
    const { storeToken } = await import('../../../src/main/auth/token-store')
    expect(() => storeToken('fail', 'token')).toThrow('Encryption is not available')
  })
})
