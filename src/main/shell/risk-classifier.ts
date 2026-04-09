import type { ShellRisk } from '../../shared/types'

const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+|.*--recursive)/,
  /\brm\s+-rf\b/,
  /\bsudo\b/,
  /\bmkfs\b/,
  /\bformat\b/,
  /\bdd\s+if=/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bchmod\s+777\b/,
  /\bcurl\b.*\|\s*(bash|sh|zsh)\b/,
  /\bwget\b.*\|\s*(bash|sh|zsh)\b/,
  />\s*\/dev\/sd/,
  /\beval\b.*\$\(/
]

const SAFE_PATTERNS: RegExp[] = [
  /^\s*ls(\s|$)/,
  /^\s*dir(\s|$)/,
  /^\s*cat\s/,
  /^\s*echo\s/,
  /^\s*pwd\s*$/,
  /^\s*git\s+(status|log|diff|branch|show|remote|tag)/,
  /^\s*node\s+--version/,
  /^\s*npm\s+--version/,
  /^\s*pnpm\s+(--version|ls|list)/,
  /^\s*which\s/,
  /^\s*where\s/,
  /^\s*head\s/,
  /^\s*tail\s/,
  /^\s*wc\s/,
  /^\s*date\s*$/,
  /^\s*whoami\s*$/
]

export function classifyRisk(command: string): ShellRisk {
  const trimmed = command.trim()
  if (!trimmed) return 'review'

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) return 'dangerous'
  }

  for (const pattern of SAFE_PATTERNS) {
    if (pattern.test(trimmed)) return 'safe'
  }

  return 'review'
}
