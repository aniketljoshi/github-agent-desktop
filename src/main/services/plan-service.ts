import { randomUUID } from 'crypto'
import { streamChatCompletion } from '../github/inference'
import type { PlanDocument } from '../../shared/types'

let currentAbort: AbortController | null = null

const PLAN_SYSTEM_PROMPT = `You are an expert software planner. Given the user's request, produce an implementation plan as JSON.

Output ONLY valid JSON matching this schema — no markdown fences, no extra text:
{
  "goal": "string — one-sentence summary of what will be built",
  "assumptions": ["string — key assumptions"],
  "steps": [
    {
      "title": "string — step title",
      "why": "string — why this step matters",
      "files": ["string — file paths that will be created or modified"],
      "risk": "low | medium | high"
    }
  ]
}`

export async function generatePlan(params: {
  prompt: string
  model: string
  token: string
  contextFiles?: string[]
}): Promise<PlanDocument> {
  currentAbort = new AbortController()
  let full = ''

  try {
    const messages = [
      { role: 'system', content: PLAN_SYSTEM_PROMPT },
      { role: 'user', content: params.prompt }
    ]

    for await (const delta of streamChatCompletion({
      token: params.token,
      model: params.model,
      messages,
      responseFormat: { type: 'json_object' },
      signal: currentAbort.signal
    })) {
      full += delta
    }
  } finally {
    currentAbort = null
  }

  return parsePlanResponse(full, params.model)
}

export function parsePlanResponse(raw: string, model: string): PlanDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Model returned invalid JSON for plan')
  }

  const obj = parsed as Record<string, unknown>

  if (typeof obj.goal !== 'string' || !Array.isArray(obj.steps)) {
    throw new Error('Plan JSON missing required fields: goal, steps')
  }

  const validRisks = new Set(['low', 'medium', 'high'])

  return {
    id: randomUUID(),
    goal: obj.goal,
    assumptions: Array.isArray(obj.assumptions) ? (obj.assumptions as string[]).map(String) : [],
    steps: (obj.steps as Array<Record<string, unknown>>).map((s) => ({
      title: String(s.title ?? 'Untitled step'),
      why: String(s.why ?? ''),
      files: Array.isArray(s.files) ? (s.files as string[]).map(String) : [],
      risk: validRisks.has(String(s.risk))
        ? (String(s.risk) as 'low' | 'medium' | 'high')
        : 'medium',
      status: 'pending' as const
    })),
    createdAt: Date.now(),
    model
  }
}

export function abortPlan(): void {
  currentAbort?.abort()
  currentAbort = null
}
