import { contextBridge, ipcRenderer } from 'electron'
import { INVOKE_CHANNELS, PUSH_CHANNELS } from '../shared/events'
import type { InvokeChannel, PushChannel } from '../shared/events'

type ApiInvoke = {
  [K in InvokeChannel]: (args?: unknown) => Promise<unknown>
}

type ApiEvents = {
  on: (channel: PushChannel, callback: (...args: unknown[]) => void) => void
  off: (channel: PushChannel, callback: (...args: unknown[]) => void) => void
}

type Api = ApiInvoke & ApiEvents

const api = {} as Api

// Build invoke methods for every channel
for (const channel of INVOKE_CHANNELS) {
  ;(api as Record<string, unknown>)[channel] = (args?: unknown) =>
    ipcRenderer.invoke(channel, args)
}

// Event subscriptions
api.on = (channel: PushChannel, callback: (...args: unknown[]) => void) => {
  const allowed = new Set<string>(PUSH_CHANNELS)
  if (!allowed.has(channel)) return
  ipcRenderer.on(channel, (_event, ...args) => callback(...args))
}

api.off = (channel: PushChannel, callback: (...args: unknown[]) => void) => {
  const allowed = new Set<string>(PUSH_CHANNELS)
  if (!allowed.has(channel)) return
  ipcRenderer.removeListener(channel, callback)
}

contextBridge.exposeInMainWorld('api', api)

export type PreloadApi = Api
