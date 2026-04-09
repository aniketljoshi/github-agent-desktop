import { useCallback, useEffect } from 'react'
import { FileEdit, Check, X } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { PermissionRequest } from '../../../../shared/types'

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
      <div className="overlay-dialog overlay-dialog--wide">
        <div className="overlay-header">
          <div className="overlay-title-wrap">
            <FileEdit size={16} className="overlay-title-icon is-warning" />
            <h3 className="overlay-title">Approve file change</h3>
          </div>
        </div>

        <div className="overlay-body">
          {request.fileName && <p className="overlay-file-label">{request.fileName}</p>}

          <div className="overlay-code-block">
            {request.diff ? (
              <pre className="overlay-diff">
                {request.diff.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className={
                      line.startsWith('+')
                        ? 'overlay-diff-line is-added'
                        : line.startsWith('-')
                          ? 'overlay-diff-line is-removed'
                          : 'overlay-diff-line'
                    }
                  >
                    {line}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="tool-list-empty">No diff preview available.</p>
            )}
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
