import type { Mode, ProviderKind, UserSettings } from '../../shared/types'
import * as adapter from '../copilot/adapter'
import { hasToken } from '../auth/token-store'

export function getProviderForMode(mode: Mode, settings: UserSettings): ProviderKind {
  return settings.selectedProvider[mode] ?? (mode === 'agent' ? 'copilot-sdk' : 'github-models')
}

export function isProviderAvailable(kind: ProviderKind): boolean {
  switch (kind) {
    case 'github-models':
      return hasToken('github')
    case 'copilot-sdk':
      return hasToken('github') && adapter.isAvailable()
    case 'byok':
      return hasToken('byok')
    default:
      return false
  }
}
