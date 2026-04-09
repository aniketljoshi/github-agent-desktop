import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const spawnMock = vi.fn()
const sendMock = vi.fn()

vi.mock('child_process', () => ({
  spawn: spawnMock
}))

vi.mock('../../../src/main/windows', () => ({
  getMainWindow: () => ({
    webContents: {
      send: sendMock
    }
  })
}))

function createProcessMock() {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  return proc
}

describe('terminal service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('streams stdout/stderr and resolves with command results', async () => {
    const proc = createProcessMock()
    spawnMock.mockReturnValue(proc)

    const { executeCommand } = await import('../../../src/main/shell/terminal')
    const pending = executeCommand('echo hello', 'C:/repo')

    proc.stdout.emit('data', Buffer.from('hello\n'))
    proc.stderr.emit('data', Buffer.from('warn\n'))
    proc.emit('close', 0)

    await expect(pending).resolves.toMatchObject({
      command: 'echo hello',
      exitCode: 0,
      stdout: 'hello\n',
      stderr: 'warn\n'
    })
    expect(sendMock).toHaveBeenCalledWith('terminal:output', { type: 'stdout', data: 'hello\n' })
    expect(sendMock).toHaveBeenCalledWith('terminal:output', { type: 'stderr', data: 'warn\n' })
  })

  it('rejects when the spawned process emits an error', async () => {
    const proc = createProcessMock()
    spawnMock.mockReturnValue(proc)

    const { executeCommand } = await import('../../../src/main/shell/terminal')
    const pending = executeCommand('bad', 'C:/repo')

    proc.emit('error', new Error('spawn failed'))
    await expect(pending).rejects.toThrow('spawn failed')
  })
})
