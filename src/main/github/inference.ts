export async function* streamChatCompletion(params: {
  token: string
  model: string
  messages: Array<{ role: string; content: string }>
  responseFormat?: { type: string }
  signal?: AbortSignal
}): AsyncGenerator<string> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: true
  }
  if (params.responseFormat) body.response_format = params.responseFormat

  const res = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'X-GitHub-Api-Version': '2025-01-01'
    },
    body: JSON.stringify(body),
    signal: params.signal
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Inference API returned ${res.status}: ${text}`)
  }

  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === ':') continue
        if (!trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice(6)
        if (payload === '[DONE]') return

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // skip unparseable SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
