import { useUIStore } from '../store/ui'
import { UserChip } from '../features/auth/UserChip'
import { ModelPicker } from '../features/models/ModelPicker'
import { ModeTabs } from '../features/modes/ModeTabs'
import { RepoPicker } from '../features/workspace/RepoPicker'
import { PanelLeft, PanelRight, Terminal } from 'lucide-react'

export function Topbar() {
  const { toggleSidebar, toggleInspector, toggleBottomPanel } = useUIStore()

  return (
    <header className="drag-region flex h-[44px] shrink-0 items-center gap-3 border-b border-border bg-bg-surface px-3">
      <button
        onClick={toggleSidebar}
        className="no-drag rounded p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        title="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>

      <span className="no-drag text-sm font-semibold text-accent">GitHub Agent</span>

      <div className="no-drag mx-2 h-4 w-px bg-border" />

      <RepoPicker />
      <ModelPicker />

      <div className="flex-1" />

      <ModeTabs />

      <div className="flex-1" />

      <button
        onClick={toggleBottomPanel}
        className="no-drag rounded p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        title="Toggle terminal"
      >
        <Terminal size={16} />
      </button>

      <button
        onClick={toggleInspector}
        className="no-drag rounded p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        title="Toggle inspector"
      >
        <PanelRight size={16} />
      </button>

      <UserChip />
    </header>
  )
}
