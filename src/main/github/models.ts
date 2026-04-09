import type { ModelCatalogEntry } from '../../shared/types'

let cachedCatalog: ModelCatalogEntry[] | null = null
let cachedAt = 0
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function fetchModelCatalog(token: string): Promise<ModelCatalogEntry[]> {
  if (cachedCatalog && Date.now() - cachedAt < CACHE_TTL) {
    return cachedCatalog
  }
  return refreshCatalog(token)
}

export async function refreshCatalog(token: string): Promise<ModelCatalogEntry[]> {
  const res = await fetch('https://models.github.ai/catalog/models', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'X-GitHub-Api-Version': '2025-01-01'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch model catalog: ${res.status} ${res.statusText}`)
  }

  interface RawModel {
    id?: string
    name?: string
    publisher?: string
    capabilities?: string[]
    limits?: Record<string, number>
    rate_limit_tier?: string
    supported_input_modalities?: string[]
    tags?: string[]
  }

  const raw = (await res.json()) as RawModel[]

  cachedCatalog = raw.map((m) => ({
    id: m.id ?? '',
    name: m.name ?? m.id ?? '',
    publisher: m.publisher ?? 'Unknown',
    capabilities: m.capabilities ?? [],
    limits: m.limits ?? {},
    rateLimitTier: m.rate_limit_tier ?? 'default',
    supportedInputModalities: m.supported_input_modalities ?? ['text'],
    tags: m.tags ?? []
  }))
  cachedAt = Date.now()

  return cachedCatalog
}
