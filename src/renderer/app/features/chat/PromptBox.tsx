import { useState, useRef, useEffect } from 'react'
import { useSessionStore } from '../../store/session'
import { useModelsStore } from '../../store/models'
import { Send, Square } from 'lucide-react'

const PLACEHOLDERS: Record<string, string> = {
  ask: 'Ask anything…',
  plan: 'Describe your plan…',
  agent: 'What should the agent do?'
}

export function PromptBox() {
  const { mode, isStreaming, sendAskMessage, generatePlan, startAgent, sendAgentMessage, agentRun, abortCurrent } =
    useSessionStore()
  const { selectedModels } = useModelsStore()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const model = selectedModels[mode]
    if (!model) return

    setInput('')

    switch (mode) {
      case 'ask':
        await sendAskMessage(text, model)
        break
      case 'plan':
        await generatePlan(text, model)
        break
      case 'agent':
        if (agentRun) {
          await sendAgentMessage(text)
        } else {
          await startAgent(text, model)
        }
        break
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-bg-surface p-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-bg-base px-3 py-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[mode]}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          disabled={isStreaming}
        />

        {isStreaming ? (
          <button
            onClick={abortCurrent}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white hover:bg-danger-hover"
            title="Stop"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedModels[mode]}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-30"
            title="Send (Ctrl+Enter)"
          >
            <Send size={14} />
          </button>
        )}
      </div>
      <p className="mt-1 text-right text-[10px] text-text-muted">
        Ctrl+Enter to send · Ctrl+1/2/3 switch mode
      </p>
    </div>
  )
}
