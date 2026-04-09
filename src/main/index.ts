import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows'
import { applyRuntimeEnv } from './runtime-config'
import { logStartup } from './startup-log'

logStartup('main module loaded')
applyRuntimeEnv({
  isPackaged: app.isPackaged,
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcesPath: process.resourcesPath,
  env: process.env
})
logStartup('initial runtime env applied')

app.whenReady().then(async () => {
  logStartup('app.whenReady resolved')
  applyRuntimeEnv({
    isPackaged: app.isPackaged,
    cwd: process.cwd(),
    execPath: process.execPath,
    resourcesPath: process.resourcesPath,
    userDataPath: app.getPath('userData'),
    env: process.env
  })
  logStartup('runtime env applied after whenReady')

  const win = createMainWindow()
  logStartup('main window created')

  try {
    logStartup('initializing IPC handlers')
    const { registerAllHandlers } = await import('./ipc')
    registerAllHandlers()
    logStartup('IPC handlers initialized')
  } catch (error) {
    console.error('Failed to initialize IPC handlers', error)
    logStartup('IPC handler initialization failed', error)
  }

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
  logStartup('window-all-closed received')
  if (process.platform !== 'darwin') app.quit()
})

app.on('render-process-gone', (_event, webContents, details) => {
  logStartup(`render-process-gone for ${webContents.id}: ${details.reason}`)
})

process.on('uncaughtException', error => {
  logStartup('uncaughtException', error)
})

process.on('unhandledRejection', reason => {
  logStartup('unhandledRejection', reason)
})
