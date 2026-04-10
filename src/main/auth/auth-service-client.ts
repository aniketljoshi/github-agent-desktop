export interface DesktopAuthConfig {
  serviceUrl: string
  desktopCallbackUrl: string
}

export interface DesktopAuthExchangeResult {
  accessToken: string
  authMethod: 'oauth'
  user: {
    username: string
    avatarUrl: string
  }
}

export function getDesktopAuthConfig(
  env: Record<string, string | undefined> = process.env
): DesktopAuthConfig | null {
  const serviceUrl = env.GITHUB_AUTH_SERVICE_URL?.trim()
  if (!serviceUrl) {
    return null
  }

  return {
    serviceUrl: serviceUrl.replace(/\/+$/, ''),
    desktopCallbackUrl:
      env.DESKTOP_AUTH_CALLBACK_URL?.trim() ?? 'github-agent://auth/callback'
  }
}

export function buildDesktopAuthStartUrl(config: DesktopAuthConfig): string {
  const url = new URL('/auth/github/start', config.serviceUrl)
  url.searchParams.set('return_to', config.desktopCallbackUrl)
  return url.toString()
}

export async function startDesktopAuthFlow(config: DesktopAuthConfig): Promise<void> {
  const { shell } = await import('electron')
  await shell.openExternal(buildDesktopAuthStartUrl(config))
}

export async function exchangeDesktopGrant(
  config: DesktopAuthConfig,
  grant: string
): Promise<DesktopAuthExchangeResult> {
  const response = await fetch(new URL('/auth/exchange', config.serviceUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ grant })
  })

  if (!response.ok) {
    const payload = (await safeJson(response)) as { error?: string }
    throw new Error(payload.error ?? `Desktop auth exchange failed: ${response.status}`)
  }

  return (await response.json()) as DesktopAuthExchangeResult
}

export function extractProtocolCallbackFromArgv(
  argv: string[],
  desktopCallbackUrl: string
): string | null {
  const expectedProtocol = new URL(desktopCallbackUrl).protocol
  return argv.find((value) => value.startsWith(expectedProtocol)) ?? null
}

export function isDesktopAuthCallbackUrl(
  value: string,
  desktopCallbackUrl: string
): boolean {
  const received = new URL(value)
  const expected = new URL(desktopCallbackUrl)

  return (
    received.protocol === expected.protocol &&
    received.hostname === expected.hostname &&
    received.pathname === expected.pathname
  )
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}
