import { useUIStore } from '../store/ui'
import { UserChip } from '../features/auth/UserChip'
import { ModelPicker } from '../features/models/ModelPicker'
import { ModeTabs } from '../features/modes/ModeTabs'
import { RepoPicker } from '../features/workspace/RepoPicker'
import { PanelLeft, PanelRight, Terminal } from 'lucide-react'

export function Topbar() {
  const { toggleSidebar, toggleInspector, toggleBottomPanel } = useUIStore()

  return (
    <header className="drag-region topbar-shell">
      <button
        onClick={toggleSidebar}
        className="topbar-icon-button no-drag"
        title="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>

      <div className="topbar-brand no-drag">
        <span className="topbar-brand-dot" />
        <div className="topbar-brand-copy">
          <span className="topbar-brand-title">GitHub Agent</span>
          <span className="topbar-brand-subtitle">Desktop workspace</span>
        </div>
      </div>

      <div className="topbar-cluster no-drag">
        <RepoPicker />
        <ModelPicker />
      </div>

      <div className="topbar-center">
        <ModeTabs />
      </div>

      <div className="topbar-actions no-drag">
        <button
          onClick={toggleBottomPanel}
          className="topbar-icon-button"
          title="Toggle terminal"
        >
          <Terminal size={16} />
        </button>

        <button
          onClick={toggleInspector}
          className="topbar-icon-button"
          title="Toggle inspector"
        >
          <PanelRight size={16} />
        </button>

        <UserChip />
      </div>
    </header>
  )
}
