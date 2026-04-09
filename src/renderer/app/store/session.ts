import { create } from 'zustand'
import type {
  Mode,
  ChatMessage,
  PlanDocument,
  AgentRun,
  AgentSessionSummary,
  ToolInvocation,
  PermissionRequest
} from '../../../shared/types'

interface SessionState {
  mode: Mode
  messages: ChatMessage[]
  currentPlan: PlanDocument | null
  agentRun: AgentRun | null
  isStreaming: boolean
  agentSessions: AgentSessionSummary[]
  pendingPermission: PermissionRequest | null

  setMode: (mode: Mode) => void
  sendAskMessage: (content: string, model: string) => Promise<void>
  generatePlan: (prompt: string, model: string) => Promise<void>
  startAgent: (prompt: string, model: string) => Promise<void>
  sendAgentMessage: (prompt: string) => Promise<void>
  abortCurrent: () => Promise<void>
  loadAgentSessions: () => Promise<void>
  resumeSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  addStreamDelta: (content: string) => void
  completeStream: () => void
  respondToPermission: (id: string, approved: boolean) => void
  clearMessages: () => void
}

let streamBuffer = ''

export const useSessionStore = create<SessionState>((set, get) => ({
  mode: 'ask',
  messages: [],
  currentPlan: null,
  agentRun: null,
  isStreaming: false,
  agentSessions: [],
  pendingPermission: null,

  setMode: (mode) => set({ mode }),

  sendAskMessage: async (content, model) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    const prev = get().messages
    set({ messages: [...prev, userMsg], isStreaming: true })
    streamBuffer = ''

    try {
      const history = [...prev, userMsg].map((m) => ({ role: m.role, content: m.content }))
      await window.api['ask:send']({ messages: history, model })
    } catch (err) {
      set({ isStreaming: false })
    }
  },

  generatePlan: async (prompt, model) => {
    set({ isStreaming: true, currentPlan: null })
    try {
      const plan = (await window.api['plan:generate']({ prompt, model })) as PlanDocument
      set({ currentPlan: plan, isStreaming: false })
    } catch {
      set({ isStreaming: false })
    }
  },

  startAgent: async (prompt, model) => {
    set({ isStreaming: true })
    try {
      const res = (await window.api['agent:start']({ prompt, model })) as { sessionId: string }
      set({
        agentRun: {
          sessionId: res.sessionId,
          status: 'running',
          messages: [{ id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: Date.now() }],
          toolInvocations: [],
          startedAt: Date.now()
        }
      })
    } catch {
      set({ isStreaming: false })
    }
  },

  sendAgentMessage: async (prompt) => {
    const run = get().agentRun
    if (!run) return
    const newMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: Date.now() }
    set({ agentRun: { ...run, messages: [...run.messages, newMsg] }, isStreaming: true })
    await window.api['agent:send']({ sessionId: run.sessionId, prompt })
  },

  abortCurrent: async () => {
    const mode = get().mode
    if (mode === 'ask') await window.api['ask:abort']()
    else if (mode === 'plan') await window.api['plan:abort']()
    else await window.api['agent:abort']()
    set({ isStreaming: false })
  },

  loadAgentSessions: async () => {
    const sessions = (await window.api['agent:list-sessions']()) as AgentSessionSummary[]
    set({ agentSessions: sessions })
  },

  resumeSession: async (id) => {
    await window.api['agent:resume']({ sessionId: id })
    set({
      agentRun: {
        sessionId: id,
        status: 'running',
        messages: [],
        toolInvocations: [],
        startedAt: Date.now()
      },
      isStreaming: true
    })
  },

  deleteSession: async (id) => {
    await window.api['agent:delete-session']({ sessionId: id })
    set({ agentSessions: get().agentSessions.filter((s) => s.sessionId !== id) })
  },

  addStreamDelta: (content) => {
    streamBuffer += content
    const msgs = get().messages
    const last = msgs[msgs.length - 1]
    if (last?.role === 'assistant') {
      set({
        messages: [
          ...msgs.slice(0, -1),
          { ...last, content: last.content + content }
        ]
      })
    } else {
      set({
        messages: [
          ...msgs,
          { id: crypto.randomUUID(), role: 'assistant', content, timestamp: Date.now() }
        ]
      })
    }
  },

  completeStream: () => {
    streamBuffer = ''
    set({ isStreaming: false })
  },

  respondToPermission: (id, approved) => {
    window.api['agent:permission-response']({ id, approved })
    set({ pendingPermission: null })
  },

  clearMessages: () => set({ messages: [] })
}))

// Subscribe to IPC push events
if (typeof window !== 'undefined' && window.api) {
  window.api.on('chat:stream-delta', (data: unknown) => {
    const d = data as { content: string }
    useSessionStore.getState().addStreamDelta(d.content)
  })

  window.api.on('chat:stream-done', () => {
    useSessionStore.getState().completeStream()
  })

  window.api.on('agent:permission-request', (data: unknown) => {
    useSessionStore.setState({ pendingPermission: data as PermissionRequest })
  })

  window.api.on('agent:event', (data: unknown) => {
    const event = data as { type: string; [key: string]: unknown }
    const state = useSessionStore.getState()

    if (event.type === 'tool-start' && state.agentRun) {
      const tool: ToolInvocation = {
        id: crypto.randomUUID(),
        toolName: String(event.toolName ?? 'unknown'),
        status: 'running',
        startedAt: Date.now()
      }
      useSessionStore.setState({
        agentRun: {
          ...state.agentRun,
          toolInvocations: [...state.agentRun.toolInvocations, tool]
        }
      })
    }

    if (event.type === 'tool-complete' && state.agentRun) {
      const tools = state.agentRun.toolInvocations.map((t) =>
        t.status === 'running'
          ? { ...t, status: 'completed' as const, completedAt: Date.now() }
          : t
      )
      useSessionStore.setState({
        agentRun: { ...state.agentRun, toolInvocations: tools }
      })
    }

    if (event.type === 'idle') {
      if (state.agentRun) {
        useSessionStore.setState({
          agentRun: { ...state.agentRun, status: 'idle' },
          isStreaming: false
        })
      }
    }

    if (event.type === 'message') {
      state.addStreamDelta(String(event.content ?? ''))
    }
  })
}
