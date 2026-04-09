import * as adapter from '../copilot/adapter'
import { handlePermissionRequest, resolvePermission } from '../copilot/permissions'
import { getMainWindow } from '../windows'
import { getToken } from '../auth/token-store'
import { getWorkspaceInfo } from '../workspace/workspace'
import { AGENT_EVENT } from '../../shared/events'
import type { AgentSessionSummary } from '../../shared/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
let currentSession: any = null
let sdkInitialized = false
const sessions = new Map<string, any>()

async function ensureSDK(): Promise<void> {
  if (sdkInitialized) return
  const loaded = await adapter.loadSDK()
  if (!loaded) throw new Error('Copilot SDK is not available — install @github/copilot-sdk')
  const token = getToken('github')
  if (!token) throw new Error('Not authenticated')
  await adapter.initClient(token)
  sdkInitialized = true
}

function emit(channel: string, data: unknown): void {
  getMainWindow()?.webContents.send(channel, data)
}

function buildHandlers() {
  const ws = getWorkspaceInfo()
  const root = ws?.rootPath ?? ''

  return {
    onPermission: async (request: any) => {
      return handlePermissionRequest(request, root)
    },
    onStreamDelta: (delta: string) => {
      emit(AGENT_EVENT, {
        type: 'message-delta',
        sessionId: currentSession?.sessionId ?? '',
        content: delta
      })
    },
    onMessage: (content: string) => {
      emit(AGENT_EVENT, { type: 'message', content })
    },
    onToolStart: (event: any) => {
      emit(AGENT_EVENT, { type: 'tool-start', ...event })
    },
    onToolComplete: (event: any) => {
      emit(AGENT_EVENT, { type: 'tool-complete', ...event })
    },
    onIdle: () => {
      emit(AGENT_EVENT, { type: 'idle' })
    }
  }
}

export async function startAgent(params: {
  model: string
  prompt: string
  systemMessage?: string
}): Promise<{ sessionId: string }> {
  await ensureSDK()

  const session = await adapter.createSession(
    { model: params.model, systemMessage: params.systemMessage },
    buildHandlers()
  )
  currentSession = session
  sessions.set(session.sessionId ?? 'session', session)

  // Send the initial message (don't await — it streams)
  adapter.sendMessage(session, params.prompt).catch((err: Error) => {
    emit(AGENT_EVENT, { type: 'error', message: err.message })
  })

  return { sessionId: session.sessionId ?? 'session' }
}

export async function sendAgentMessage(sessionId: string, prompt: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (!session) throw new Error(`Unknown agent session: ${sessionId}`)
  currentSession = session
  await adapter.sendMessage(session, prompt)
}

export async function abortAgent(): Promise<void> {
  if (currentSession) {
    sessions.delete(currentSession.sessionId ?? '')
    await adapter.abortSession(currentSession)
    currentSession = null
  }
}

export async function resumeAgent(sessionId: string): Promise<void> {
  await ensureSDK()
  currentSession = await adapter.resumeSession(sessionId, buildHandlers())
  sessions.set(sessionId, currentSession)
}

export async function listAgentSessions(): Promise<AgentSessionSummary[]> {
  if (!adapter.isAvailable()) return []
  try {
    await ensureSDK()
    return await adapter.listSessions()
  } catch {
    return []
  }
}

export async function deleteAgentSession(sessionId: string): Promise<void> {
  await ensureSDK()
  sessions.delete(sessionId)
  await adapter.deleteSession(sessionId)
}

export function handlePermissionResponse(args: { id: string; approved: boolean }): void {
  resolvePermission(args.id, args.approved)
}
