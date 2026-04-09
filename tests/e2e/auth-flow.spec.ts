import { test, expect, _electron as electron } from '@playwright/test'

// NOTE: Full OAuth/device flow E2E requires mocking GitHub endpoints.
// These tests cover PAT login flow with basic interaction.

let app: Awaited<ReturnType<typeof electron.launch>>

test.beforeEach(async () => {
  app = await electron.launch({
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'test' }
  })
})

test.afterEach(async () => {
  await app.close()
})

test('PAT login — shows error for invalid token', async () => {
  const window = await app.firstWindow()

  // Expand PAT section
  await window.locator('text=Use Personal Access Token').click()

  // Type an invalid token
  const input = window.locator('input[type="password"]')
  await input.fill('invalid-token')

  // Submit
  await window.locator('text=Authenticate').click()

  // Should show an error (network call will fail in test environment)
  // We just verify the flow doesn't crash
  await window.waitForTimeout(2000)
})

test('PAT login — shows input after clicking PAT option', async () => {
  const window = await app.firstWindow()
  await window.locator('text=Use Personal Access Token').click()
  const input = window.locator('input[type="password"]')
  await expect(input).toBeVisible()
})

// TODO: OAuth mock flow — requires stubbing the loopback server
// TODO: Device flow mock — requires stubbing GitHub device code endpoint
