import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { useUIStore } from './store/ui'
import { LoginScreen } from './features/auth/LoginScreen'
import { Topbar } from './layout/Topbar'
import { Sidebar } from './layout/Sidebar'
import { BottomPanel } from './layout/BottomPanel'
import { RightInspector } from './layout/RightInspector'
import { ChatThread } from './features/chat/ChatThread'
import { PromptBox } from './features/chat/PromptBox'
import { PlanView } from './features/plan/PlanView'
import { AgentRunView } from './features/agent/AgentRunView'
import { DiffApproval } from './features/agent/DiffApproval'
import { ShellApproval } from './features/agent/ShellApproval'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { useSessionStore } from './store/session'

export default function App() {
  const { isAuthenticated, isLoading, checkStatus } = useAuthStore()
  const { sidebarOpen, inspectorOpen, bottomPanelOpen, settingsOpen } = useUIStore()
  const { mode, pendingPermission } = useSessionStore()

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-base">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  const CenterContent = () => {
    switch (mode) {
      case 'ask':
        return <ChatThread />
      case 'plan':
        return <PlanView />
      case 'agent':
        return <AgentRunView />
    }
  }

  return (
    <div className="flex h-full flex-col bg-bg-base">
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <CenterContent />
              </div>
              <PromptBox />
            </div>

            {inspectorOpen && <RightInspector />}
          </div>

          {bottomPanelOpen && <BottomPanel />}
        </div>
      </div>

      {pendingPermission?.kind === 'write' && <DiffApproval request={pendingPermission} />}
      {pendingPermission?.kind === 'shell' && <ShellApproval request={pendingPermission} />}
      {settingsOpen && <SettingsPanel />}
    </div>
  )
}
