import { useUIStore } from '../../store/ui'
import { useEffect } from 'react'
import { X, Settings } from 'lucide-react'

export function SettingsPanel() {
  const { closeSettings } = useUIStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSettings])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-[70vh] w-[500px] overflow-hidden rounded-xl border border-border bg-bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-text-secondary" />
            <h2 className="text-sm font-medium text-text-primary">Settings</h2>
          </div>
          <button onClick={closeSettings} className="rounded p-1 text-text-muted hover:bg-bg-hover">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-4">
          {/* Theme */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Appearance
            </h3>
            <p className="text-xs text-text-secondary">Dark theme (other themes coming soon)</p>
          </section>

          {/* BYOK */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Provider Fallbacks
            </h3>
            <p className="text-xs text-text-secondary">
              Bring-your-own-key support is planned, but it is intentionally hidden in this build
              until provider routing and model selection are fully wired.
            </p>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Keyboard Shortcuts
            </h3>
            <div className="flex flex-col gap-1 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Send message</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl+Enter
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Ask mode</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">Ctrl+1</kbd>
              </div>
              <div className="flex justify-between">
                <span>Plan mode</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">Ctrl+2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Agent mode</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">Ctrl+3</kbd>
              </div>
              <div className="flex justify-between">
                <span>Approve action</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Deny action</span>
                <kbd className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[10px]">Escape</kbd>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              About
            </h3>
            <p className="text-xs text-text-secondary">
              GitHub Agent Desktop v0.1.0 — An unofficial GitHub-native desktop coding agent.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
