import { useState, useEffect, useRef } from 'react'
import { useModelsStore } from '../../store/models'
import { useSessionStore } from '../../store/session'
import { ChevronDown, Zap, Eye, Wrench, Search } from 'lucide-react'
import type { ModelCatalogEntry } from '../../../../shared/types'

export function ModelPicker() {
  const { catalog, selectedModels, fetchCatalog, selectModel, getGroupedModels } = useModelsStore()
  const { mode } = useSessionStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (catalog.length === 0) fetchCatalog()
  }, [catalog.length, fetchCatalog])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentId = selectedModels[mode]
  const currentModel = catalog.find((m) => m.id === currentId)
  const grouped = getGroupedModels()

  const filtered = Object.entries(grouped).reduce(
    (acc, [pub, models]) => {
      const matches = models.filter(
        (m) =>
          m.name.toLowerCase().includes(filter.toLowerCase()) ||
          m.id.toLowerCase().includes(filter.toLowerCase())
      )
      if (matches.length > 0) acc[pub] = matches
      return acc
    },
    {} as Record<string, ModelCatalogEntry[]>
  )

  return (
    <div ref={ref} className="no-drag relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2 py-1 text-xs text-text-secondary hover:bg-bg-hover"
      >
        <Zap size={12} className="text-accent" />
        <span className="max-w-[120px] truncate">{currentModel?.name ?? 'Select model'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-lg">
          <div className="border-b border-border-subtle p-2">
            <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-base px-2 py-1">
              <Search size={12} className="text-text-muted" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search models…"
                className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {Object.entries(filtered).map(([publisher, models]) => (
              <div key={publisher}>
                <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {publisher}
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      selectModel(mode, m.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-hover ${
                      m.id === currentId ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    <span className="flex-1 truncate text-left">{m.name}</span>
                    <div className="flex gap-1">
                      {m.capabilities.includes('streaming') && (
                        <span title="Streaming">
                          <Zap size={10} className="text-text-muted" />
                        </span>
                      )}
                      {m.capabilities.includes('tool-calling') && (
                        <span title="Tool calling">
                          <Wrench size={10} className="text-text-muted" />
                        </span>
                      )}
                      {m.supportedInputModalities.includes('image') && (
                        <span title="Vision">
                          <Eye size={10} className="text-text-muted" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(filtered).length === 0 && (
              <p className="px-3 py-2 text-xs text-text-muted">No models found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
