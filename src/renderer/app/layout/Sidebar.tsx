import { useEffect } from 'react'
import { useSessionStore } from '../store/session'
import { useWorkspaceStore } from '../store/workspace'
import { useUIStore } from '../store/ui'
import {
  Bot,
  FolderOpen,
  FolderTree,
  MessageSquare,
  PanelRight,
  Plus,
  Settings,
  Terminal,
  Trash2
} from 'lucide-react'
import { FileTree } from '../features/workspace/FileTree'

export function Sidebar() {
  const { agentSessions, loadAgentSessions, resumeSession, deleteSession, clearMessages, setMode } =
    useSessionStore()
  const { workspace, selectWorkspace } = useWorkspaceStore()
  const { openSettings, setBottomPanelTab, toggleInspector } = useUIStore()

  useEffect(() => {
    loadAgentSessions()
  }, [loadAgentSessions])

  return (
    <aside className="sidebar-shell">
      <div className="app-rail">
        <div className="app-rail-group">
          <button
            className="app-rail-button is-brand"
            title="New thread"
            onClick={() => {
              clearMessages()
              setMode('ask')
            }}
          >
            <Plus size={16} />
          </button>
          <button className="app-rail-button is-active" title="Threads">
            <MessageSquare size={16} />
          </button>
          <button className="app-rail-button" title="Files" onClick={() => void selectWorkspace()}>
            <FolderTree size={16} />
          </button>
        </div>

        <div className="app-rail-group app-rail-group--bottom">
          <button
            className="app-rail-button"
            title="Terminal"
            onClick={() => setBottomPanelTab('terminal')}
          >
            <Terminal size={16} />
          </button>
          <button className="app-rail-button" title="Inspector" onClick={toggleInspector}>
            <PanelRight size={16} />
          </button>
          <button className="app-rail-button" title="Settings" onClick={openSettings}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-pane-header">
          <div>
            <p className="sidebar-pane-kicker">Workspace</p>
            <h2 className="sidebar-pane-title">
              {workspace?.repoName ?? 'No repository selected'}
            </h2>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <Bot size={12} />
            Sessions
          </div>
          <div className="sidebar-list">
            {agentSessions.length === 0 && (
              <p className="sidebar-empty">Start a thread, then agent sessions will appear here.</p>
            )}
            {agentSessions.map((s) => (
              <div key={s.sessionId} className="sidebar-item group">
                <button onClick={() => resumeSession(s.sessionId)} className="sidebar-item-main">
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
          <div className="sidebar-section-row">
            <div className="sidebar-section-title">
              <FolderOpen size={12} />
              Files
            </div>
            <button className="sidebar-link-button" onClick={() => void selectWorkspace()}>
              {workspace ? 'Change' : 'Select'}
            </button>
          </div>
          {workspace ? (
            <FileTree />
          ) : (
            <p className="sidebar-empty">Pick a workspace to browse files.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
