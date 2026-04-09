import { useEffect, useState } from 'react'
import { Github, KeyRound, Smartphone, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/auth'

export function LoginScreen() {
  const { loginOAuth, loginDevice, loginPAT, isLoading, error } = useAuthStore()
  const [showPAT, setShowPAT] = useState(false)
  const [patInput, setPATInput] = useState('')
  const [deviceCode, setDeviceCode] = useState<{ code: string; uri: string } | null>(null)

  const handlePAT = async () => {
    if (!patInput.trim()) return
    await loginPAT(patInput.trim())
  }

  useEffect(() => {
    const handler = (data: unknown) => {
      const payload = data as { code: string; uri: string }
      setDeviceCode(payload)
    }

    window.api.on('auth:device-code', handler)
    return () => window.api.off('auth:device-code', handler)
  }, [])

  return (
    <div className="auth-screen">
      <div className="auth-frame">
        <section className="auth-hero">
          <div className="auth-hero-top">
            <div className="auth-hero-mark">
              <Github size={22} />
            </div>
            <div className="auth-mode-pills">
              <span className="auth-mode-pill">Ask</span>
              <span className="auth-mode-pill">Plan</span>
              <span className="auth-mode-pill">Agent</span>
            </div>
          </div>
          <span className="auth-kicker">GitHub-native coding workspace</span>
          <h1 className="auth-title">Supervise agents from a calmer desktop surface.</h1>
          <p className="auth-copy">
            Ask questions, generate plans, and approve agent work from a focused workspace built
            around reviewable changes instead of noisy chat chrome.
          </p>

          <div className="auth-preview">
            <div className="auth-preview-header">
              <span className="auth-feature-label">Session preview</span>
              <span className="auth-preview-status">Approval-first</span>
            </div>
            <div className="auth-preview-command">
              <span className="auth-preview-prompt">&gt;</span>
              <span>Refactor auth flow and show me the exact diff before applying it.</span>
            </div>
            <div className="auth-preview-grid">
              <div className="auth-preview-card">
                <span className="auth-preview-card-label">Workspace</span>
                <strong>Repo-aware execution</strong>
                <p>Model routing, file context, terminal output, and checkpoints in one place.</p>
              </div>
              <div className="auth-preview-card">
                <span className="auth-preview-card-label">Review</span>
                <strong>Diffs before writes</strong>
                <p>Every file edit and shell action stays inspectable before it lands.</p>
              </div>
              <div className="auth-preview-card auth-preview-card--timeline">
                <span className="auth-preview-card-label">Live timeline</span>
                <ul className="auth-preview-timeline">
                  <li>Planned implementation steps</li>
                  <li>Tool calls and command logs</li>
                  <li>Approvals, retries, and final summary</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-icon">
              <Github size={20} />
            </div>
            <div>
              <h2>Sign in to continue</h2>
              <p>
                Continue with GitHub opens your browser, completes sign-in, then returns you to the
                app. Device Code and PAT are fallback options.
              </p>
            </div>
          </div>

          {error && (
            <div className="auth-alert">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-actions">
            <button
              onClick={loginOAuth}
              disabled={isLoading}
              className="auth-action auth-action--primary"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
              <span>Continue with GitHub</span>
            </button>

            <button onClick={loginDevice} disabled={isLoading} className="auth-action">
              <Smartphone size={16} />
              <span>Use Device Code</span>
            </button>

            {deviceCode && (
              <div className="auth-device-code">
                <div className="auth-device-meta">
                  <span>Open</span>
                  <span className="auth-device-uri">{deviceCode.uri}</span>
                </div>
                <div className="auth-device-token">{deviceCode.code}</div>
              </div>
            )}

            <button
              onClick={() => setShowPAT((value) => !value)}
              className={`auth-action auth-action--subtle ${showPAT ? 'is-active' : ''}`}
            >
              <KeyRound size={16} />
              <span>Use Personal Access Token</span>
            </button>

            {showPAT && (
              <div className="auth-pat-block">
                <label className="auth-field-label" htmlFor="pat-input">
                  Fine-grained token
                </label>
                <input
                  id="pat-input"
                  type="password"
                  value={patInput}
                  onChange={(event) => setPATInput(event.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="auth-input"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handlePAT()
                    }
                  }}
                />
                <button
                  onClick={() => void handlePAT()}
                  disabled={isLoading || !patInput.trim()}
                  className="auth-action auth-action--secondary"
                >
                  {isLoading ? 'Validating...' : 'Authenticate'}
                </button>
              </div>
            )}
          </div>

          <div className="auth-footnote">
            For local browser login, configure <code>GITHUB_CLIENT_ID</code>,{' '}
            <code>GITHUB_CLIENT_SECRET</code>, and a matching <code>GITHUB_CALLBACK_URL</code>.
          </div>
        </section>
      </div>
    </div>
  )
}
