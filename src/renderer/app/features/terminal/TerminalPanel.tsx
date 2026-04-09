import { useEffect, useState } from 'react'

export function TerminalPanel() {
  const [lines, setLines] = useState<Array<{ type: string; data: string }>>([])

  useEffect(() => {
    const handler = (data: unknown) => {
      const d = data as { type: string; data: string }
      setLines((prev) => [...prev.slice(-500), d]) // keep last 500 lines
    }
    window.api.on('terminal:output', handler)
    return () => window.api.off('terminal:output', handler)
  }, [])

  if (lines.length === 0) {
    return (
      <p className="font-mono text-xs text-text-muted">
        Terminal output from agent shell commands will appear here
      </p>
    )
  }

  return (
    <pre className="font-mono text-xs leading-relaxed">
      {lines.map((line, i) => (
        <span key={i} className={line.type === 'stderr' ? 'text-danger' : 'text-text-secondary'}>
          {line.data}
        </span>
      ))}
    </pre>
  )
}
