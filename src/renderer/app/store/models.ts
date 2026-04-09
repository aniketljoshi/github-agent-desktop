import { create } from 'zustand'
import type { ModelCatalogEntry, Mode } from '../../../shared/types'

interface ModelsState {
  catalog: ModelCatalogEntry[]
  selectedModels: Record<Mode, string>
  isLoading: boolean
  fetchCatalog: () => Promise<void>
  selectModel: (mode: Mode, modelId: string) => void
  getGroupedModels: () => Record<string, ModelCatalogEntry[]>
}

export const useModelsStore = create<ModelsState>((set, get) => ({
  catalog: [],
  selectedModels: { ask: '', plan: '', agent: '' },
  isLoading: false,

  fetchCatalog: async () => {
    set({ isLoading: true })
    try {
      const catalog = (await window.api['models:catalog']()) as ModelCatalogEntry[]
      set({ catalog, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectModel: (mode: Mode, modelId: string) => {
    const current = get().selectedModels
    set({ selectedModels: { ...current, [mode]: modelId } })
    window.api['models:select']({ mode, modelId })
  },

  getGroupedModels: () => {
    const groups: Record<string, ModelCatalogEntry[]> = {}
    for (const m of get().catalog) {
      const key = m.publisher
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    }
    return groups
  }
}))
