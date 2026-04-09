import { appendFileSync } from 'fs'
import { join } from 'path'

const startupLogPath = join(process.env.TEMP ?? process.cwd(), 'github-agent-desktop-startup.log')

export function logStartup(message: string, error?: unknown): void {
  try {
    const suffix =
      error instanceof Error
        ? ` | ${error.name}: ${error.message}\n${error.stack ?? ''}`
        : error
          ? ` | ${String(error)}`
          : ''

    appendFileSync(startupLogPath, `[${new Date().toISOString()}] ${message}${suffix}\n`)
  } catch {
    // Avoid crashing startup because logging failed.
  }
}

export function getStartupLogPath(): string {
  return startupLogPath
}
