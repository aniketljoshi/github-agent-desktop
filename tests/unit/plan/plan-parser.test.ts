import { describe, it, expect } from 'vitest'
import { parsePlanResponse } from '../../../src/main/services/plan-service'

describe('plan parser', () => {
  it('parses valid plan JSON', () => {
    const raw = JSON.stringify({
      goal: 'Build a REST API',
      assumptions: ['Node.js is installed'],
      steps: [
        { title: 'Setup project', why: 'Foundation', files: ['package.json'], risk: 'low' },
        { title: 'Add routes', why: 'Core logic', files: ['src/routes.ts'], risk: 'medium' }
      ]
    })
    const plan = parsePlanResponse(raw, 'gpt-4o')
    expect(plan.goal).toBe('Build a REST API')
    expect(plan.steps).toHaveLength(2)
    expect(plan.steps[0].risk).toBe('low')
    expect(plan.steps[0].status).toBe('pending')
    expect(plan.model).toBe('gpt-4o')
    expect(plan.id).toBeTruthy()
  })

  it('handles missing optional fields', () => {
    const raw = JSON.stringify({
      goal: 'Simple task',
      steps: [{ title: 'Do it' }]
    })
    const plan = parsePlanResponse(raw, 'model')
    expect(plan.assumptions).toEqual([])
    expect(plan.steps[0].why).toBe('')
    expect(plan.steps[0].files).toEqual([])
    expect(plan.steps[0].risk).toBe('medium')
  })

  it('rejects invalid JSON', () => {
    expect(() => parsePlanResponse('not json', 'model')).toThrow('invalid JSON')
  })

  it('rejects JSON without required fields', () => {
    expect(() => parsePlanResponse('{"foo":"bar"}', 'model')).toThrow('missing required fields')
  })

  it('normalizes unknown risk values to medium', () => {
    const raw = JSON.stringify({
      goal: 'Test',
      steps: [{ title: 'Step', risk: 'extreme' }]
    })
    const plan = parsePlanResponse(raw, 'model')
    expect(plan.steps[0].risk).toBe('medium')
  })
})
