import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getMainWindow } from '../windows'
import { isWithinWorkspace } from '../workspace/path-guard'
import { classifyRisk } from '../shell/risk-classifier'
import { AGENT_PERMISSION_REQUEST, AGENT_PERMISSION_RESPONSE } from '../../shared/events'
import type { PermissionKind } from '../../shared/types'

const pendingRequests = new Map<string, { resolve: (approved: boolean) => void }>()

// Listen for permission responses from the renderer
ipcMain.on(AGENT_PERMISSION_RESPONSE, (_event, args: { id: string; approved: boolean }) => {
  const pending = pendingRequests.get(args.id)
  if (pending) {
    pending.resolve(args.approved)
    pendingRequests.delete(args.id)
  }
})

async function askRenderer(request: {
  id: string
  kind: PermissionKind
  toolName: string
  fileName?: string
  fullCommandText?: string
  diff?: string
}): Promise<boolean> {
  const win = getMainWindow()
  if (!win) return false

  return new Promise<boolean>((resolve) => {
    pendingRequests.set(request.id, { resolve })
    win.webContents.send(AGENT_PERMISSION_REQUEST, {
      ...request,
      timestamp: Date.now()
    })

    // Timeout after 5 minutes — deny if no response
    setTimeout(() => {
      if (pendingRequests.has(request.id)) {
        pendingRequests.delete(request.id)
        resolve(false)
      }
    }, 5 * 60 * 1000)
  })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function handlePermissionRequest(
  sdkRequest: any,
  workspaceRoot: string
): Promise<{ kind: 'approved' } | { kind: 'denied-interactively-by-user' }> {
  const kind: PermissionKind = sdkRequest.kind ?? 'custom-tool'
  const toolName: string = sdkRequest.toolName ?? 'unknown'
  const fileName: string | undefined = sdkRequest.fileName
  const fullCommandText: string | undefined = sdkRequest.fullCommandText
  const diff: string | undefined = sdkRequest.diff
  const id = randomUUID()

  switch (kind) {
    case 'read': {
      if (fileName && isWithinWorkspace(workspaceRoot, fileName)) {
        return { kind: 'approved' }
      }
      return { kind: 'denied-interactively-by-user' }
    }

    case 'write': {
      const approved = await askRenderer({ id, kind, toolName, fileName, diff })
      return approved
        ? { kind: 'approved' }
        : { kind: 'denied-interactively-by-user' }
    }

    case 'shell': {
      const risk = classifyRisk(fullCommandText ?? '')
      if (risk === 'safe') return { kind: 'approved' }
      const approved = await askRenderer({ id, kind, toolName, fullCommandText })
      return approved
        ? { kind: 'approved' }
        : { kind: 'denied-interactively-by-user' }
    }

    case 'url':
      return { kind: 'approved' }

    default:
      return { kind: 'denied-interactively-by-user' }
  }
}

export function resolvePermission(id: string, approved: boolean): void {
  const pending = pendingRequests.get(id)
  if (pending) {
    pending.resolve(approved)
    pendingRequests.delete(id)
  }
}
