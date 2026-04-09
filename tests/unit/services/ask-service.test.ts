import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()
const streamChatCompletionMock = vi.fn()

vi.mock('../../../src/main/windows', () => ({
  getMainWindow: () => ({
    webContents: {
      send: sendMock
    }
  })
}))

vi.mock('../../../src/main/github/inference', () => ({
  streamChatCompletion: streamChatCompletionMock
}))

describe('ask-service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('streams deltas to the renderer and returns the accumulated content', async () => {
    streamChatCompletionMock.mockImplementation(async function* () {
      yield 'Hello'
      yield ' world'
    })

    const { sendAskMessage } = await import('../../../src/main/services/ask-service')
    const result = await sendAskMessage({
      token: 'token',
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hi' }]
    })

    expect(result).toEqual({ content: 'Hello world' })
    expect(sendMock).toHaveBeenCalledWith('chat:stream-delta', {
      content: 'Hello',
      sessionId: 'ask'
    })
    expect(sendMock).toHaveBeenCalledWith('chat:stream-delta', {
      content: ' world',
      sessionId: 'ask'
    })
    expect(sendMock).toHaveBeenLastCalledWith('chat:stream-done', { sessionId: 'ask' })
  })

  it('always notifies the renderer when streaming ends, even on failure', async () => {
    streamChatCompletionMock.mockImplementation(async function* () {
      yield 'partial'
      throw new Error('stream failed')
    })

    const { sendAskMessage } = await import('../../../src/main/services/ask-service')

    await expect(
      sendAskMessage({
        token: 'token',
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hi' }]
      })
    ).rejects.toThrow('stream failed')

    expect(sendMock).toHaveBeenCalledWith('chat:stream-delta', {
      content: 'partial',
      sessionId: 'ask'
    })
    expect(sendMock).toHaveBeenLastCalledWith('chat:stream-done', { sessionId: 'ask' })
  })

  it('aborts the active ask controller', async () => {
    streamChatCompletionMock.mockImplementation(async function* (params: { signal: AbortSignal }) {
      yield 'working'
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(params.signal.aborted).toBe(true)
    })

    const { sendAskMessage, abortAsk } = await import('../../../src/main/services/ask-service')
    const pending = sendAskMessage({
      token: 'token',
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hi' }]
    })

    abortAsk()
    await pending

    expect(sendMock).toHaveBeenLastCalledWith('chat:stream-done', { sessionId: 'ask' })
  })
})
