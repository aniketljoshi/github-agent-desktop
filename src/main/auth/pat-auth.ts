export async function validatePAT(token: string): Promise<{ username: string; avatarUrl: string }> {
  if (!token) throw new Error('Token is required')

  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`)
  }

  const data = (await res.json()) as { login: string; avatar_url: string }

  const modelsRes = await fetch('https://models.github.ai/catalog/models', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'X-GitHub-Api-Version': '2025-01-01'
    }
  })

  if (!modelsRes.ok) {
    throw new Error(
      `Token does not have GitHub Models access (${modelsRes.status}: ${modelsRes.statusText})`
    )
  }

  return { username: data.login, avatarUrl: data.avatar_url }
}
