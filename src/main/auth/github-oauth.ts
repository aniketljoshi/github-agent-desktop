import { createHash, randomBytes } from 'crypto'
import { createServer } from 'http'
import { shell } from 'electron'
import type { AddressInfo } from 'net'

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

export async function startOAuthFlow(clientId: string): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')

  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()

  return new Promise<string>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', `http://127.0.0.1`)
        if (url.pathname !== '/callback') {
          res.writeHead(404)
          res.end('Not found')
          return
        }

        const returnedState = url.searchParams.get('state')
        const code = url.searchParams.get('code')

        if (returnedState !== state) {
          res.writeHead(400)
          res.end('State mismatch — possible CSRF attack.')
          reject(new Error('OAuth state mismatch'))
          server.close()
          return
        }

        if (!code) {
          res.writeHead(400)
          res.end('Missing authorization code.')
          reject(new Error('Missing authorization code'))
          server.close()
          return
        }

        const port = (server.address() as AddressInfo).port

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            code,
            redirect_uri: `http://127.0.0.1:${port}/callback`,
            code_verifier: codeVerifier
          })
        })

        const data = (await tokenRes.json()) as { access_token?: string; error?: string }

        if (data.error || !data.access_token) {
          res.writeHead(400)
          res.end(`Authentication failed: ${data.error ?? 'unknown error'}`)
          reject(new Error(data.error ?? 'Token exchange failed'))
          server.close()
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>✓ Authenticated</h2><p>You can close this tab and return to the app.</p></body></html>'
        )
        server.close()
        resolve(data.access_token)
      } catch (err) {
        res.writeHead(500)
        res.end('Internal error')
        server.close()
        reject(err)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port
      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', `http://127.0.0.1:${port}/callback`)
      authUrl.searchParams.set('scope', 'read:user')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      shell.openExternal(authUrl.toString())
    })

    server.on('error', reject)
    setTimeout(() => {
      server.close()
      reject(new Error('OAuth flow timed out after 120 seconds'))
    }, 120_000)
  })
}

export async function startDeviceFlow(
  clientId: string,
  onCode: (userCode: string, verificationUri: string) => void
): Promise<string> {
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured')

  const initRes = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope: 'read:user' })
  })

  const init = (await initRes.json()) as {
    device_code: string
    user_code: string
    verification_uri: string
    interval: number
    expires_in: number
  }

  onCode(init.user_code, init.verification_uri)

  let interval = init.interval * 1000
  const deadline = Date.now() + init.expires_in * 1000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval))

    const pollRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        device_code: init.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })

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
    if (data.error === 'expired_token') throw new Error('Device code expired — please restart login')
    if (data.error === 'access_denied') throw new Error('Login was denied by the user')
    throw new Error(`Unexpected device flow error: ${data.error}`)
  }

  throw new Error('Device flow timed out')
}
