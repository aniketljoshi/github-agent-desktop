import { useSessionStore } from '../store/session'
import { ToolRunList } from '../features/agent/ToolRunList'
import { Info, Cpu, FileCode, Clock } from 'lucide-react'

export function RightInspector() {
  const { mode, agentRun, messages } = useSessionStore()

  return (
    <aside className="inspector-shell">
      <div className="inspector-header">
        <Info size={12} />
        Inspector
      </div>

      <div className="inspector-body">
        {mode === 'ask' && (
          <div className="inspector-card-stack">
            <div className="inspector-stat-card">
              <Cpu size={12} />
              <span>Messages: {messages.length}</span>
            </div>
          </div>
        )}

        {mode === 'plan' && (
          <div className="inspector-card-stack">
            <div className="inspector-stat-card">
              <FileCode size={12} />
              <span>Structured execution planning</span>
            </div>
          </div>
        )}

        {mode === 'agent' && agentRun && (
          <div className="inspector-card-stack">
            <div className="inspector-stat-card">
              <Clock size={12} />
              <span>Status: {agentRun.status}</span>
            </div>
            <div className="inspector-stat-card">
              <Cpu size={12} />
              <span>Tools: {agentRun.toolInvocations.length}</span>
            </div>
            <ToolRunList tools={agentRun.toolInvocations} />
          </div>
        )}

        {mode === 'agent' && !agentRun && (
          <p className="inspector-empty">Start an agent session to see execution details.</p>
        )}
      </div>
    </aside>
  )
}
