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
    <div ref={ref} className="user-chip-shell no-drag">
      <button
        onClick={() => setOpen(!open)}
        className="user-chip-trigger"
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="user-chip-avatar"
          referrerPolicy="no-referrer"
        />
        <span className="user-chip-name">{user.username}</span>
      </button>

      {open && (
        <div className="user-chip-menu">
          <div className="user-chip-menu-header">
            <p>{user.username}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              openSettings()
            }}
            className="user-chip-menu-item"
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="user-chip-menu-item user-chip-menu-item--danger"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
