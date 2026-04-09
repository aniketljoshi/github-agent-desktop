import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../../store/session'
import type { PermissionRequest } from '../../../../shared/types'
import { Terminal, Check, X, AlertTriangle } from 'lucide-react'

interface Props {
  request: PermissionRequest
}

export function ShellApproval({ request }: Props) {
  const { respondToPermission } = useSessionStore()

  const approve = useCallback(
    () => respondToPermission(request.id, true),
    [request.id, respondToPermission]
  )
  const deny = useCallback(
    () => respondToPermission(request.id, false),
    [request.id, respondToPermission]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        approve()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        deny()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [approve, deny])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[500px] overflow-hidden rounded-xl border border-border bg-bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Terminal size={16} className="text-warning" />
          <h3 className="text-sm font-medium text-text-primary">Shell Command Approval</h3>
        </div>

        <div className="p-4">
          <div className="rounded-lg border border-border-subtle bg-bg-base p-3">
            <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap break-all">
              {request.fullCommandText ?? 'Unknown command'}
            </pre>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              This command will run in your system shell. Review carefully before approving.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            onClick={deny}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
          >
            <X size={12} />
            Deny (Esc)
          </button>
          <button
            onClick={approve}
            autoFocus
            className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Check size={12} />
            Approve (Enter)
          </button>
        </div>
      </div>
    </div>
  )
}
