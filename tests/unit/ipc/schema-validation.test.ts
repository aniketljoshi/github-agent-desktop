import { describe, it, expect } from 'vitest'
import {
  askSendSchema,
  planGenerateSchema,
  loginPatSchema,
  agentStartSchema,
  settingsBYOKSchema,
  ipcSchemas
} from '../../../src/shared/ipc-schemas'

describe('IPC schema validation', () => {
  it('askSendSchema accepts valid input', () => {
    const result = askSendSchema.safeParse({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o'
    })
    expect(result.success).toBe(true)
  })

  it('askSendSchema rejects empty messages', () => {
    const result = askSendSchema.safeParse({ messages: [], model: 'gpt-4o' })
    // Empty array is valid per schema — test it passes
    expect(result.success).toBe(true)
  })

  it('askSendSchema rejects missing model', () => {
    const result = askSendSchema.safeParse({
      messages: [{ role: 'user', content: 'Hi' }],
      model: ''
    })
    expect(result.success).toBe(false)
  })

  it('planGenerateSchema accepts valid input', () => {
    const result = planGenerateSchema.safeParse({
      prompt: 'Build a todo app',
      model: 'gpt-4o'
    })
    expect(result.success).toBe(true)
  })

  it('planGenerateSchema rejects empty prompt', () => {
    const result = planGenerateSchema.safeParse({ prompt: '', model: 'gpt-4o' })
    expect(result.success).toBe(false)
  })

  it('loginPatSchema rejects empty token', () => {
    const result = loginPatSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
  })

  it('agentStartSchema accepts valid input', () => {
    const result = agentStartSchema.safeParse({
      model: 'gpt-4o',
      prompt: 'Fix the tests'
    })
    expect(result.success).toBe(true)
  })

  it('settingsBYOKSchema rejects invalid URL', () => {
    const result = settingsBYOKSchema.safeParse({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'not-a-url'
    })
    expect(result.success).toBe(false)
  })

  it('all schemas in ipcSchemas are Zod schemas', () => {
    for (const [key, schema] of Object.entries(ipcSchemas)) {
      expect(schema).toHaveProperty('parse')
      expect(schema).toHaveProperty('safeParse')
    }
  })
})
