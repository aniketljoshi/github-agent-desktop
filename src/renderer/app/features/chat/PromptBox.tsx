import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Paperclip, Square } from 'lucide-react'
import { useModelsStore } from '../../store/models'
import { useSessionStore } from '../../store/session'
import { useWorkspaceStore } from '../../store/workspace'
import { ModelPicker } from '../models/ModelPicker'
import { ModeDropdown } from '../modes/ModeDropdown'

const PLACEHOLDERS: Record<string, string> = {
  ask: 'Ask about the repo, architecture, or implementation details...',
  plan: 'Describe the outcome you want and get a structured execution plan...',
  agent: 'Describe the task for the agent to execute under your supervision...'
}

export function PromptBox() {
  const {
    mode,
    isStreaming,
    sendAskMessage,
    generatePlan,
    startAgent,
    sendAgentMessage,
    agentRun,
    abortCurrent
  } = useSessionStore()
  const { selectedModels } = useModelsStore()
  const { workspace, selectWorkspace } = useWorkspaceStore()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="prompt-shell">
      <div className="prompt-compose">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[mode]}
          rows={1}
          className="prompt-input"
          disabled={isStreaming}
        />

        <div className="prompt-toolbar prompt-toolbar--bottom">
          <div className="prompt-toolbar-left">
            <button
              onClick={() => void selectWorkspace()}
              className="prompt-tool-button"
              title={workspace ? 'Change attached workspace' : 'Attach workspace'}
            >
              <Paperclip size={14} />
              <span>{workspace ? workspace.repoName : 'Attach context'}</span>
            </button>

            <ModeDropdown />
            <ModelPicker compact />
          </div>

          {isStreaming ? (
            <button
              onClick={abortCurrent}
              className="prompt-action prompt-action--danger"
              title="Stop"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || !selectedModels[mode]}
              className="prompt-action prompt-action--primary"
              title="Send (Ctrl+Enter)"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="prompt-footnote">
        <span>{selectedModels[mode] ? 'Model ready' : 'Choose a model to start'}</span>
        <span>Ctrl+Enter to send</span>
      </div>
    </div>
  )
}
