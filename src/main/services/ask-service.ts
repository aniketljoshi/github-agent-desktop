import { getMainWindow } from '../windows'
import { streamChatCompletion } from '../github/inference'
import { CHAT_STREAM_DELTA, CHAT_STREAM_DONE } from '../../shared/events'

let currentAbort: AbortController | null = null

export async function sendAskMessage(params: {
  messages: Array<{ role: string; content: string }>
  model: string
  token: string
  contextFiles?: string[]
}): Promise<{ content: string }> {
  currentAbort = new AbortController()
  const win = getMainWindow()
  let full = ''

  try {
    for await (const delta of streamChatCompletion({
      token: params.token,
      model: params.model,
      messages: params.messages,
      signal: currentAbort.signal
    })) {
      full += delta
      win?.webContents.send(CHAT_STREAM_DELTA, { content: delta, sessionId: 'ask' })
    }
  } finally {
    win?.webContents.send(CHAT_STREAM_DONE, { sessionId: 'ask' })
    currentAbort = null
  }

  return { content: full }
}

export function abortAsk(): void {
  currentAbort?.abort()
  currentAbort = null
}
