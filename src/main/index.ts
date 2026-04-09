import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows'
import { applyRuntimeEnv } from './runtime-config'

applyRuntimeEnv({
  isPackaged: app.isPackaged,
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcesPath: process.resourcesPath,
  env: process.env
})

app.whenReady().then(async () => {
  applyRuntimeEnv({
    isPackaged: app.isPackaged,
    cwd: process.cwd(),
    execPath: process.execPath,
    resourcesPath: process.resourcesPath,
    userDataPath: app.getPath('userData'),
    env: process.env
  })

  const { registerAllHandlers } = await import('./ipc')
  const win = createMainWindow()
  registerAllHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('file://')) {
      e.preventDefault()
    }
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
