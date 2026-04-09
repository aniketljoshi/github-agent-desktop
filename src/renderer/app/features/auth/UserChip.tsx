import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'
import { LogOut, Settings } from 'lucide-react'

export function UserChip() {
  const { user, logout } = useAuthStore()
  const { openSettings } = useUIStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} className="no-drag relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-bg-hover"
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="h-6 w-6 rounded-full"
          referrerPolicy="no-referrer"
        />
        <span className="text-xs text-text-secondary">{user.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-lg">
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="text-sm font-medium text-text-primary">{user.username}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              openSettings()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover"
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-bg-hover"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
