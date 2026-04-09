import { useEffect } from 'react'
import { useSessionStore } from '../store/session'
import { MessageSquare, FolderOpen, Trash2 } from 'lucide-react'

export function Sidebar() {
  const { agentSessions, loadAgentSessions, resumeSession, deleteSession } = useSessionStore()

  useEffect(() => {
    loadAgentSessions()
  }, [loadAgentSessions])

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <MessageSquare size={12} />
          Sessions
        </div>
        <div className="sidebar-list">
          {agentSessions.length === 0 && (
            <p className="sidebar-empty">No sessions yet</p>
          )}
          {agentSessions.map((s) => (
            <div key={s.sessionId} className="sidebar-item group">
              <button
                onClick={() => resumeSession(s.sessionId)}
                className="sidebar-item-main"
              >
                {s.summary || 'Untitled session'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(s.sessionId)
                }}
                className="sidebar-item-delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section sidebar-section--grow">
        <div className="sidebar-section-title">
          <FolderOpen size={12} />
          Files
        </div>
        <p className="sidebar-empty">Select a workspace to browse files</p>
      </div>
    </aside>
  )
}
