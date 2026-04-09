import { create } from 'zustand'

type BottomTab = 'terminal' | 'diff' | 'diagnostics'

interface UIState {
  sidebarOpen: boolean
  inspectorOpen: boolean
  bottomPanelOpen: boolean
  bottomPanelTab: BottomTab
  settingsOpen: boolean
  toggleSidebar: () => void
  toggleInspector: () => void
  toggleBottomPanel: () => void
  setBottomPanelTab: (tab: BottomTab) => void
  openSettings: () => void
  closeSettings: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  inspectorOpen: true,
  bottomPanelOpen: false,
  bottomPanelTab: 'terminal',
  settingsOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab, bottomPanelOpen: true }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false })
}))
