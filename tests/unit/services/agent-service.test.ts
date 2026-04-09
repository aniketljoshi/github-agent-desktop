import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadSDKMock = vi.fn()
const initClientMock = vi.fn()
const createSessionMock = vi.fn()
const sendMessageMock = vi.fn()
const resumeSessionMock = vi.fn()
const listSessionsMock = vi.fn()
const deleteSessionMock = vi.fn()
const abortSessionMock = vi.fn()
const isAvailableMock = vi.fn()
const handlePermissionRequestMock = vi.fn()
const resolvePermissionMock = vi.fn()
const getTokenMock = vi.fn()
const getWorkspaceInfoMock = vi.fn()
const sendMock = vi.fn()

vi.mock('../../../src/main/copilot/adapter', () => ({
  loadSDK: loadSDKMock,
  initClient: initClientMock,
  createSession: createSessionMock,
  sendMessage: sendMessageMock,
  resumeSession: resumeSessionMock,
  listSessions: listSessionsMock,
  deleteSession: deleteSessionMock,
  abortSession: abortSessionMock,
  isAvailable: isAvailableMock
}))

vi.mock('../../../src/main/copilot/permissions', () => ({
  handlePermissionRequest: handlePermissionRequestMock,
  resolvePermission: resolvePermissionMock
}))

vi.mock('../../../src/main/auth/token-store', () => ({
  getToken: getTokenMock
}))

vi.mock('../../../src/main/workspace/workspace', () => ({
  getWorkspaceInfo: getWorkspaceInfoMock
}))

vi.mock('../../../src/main/windows', () => ({
  getMainWindow: () => ({
    webContents: {
      send: sendMock
    }
  })
}))

describe('agent-service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    loadSDKMock.mockResolvedValue(true)
    initClientMock.mockResolvedValue(undefined)
    sendMessageMock.mockResolvedValue(undefined)
    resumeSessionMock.mockResolvedValue({ sessionId: 'session-2' })
    abortSessionMock.mockResolvedValue(undefined)
    deleteSessionMock.mockResolvedValue(undefined)
    getTokenMock.mockReturnValue('github-token')
    getWorkspaceInfoMock.mockReturnValue({ rootPath: 'C:/repo', repoName: 'repo', branch: 'main' })
    handlePermissionRequestMock.mockResolvedValue({ kind: 'approved' })
    isAvailableMock.mockReturnValue(true)
  })

  it('starts an agent session and emits stream/tool events through the window bridge', async () => {
    const session = { sessionId: 'session-1' }
    createSessionMock.mockImplementation(async (_config, handlers) => {
      handlers.onStreamDelta?.('delta')
      handlers.onMessage?.('final')
      handlers.onToolStart?.({ toolName: 'read_file' })
      handlers.onToolComplete?.({ toolName: 'read_file' })
      handlers.onIdle?.()
      await handlers.onPermission({ kind: 'read', toolName: 'read_file', fileName: 'C:/repo/a.ts' })
      return session
    })

    const service = await import('../../../src/main/services/agent-service')
    const result = await service.startAgent({ model: 'gpt-5', prompt: 'Do it' })

    expect(result).toEqual({ sessionId: 'session-1' })
    expect(initClientMock).toHaveBeenCalledWith('github-token')
    expect(sendMessageMock).toHaveBeenCalledWith(session, 'Do it')
    expect(sendMock).toHaveBeenCalledWith('agent:event', {
      type: 'message-delta',
      sessionId: '',
      content: 'delta'
    })
    expect(sendMock).toHaveBeenCalledWith('agent:event', { type: 'message', content: 'final' })
    expect(sendMock).toHaveBeenCalledWith('agent:event', { type: 'tool-start', toolName: 'read_file' })
    expect(sendMock).toHaveBeenCalledWith('agent:event', {
      type: 'tool-complete',
      toolName: 'read_file'
    })
    expect(sendMock).toHaveBeenCalledWith('agent:event', { type: 'idle' })
    expect(handlePermissionRequestMock).toHaveBeenCalledWith(
      { kind: 'read', toolName: 'read_file', fileName: 'C:/repo/a.ts' },
      'C:/repo'
    )
  })

  it('routes follow-up messages to the correct session and errors on unknown sessions', async () => {
    createSessionMock.mockResolvedValue({ sessionId: 'session-1' })

    const service = await import('../../../src/main/services/agent-service')
    await service.startAgent({ model: 'gpt-5', prompt: 'Start' })

    await service.sendAgentMessage('session-1', 'follow up')
    expect(sendMessageMock).toHaveBeenLastCalledWith({ sessionId: 'session-1' }, 'follow up')

    await expect(service.sendAgentMessage('missing', 'nope')).rejects.toThrow(
      'Unknown agent session: missing'
    )
  })

  it('supports abort, resume, list, delete, and permission resolution helpers', async () => {
    createSessionMock.mockResolvedValue({ sessionId: 'session-1' })
    resumeSessionMock.mockResolvedValue({ sessionId: 'session-2' })
    listSessionsMock.mockResolvedValue([{ sessionId: 'session-2', summary: 'Saved' }])

    const service = await import('../../../src/main/services/agent-service')
    await service.startAgent({ model: 'gpt-5', prompt: 'Start' })
    await service.abortAgent()
    expect(abortSessionMock).toHaveBeenCalledWith({ sessionId: 'session-1' })

    await service.resumeAgent('session-2')
    expect(resumeSessionMock).toHaveBeenCalledWith(
      'session-2',
      expect.objectContaining({ onPermission: expect.any(Function) })
    )

    await expect(service.listAgentSessions()).resolves.toEqual([{ sessionId: 'session-2', summary: 'Saved' }])
    await service.deleteAgentSession('session-2')
    expect(deleteSessionMock).toHaveBeenCalledWith('session-2')

    service.handlePermissionResponse({ id: 'perm-1', approved: true })
    expect(resolvePermissionMock).toHaveBeenCalledWith('perm-1', true)
  })

  it('returns an empty list when the SDK is unavailable or session listing fails', async () => {
    const service = await import('../../../src/main/services/agent-service')

    isAvailableMock.mockReturnValue(false)
    await expect(service.listAgentSessions()).resolves.toEqual([])

    isAvailableMock.mockReturnValue(true)
    listSessionsMock.mockRejectedValue(new Error('boom'))
    await expect(service.listAgentSessions()).resolves.toEqual([])
  })

  it('throws when the SDK is missing or the user is not authenticated', async () => {
    const service = await import('../../../src/main/services/agent-service')

    loadSDKMock.mockResolvedValue(false)
    await expect(service.startAgent({ model: 'gpt-5', prompt: 'Start' })).rejects.toThrow(
      'Copilot SDK is not available'
    )

    loadSDKMock.mockResolvedValue(true)
    getTokenMock.mockReturnValue(null)
    await expect(service.startAgent({ model: 'gpt-5', prompt: 'Start' })).rejects.toThrow(
      'Not authenticated'
    )
  })
})
