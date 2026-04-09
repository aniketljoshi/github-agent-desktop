import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../../store/session'
import type { PermissionRequest } from '../../../../shared/types'
import { FileEdit, Check, X } from 'lucide-react'

interface Props {
  request: PermissionRequest
}

export function DiffApproval({ request }: Props) {
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
      <div className="w-[600px] max-h-[80vh] overflow-hidden rounded-xl border border-border bg-bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <FileEdit size={16} className="text-warning" />
          <h3 className="text-sm font-medium text-text-primary">File Write Approval</h3>
        </div>

        <div className="p-4">
          {request.fileName && (
            <p className="mb-2 font-mono text-xs text-text-secondary">{request.fileName}</p>
          )}
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-border-subtle bg-bg-base p-3">
            {request.diff ? (
              <pre className="text-xs leading-relaxed">
                {request.diff.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('+')
                        ? 'text-success'
                        : line.startsWith('-')
                          ? 'text-danger'
                          : 'text-text-secondary'
                    }
                  >
                    {line}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="text-xs text-text-muted">No diff preview available</p>
            )}
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
