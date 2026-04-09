import { useEffect } from 'react'
import { useSessionStore } from '../store/session'
import { MessageSquare, FolderOpen, Trash2 } from 'lucide-react'

export function Sidebar() {
  const { agentSessions, loadAgentSessions, resumeSession, deleteSession } = useSessionStore()

  useEffect(() => {
    loadAgentSessions()
  }, [loadAgentSessions])

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-bg-surface">
      {/* Sessions */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-muted">
          <MessageSquare size={12} />
          Sessions
        </div>
        <div className="flex flex-col gap-0.5 px-1">
          {agentSessions.length === 0 && (
            <p className="px-2 py-1 text-xs text-text-muted">No sessions yet</p>
          )}
          {agentSessions.map((s) => (
            <div
              key={s.sessionId}
              className="group flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-bg-hover"
            >
              <button
                onClick={() => resumeSession(s.sessionId)}
                className="flex-1 truncate text-left text-text-secondary hover:text-text-primary"
              >
                {s.summary || 'Untitled session'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(s.sessionId)
                }}
                className="hidden text-text-muted hover:text-danger group-hover:block"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="my-2 h-px bg-border-subtle" />

      {/* Workspace files placeholder */}
      <div className="flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-muted">
          <FolderOpen size={12} />
          Files
        </div>
        <p className="px-3 py-1 text-xs text-text-muted">Select a workspace to browse files</p>
      </div>
    </aside>
  )
}
