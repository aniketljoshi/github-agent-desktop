import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('../../../src/main/windows', () => ({
  getMainWindow: () => ({
    webContents: {
      send: sendMock
    }
  })
}))

describe('copilot permissions', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('auto-approves reads within the workspace', async () => {
    const { handlePermissionRequest } = await import('../../../src/main/copilot/permissions')

    await expect(
      handlePermissionRequest(
        { kind: 'read', toolName: 'read_file', fileName: 'C:/repo/src/index.ts' },
        'C:/repo'
      )
    ).resolves.toEqual({ kind: 'approved' })
  })

  it('denies reads outside the workspace', async () => {
    const { handlePermissionRequest } = await import('../../../src/main/copilot/permissions')

    await expect(
      handlePermissionRequest(
        { kind: 'read', toolName: 'read_file', fileName: 'C:/elsewhere/secret.txt' },
        'C:/repo'
      )
    ).resolves.toEqual({ kind: 'denied-interactively-by-user' })
  })

  it('sends write approvals to the renderer and resolves approved responses', async () => {
    const { handlePermissionRequest, resolvePermission } = await import(
      '../../../src/main/copilot/permissions'
    )

    const pending = handlePermissionRequest(
      {
        kind: 'write',
        toolName: 'edit_file',
        fileName: 'C:/repo/src/index.ts',
        diff: '+hello'
      },
      'C:/repo'
    )

    const request = sendMock.mock.calls[0]?.[1]
    expect(request.kind).toBe('write')
    resolvePermission(request.id, true)

    await expect(pending).resolves.toEqual({ kind: 'approved' })
  })

  it('auto-approves safe shell commands and prompts for dangerous ones', async () => {
    const { handlePermissionRequest, resolvePermission } = await import(
      '../../../src/main/copilot/permissions'
    )

    await expect(
      handlePermissionRequest(
        { kind: 'shell', toolName: 'bash', fullCommandText: 'git status' },
        'C:/repo'
      )
    ).resolves.toEqual({ kind: 'approved' })

    const pending = handlePermissionRequest(
      { kind: 'shell', toolName: 'bash', fullCommandText: 'rm -rf .git' },
      'C:/repo'
    )

    const request = sendMock.mock.calls.at(-1)?.[1]
    expect(request.kind).toBe('shell')
    resolvePermission(request.id, false)

    await expect(pending).resolves.toEqual({ kind: 'denied-interactively-by-user' })
  })

  it('denies unsupported permission kinds by default', async () => {
    const { handlePermissionRequest } = await import('../../../src/main/copilot/permissions')

    await expect(
      handlePermissionRequest({ kind: 'url', toolName: 'fetch_url' }, 'C:/repo')
    ).resolves.toEqual({ kind: 'denied-interactively-by-user' })
  })
})
