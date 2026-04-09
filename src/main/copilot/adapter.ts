import type { AgentSessionSummary } from '../../shared/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
let CopilotClientClass: any = null
let client: any = null
let sdkLoaded = false

export async function loadSDK(): Promise<boolean> {
  if (sdkLoaded) return true
  try {
    const mod = await import('@github/copilot-sdk')
    CopilotClientClass = mod.CopilotClient ?? mod.default?.CopilotClient
    sdkLoaded = !!CopilotClientClass
    return sdkLoaded
  } catch {
    sdkLoaded = false
    return false
  }
}

export function isAvailable(): boolean {
  return sdkLoaded && !!CopilotClientClass
}

export async function initClient(token: string): Promise<void> {
  if (!isAvailable()) throw new Error('Copilot SDK is not available')
  client = new CopilotClientClass({ githubToken: token, useLoggedInUser: false })
  await client.start()
}

export async function stopClient(): Promise<void> {
  if (client) {
    await client.stop()
    client = null
  }
}

export interface SessionHandlers {
  onPermission: (request: any) => Promise<{ kind: string }>
  onStreamDelta?: (delta: string) => void
  onMessage?: (content: string) => void
  onToolStart?: (event: any) => void
  onToolComplete?: (event: any) => void
  onIdle?: () => void
}

export async function createSession(
  config: { model: string; systemMessage?: string },
  handlers: SessionHandlers
): Promise<any> {
  if (!client) throw new Error('Client not initialized')

  const session = await client.createSession({
    model: config.model,
    streaming: true,
    systemMessage: config.systemMessage,
    onPermissionRequest: handlers.onPermission,
    onUserInputRequest: undefined
  })

  if (handlers.onStreamDelta) {
    session.on('assistant.message_delta', (e: any) => handlers.onStreamDelta!(e.data?.deltaContent ?? ''))
  }
  if (handlers.onMessage) {
    session.on('assistant.message', (e: any) => handlers.onMessage!(e.data?.content ?? ''))
  }
  if (handlers.onToolStart) {
    session.on('tool.execution_start', handlers.onToolStart)
  }
  if (handlers.onToolComplete) {
    session.on('tool.execution_complete', handlers.onToolComplete)
  }
  if (handlers.onIdle) {
    session.on('session.idle', handlers.onIdle)
  }

  return session
}

export async function resumeSession(
  sessionId: string,
  handlers: SessionHandlers
): Promise<any> {
  if (!client) throw new Error('Client not initialized')
  const session = await client.resumeSession(sessionId, {
    onPermissionRequest: handlers.onPermission
  })

  if (handlers.onStreamDelta) {
    session.on('assistant.message_delta', (e: any) => handlers.onStreamDelta!(e.data?.deltaContent ?? ''))
  }
  if (handlers.onMessage) {
    session.on('assistant.message', (e: any) => handlers.onMessage!(e.data?.content ?? ''))
  }
  if (handlers.onToolStart) {
    session.on('tool.execution_start', handlers.onToolStart)
  }
  if (handlers.onToolComplete) {
    session.on('tool.execution_complete', handlers.onToolComplete)
  }
  if (handlers.onIdle) {
    session.on('session.idle', handlers.onIdle)
  }

  return session
}

export async function listSessions(): Promise<AgentSessionSummary[]> {
  if (!client) return []
  try {
    const sessions = await client.listSessions()
    return (sessions ?? []).map((s: any) => ({
      sessionId: s.sessionId ?? '',
      startTime: s.startTime ?? 0,
      modifiedTime: s.modifiedTime ?? 0,
      summary: s.summary ?? '',
      context: s.context
    }))
  } catch {
    return []
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!client) return
  await client.deleteSession(sessionId)
}

export async function sendMessage(session: any, prompt: string): Promise<void> {
  await session.send({ prompt })
}

export async function sendAndWait(session: any, prompt: string): Promise<string> {
  const result = await session.sendAndWait({ prompt })
  return result?.content ?? ''
}

export async function abortSession(session: any): Promise<void> {
  await session.abort()
}

export async function disconnectSession(session: any): Promise<void> {
  await session.disconnect()
}
