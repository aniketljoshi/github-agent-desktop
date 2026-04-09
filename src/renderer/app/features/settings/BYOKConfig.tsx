import { useState } from 'react'
import { useSettingsStore } from '../../store/settings'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function BYOKConfig() {
  const { settings, setBYOK, clearBYOK } = useSettingsStore()
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'ollama'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim() || !baseUrl.trim()) return
    setSaving(true)
    await setBYOK({ provider, apiKey, baseUrl })
    setApiKey('')
    setSaving(false)
  }

  const handleClear = async () => {
    await clearBYOK()
  }

  const PROVIDER_URLS: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    ollama: 'http://localhost:11434/v1'
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs">
        {settings?.hasBYOK ? (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle size={12} />
            Configured
          </span>
        ) : (
          <span className="flex items-center gap-1 text-text-muted">
            <XCircle size={12} />
            Not configured
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-text-secondary">Provider</label>
        <select
          value={provider}
          onChange={(e) => {
            const p = e.target.value as 'openai' | 'anthropic' | 'ollama'
            setProvider(p)
            setBaseUrl(PROVIDER_URLS[p])
          }}
          className="rounded-lg border border-border bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama (local)</option>
        </select>

        <label className="text-xs text-text-secondary">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-…"
          className="rounded-lg border border-border bg-bg-base px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />

        <label className="text-xs text-text-secondary">Base URL</label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="rounded-lg border border-border bg-bg-base px-2 py-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save
          </button>
          {settings?.hasBYOK && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
