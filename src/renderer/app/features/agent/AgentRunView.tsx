import { useRef, useEffect } from 'react'
import { useSessionStore } from '../../store/session'
import { Bot, User, Wrench } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, ToolInvocation } from '../../../../shared/types'

type TimelineItem =
  | { type: 'message'; msg: ChatMessage }
  | { type: 'tool'; tool: ToolInvocation }

export function AgentRunView() {
  const { agentRun, isStreaming, messages } = useSessionStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentRun, messages])

  if (!agentRun) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
        <Bot size={32} className="text-border" />
        <p className="text-sm">Tell the agent what to do — it will plan and execute</p>
      </div>
    )
  }

  // Build interleaved timeline
  const timeline: TimelineItem[] = []
  let toolIdx = 0

  for (const msg of agentRun.messages) {
    timeline.push({ type: 'message', msg })
    // Insert tools that started before the next message
    while (
      toolIdx < agentRun.toolInvocations.length &&
      agentRun.toolInvocations[toolIdx].startedAt <= msg.timestamp
    ) {
      timeline.push({ type: 'tool', tool: agentRun.toolInvocations[toolIdx] })
      toolIdx++
    }
  }
  // Remaining tools
  while (toolIdx < agentRun.toolInvocations.length) {
    timeline.push({ type: 'tool', tool: agentRun.toolInvocations[toolIdx] })
    toolIdx++
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className={`h-2 w-2 rounded-full ${agentRun.status === 'running' ? 'animate-pulse bg-accent' : agentRun.status === 'idle' ? 'bg-success' : 'bg-border'}`} />
        Session: {agentRun.sessionId.slice(0, 8)}… — {agentRun.status}
      </div>

      {timeline.map((item, i) => {
        if (item.type === 'message') {
          const isUser = item.msg.role === 'user'
          return (
            <div key={`msg-${i}`} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-bg-elevated' : 'bg-accent/10'}`}>
                {isUser ? <User size={14} className="text-text-secondary" /> : <Bot size={14} className="text-accent" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${isUser ? 'bg-bg-elevated' : ''}`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap text-text-primary">{item.msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={`tool-${i}`} className="ml-10 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-base px-3 py-2">
            <Wrench size={12} className="text-text-muted" />
            <span className="text-xs font-medium text-text-secondary">{item.tool.toolName}</span>
            <span className={`ml-auto text-[10px] ${item.tool.status === 'completed' ? 'text-success' : item.tool.status === 'denied' ? 'text-danger' : 'text-warning'}`}>
              {item.tool.status}
            </span>
          </div>
        )
      })}

      {isStreaming && (
        <div className="flex items-center gap-2 px-10 text-xs text-text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          Agent working…
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
