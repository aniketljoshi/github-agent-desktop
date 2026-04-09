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
    <div className="flex h-[200px] shrink-0 flex-col border-t border-border bg-bg-surface">
      <div className="flex items-center gap-1 border-b border-border-subtle px-2 py-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setBottomPanelTab(id)}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
              bottomPanelTab === id
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-2">
        {bottomPanelTab === 'terminal' && <TerminalPanel />}
        {bottomPanelTab === 'diff' && <p className="text-xs text-text-muted">No diff to display</p>}
        {bottomPanelTab === 'diagnostics' && (
          <p className="text-xs text-text-muted">No diagnostics</p>
        )}
      </div>
    </div>
  )
}
