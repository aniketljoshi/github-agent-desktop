import { useEffect } from 'react'
import { useSessionStore } from '../../store/session'
import { MessageSquare, Map, Bot } from 'lucide-react'
import type { Mode } from '../../../../shared/types'

const TABS: { id: Mode; label: string; icon: typeof MessageSquare; shortcut: string }[] = [
  { id: 'ask', label: 'Ask', icon: MessageSquare, shortcut: '1' },
  { id: 'plan', label: 'Plan', icon: Map, shortcut: '2' },
  { id: 'agent', label: 'Agent', icon: Bot, shortcut: '3' }
]

export function ModeTabs() {
  const { mode, setMode } = useSessionStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const idx = parseInt(e.key, 10)
        if (idx >= 1 && idx <= 3) {
          e.preventDefault()
          setMode(TABS[idx - 1].id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setMode])

  return (
    <div className="mode-switch no-drag">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          className={`mode-switch-tab ${mode === id ? 'is-active' : ''}`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}
