import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, ListChecks, MessageSquare, Sparkles } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { Mode } from '../../../../shared/types'

const MODE_ITEMS: Array<{
  mode: Mode
  label: string
  description: string
  icon: typeof MessageSquare
}> = [
  {
    mode: 'ask',
    label: 'Ask',
    description: 'Questions, explanation, and repo guidance',
    icon: MessageSquare
  },
  {
    mode: 'plan',
    label: 'Plan',
    description: 'Structured steps before making changes',
    icon: ListChecks
  },
  {
    mode: 'agent',
    label: 'Agent',
    description: 'Execute with approvals and tool traces',
    icon: Bot
  }
]

export function ModeDropdown() {
  const { mode, setMode } = useSessionStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeMode = MODE_ITEMS.find((item) => item.mode === mode) ?? MODE_ITEMS[0]
  const ActiveIcon = activeMode.icon

  return (
    <div ref={ref} className="mode-dropdown-shell no-drag">
      <button onClick={() => setOpen((value) => !value)} className="mode-dropdown-trigger">
        <ActiveIcon size={12} />
        <span>{activeMode.label}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="mode-dropdown-menu">
          <div className="mode-dropdown-header">
            <Sparkles size={12} />
            <span>Conversation mode</span>
          </div>

          <div className="mode-dropdown-list">
            {MODE_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.mode}
                  onClick={() => {
                    setMode(item.mode)
                    setOpen(false)
                  }}
                  className={`mode-dropdown-option ${item.mode === mode ? 'is-active' : ''}`}
                >
                  <span className="mode-dropdown-option-icon">
                    <Icon size={12} />
                  </span>
                  <span className="mode-dropdown-option-copy">
                    <span className="mode-dropdown-option-label">{item.label}</span>
                    <span className="mode-dropdown-option-description">{item.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
