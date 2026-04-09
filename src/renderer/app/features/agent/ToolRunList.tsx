import { FileEdit, Terminal, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import type { ToolInvocation } from '../../../../shared/types'

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  denied: XCircle
}

const STATUS_TONE: Record<string, string> = {
  pending: 'is-pending',
  running: 'is-running',
  completed: 'is-completed',
  denied: 'is-denied'
}

function toolIcon(name: string) {
  if (name.includes('edit') || name.includes('write')) return FileEdit
  if (name.includes('bash') || name.includes('shell')) return Terminal
  return FileEdit
}

export function ToolRunList({ tools }: { tools: ToolInvocation[] }) {
  if (tools.length === 0) {
    return <p className="tool-list-empty">No tool calls yet</p>
  }

  return (
    <div className="tool-list-shell">
      <h4 className="tool-list-heading">Tool Calls</h4>
      {tools.map((tool) => {
        const Icon = toolIcon(tool.toolName)
        const StatusIcon = STATUS_ICON[tool.status] ?? Clock

        return (
          <div key={tool.id} className="tool-list-item">
            <Icon size={12} className="tool-list-item-icon" />
            <span className="tool-list-item-name">{tool.toolName}</span>
            <StatusIcon
              size={12}
              className={`tool-list-item-status ${STATUS_TONE[tool.status]} ${tool.status === 'running' ? 'animate-spin' : ''}`}
            />
            {tool.completedAt && tool.startedAt && (
              <span className="tool-list-item-duration">
                {((tool.completedAt - tool.startedAt) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
