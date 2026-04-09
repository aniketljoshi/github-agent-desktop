import { useEffect, useRef } from 'react'
import { useSessionStore } from '../../store/session'
import type { ChatMessage } from '../../../../shared/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-bg-elevated' : 'bg-accent/10'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-text-secondary" />
        ) : (
          <Bot size={14} className="text-accent" />
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-primary'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
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
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
        <Bot size={32} className="text-border" />
        <p className="text-sm">Ask anything — your conversation starts here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}

      {isStreaming && (
        <div className="flex items-center gap-2 px-10 text-xs text-text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          Thinking…
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
