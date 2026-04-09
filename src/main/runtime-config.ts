import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'

export type RuntimeEnvContext = {
  isPackaged: boolean
  cwd: string
  execPath: string
  resourcesPath?: string
  userDataPath?: string
  env?: NodeJS.ProcessEnv
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

export function parseEnvContent(content: string): Record<string, string> {
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  return entries.reduce<Record<string, string>>((result, line) => {
    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      return result
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()

    if (!key) {
      return result
    }

    result[key] = stripWrappingQuotes(rawValue)
    return result
  }, {})
}

export function getRuntimeEnvFileCandidates(context: RuntimeEnvContext): string[] {
  if (!context.isPackaged) {
    return [join(context.cwd, '.env'), join(context.cwd, '.env.local')]
  }

  const packagedCandidates = [
    context.resourcesPath ? join(context.resourcesPath, '.env') : null,
    context.resourcesPath ? join(context.resourcesPath, '.env.local') : null,
    join(dirname(context.execPath), '.env'),
    join(dirname(context.execPath), '.env.local'),
    context.userDataPath ? join(context.userDataPath, '.env') : null,
    context.userDataPath ? join(context.userDataPath, '.env.local') : null
  ].filter((candidate): candidate is string => Boolean(candidate))

  return [...new Set(packagedCandidates)]
}

export function loadRuntimeEnv(context: RuntimeEnvContext): {
  loadedFiles: string[]
  mergedEnv: NodeJS.ProcessEnv
} {
  const originalEnv = { ...(context.env ?? {}) }
  const preservedKeys = new Set(
    Object.entries(originalEnv)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([key]) => key)
  )

  const mergedEnv = { ...originalEnv }
  const loadedFiles: string[] = []

  for (const filePath of getRuntimeEnvFileCandidates(context)) {
    if (!existsSync(filePath)) {
      continue
    }

    const parsed = parseEnvContent(readFileSync(filePath, 'utf8'))
    loadedFiles.push(filePath)

    for (const [key, value] of Object.entries(parsed)) {
      if (preservedKeys.has(key)) {
        continue
      }

      mergedEnv[key] = value
    }
  }

  return { loadedFiles, mergedEnv }
}

export function applyRuntimeEnv(context: RuntimeEnvContext): string[] {
  const { loadedFiles, mergedEnv } = loadRuntimeEnv(context)

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (typeof value === 'string') {
      process.env[key] = value
    }
  }

  return loadedFiles
}
