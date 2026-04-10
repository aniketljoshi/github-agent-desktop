export interface GitHubUserProfile {
  username: string
  avatarUrl: string
}

export interface ExchangeCodeArgs {
  clientId: string
  clientSecret: string
  callbackUrl: string
  code: string
  codeVerifier: string
}

export type FetchLike = typeof fetch

export function createGitHubAuthorizeUrl(args: {
  clientId: string
  callbackUrl: string
  state: string
  codeChallenge: string
  scope?: string
}): string {
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', args.clientId)
  url.searchParams.set('redirect_uri', args.callbackUrl)
  url.searchParams.set('scope', args.scope ?? 'read:user')
  url.searchParams.set('state', args.state)
  url.searchParams.set('code_challenge', args.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('allow_signup', 'true')
  return url.toString()
}

export async function exchangeOAuthCode(
  fetchImpl: FetchLike,
  args: ExchangeCodeArgs
): Promise<string> {
  const response = await fetchImpl('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
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

export async function fetchGitHubUserProfile(
  fetchImpl: FetchLike,
  accessToken: string
): Promise<GitHubUserProfile> {
  const response = await fetchImpl('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'github-agent-desktop-auth-service'
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub user fetch failed: ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as {
    login?: string
    avatar_url?: string
  }

  if (!payload.login) {
    throw new Error('GitHub user profile is missing a login')
  }

  return {
    username: payload.login,
    avatarUrl: payload.avatar_url ?? ''
  }
}
