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
const listeners = new Map<string, Map<(...args: unknown[]) => void, (...args: unknown[]) => void>>()

// Build invoke methods for every channel
for (const channel of INVOKE_CHANNELS) {
  ;(api as Record<string, unknown>)[channel] = (args?: unknown) => ipcRenderer.invoke(channel, args)
}

// Event subscriptions
api.on = (channel: PushChannel, callback: (...args: unknown[]) => void) => {
  const allowed = new Set<string>(PUSH_CHANNELS)
  if (!allowed.has(channel)) return
  const wrapped = (_event: unknown, ...args: unknown[]) => callback(...args)
  const byChannel = listeners.get(channel) ?? new Map()
  byChannel.set(callback, wrapped)
  listeners.set(channel, byChannel)
  ipcRenderer.on(channel, wrapped)
}

api.off = (channel: PushChannel, callback: (...args: unknown[]) => void) => {
  const allowed = new Set<string>(PUSH_CHANNELS)
  if (!allowed.has(channel)) return
  const byChannel = listeners.get(channel)
  if (!byChannel) return
  const wrapped = byChannel?.get(callback)
  if (!wrapped) return
  ipcRenderer.removeListener(channel, wrapped)
  byChannel.delete(callback)
  if (byChannel.size === 0) {
    listeners.delete(channel)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type PreloadApi = Api
