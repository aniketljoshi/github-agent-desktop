import { useEffect } from 'react'
import { X, Settings } from 'lucide-react'
import { useUIStore } from '../../store/ui'

export function SettingsPanel() {
  const { closeSettings } = useUIStore()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSettings()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSettings])

  return (
    <div className="overlay-backdrop">
      <div className="overlay-dialog settings-dialog">
        <div className="overlay-header">
          <div className="overlay-title-wrap">
            <Settings size={16} className="overlay-title-icon" />
            <h2 className="overlay-title">Settings</h2>
          </div>
          <button onClick={closeSettings} className="settings-close-button">
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3 className="settings-heading">Appearance</h3>
            <p className="settings-copy">
              Dark theme is the default in this build. Additional themes can land once the core
              agent surfaces settle.
            </p>
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">Provider fallback</h3>
            <p className="settings-copy">
              Bring-your-own-key support is planned, but it is intentionally hidden in this build
              until provider routing and model selection are fully wired.
            </p>
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">Keyboard shortcuts</h3>
            <div className="settings-shortcuts">
              <div className="settings-shortcut-row">
                <span>Send message</span>
                <kbd>Ctrl+Enter</kbd>
              </div>
              <div className="settings-shortcut-row">
                <span>Ask mode</span>
                <kbd>Ctrl+1</kbd>
              </div>
              <div className="settings-shortcut-row">
                <span>Plan mode</span>
                <kbd>Ctrl+2</kbd>
              </div>
              <div className="settings-shortcut-row">
                <span>Agent mode</span>
                <kbd>Ctrl+3</kbd>
              </div>
              <div className="settings-shortcut-row">
                <span>Approve action</span>
                <kbd>Enter</kbd>
              </div>
              <div className="settings-shortcut-row">
                <span>Deny action</span>
                <kbd>Escape</kbd>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">About</h3>
            <p className="settings-copy">
              GitHub Agent Desktop v0.1.0 - An unofficial GitHub-native desktop coding agent.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
