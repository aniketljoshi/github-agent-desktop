import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { URL } from 'node:url'
import type { AuthServiceConfig } from './config.js'
import { generateCodeChallenge, generateCodeVerifier, generateGrantToken, generateStateToken } from './lib/pkce.js'
import {
  createGitHubAuthorizeUrl,
  exchangeOAuthCode,
  fetchGitHubUserProfile,
  type FetchLike
} from './services/github-oauth.js'
import { ExchangeGrantStore } from './services/grant-store.js'
import { OAuthStateStore } from './services/state-store.js'

export interface AuthServiceDependencies {
  config: AuthServiceConfig
  fetchImpl?: FetchLike
  stateStore?: OAuthStateStore
  grantStore?: ExchangeGrantStore
}

export function createAuthService(dependencies: AuthServiceDependencies): {
  server: Server
  stateStore: OAuthStateStore
  grantStore: ExchangeGrantStore
} {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const stateStore =
    dependencies.stateStore ?? new OAuthStateStore(dependencies.config.stateTtlSeconds)
  const grantStore =
    dependencies.grantStore ?? new ExchangeGrantStore(dependencies.config.grantTtlSeconds)

  const server = createServer(async (request, response) => {
    try {
      await routeRequest(
        request,
        response,
        dependencies.config,
        fetchImpl,
        stateStore,
        grantStore
      )
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Unexpected auth service error'
      })
    }
  })

  return { server, stateStore, grantStore }
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: AuthServiceConfig,
  fetchImpl: FetchLike,
  stateStore: OAuthStateStore,
  grantStore: ExchangeGrantStore
): Promise<void> {
  const url = new URL(request.url ?? '/', config.appBaseUrl)

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' })
    return
  }

  if (request.method === 'GET' && url.pathname === '/auth/github/start') {
    const returnTo = sanitizeReturnTo(url.searchParams.get('return_to'), config.desktopProtocol)
    const state = generateStateToken()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    stateStore.set(state, { codeVerifier, returnTo })

    const authorizeUrl = createGitHubAuthorizeUrl({
      clientId: config.githubClientId,
      callbackUrl: config.githubCallbackUrl,
      state,
      codeChallenge
    })

    redirect(response, authorizeUrl)
    return
  }

  if (request.method === 'GET' && url.pathname === '/auth/github/callback') {
    const state = url.searchParams.get('state')
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      redirect(response, appendErrorToReturnTo(config.desktopProtocol, error))
      return
    }

    if (!state || !code) {
      sendJson(response, 400, { error: 'Missing OAuth state or code' })
      return
    }

    const pending = stateStore.take(state)
    if (!pending) {
      sendJson(response, 400, { error: 'OAuth state is invalid or expired' })
      return
    }

    const accessToken = await exchangeOAuthCode(fetchImpl, {
      clientId: config.githubClientId,
      clientSecret: config.githubClientSecret,
      callbackUrl: config.githubCallbackUrl,
      code,
      codeVerifier: pending.codeVerifier
    })
    const user = await fetchGitHubUserProfile(fetchImpl, accessToken)
    const grant = generateGrantToken()

    grantStore.set(grant, {
      accessToken,
      authMethod: 'oauth',
      user
    })

    redirect(response, appendGrantToReturnTo(pending.returnTo, grant))
    return
  }

  if (request.method === 'POST' && url.pathname === '/auth/exchange') {
    const payload = await readJsonBody(request)
    const grant = typeof payload.grant === 'string' ? payload.grant : ''
    if (!grant) {
      sendJson(response, 400, { error: 'grant is required' })
      return
    }

    const exchangeGrant = grantStore.take(grant)
    if (!exchangeGrant) {
      sendJson(response, 400, { error: 'grant is invalid or expired' })
      return
    }

    sendJson(response, 200, exchangeGrant)
    return
  }

  sendJson(response, 404, { error: 'Not found' })
}

function sanitizeReturnTo(returnTo: string | null, defaultReturnTo: string): string {
  if (!returnTo) {
    return defaultReturnTo
  }

  const parsed = new URL(returnTo)
  if (['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('return_to must use a custom desktop protocol')
  }

  return returnTo
}

function appendGrantToReturnTo(returnTo: string, grant: string): string {
  const url = new URL(returnTo)
  url.searchParams.set('grant', grant)
  return url.toString()
}

function appendErrorToReturnTo(returnTo: string, error: string): string {
  const url = new URL(returnTo)
  url.searchParams.set('error', error)
  return url.toString()
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return {}
  }

  const body = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(body) as Record<string, unknown>
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function redirect(response: ServerResponse, location: string): void {
  response.statusCode = 302
  response.setHeader('Location', location)
  response.end()
}
