import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Zap, Eye, Wrench, Search } from 'lucide-react'
import { useModelsStore } from '../../store/models'
import { useSessionStore } from '../../store/session'
import type { ModelCatalogEntry } from '../../../../shared/types'

export function ModelPicker() {
  const { catalog, selectedModels, fetchCatalog, selectModel, getGroupedModels } = useModelsStore()
  const { mode } = useSessionStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (catalog.length === 0) {
      void fetchCatalog()
    }
  }, [catalog.length, fetchCatalog])

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
  const currentModel = catalog.find((model) => model.id === currentId)
  const grouped = getGroupedModels()

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
      <button onClick={() => setOpen((value) => !value)} className="model-picker-trigger">
        <Zap size={12} className="text-accent" />
        <span className="model-picker-trigger-label">{currentModel?.name ?? 'Select model'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="model-picker-menu">
          <div className="model-picker-search-wrap">
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
                    <span className="model-picker-option-name">{model.name}</span>
                    <div className="model-picker-option-icons">
                      {model.capabilities.includes('streaming') && (
                        <span title="Streaming">
                          <Zap size={10} />
                        </span>
                      )}
                      {model.capabilities.includes('tool-calling') && (
                        <span title="Tool calling">
                          <Wrench size={10} />
                        </span>
                      )}
                      {model.supportedInputModalities.includes('image') && (
                        <span title="Vision">
                          <Eye size={10} />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(filtered).length === 0 && (
              <p className="model-picker-empty">No models found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
