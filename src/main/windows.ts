import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { logStartup } from './startup-log'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  logStartup('createMainWindow invoked')
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay:
      process.platform === 'win32'
        ? {
            color: '#0f1116',
            symbolColor: '#dfe7f7',
            height: 56
          }
        : false,
    trafficLightPosition: { x: 12, y: 14 },
    backgroundColor: '#0d0f13',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  const revealWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
  }

  const revealTimeout = setTimeout(revealWindow, 1500)

  mainWindow.on('ready-to-show', () => {
    clearTimeout(revealTimeout)
    logStartup('main window ready-to-show')
    revealWindow()
  })
  mainWindow.webContents.on('did-finish-load', () => {
    logStartup('main window did-finish-load')
    revealWindow()
  })
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logStartup(`main window did-fail-load: ${errorCode} ${errorDescription}`)
    revealWindow()
  })
  mainWindow.on('closed', () => {
    logStartup('main window closed')
    clearTimeout(revealTimeout)
  })
  mainWindow.setMenuBarVisibility(false)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function focusMainWindow(): void {
  if (!mainWindow) return

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }

  mainWindow.focus()
}
