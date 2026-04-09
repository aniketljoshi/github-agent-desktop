import { useUIStore } from '../store/ui'
import { TerminalPanel } from '../features/terminal/TerminalPanel'
import { Terminal, FileDiff, AlertTriangle } from 'lucide-react'

const TABS = [
  { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
  { id: 'diff' as const, label: 'Diff', icon: FileDiff },
  { id: 'diagnostics' as const, label: 'Diagnostics', icon: AlertTriangle }
]

export function BottomPanel() {
  const { bottomPanelTab, setBottomPanelTab } = useUIStore()

  return (
    <div className="bottom-shell">
      <div className="bottom-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setBottomPanelTab(id)}
            className={`bottom-tab ${bottomPanelTab === id ? 'is-active' : ''}`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="bottom-body">
        {bottomPanelTab === 'terminal' && <TerminalPanel />}
        {bottomPanelTab === 'diff' && <p className="bottom-empty">No diff to display.</p>}
        {bottomPanelTab === 'diagnostics' && (
          <p className="bottom-empty">No diagnostics.</p>
        )}
      </div>
    </div>
  )
}
