import { useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { Github, KeyRound, Smartphone, Loader2, AlertCircle } from 'lucide-react'

export function LoginScreen() {
  const { loginOAuth, loginDevice, loginPAT, isLoading, error } = useAuthStore()
  const [showPAT, setShowPAT] = useState(false)
  const [patInput, setPATInput] = useState('')
  const [deviceCode, setDeviceCode] = useState<{ code: string; uri: string } | null>(null)

  const handlePAT = async () => {
    if (!patInput.trim()) return
    await loginPAT(patInput.trim())
  }

  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <div className="flex w-[380px] flex-col items-center gap-6 rounded-xl border border-border bg-bg-surface p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
          <Github size={24} className="text-accent" />
        </div>

        <div className="text-center">
          <h1 className="text-lg font-semibold text-text-primary">GitHub Agent Desktop</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to start using Ask, Plan, and Agent modes
          </p>
        </div>

        {error && (
          <div className="flex w-full items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={loginOAuth}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            Login with GitHub
          </button>

          <button
            onClick={async () => {
              // Listen for device code event
              window.api.on('auth:device-code', (data: unknown) => {
                const d = data as { code: string; uri: string }
                setDeviceCode(d)
              })
              await loginDevice()
            }}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50"
          >
            <Smartphone size={16} />
            Use Device Code
          </button>

          {deviceCode && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-center">
              <p className="text-xs text-text-secondary">
                Visit{' '}
                <span className="font-mono text-accent">{deviceCode.uri}</span>
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-widest text-text-primary">
                {deviceCode.code}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowPAT(!showPAT)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover"
          >
            <KeyRound size={16} />
            Use Personal Access Token
          </button>

          {showPAT && (
            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={patInput}
                onChange={(e) => setPATInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePAT()
                }}
              />
              <button
                onClick={handlePAT}
                disabled={isLoading || !patInput.trim()}
                className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50"
              >
                {isLoading ? 'Validating…' : 'Authenticate'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
