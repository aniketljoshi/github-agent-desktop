import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { ChatMessage } from '../../../../shared/types'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`thread-message ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div className={`thread-avatar ${isUser ? 'is-user' : 'is-assistant'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`thread-bubble ${isUser ? 'is-user' : 'is-assistant'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="md-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatThread() {
  const { messages, isStreaming } = useSessionStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="thread-empty-state">
        <div className="thread-empty-badge">
          <Bot size={18} />
          <span>Ask mode</span>
        </div>
        <h2>Start with a repo question, a change request, or a decision to make.</h2>
        <p>
          Keep the conversation clean while plans, tool calls, approvals, and logs stay in their own
          surfaces around the workspace.
        </p>
      </div>
    )
  }

  return (
    <div className="thread-shell">
      <div className="thread-stack">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isStreaming && (
          <div className="thread-status">
            <span className="thread-status-dot" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
