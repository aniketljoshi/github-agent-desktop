export interface AuthServiceConfig {
  port: number
  appBaseUrl: string
  githubClientId: string
  githubClientSecret: string
  githubCallbackUrl: string
  desktopProtocol: string
  stateTtlSeconds: number
  grantTtlSeconds: number
}

export function loadAuthServiceConfig(
  env: Record<string, string | undefined> = process.env
): AuthServiceConfig {
  const port = parsePositiveInteger(env.PORT, 'PORT', 3001)
  const appBaseUrl = requireUrl(env.APP_BASE_URL, 'APP_BASE_URL')
  const githubClientId = requireValue(env.GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID')
  const githubClientSecret = requireValue(env.GITHUB_CLIENT_SECRET, 'GITHUB_CLIENT_SECRET')
  const githubCallbackUrl = requireUrl(env.GITHUB_CALLBACK_URL, 'GITHUB_CALLBACK_URL')
  const desktopProtocol = requireDesktopProtocol(env.DESKTOP_PROTOCOL, 'DESKTOP_PROTOCOL')
  const stateTtlSeconds = parsePositiveInteger(env.STATE_TTL_SECONDS, 'STATE_TTL_SECONDS', 600)
  const grantTtlSeconds = parsePositiveInteger(env.GRANT_TTL_SECONDS, 'GRANT_TTL_SECONDS', 60)

  return {
    port,
    appBaseUrl,
    githubClientId,
    githubClientSecret,
    githubCallbackUrl,
    desktopProtocol,
    stateTtlSeconds,
    grantTtlSeconds
  }
}

function requireValue(value: string | undefined, key: string): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function requireUrl(value: string | undefined, key: string): string {
  const trimmed = requireValue(value, key)
  try {
    const url = new URL(trimmed)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`${key} must use http or https`)
    }
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.includes(key)
        ? error.message
        : `${key} must be a valid URL`
    )
  }

  return trimmed
}

function requireDesktopProtocol(value: string | undefined, key: string): string {
  const trimmed = requireValue(value, key)
  try {
    const url = new URL(trimmed)
    if (!url.protocol || ['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`${key} must be a custom desktop callback URL`)
    }
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.includes(key)
        ? error.message
        : `${key} must be a valid custom protocol URL`
    )
  }
  return trimmed
}

function parsePositiveInteger(
  value: string | undefined,
  key: string,
  defaultValue: number
): number {
  const parsed = value?.trim() ? Number.parseInt(value, 10) : defaultValue
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return parsed
}
