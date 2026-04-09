import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Zap, Eye, Wrench, Search, Check } from 'lucide-react'
import { useModelsStore } from '../../store/models'
import { useSessionStore } from '../../store/session'
import type { ModelCatalogEntry } from '../../../../shared/types'

export function ModelPicker({ compact = false }: { compact?: boolean }) {
  const {
    selectedModels,
    fetchCatalog,
    selectModel,
    getGroupedModels,
    getModelsForMode,
    isLoading,
    error
  } = useModelsStore()
  const { mode } = useSessionStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (getModelsForMode(mode).length === 0) {
      void fetchCatalog()
    }
  }, [fetchCatalog, getModelsForMode, mode])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentId = selectedModels[mode]
  const availableModels = getModelsForMode(mode)
  const currentModel = availableModels.find((model) => model.id === currentId)
  const grouped = getGroupedModels(mode)

  const filtered = Object.entries(grouped).reduce(
    (accumulator, [publisher, models]) => {
      const matches = models.filter(
        (model) =>
          model.name.toLowerCase().includes(filter.toLowerCase()) ||
          model.id.toLowerCase().includes(filter.toLowerCase())
      )

      if (matches.length > 0) {
        accumulator[publisher] = matches
      }

      return accumulator
    },
    {} as Record<string, ModelCatalogEntry[]>
  )

  return (
    <div ref={ref} className="model-picker-shell no-drag">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`model-picker-trigger ${compact ? 'is-compact' : ''}`}
      >
        <Zap size={12} className="text-accent" />
        <span className="model-picker-trigger-label">{currentModel?.name ?? 'Select model'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="model-picker-menu">
          <div className="model-picker-search-wrap">
            <div className="model-picker-menu-header">
              <span className="model-picker-menu-title">Available to your Copilot access</span>
              <span className="model-picker-menu-meta">
                {isLoading
                  ? 'Loading...'
                  : error
                    ? 'Copilot models unavailable'
                    : mode === 'agent'
                      ? 'Tool-capable only'
                      : `${availableModels.length} models`}
              </span>
            </div>
            <div className="model-picker-search">
              <Search size={12} className="model-picker-search-icon" />
              <input
                type="text"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search models..."
                className="model-picker-search-input"
                autoFocus
              />
            </div>
          </div>

          <div className="model-picker-list">
            {Object.entries(filtered).map(([publisher, models]) => (
              <div key={publisher}>
                <div className="model-picker-group-label">{publisher}</div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      selectModel(mode, model.id)
                      setOpen(false)
                    }}
                    className={`model-picker-option ${model.id === currentId ? 'is-active' : ''}`}
                  >
                    <div className="model-picker-option-main">
                      <div className="model-picker-option-title-row">
                        <span className="model-picker-option-name">{model.name}</span>
                        {model.id === currentId && (
                          <Check size={12} className="model-picker-check" />
                        )}
                      </div>
                      <div className="model-picker-option-meta">
                        <span>{formatContextWindow(model)}</span>
                        <span>{model.publisher}</span>
                        {typeof model.requestMultiplier === 'number' && (
                          <span>{formatMultiplier(model.requestMultiplier)}</span>
                        )}
                        <div className="model-picker-option-icons">
                          {model.capabilities.includes('streaming') && (
                            <span className="model-capability-pill" title="Streaming">
                              <Zap size={10} />
                              Streaming
                            </span>
                          )}
                          {model.capabilities.includes('tool-calling') && (
                            <span className="model-capability-pill" title="Tool calling">
                              <Wrench size={10} />
                              Tools
                            </span>
                          )}
                          {model.supportedInputModalities.includes('image') && (
                            <span className="model-capability-pill" title="Vision">
                              <Eye size={10} />
                              Vision
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(filtered).length === 0 && (
              <p className="model-picker-empty">
                {isLoading
                  ? 'Loading models...'
                  : error
                    ? error
                    : mode === 'agent'
                      ? 'No tool-capable models are available to this account.'
                      : 'No models found'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatContextWindow(model: ModelCatalogEntry): string {
  const rawContext =
    model.limits.max_input_tokens ??
    model.limits.context_window ??
    model.limits.max_context_tokens ??
    0

  if (!rawContext) {
    return 'Context unknown'
  }

  if (rawContext >= 1000) {
    return `${Math.round(rawContext / 1000)}K context`
  }

  return `${rawContext} tokens`
}

function formatMultiplier(multiplier: number): string {
  return `${multiplier}x`
}
