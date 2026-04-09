import { z } from 'zod'

export const loginPatSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const loginDeviceSchema = z.object({})
export const loginOAuthSchema = z.object({})

export const permissionResponseSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean()
})

export const selectModelSchema = z.object({
  mode: z.enum(['ask', 'plan', 'agent']),
  modelId: z.string().min(1)
})

export const askSendSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    })
  ),
  model: z.string().min(1),
  contextFiles: z.array(z.string()).optional()
})

export const planGenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().min(1),
  contextFiles: z.array(z.string()).optional()
})

export const agentStartSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  systemMessage: z.string().optional()
})

export const agentSendSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1)
})

export const agentResumeSchema = z.object({
  sessionId: z.string().min(1)
})

export const agentDeleteSessionSchema = z.object({
  sessionId: z.string().min(1)
})

export const workspaceSelectSchema = z.object({
  path: z.string().min(1)
})

export const workspaceReadFileSchema = z.object({
  filePath: z.string().min(1)
})

export const workspaceListDirSchema = z.object({
  dirPath: z.string().min(1)
})

export const settingsSetSchema = z.object({
  selectedProvider: z
    .record(z.enum(['ask', 'plan', 'agent']), z.enum(['github-models', 'copilot-sdk', 'byok']))
    .optional(),
  selectedModel: z.record(z.enum(['ask', 'plan', 'agent']), z.string()).optional(),
  repoPath: z.string().nullable().optional(),
  byokConfig: z
    .object({
      provider: z.enum(['openai', 'ollama']),
      baseUrl: z.string().url()
    })
    .nullable()
    .optional(),
  theme: z.literal('dark').optional()
})

export const settingsBYOKSchema = z.object({
  provider: z.enum(['openai', 'ollama']),
  apiKey: z.string().min(1),
  baseUrl: z.string().url()
})

export const ipcSchemas = {
  'auth:login-pat': loginPatSchema,
  'auth:login-device': loginDeviceSchema,
  'auth:login-oauth': loginOAuthSchema,
  'auth:logout': z.object({}),
  'auth:status': z.object({}),
  'models:catalog': z.object({}),
  'models:select': selectModelSchema,
  'ask:send': askSendSchema,
  'ask:abort': z.object({}),
  'plan:generate': planGenerateSchema,
  'plan:abort': z.object({}),
  'agent:start': agentStartSchema,
  'agent:send': agentSendSchema,
  'agent:abort': z.object({}),
  'agent:resume': agentResumeSchema,
  'agent:list-sessions': z.object({}),
  'agent:delete-session': agentDeleteSessionSchema,
  'agent:permission-response': permissionResponseSchema,
  'workspace:select': workspaceSelectSchema,
  'workspace:info': z.object({}),
  'workspace:read-file': workspaceReadFileSchema,
  'workspace:list-dir': workspaceListDirSchema,
  'settings:get': z.object({}),
  'settings:set': settingsSetSchema,
  'settings:set-byok': settingsBYOKSchema,
  'settings:clear-byok': z.object({})
} as const

export type IpcSchemaMap = typeof ipcSchemas
