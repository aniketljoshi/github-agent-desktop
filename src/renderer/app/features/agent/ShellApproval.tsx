import { useCallback, useEffect } from 'react'
import { Terminal, Check, X, AlertTriangle } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { PermissionRequest } from '../../../../shared/types'

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
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        approve()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        deny()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [approve, deny])

  return (
    <div className="overlay-backdrop">
      <div className="overlay-dialog">
        <div className="overlay-header">
          <div className="overlay-title-wrap">
            <Terminal size={16} className="overlay-title-icon is-warning" />
            <h3 className="overlay-title">Approve shell command</h3>
          </div>
        </div>

        <div className="overlay-body">
          <div className="overlay-code-block">
            <pre className="overlay-command">{request.fullCommandText ?? 'Unknown command'}</pre>
          </div>

          <div className="overlay-warning">
            <AlertTriangle size={14} className="overlay-warning-icon" />
            <span>
              This command will run in your system shell. Review carefully before approving.
            </span>
          </div>
        </div>

        <div className="overlay-actions">
          <button onClick={deny} className="overlay-button overlay-button--secondary">
            <X size={12} />
            Deny (Esc)
          </button>
          <button onClick={approve} autoFocus className="overlay-button overlay-button--primary">
            <Check size={12} />
            Approve (Enter)
          </button>
        </div>
      </div>
    </div>
  )
}
