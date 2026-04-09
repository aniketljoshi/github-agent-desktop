import { ipcMain } from 'electron'
import type { ZodSchema } from 'zod'
import { ipcSchemas } from '../shared/ipc-schemas'
import type { BYOKConfig, Mode, PermissionResponse, UserSettings } from '../shared/types'
import {
  AUTH_LOGIN_OAUTH,
  AUTH_LOGIN_DEVICE,
  AUTH_LOGIN_PAT,
  AUTH_LOGOUT,
  AUTH_STATUS,
  MODELS_CATALOG,
  MODELS_SELECT,
  ASK_SEND,
  ASK_ABORT,
  PLAN_GENERATE,
  PLAN_ABORT,
  AGENT_START,
  AGENT_SEND,
  AGENT_ABORT,
  AGENT_RESUME,
  AGENT_LIST_SESSIONS,
  AGENT_DELETE_SESSION,
  AGENT_PERMISSION_RESPONSE,
  WORKSPACE_SELECT,
  WORKSPACE_INFO,
  WORKSPACE_READ_FILE,
  WORKSPACE_LIST_DIR,
  SETTINGS_GET,
  SETTINGS_SET,
  SETTINGS_SET_BYOK,
  SETTINGS_CLEAR_BYOK
} from '../shared/events'
import * as authService from './auth/github-oauth'
import { validatePAT } from './auth/pat-auth'
import {
  deleteToken,
  getAuthMethod,
  getToken,
  storeAuthMethod,
  storeToken
} from './auth/token-store'
import { fetchModelCatalog } from './github/models'
import * as askService from './services/ask-service'
import * as planService from './services/plan-service'
import * as agentService from './services/agent-service'
import * as workspace from './workspace/workspace'
import { settingsStore } from './services/settings-store'
import { focusMainWindow } from './windows'

function getGitHubOAuthConfig(): {
  clientId: string
  clientSecret: string
  callbackUrl: string
} {
  return {
    clientId: process.env.GITHUB_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() ?? '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL?.trim() || 'http://127.0.0.1:48163/callback'
  }
}

