import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User, Wrench } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { ChatMessage, ToolInvocation } from '../../../../shared/types'

type TimelineItem = { type: 'message'; msg: ChatMessage } | { type: 'tool'; tool: ToolInvocation }

export function AgentRunView() {
  const { agentRun, isStreaming, messages } = useSessionStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentRun, messages])

  if (!agentRun) {
    return (
      <div className="agent-empty-state">
        <div className="agent-empty-icon">
          <Bot size={28} />
        </div>
        <div className="agent-empty-copy">
          <h2>Delegate the task, then supervise the execution.</h2>
          <p>
            Agent mode is designed for review: tool calls, writes, commands, and approvals stay
            visible while the run unfolds.
          </p>
        </div>
      </div>
    )
  }

  const timeline: TimelineItem[] = []
  let toolIndex = 0

  for (const message of agentRun.messages) {
    timeline.push({ type: 'message', msg: message })

    while (
      toolIndex < agentRun.toolInvocations.length &&
      agentRun.toolInvocations[toolIndex].startedAt <= message.timestamp
    ) {
      timeline.push({ type: 'tool', tool: agentRun.toolInvocations[toolIndex] })
      toolIndex += 1
    }
  }

  while (toolIndex < agentRun.toolInvocations.length) {
    timeline.push({ type: 'tool', tool: agentRun.toolInvocations[toolIndex] })
    toolIndex += 1
  }

  return (
    <div className="agent-shell">
      <div className="agent-session-bar">
        <span className={`agent-session-dot is-${agentRun.status}`} />
        <span>Session {agentRun.sessionId.slice(0, 8)}...</span>
        <span className="agent-session-status">{agentRun.status}</span>
      </div>

      {timeline.map((item, index) => {
        if (item.type === 'message') {
          const isUser = item.msg.role === 'user'
          return (
            <div key={`msg-${index}`} className={`agent-message ${isUser ? 'is-user' : 'is-assistant'}`}>
              <div className={`agent-message-avatar ${isUser ? 'is-user' : 'is-assistant'}`}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`agent-message-bubble ${isUser ? 'is-user' : 'is-assistant'}`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap">{item.msg.content}</p>
                ) : (
                  <div className="md-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={`tool-${index}`} className="agent-tool-row">
            <Wrench size={12} className="agent-tool-icon" />
            <span className="agent-tool-name">{item.tool.toolName}</span>
            <span className={`agent-tool-status is-${item.tool.status}`}>{item.tool.status}</span>
          </div>
        )
      })}

      {isStreaming && (
        <div className="agent-working-row">
          <span className="thread-status-dot" />
          Agent working...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
