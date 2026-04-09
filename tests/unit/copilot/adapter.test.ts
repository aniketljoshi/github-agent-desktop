import { beforeEach, describe, expect, it, vi } from 'vitest'

const startMock = vi.fn()
const stopMock = vi.fn()
const createSessionMock = vi.fn()
const resumeSessionMock = vi.fn()
const listSessionsMock = vi.fn()
const listModelsMock = vi.fn()
const deleteSessionMock = vi.fn()

const CopilotClientMock = vi.fn().mockImplementation(() => ({
  start: startMock,
  stop: stopMock,
  createSession: createSessionMock,
  resumeSession: resumeSessionMock,
  listSessions: listSessionsMock,
  listModels: listModelsMock,
  deleteSession: deleteSessionMock
}))

vi.mock('@github/copilot-sdk', () => ({
  CopilotClient: CopilotClientMock
}))

function createFakeSession() {
  return {
    on: vi.fn(),
    send: vi.fn(),
    sendAndWait: vi.fn().mockResolvedValue({ content: 'done' }),
    abort: vi.fn(),
    disconnect: vi.fn()
  }
}

describe('copilot adapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('loads the SDK and initializes a client', async () => {
    const adapter = await import('../../../src/main/copilot/adapter')

    await expect(adapter.loadSDK()).resolves.toBe(true)
    expect(adapter.isAvailable()).toBe(true)

    await adapter.initClient('token')
    expect(CopilotClientMock).toHaveBeenCalledWith({
      githubToken: 'token',
      useLoggedInUser: false
    })
    expect(startMock).toHaveBeenCalled()
  })

  it('reuses the existing client for the same token and recreates it for a new token', async () => {
    const adapter = await import('../../../src/main/copilot/adapter')

    await adapter.loadSDK()
    await adapter.initClient('token-a')
    await adapter.initClient('token-a')
    await adapter.initClient('token-b')

    expect(CopilotClientMock).toHaveBeenCalledTimes(2)
    expect(startMock).toHaveBeenCalledTimes(2)
    expect(stopMock).toHaveBeenCalledTimes(1)
  })

  it('creates and wires a session with handlers', async () => {
    const session = createFakeSession()
    createSessionMock.mockResolvedValue(session)

    const adapter = await import('../../../src/main/copilot/adapter')
    await adapter.loadSDK()
    await adapter.initClient('token')

    const handlers = {
      onPermission: vi.fn(),
      onStreamDelta: vi.fn(),
      onMessage: vi.fn(),
      onToolStart: vi.fn(),
      onToolComplete: vi.fn(),
      onIdle: vi.fn()
    }

    const result = await adapter.createSession({ model: 'gpt-5', systemMessage: 'hello' }, handlers)

    expect(result).toBe(session)
    expect(createSessionMock).toHaveBeenCalledWith({
      model: 'gpt-5',
      streaming: true,
      systemMessage: 'hello',
      onPermissionRequest: handlers.onPermission,
      onUserInputRequest: undefined
    })
    expect(session.on).toHaveBeenCalledTimes(5)
  })

  it('resumes sessions, maps listSessions, and proxies message helpers', async () => {
    const resumed = createFakeSession()
    resumeSessionMock.mockResolvedValue(resumed)
    listSessionsMock.mockResolvedValue([
      { sessionId: 's1', startTime: 1, modifiedTime: 2, summary: 'One', context: 'ctx' }
    ])
    listModelsMock.mockResolvedValue([
      {
        id: 'claude-sonnet-4.6',
        name: 'Claude Sonnet 4.6',
        capabilities: {
          supports: { vision: true, reasoningEffort: false },
          limits: { max_context_window_tokens: 200000 }
        },
        billing: { multiplier: 1 }
      }
    ])

    const adapter = await import('../../../src/main/copilot/adapter')
    await adapter.loadSDK()
    await adapter.initClient('token')

    const handlers = { onPermission: vi.fn() }
    const session = await adapter.resumeSession('s1', handlers)
    expect(session).toBe(resumed)
    expect(resumeSessionMock).toHaveBeenCalledWith('s1', {
      onPermissionRequest: handlers.onPermission
    })

    await expect(adapter.listSessions()).resolves.toEqual([
      { sessionId: 's1', startTime: 1, modifiedTime: 2, summary: 'One', context: 'ctx' }
    ])
    await expect(adapter.listModels()).resolves.toEqual([
      {
        id: 'claude-sonnet-4.6',
        name: 'Claude Sonnet 4.6',
        capabilities: {
          supports: { vision: true, reasoningEffort: false },
          limits: { max_context_window_tokens: 200000 }
        },
        billing: { multiplier: 1 }
      }
    ])

    await adapter.sendMessage(resumed, 'hello')
    expect(resumed.send).toHaveBeenCalledWith({ prompt: 'hello' })

    await expect(adapter.sendAndWait(resumed, 'hello')).resolves.toBe('done')
    await adapter.abortSession(resumed)
    await adapter.disconnectSession(resumed)
    await adapter.deleteSession('s1')
    await adapter.stopClient()

    expect(resumed.abort).toHaveBeenCalled()
    expect(resumed.disconnect).toHaveBeenCalled()
    expect(deleteSessionMock).toHaveBeenCalledWith('s1')
    expect(stopMock).toHaveBeenCalled()
  })

  it('handles uninitialized and failing client branches safely', async () => {
    const adapter = await import('../../../src/main/copilot/adapter')

    await expect(adapter.createSession({ model: 'gpt-5' }, { onPermission: vi.fn() })).rejects.toThrow(
      'Client not initialized'
    )
    await expect(adapter.resumeSession('s1', { onPermission: vi.fn() })).rejects.toThrow(
      'Client not initialized'
    )
    await expect(adapter.listSessions()).resolves.toEqual([])
    await expect(adapter.listModels()).resolves.toEqual([])
    await expect(adapter.deleteSession('missing')).resolves.toBeUndefined()

    await adapter.loadSDK()
    await adapter.initClient('token')
    listSessionsMock.mockRejectedValueOnce(new Error('boom'))
    listModelsMock.mockRejectedValueOnce(new Error('boom'))
    await expect(adapter.listSessions()).resolves.toEqual([])
    await expect(adapter.listModels()).resolves.toEqual([])
  })
})