function validated<T>(schema: ZodSchema, handler: (args: T) => unknown | Promise<unknown>) {
  return async (_event: Electron.IpcMainInvokeEvent, rawArgs: unknown) => {
    try {
      const args = schema.parse(rawArgs ?? {}) as T
      return await handler(args)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }
}

export function registerAllHandlers(): void {
  // ── Auth ──────────────────────────────────────────────
  ipcMain.handle(
    AUTH_LOGIN_OAUTH,
    validated(ipcSchemas['auth:login-oauth'], async () => {
      const { clientId, clientSecret, callbackUrl } = getGitHubOAuthConfig()
      const token = await authService.startOAuthFlow(
        clientId,
        clientSecret,
        callbackUrl
      )
      focusMainWindow()
      const user = await validatePAT(token)
      storeToken('github', token)
      storeAuthMethod('github', 'oauth')
      return { success: true, user, authMethod: 'oauth' as const }
    })
  )

  ipcMain.handle(
    AUTH_LOGIN_DEVICE,
    validated(ipcSchemas['auth:login-device'], async () => {
      const { getMainWindow } = await import('./windows')
      const { clientId } = getGitHubOAuthConfig()
      const token = await authService.startDeviceFlow(clientId, (code, uri) => {
        getMainWindow()?.webContents.send('auth:device-code', { code, uri })
      })
      focusMainWindow()
      const user = await validatePAT(token)
      storeToken('github', token)
      storeAuthMethod('github', 'device-flow')
      return { success: true, user, authMethod: 'device-flow' as const }
    })
  )

  ipcMain.handle(
    AUTH_LOGIN_PAT,
    validated(ipcSchemas['auth:login-pat'], async (args: { token: string }) => {
      const user = await validatePAT(args.token)
      storeToken('github', args.token)
      storeAuthMethod('github', 'pat')
      return { success: true, user, authMethod: 'pat' as const }
    })
  )

  ipcMain.handle(
    AUTH_LOGOUT,
    validated(ipcSchemas['auth:logout'], async () => {
      deleteToken('github')
    })
  )

  ipcMain.handle(
    AUTH_STATUS,
    validated(ipcSchemas['auth:status'], async () => {
      const token = getToken('github')
      if (!token) return { isAuthenticated: false, user: null, authMethod: null }
      try {
        const user = await validatePAT(token)
        return {
          isAuthenticated: true,
          user,
          authMethod: getAuthMethod('github')
        }
      } catch {
        deleteToken('github')
        return { isAuthenticated: false, user: null, authMethod: null }
      }
    })
  )

  // ── Models ────────────────────────────────────────────
  ipcMain.handle(
    MODELS_CATALOG,
    validated(ipcSchemas['models:catalog'], async () => {
      const token = getToken('github')
      if (!token) throw new Error('Not authenticated')
      return fetchModelCatalog(token)
    })
  )

  ipcMain.handle(
    MODELS_SELECT,
    validated(ipcSchemas['models:select'], async (args: { mode: Mode; modelId: string }) => {
      const s = settingsStore.get()
      settingsStore.set({
        ...s,
        selectedModel: { ...s.selectedModel, [args.mode]: args.modelId }
      })
    })
  )

  // ── Ask ───────────────────────────────────────────────
  ipcMain.handle(
    ASK_SEND,
    validated(
      ipcSchemas['ask:send'],
      async (args: {
        messages: Array<{ role: string; content: string }>
        model: string
        contextFiles?: string[]
      }) => {
        const token = getToken('github')
        if (!token) throw new Error('Not authenticated')
        return askService.sendAskMessage({ ...args, token })
      }
    )
  )

  ipcMain.handle(
    ASK_ABORT,
    validated(ipcSchemas['ask:abort'], async () => askService.abortAsk())
  )

  // ── Plan ──────────────────────────────────────────────
  ipcMain.handle(
    PLAN_GENERATE,
    validated(
      ipcSchemas['plan:generate'],
      async (args: { prompt: string; model: string; contextFiles?: string[] }) => {
        const token = getToken('github')
        if (!token) throw new Error('Not authenticated')
        return planService.generatePlan({ ...args, token })
      }
    )
  )

  ipcMain.handle(
    PLAN_ABORT,
    validated(ipcSchemas['plan:abort'], async () => planService.abortPlan())
  )

  // ── Agent ─────────────────────────────────────────────
  ipcMain.handle(
    AGENT_START,
    validated(ipcSchemas['agent:start'], (args) =>
      agentService.startAgent(args as { model: string; prompt: string; systemMessage?: string })
    )
  )

  ipcMain.handle(
    AGENT_SEND,
    validated(ipcSchemas['agent:send'], (args) =>
      agentService.sendAgentMessage(
        (args as { sessionId: string; prompt: string }).sessionId,
        (args as { sessionId: string; prompt: string }).prompt
      )
    )
  )

  ipcMain.handle(
    AGENT_ABORT,
    validated(ipcSchemas['agent:abort'], () => agentService.abortAgent())
  )

  ipcMain.handle(
    AGENT_RESUME,
    validated(ipcSchemas['agent:resume'], (args) =>
      agentService.resumeAgent((args as { sessionId: string }).sessionId)
    )
  )

  ipcMain.handle(
    AGENT_LIST_SESSIONS,
    validated(ipcSchemas['agent:list-sessions'], () => agentService.listAgentSessions())
  )

  ipcMain.handle(
    AGENT_DELETE_SESSION,
    validated(ipcSchemas['agent:delete-session'], (args) =>
      agentService.deleteAgentSession((args as { sessionId: string }).sessionId)
    )
  )

  ipcMain.handle(
    AGENT_PERMISSION_RESPONSE,
    validated(ipcSchemas['agent:permission-response'], (args) =>
      agentService.handlePermissionResponse(args as PermissionResponse)
    )
  )

  // ── Workspace ─────────────────────────────────────────
  ipcMain.handle(
    WORKSPACE_SELECT,
    validated(ipcSchemas['workspace:select'], (args) =>
      workspace.selectWorkspace((args as { path: string }).path)
    )
  )

  ipcMain.handle(
    WORKSPACE_INFO,
    validated(ipcSchemas['workspace:info'], () => Promise.resolve(workspace.getWorkspaceInfo()))
  )

  ipcMain.handle(
    WORKSPACE_READ_FILE,
    validated(ipcSchemas['workspace:read-file'], (args) =>
      workspace.readWorkspaceFile((args as { filePath: string }).filePath)
    )
  )

  ipcMain.handle(
    WORKSPACE_LIST_DIR,
    validated(ipcSchemas['workspace:list-dir'], (args) =>
      workspace.listWorkspaceDir((args as { dirPath: string }).dirPath)
    )
  )

  // ── Settings ──────────────────────────────────────────
  ipcMain.handle(
    SETTINGS_GET,
    validated(ipcSchemas['settings:get'], () => Promise.resolve(settingsStore.get()))
  )

  ipcMain.handle(
    SETTINGS_SET,
    validated(ipcSchemas['settings:set'], async (args: Partial<UserSettings>) => {
      const current = settingsStore.get()
      settingsStore.set({ ...current, ...args })
    })
  )

  ipcMain.handle(
    SETTINGS_SET_BYOK,
    validated(ipcSchemas['settings:set-byok'], async (args: BYOKConfig & { apiKey: string }) => {
      const { apiKey, ...rest } = args
      storeToken('byok', apiKey)
      const current = settingsStore.get()
      settingsStore.set({ ...current, hasBYOK: true, byokConfig: rest })
    })
  )

  ipcMain.handle(
    SETTINGS_CLEAR_BYOK,
    validated(ipcSchemas['settings:clear-byok'], async () => {
      deleteToken('byok')
      const current = settingsStore.get()
      settingsStore.set({ ...current, hasBYOK: false, byokConfig: null })
    })
  )
}
