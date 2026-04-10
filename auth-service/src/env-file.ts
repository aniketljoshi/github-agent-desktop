import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function applyAuthServiceEnvFiles(baseDir: string, env: NodeJS.ProcessEnv = process.env): void {
  for (const filename of ['.env', '.env.local']) {
    const filePath = join(baseDir, filename)
    if (!existsSync(filePath)) {
      continue
    }

    const content = readFileSync(filePath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex <= 0) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()
      if (!env[key]) {
        env[key] = value
      }
    }
  }
}
