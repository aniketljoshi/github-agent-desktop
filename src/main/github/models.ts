import type { ModelCatalogEntry } from '../../shared/types'
import * as adapter from '../copilot/adapter'

let cachedCatalog: ModelCatalogEntry[] | null = null
let cachedAt = 0
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const COPILOT_FETCH_TIMEOUT_MS = 4000

export async function fetchModelCatalog(token: string): Promise<ModelCatalogEntry[]> {
  if (cachedCatalog && Date.now() - cachedAt < CACHE_TTL) {
    return cachedCatalog
  }
  return refreshCatalog(token)
}

export async function fetchAccessibleModelCatalog(token: string): Promise<ModelCatalogEntry[]> {
  const copilotModels = await withTimeout(fetchCopilotAccessibleModels(token), COPILOT_FETCH_TIMEOUT_MS)
  if (copilotModels.length > 0) {
    cachedCatalog = copilotModels
    cachedAt = Date.now()
    return copilotModels
  }

  throw new Error('Could not load organization-assigned Copilot models')
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
    tags: m.tags ?? [],
    source: 'github-models'
  }))
  cachedAt = Date.now()

  return cachedCatalog
}

async function fetchCopilotAccessibleModels(token: string): Promise<ModelCatalogEntry[]> {
  const loaded = await adapter.loadSDK()
  if (!loaded) {
    return []
  }

  await adapter.initClient(token)
  const models = await adapter.listModels()
  if (!models.length) {
    return []
  }

  return models
    .filter((model) => {
      const policyState = model?.policy?.state as string | undefined
      return policyState === undefined || policyState === 'enabled'
    })
    .map((model) => {
      const supportsVision = Boolean(model?.capabilities?.supports?.vision)
      const supportsReasoning = Boolean(model?.capabilities?.supports?.reasoningEffort)
      const contextWindow = Number(model?.capabilities?.limits?.max_context_window_tokens ?? 0)

      return {
        id: model?.id ?? '',
        name: model?.name ?? model?.id ?? '',
        publisher: inferPublisher(model?.name ?? model?.id ?? ''),
        capabilities: buildCapabilities({ supportsVision, supportsReasoning }),
        limits: {
          max_context_tokens: contextWindow
        },
        rateLimitTier: 'copilot',
        supportedInputModalities: supportsVision ? ['text', 'image'] : ['text'],
        tags: [],
        requestMultiplier: Number(model?.billing?.multiplier ?? 1),
        policyState: model?.policy?.state,
        source: 'copilot-sdk'
      } satisfies ModelCatalogEntry
    })
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | []> {
  let timer: NodeJS.Timeout | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<[]>(resolve => {
        timer = setTimeout(() => resolve([]), timeoutMs)
      })
    ])
  } catch {
    return []
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

function buildCapabilities(options: {
  supportsVision: boolean
  supportsReasoning: boolean
}): string[] {
  const capabilities = ['tool-calling']

  if (options.supportsVision) {
    capabilities.push('vision')
  }

  if (options.supportsReasoning) {
    capabilities.push('reasoning-effort')
  }

  return capabilities
}

function inferPublisher(name: string): string {
  const lower = name.toLowerCase()

  if (lower.includes('claude')) return 'Anthropic'
  if (lower.includes('gemini')) return 'Google'
  if (
    lower.includes('gpt') ||
    lower.includes('codex') ||
    lower.includes('o1') ||
    lower.includes('o3')
  ) {
    return 'OpenAI'
  }
  if (lower.includes('llama')) return 'Meta'
  if (lower.includes('mistral')) return 'Mistral'
  return 'GitHub Copilot'
}
