export interface AuthSession {
  username: string
  avatarUrl: string
  authMethod: AuthMethod
  expiresAt?: number
}

export type AuthMethod = 'oauth' | 'device-flow' | 'pat'

export interface AuthStatus {
  isAuthenticated: boolean
  user: { username: string; avatarUrl: string } | null
  authMethod: AuthMethod | null
}

export type ProviderKind = 'github-models' | 'copilot-sdk' | 'byok'

export interface BYOKConfig {
  provider: 'openai' | 'ollama'
  baseUrl: string
}

export interface ModelCatalogEntry {
  id: string
  name: string
  publisher: string
  capabilities: string[]
  limits: Record<string, number>
  rateLimitTier: string
  supportedInputModalities: string[]
  tags: string[]
  requestMultiplier?: number
  policyState?: 'enabled' | 'disabled' | 'unconfigured'
  source?: 'copilot-sdk' | 'github-models'
}

export type Mode = 'ask' | 'plan' | 'agent'

export interface WorkspaceContext {
  rootPath: string
  repoName: string
  branch: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string
}

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

export interface AgentRun {
  sessionId: string
  status: AgentStatus
  messages: ChatMessage[]
  toolInvocations: ToolInvocation[]
  startedAt: number
  completedAt?: number
}

export type AgentStatus = 'idle' | 'running' | 'awaiting-approval' | 'completed' | 'error'

export interface ToolInvocation {
  id: string
  toolName: string
  status: 'pending' | 'running' | 'completed' | 'denied'
  input?: Record<string, unknown>
  output?: string
  startedAt: number
  completedAt?: number
}

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

export interface TerminalRunResult {
  command: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

export type ShellRisk = 'safe' | 'review' | 'dangerous'

export interface UserSettings {
  selectedProvider: Record<Mode, ProviderKind>
  selectedModel: Record<Mode, string>
  repoPath: string | null
  hasBYOK: boolean
  byokConfig: BYOKConfig | null
  theme: 'dark'
}

export interface AgentSessionSummary {
  sessionId: string
  startTime: number
  modifiedTime: number
  summary: string
  context?: string
}

export interface QuotaInfo {
  remaining: number
  limit: number
  resetAt: number
}

export interface StreamDelta {
  sessionId: string
  content: string
}
