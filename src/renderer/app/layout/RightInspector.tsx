import { useSessionStore } from '../store/session'
import { ToolRunList } from '../features/agent/ToolRunList'
import { Info, Cpu, FileCode, Clock } from 'lucide-react'

export function RightInspector() {
  const { mode, agentRun, messages } = useSessionStore()

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l border-border bg-bg-surface">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-muted">
        <Info size={12} />
        Inspector
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {mode === 'ask' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Cpu size={12} />
              <span>Messages: {messages.length}</span>
            </div>
          </div>
        )}

        {mode === 'plan' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <FileCode size={12} />
              <span>Plan mode</span>
            </div>
          </div>
        )}

        {mode === 'agent' && agentRun && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Clock size={12} />
              <span>Status: {agentRun.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Cpu size={12} />
              <span>Tools: {agentRun.toolInvocations.length}</span>
            </div>
            <ToolRunList tools={agentRun.toolInvocations} />
          </div>
        )}

        {mode === 'agent' && !agentRun && (
          <p className="text-xs text-text-muted">Start an agent session to see execution details</p>
        )}
      </div>
    </aside>
  )
}
