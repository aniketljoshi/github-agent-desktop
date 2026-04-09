export interface PreloadApi {
  'auth:login-oauth': () => Promise<{ success: boolean; error?: string }>
  'auth:login-device': () => Promise<{ success: boolean; error?: string }>
  'auth:login-pat': (args: { token: string }) => Promise<{ success: boolean; error?: string }>
  'auth:logout': () => Promise<void>
  'auth:status': () => Promise<
    import('../../shared/types').AuthStatus
  >
  'models:catalog': () => Promise<import('../../shared/types').ModelCatalogEntry[]>
  'models:select': (args: { mode: string; modelId: string }) => Promise<void>
  'ask:send': (args: {
    messages: Array<{ role: string; content: string }>
    model: string
    contextFiles?: string[]
  }) => Promise<{ content: string }>
  'ask:abort': () => Promise<void>
  'plan:generate': (args: {
    prompt: string
    model: string
    contextFiles?: string[]
  }) => Promise<import('../../shared/types').PlanDocument>
  'plan:abort': () => Promise<void>
  'agent:start': (args: {
    model: string
    prompt: string
    systemMessage?: string
  }) => Promise<{ sessionId: string }>
  'agent:send': (args: { sessionId: string; prompt: string }) => Promise<void>
  'agent:abort': () => Promise<void>
  'agent:resume': (args: { sessionId: string }) => Promise<void>
  'agent:list-sessions': () => Promise<import('../../shared/types').AgentSessionSummary[]>
  'agent:delete-session': (args: { sessionId: string }) => Promise<void>
  'agent:permission-response': (args: { id: string; approved: boolean }) => Promise<void>
  'workspace:select': (args: { path: string }) => Promise<import('../../shared/types').WorkspaceContext | null>
  'workspace:info': () => Promise<import('../../shared/types').WorkspaceContext | null>
  'workspace:read-file': (args: { filePath: string }) => Promise<string>
  'workspace:list-dir': (args: { dirPath: string }) => Promise<string[]>
  'settings:get': () => Promise<import('../../shared/types').UserSettings>
  'settings:set': (args: Partial<import('../../shared/types').UserSettings>) => Promise<void>
  'settings:set-byok': (args: { provider: string; apiKey: string; baseUrl: string }) => Promise<void>
  'settings:clear-byok': () => Promise<void>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}
