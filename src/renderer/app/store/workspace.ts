import { create } from 'zustand'
import type { WorkspaceContext } from '../../../shared/types'

interface WorkspaceState {
  workspace: WorkspaceContext | null
  files: string[]
  isLoading: boolean
  selectWorkspace: () => Promise<void>
  loadInfo: () => Promise<void>
  listDir: (path: string) => Promise<string[]>
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  files: [],
  isLoading: false,

  selectWorkspace: async () => {
    set({ isLoading: true })
    try {
      const ws = (await window.api['workspace:select']({ path: '' })) as WorkspaceContext | null
      if (ws) {
        const files = (await window.api['workspace:list-dir']({ dirPath: '.' })) as string[]
        set({ workspace: ws, files, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  loadInfo: async () => {
    const ws = (await window.api['workspace:info']()) as WorkspaceContext | null
    set({ workspace: ws })
  },

  listDir: async (path: string) => {
    const files = (await window.api['workspace:list-dir']({ dirPath: path })) as string[]
    set({ files })
    return files
  }
}))
