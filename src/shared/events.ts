/**
 * Canonical channel names for Electron IPC.
 *
 * Naming convention:  `domain:verb` or `domain:noun-verb`
 * All names are defined here so main, preload, and renderer stay in sync.
 */

// ─── Auth ───────────────────────────────────────────────────
export const AUTH_LOGIN_OAUTH = 'auth:login-oauth' as const
export const AUTH_LOGIN_DEVICE = 'auth:login-device' as const
export const AUTH_LOGIN_PAT = 'auth:login-pat' as const
export const AUTH_LOGOUT = 'auth:logout' as const
export const AUTH_STATUS = 'auth:status' as const
export const AUTH_DEVICE_CODE = 'auth:device-code' as const

// ─── Models ─────────────────────────────────────────────────
export const MODELS_CATALOG = 'models:catalog' as const
export const MODELS_SELECT = 'models:select' as const

// ─── Ask ────────────────────────────────────────────────────
export const ASK_SEND = 'ask:send' as const
export const ASK_ABORT = 'ask:abort' as const

// ─── Plan ───────────────────────────────────────────────────
export const PLAN_GENERATE = 'plan:generate' as const
export const PLAN_ABORT = 'plan:abort' as const

// ─── Agent ──────────────────────────────────────────────────
export const AGENT_START = 'agent:start' as const
export const AGENT_SEND = 'agent:send' as const
export const AGENT_ABORT = 'agent:abort' as const
export const AGENT_RESUME = 'agent:resume' as const
export const AGENT_LIST_SESSIONS = 'agent:list-sessions' as const
export const AGENT_DELETE_SESSION = 'agent:delete-session' as const

// ─── Agent events (main → renderer, via webContents.send) ──
export const AGENT_EVENT = 'agent:event' as const
export const AGENT_PERMISSION_REQUEST = 'agent:permission-request' as const
export const AGENT_PERMISSION_RESPONSE = 'agent:permission-response' as const

// ─── Streaming (main → renderer) ───────────────────────────
export const CHAT_STREAM_DELTA = 'chat:stream-delta' as const
export const CHAT_STREAM_DONE = 'chat:stream-done' as const

// ─── Workspace ──────────────────────────────────────────────
export const WORKSPACE_SELECT = 'workspace:select' as const
export const WORKSPACE_INFO = 'workspace:info' as const
export const WORKSPACE_READ_FILE = 'workspace:read-file' as const
export const WORKSPACE_LIST_DIR = 'workspace:list-dir' as const

// ─── Terminal ───────────────────────────────────────────────
export const TERMINAL_OUTPUT = 'terminal:output' as const

// ─── Settings ───────────────────────────────────────────────
export const SETTINGS_GET = 'settings:get' as const
export const SETTINGS_SET = 'settings:set' as const
export const SETTINGS_SET_BYOK = 'settings:set-byok' as const
export const SETTINGS_CLEAR_BYOK = 'settings:clear-byok' as const

// ─── All invoke channels (renderer → main, expects response)
export const INVOKE_CHANNELS = [
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
  SETTINGS_CLEAR_BYOK,
] as const

// ─── All push channels (main → renderer, no response expected)
export const PUSH_CHANNELS = [
  CHAT_STREAM_DELTA,
  CHAT_STREAM_DONE,
  AGENT_EVENT,
  AGENT_PERMISSION_REQUEST,
  TERMINAL_OUTPUT,
  AUTH_DEVICE_CODE,
] as const

export type InvokeChannel = (typeof INVOKE_CHANNELS)[number]
export type PushChannel = (typeof PUSH_CHANNELS)[number]
