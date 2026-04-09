import { test, expect, _electron as electron } from '@playwright/test'

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

test('PAT login shows error for invalid token', async () => {
  const window = await app.firstWindow()
  const patButton = window.getByRole('button', { name: /use personal access token/i })

  await expect(patButton).toBeVisible()
  await patButton.click()

  const input = window.locator('input[type="password"]')
  await input.fill('invalid-token')

  await window.getByRole('button', { name: 'Authenticate' }).click()

  await window.waitForTimeout(2000)
})

test('PAT login shows input after clicking PAT option', async () => {
  const window = await app.firstWindow()
  const patButton = window.getByRole('button', { name: /use personal access token/i })
  await expect(patButton).toBeVisible()
  await patButton.click()
  const input = window.locator('input[type="password"]')
  await expect(input).toBeVisible()
})
