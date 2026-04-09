import { spawn } from 'child_process'
import { getMainWindow } from '../windows'
import { TERMINAL_OUTPUT } from '../../shared/events'
import type { TerminalRunResult } from '../../shared/types'

const DEFAULT_TIMEOUT = 30_000

export function executeCommand(
  command: string,
  cwd: string,
  timeout = DEFAULT_TIMEOUT
): Promise<TerminalRunResult> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    let stdout = ''
    let stderr = ''
    const win = getMainWindow()

    const proc = spawn(command, {
      shell: true,
      cwd,
      env: { ...process.env },
      timeout
    })

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stdout += text
      win?.webContents.send(TERMINAL_OUTPUT, { type: 'stdout', data: text })
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderr += text
      win?.webContents.send(TERMINAL_OUTPUT, { type: 'stderr', data: text })
    })

    proc.on('close', (code) => {
      resolve({
        command,
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - start
      })
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}
