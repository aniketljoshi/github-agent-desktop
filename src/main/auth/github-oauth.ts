import { createHash, randomBytes } from 'crypto'
import { createServer } from 'http'
import { URL } from 'url'
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

export function createOAuthAuthorizeUrl(args: {
  clientId: string
  callbackUrl: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', args.clientId)
  url.searchParams.set('redirect_uri', args.callbackUrl)
  url.searchParams.set('scope', 'read:user')
  url.searchParams.set('state', args.state)
  url.searchParams.set('code_challenge', args.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('allow_signup', 'true')
  return url.toString()
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
    if (data.error === 'expired_token') {
      throw new Error('Device code expired - please restart login')
    }
    if (data.error === 'access_denied') {
      throw new Error('Login was denied by the user')
    }

    throw new Error(`Unexpected device flow error: ${data.error}`)
  }

  throw new Error('Device flow timed out')
}

async function waitForOAuthCode(callbackUrl: string, expectedState: string): Promise<string> {
  const callback = new URL(callbackUrl)
  const hostname = callback.hostname
  const port = Number(callback.port)
  const pathname = callback.pathname

  if (!hostname || !port) {
    throw new Error('GITHUB_CALLBACK_URL must include a hostname and port')
  }

  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url ?? '/', callback.origin)

        if (requestUrl.pathname !== pathname) {
          res.statusCode = 404
          res.end('Not found')
          return
        }

        const returnedState = requestUrl.searchParams.get('state')
        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')

        if (error) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end('<html><body><h1>GitHub login failed</h1><p>You can close this window.</p></body></html>')
          clearTimeout(timeout)
          server.close()
          reject(new Error(`GitHub login failed: ${error}`))
          return
        }

        if (returnedState !== expectedState || !code) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end('<html><body><h1>Invalid login response</h1><p>You can close this window.</p></body></html>')
          clearTimeout(timeout)
          server.close()
          reject(new Error('Invalid GitHub login response'))
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(
          '<html><body style="font-family:Inter,system-ui,sans-serif;background:#0d0f13;color:#f5f7ff;display:flex;min-height:100vh;align-items:center;justify-content:center;"><div><h1 style="font-size:24px;margin-bottom:8px;">GitHub login complete</h1><p style="color:#aab3c5;">Return to GitHub Agent Desktop. You can close this window.</p></div></body></html>'
        )

        clearTimeout(timeout)
        server.close()
        resolve(code)
      } catch (error) {
        clearTimeout(timeout)
        server.close()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })

    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('GitHub login timed out while waiting for the browser callback'))
    }, 120000)

    server.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    server.listen(port, hostname)
  })
}

async function exchangeOAuthCode(args: {
  clientId: string
  clientSecret: string
  callbackUrl: string
  code: string
  codeVerifier: string
}): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: args.clientId,
      client_secret: args.clientSecret,
      code: args.code,
      redirect_uri: args.callbackUrl,
      code_verifier: args.codeVerifier
    })
  })

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? 'GitHub token exchange failed')
  }

  return payload.access_token
}

export async function startOAuthFlow(
  clientId: string,
  clientSecret: string,
  callbackUrl: string
): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')
  if (!clientSecret) {
    throw new Error(
      'Browser login requires GITHUB_CLIENT_SECRET. Configure a local GitHub OAuth App or use Device Code.'
    )
  }
  if (!callbackUrl) throw new Error('GITHUB_CALLBACK_URL is not configured')

  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  const authorizeUrl = createOAuthAuthorizeUrl({ clientId, callbackUrl, state, codeChallenge })

  const codePromise = waitForOAuthCode(callbackUrl, state)
  await shell.openExternal(authorizeUrl)
  const code = await codePromise

  return exchangeOAuthCode({
    clientId,
    clientSecret,
    callbackUrl,
    code,
    codeVerifier
  })
}

export async function startDeviceFlow(
  clientId: string,
  onCode: (userCode: string, verificationUri: string) => void
): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')

  const init = await requestDeviceCode(clientId)
  onCode(init.user_code, init.verification_uri)
  await shell.openExternal(init.verification_uri)
  return pollForAccessToken(clientId, init)
}
