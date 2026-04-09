import { create } from 'zustand'
import type { ModelCatalogEntry, Mode, UserSettings } from '../../../shared/types'

function filterModelsForMode(catalog: ModelCatalogEntry[], mode: Mode): ModelCatalogEntry[] {
  if (mode === 'agent') {
    return catalog.filter((model) => model.capabilities.includes('tool-calling'))
  }

  return catalog
}

interface ModelsState {
  catalog: ModelCatalogEntry[]
  selectedModels: Record<Mode, string>
  isLoading: boolean
  fetchCatalog: () => Promise<void>
  selectModel: (mode: Mode, modelId: string) => void
  getModelsForMode: (mode: Mode) => ModelCatalogEntry[]
  getGroupedModels: (mode: Mode) => Record<string, ModelCatalogEntry[]>
}

export const useModelsStore = create<ModelsState>((set, get) => ({
  catalog: [],
  selectedModels: { ask: '', plan: '', agent: '' },
  isLoading: false,

  fetchCatalog: async () => {
    set({ isLoading: true })
    try {
      const [catalog, settings] = (await Promise.all([
        window.api['models:catalog'](),
        window.api['settings:get']()
      ])) as [ModelCatalogEntry[], UserSettings]

      const nextSelected: Record<Mode, string> = {
        ask: get().selectedModels.ask || settings.selectedModel.ask || '',
        plan: get().selectedModels.plan || settings.selectedModel.plan || '',
        agent: get().selectedModels.agent || settings.selectedModel.agent || ''
      }

      ;(['ask', 'plan', 'agent'] as const).forEach((mode) => {
        const modeModels = filterModelsForMode(catalog, mode)
        const hasCurrentSelection = modeModels.some((model) => model.id === nextSelected[mode])

        if (!hasCurrentSelection) {
          nextSelected[mode] = modeModels[0]?.id ?? ''
          if (nextSelected[mode]) {
            window.api['models:select']({ mode, modelId: nextSelected[mode] })
          }
        }
      })

      set({ catalog, selectedModels: nextSelected, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectModel: (mode: Mode, modelId: string) => {
    const current = get().selectedModels
    set({ selectedModels: { ...current, [mode]: modelId } })
    window.api['models:select']({ mode, modelId })
  },

  getModelsForMode: (mode) => {
    return filterModelsForMode(get().catalog, mode)
  },

  getGroupedModels: (mode) => {
    const groups: Record<string, ModelCatalogEntry[]> = {}
    for (const m of filterModelsForMode(get().catalog, mode)) {
      const key = m.publisher
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    }
    return groups
  }
}))
