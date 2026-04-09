import { useEffect } from 'react'
import { LogOut, Settings, Shield, UserRound, X } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'

export function SettingsPanel() {
  const { closeSettings } = useUIStore()
  const { user, authMethod, logout } = useAuthStore()

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
            <h3 className="settings-heading">Account</h3>
            {user ? (
              <div className="settings-account-card">
                <div className="settings-account-profile">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="settings-account-avatar"
                    referrerPolicy="no-referrer"
                  />
                  <div className="settings-account-copy">
                    <strong>{user.username}</strong>
                    <span>Signed in with GitHub</span>
                  </div>
                </div>

                <div className="settings-account-meta">
                  <span className="settings-account-method">
                    <Shield size={12} />
                    {authMethod === 'oauth'
                      ? 'Browser OAuth'
                      : authMethod === 'device-flow'
                        ? 'Device code'
                        : 'Personal access token'}
                  </span>

                  <button
                    onClick={() => {
                      void logout()
                      closeSettings()
                    }}
                    className="settings-logout-button"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-account-card">
                <div className="settings-account-profile">
                  <span className="settings-account-avatar settings-account-avatar--placeholder">
                    <UserRound size={16} />
                  </span>
                  <div className="settings-account-copy">
                    <strong>No signed-in account</strong>
                    <span>Sign in again to browse models and run Ask, Plan, or Agent.</span>
                  </div>
                </div>
              </div>
            )}
          </section>

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
              GitHub remains the primary provider. The model dropdown only shows what your current
              GitHub access can use, and Agent mode narrows that further to tool-capable models.
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
              GitHub Agent Desktop v0.1.0 - An unofficial GitHub-native desktop coding agent with
              Ask, Plan, and Agent workflows.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
