import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyRuntimeEnv,
  getRuntimeEnvFileCandidates,
  loadRuntimeEnv,
  parseEnvContent
} from '../../../src/main/runtime-config'

const tempDirectories: string[] = []

function normalizePathSeparators(value: string): string {
  return value.replace(/\\/g, '/')
}

function createTempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'gh-agent-runtime-config-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(() => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop()
    if (directory) {
      rmSync(directory, { recursive: true, force: true })
    }
  }
})

describe('parseEnvContent', () => {
  it('parses key-value lines and ignores comments', () => {
    const parsed = parseEnvContent(`
# Comment
GITHUB_CLIENT_ID=test-id
GITHUB_CALLBACK_URL="http://127.0.0.1:48163/callback"
INVALID_LINE
`)

    expect(parsed).toEqual({
      GITHUB_CLIENT_ID: 'test-id',
      GITHUB_CALLBACK_URL: 'http://127.0.0.1:48163/callback'
    })
  })
})

describe('getRuntimeEnvFileCandidates', () => {
  it('uses cwd files in development mode', () => {
    const candidates = getRuntimeEnvFileCandidates({
      isPackaged: false,
      cwd: 'C:\\repo',
      execPath: 'C:\\repo\\app.exe'
    })

    expect(candidates.map(normalizePathSeparators)).toEqual(['C:/repo/.env', 'C:/repo/.env.local'])
  })

  it('includes resources, executable directory, and userData in packaged mode', () => {
    const candidates = getRuntimeEnvFileCandidates({
      isPackaged: true,
      cwd: '/repo',
      execPath: '/opt/GitHub Agent Desktop/GitHub Agent Desktop',
      resourcesPath: '/opt/GitHub Agent Desktop/resources',
      userDataPath: '/home/user/.config/GitHub Agent Desktop'
    })

    const normalizedCandidates = candidates.map(normalizePathSeparators)

    expect(normalizedCandidates).toContain('/opt/GitHub Agent Desktop/resources/.env')
    expect(normalizedCandidates).toContain('/opt/GitHub Agent Desktop/.env.local')
    expect(normalizedCandidates).toContain('/home/user/.config/GitHub Agent Desktop/.env')
  })
})

describe('loadRuntimeEnv', () => {
  it('lets .env.local override .env while preserving explicit process env values', () => {
    const root = createTempDirectory()

    writeFileSync(
      join(root, '.env'),
      ['GITHUB_CLIENT_ID=base-client', 'GITHUB_CALLBACK_URL=http://base.local/callback'].join('\n')
    )
    writeFileSync(
      join(root, '.env.local'),
      ['GITHUB_CLIENT_ID=local-client', 'GITHUB_CLIENT_SECRET=local-secret'].join('\n')
    )

    const result = loadRuntimeEnv({
      isPackaged: false,
      cwd: root,
      execPath: join(root, 'GitHub Agent Desktop.exe'),
      env: {
        GITHUB_CALLBACK_URL: 'http://explicit.local/callback'
      }
    })

    expect(result.mergedEnv.GITHUB_CLIENT_ID).toBe('local-client')
    expect(result.mergedEnv.GITHUB_CLIENT_SECRET).toBe('local-secret')
    expect(result.mergedEnv.GITHUB_CALLBACK_URL).toBe('http://explicit.local/callback')
    expect(result.loadedFiles).toEqual([join(root, '.env'), join(root, '.env.local')])
  })

  it('loads packaged runtime config from the executable directory when present', () => {
    const root = createTempDirectory()
    const appDirectory = join(root, 'dist', 'win-unpacked')
    mkdirSync(appDirectory, { recursive: true })
    writeFileSync(
      join(appDirectory, '.env.local'),
      ['GITHUB_CLIENT_ID=packaged-client', 'GITHUB_CLIENT_SECRET=packaged-secret'].join('\n')
    )

    const result = loadRuntimeEnv({
      isPackaged: true,
      cwd: root,
      execPath: join(appDirectory, 'GitHub Agent Desktop.exe'),
      resourcesPath: join(root, 'resources'),
      userDataPath: join(root, 'userData'),
      env: {}
    })

    expect(result.mergedEnv.GITHUB_CLIENT_ID).toBe('packaged-client')
    expect(result.mergedEnv.GITHUB_CLIENT_SECRET).toBe('packaged-secret')
    expect(result.loadedFiles).toContain(join(appDirectory, '.env.local'))
  })
})

describe('applyRuntimeEnv', () => {
  it('writes loaded keys into process.env', () => {
    const root = createTempDirectory()
    writeFileSync(join(root, '.env.local'), 'GITHUB_CLIENT_ID=runtime-client')

    const previousValue = process.env.GITHUB_CLIENT_ID

    try {
      delete process.env.GITHUB_CLIENT_ID
      applyRuntimeEnv({
        isPackaged: false,
        cwd: root,
        execPath: join(root, 'GitHub Agent Desktop.exe'),
        env: {}
      })

      expect(process.env.GITHUB_CLIENT_ID).toBe('runtime-client')
    } finally {
      if (typeof previousValue === 'string') {
        process.env.GITHUB_CLIENT_ID = previousValue
      } else {
        delete process.env.GITHUB_CLIENT_ID
      }
    }
  })
})
