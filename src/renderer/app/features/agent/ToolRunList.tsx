import { FileEdit, Terminal, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import type { ToolInvocation } from '../../../../shared/types'

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  denied: XCircle
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-warning',
  running: 'text-accent',
  completed: 'text-success',
  denied: 'text-danger'
}

function toolIcon(name: string) {
  if (name.includes('edit') || name.includes('write')) return FileEdit
  if (name.includes('bash') || name.includes('shell')) return Terminal
  return FileEdit
}

export function ToolRunList({ tools }: { tools: ToolInvocation[] }) {
  if (tools.length === 0) {
    return <p className="text-xs text-text-muted">No tool calls yet</p>
  }

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
        Tool Calls
      </h4>
      {tools.map((tool) => {
        const Icon = toolIcon(tool.toolName)
        const StatusIcon = STATUS_ICON[tool.status] ?? Clock

        return (
          <div
            key={tool.id}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-bg-hover"
          >
            <Icon size={12} className="shrink-0 text-text-muted" />
            <span className="flex-1 truncate text-text-secondary">{tool.toolName}</span>
            <StatusIcon
              size={12}
              className={`shrink-0 ${STATUS_COLOR[tool.status]} ${tool.status === 'running' ? 'animate-spin' : ''}`}
            />
            {tool.completedAt && tool.startedAt && (
              <span className="text-[10px] text-text-muted">
                {((tool.completedAt - tool.startedAt) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
