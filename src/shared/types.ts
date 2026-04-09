// ─── Auth ───────────────────────────────────────────────────

export interface AuthSession {
  username: string
  avatarUrl: string
  authMethod: AuthMethod
  expiresAt?: number
}

export type AuthMethod = 'oauth' | 'device-flow' | 'pat'

/** Surfaces exposed to the renderer — never includes the raw token. */
export interface AuthStatus {
  isAuthenticated: boolean
  user: { username: string; avatarUrl: string } | null
  authMethod: AuthMethod | null
}

// ─── Providers ──────────────────────────────────────────────

export type ProviderKind = 'github-models' | 'copilot-sdk' | 'byok'

export interface BYOKConfig {
  provider: 'openai' | 'anthropic' | 'ollama'
  baseUrl: string
  // apiKey is stored encrypted — never present in renderer memory
}

// ─── Models ─────────────────────────────────────────────────

export interface ModelCatalogEntry {
  id: string
  name: string
  publisher: string
  capabilities: string[]
  limits: Record<string, number>
  rateLimitTier: string
  supportedInputModalities: string[]
  tags: string[]
}

// ─── Modes ──────────────────────────────────────────────────

export type Mode = 'ask' | 'plan' | 'agent'

// ─── Workspace ──────────────────────────────────────────────

export interface WorkspaceContext {
  rootPath: string
  repoName: string
  branch: string
}

// ─── Chat ───────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string
}

// ─── Plan ───────────────────────────────────────────────────

export interface PlanDocument {
  id: string
  goal: string
  assumptions: string[]
  steps: PlanStep[]
  createdAt: number
  model: string
}

export interface PlanStep {
  title: string
  why: string
  files: string[]
  risk: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'done' | 'skipped'
}

// ─── Agent ──────────────────────────────────────────────────

export interface AgentRun {
  sessionId: string
  status: AgentStatus
  messages: ChatMessage[]
  toolInvocations: ToolInvocation[]
  startedAt: number
  completedAt?: number
}

export type AgentStatus =
  | 'idle'
  | 'running'
  | 'awaiting-approval'
  | 'completed'
  | 'error'

export interface ToolInvocation {
  id: string
  toolName: string
  status: 'pending' | 'running' | 'completed' | 'denied'
  input?: Record<string, unknown>
  output?: string
  startedAt: number
  completedAt?: number
}

// ─── Permissions ────────────────────────────────────────────

export type PermissionKind =
  | 'read'
  | 'write'
  | 'shell'
  | 'mcp'
  | 'custom-tool'
  | 'url'
  | 'memory'
  | 'hook'

export interface PermissionRequest {
  id: string
  kind: PermissionKind
  toolName: string
  fileName?: string
  fullCommandText?: string
  diff?: string
  timestamp: number
}

export interface PermissionResponse {
  id: string
  approved: boolean
}

// ─── Terminal ───────────────────────────────────────────────

export interface TerminalRunResult {
  command: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

export type ShellRisk = 'safe' | 'review' | 'dangerous'

// ─── Settings ───────────────────────────────────────────────

export interface UserSettings {
  selectedProvider: Record<Mode, ProviderKind>
  selectedModel: Record<Mode, string>
  repoPath: string | null
  hasBYOK: boolean
  theme: 'dark'
}

// ─── Session listing (Copilot SDK) ──────────────────────────

export interface AgentSessionSummary {
  sessionId: string
  startTime: number
  modifiedTime: number
  summary: string
  context?: string
}

// ─── Quota ──────────────────────────────────────────────────

export interface QuotaInfo {
  remaining: number
  limit: number
  resetAt: number
}

// ─── Stream delta ───────────────────────────────────────────

export interface StreamDelta {
  sessionId: string
  content: string
}
