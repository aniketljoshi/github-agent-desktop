import { createHash, randomBytes } from 'crypto'
import { shell } from 'electron'

type DeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  interval: number
  expires_in: number
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64url(randomBytes(32))
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest())
  return { codeVerifier, codeChallenge }
}

export function generateState(): string {
  return randomBytes(16).toString('hex')
}

async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
  const initRes = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope: 'read:user' })
  })

  if (!initRes.ok) {
    throw new Error(`Failed to start GitHub login: ${initRes.status} ${initRes.statusText}`)
  }

  return (await initRes.json()) as DeviceCodeResponse
}

async function pollForAccessToken(clientId: string, init: DeviceCodeResponse): Promise<string> {
  let interval = init.interval * 1000
  const deadline = Date.now() + init.expires_in * 1000

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, interval))

    const pollRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        device_code: init.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })

    if (!pollRes.ok) {
      throw new Error(`Token polling failed: ${pollRes.status} ${pollRes.statusText}`)
    }

    const data = (await pollRes.json()) as {
      access_token?: string
      error?: string
    }

    if (data.access_token) return data.access_token
    if (data.error === 'authorization_pending') continue
    if (data.error === 'slow_down') {
      interval += 5000
      continue
    }
    if (data.error === 'expired_token')
      throw new Error('Device code expired - please restart login')
    if (data.error === 'access_denied') throw new Error('Login was denied by the user')
    throw new Error(`Unexpected device flow error: ${data.error}`)
  }

  throw new Error('Device flow timed out')
}

export async function startOAuthFlow(
  clientId: string,
  onCode?: (userCode: string, verificationUri: string) => void
): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')

  const init = await requestDeviceCode(clientId)
  onCode?.(init.user_code, init.verification_uri)
  await shell.openExternal(init.verification_uri)
  return pollForAccessToken(clientId, init)
}

export async function startDeviceFlow(
  clientId: string,
  onCode: (userCode: string, verificationUri: string) => void
): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')

  const init = await requestDeviceCode(clientId)
  onCode(init.user_code, init.verification_uri)
  return pollForAccessToken(clientId, init)
}
