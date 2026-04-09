import { beforeEach, describe, expect, it, vi } from 'vitest'

function createSseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    }
  })
}

describe('github inference streaming', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('yields delta content from SSE responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: createSseStream([
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
          'data: {"choices":[{"delta":{"content":" world"}}]}\n',
          'data: [DONE]\n'
        ])
      })
    )

    const { streamChatCompletion } = await import('../../../src/main/github/inference')
    const parts: string[] = []
    for await (const delta of streamChatCompletion({
      token: 'token',
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hi' }]
    })) {
      parts.push(delta)
    }

    expect(parts).toEqual(['Hello', ' world'])
  })

  it('skips invalid chunks and throws on API failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          body: createSseStream([
            ': keepalive\n',
            'data: not-json\n',
            'data: {"choices":[{"delta":{"content":"usable"}}]}\n',
            'data: [DONE]\n'
          ])
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: vi.fn().mockResolvedValue('bad token')
        })
        .mockResolvedValueOnce({
          ok: true,
          body: null
        })
    )

    const { streamChatCompletion } = await import('../../../src/main/github/inference')

    const parts: string[] = []
    for await (const delta of streamChatCompletion({
      token: 'token',
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hi' }]
    })) {
      parts.push(delta)
    }
    expect(parts).toEqual(['usable'])

    await expect(
      (async () => {
        for await (const chunk of streamChatCompletion({
          token: 'token',
          model: 'gpt-5',
          messages: [{ role: 'user', content: 'Hi' }]
        })) {
          void chunk
        }
      })()
    ).rejects.toThrow('Inference API returned 401: bad token')

    await expect(
      (async () => {
        for await (const chunk of streamChatCompletion({
          token: 'token',
          model: 'gpt-5',
          messages: [{ role: 'user', content: 'Hi' }]
        })) {
          void chunk
        }
      })()
    ).rejects.toThrow('No response body')
  })
})
