import { test, expect, _electron as electron } from '@playwright/test'

let app: Awaited<ReturnType<typeof electron.launch>>

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'test' }
  })
})

test.afterAll(async () => {
  await app.close()
})

test('app launches and shows a window', async () => {
  const window = await app.firstWindow()
  expect(window).toBeTruthy()
})

test('window title contains GitHub Agent Desktop', async () => {
  const window = await app.firstWindow()
  const title = await window.title()
  expect(title).toContain('GitHub Agent Desktop')
})

test('login screen is visible when unauthenticated', async () => {
  const window = await app.firstWindow()
  const heading = window.locator('h1')
  await expect(heading).toContainText('GitHub Agent Desktop')
})

test('three auth options are visible', async () => {
  const window = await app.firstWindow()
  await expect(window.locator('text=Continue with GitHub')).toBeVisible()
  await expect(window.locator('text=Use Device Code')).toBeVisible()
  await expect(window.locator('text=Use Personal Access Token')).toBeVisible()
})
