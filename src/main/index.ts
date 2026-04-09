import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows'
import { registerAllHandlers } from './ipc'

app.whenReady().then(() => {
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
