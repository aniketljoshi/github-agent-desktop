import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows'
import { applyRuntimeEnv } from './runtime-config'
import { logStartup } from './startup-log'
import { focusMainWindow, getMainWindow } from './windows'
import { AUTH_COMPLETED, AUTH_ERROR } from '../shared/events'
import {
  exchangeDesktopGrant,
  extractProtocolCallbackFromArgv,
  getDesktopAuthConfig,
  isDesktopAuthCallbackUrl
} from './auth/auth-service-client'
import { storeAuthMethod, storeToken } from './auth/token-store'

logStartup('main module loaded')

const isTestEnvironment = process.env.NODE_ENV === 'test'
const hasSingleInstanceLock = isTestEnvironment ? true : app.requestSingleInstanceLock()
let pendingDesktopAuthUrl: string | null = null

if (!hasSingleInstanceLock) {
  logStartup('second instance detected before startup lock; quitting')
  app.quit()
}

applyRuntimeEnv({
  isPackaged: app.isPackaged,
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcesPath: process.resourcesPath,
  env: process.env
})
logStartup('initial runtime env applied')

if (!isTestEnvironment) {
  registerDesktopAuthProtocol()

  app.on('second-instance', (_event, commandLine) => {
    logStartup('second-instance event received')
    const authConfig = getDesktopAuthConfig()
    if (authConfig) {
      const callbackUrl = extractProtocolCallbackFromArgv(commandLine, authConfig.desktopCallbackUrl)
      if (callbackUrl) {
        pendingDesktopAuthUrl = callbackUrl
        void flushPendingDesktopAuth()
      }
    }
    focusMainWindow()
  })

  app.on('open-url', (event, url) => {
    event.preventDefault()
    pendingDesktopAuthUrl = url
    void flushPendingDesktopAuth()
  })
}

if (hasSingleInstanceLock) {
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

    const authConfig = getDesktopAuthConfig()
    if (authConfig) {
      const launchUrl = extractProtocolCallbackFromArgv(process.argv, authConfig.desktopCallbackUrl)
      if (launchUrl) {
        pendingDesktopAuthUrl = launchUrl
      }
    }
    await flushPendingDesktopAuth()

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
}

app.on('window-all-closed', () => {
  logStartup('window-all-closed received')
  if (process.platform !== 'darwin') app.quit()
})

app.on('render-process-gone', (_event, webContents, details) => {
  logStartup(`render-process-gone for ${webContents.id}: ${details.reason}`)
})

process.on('uncaughtException', (error) => {
  logStartup('uncaughtException', error)
})

process.on('unhandledRejection', (reason) => {
  logStartup('unhandledRejection', reason)
})

function registerDesktopAuthProtocol(): void {
  const authConfig = getDesktopAuthConfig()
  if (!authConfig) {
    return
  }

  const protocolName = new URL(authConfig.desktopCallbackUrl).protocol.replace(':', '')
  const registered = process.defaultApp
    ? app.setAsDefaultProtocolClient(protocolName, process.execPath, [app.getAppPath()])
    : app.setAsDefaultProtocolClient(protocolName)
  logStartup(`desktop auth protocol registration attempted: ${protocolName}=${registered}`)
}

async function flushPendingDesktopAuth(): Promise<void> {
  const callbackUrl = pendingDesktopAuthUrl
  if (!callbackUrl) {
    return
  }

  const authConfig = getDesktopAuthConfig()
  if (!authConfig || !isDesktopAuthCallbackUrl(callbackUrl, authConfig.desktopCallbackUrl)) {
    return
  }

  const mainWindow = getMainWindow()
  if (!mainWindow) {
    return
  }

  pendingDesktopAuthUrl = null

  try {
    const url = new URL(callbackUrl)
    const error = url.searchParams.get('error')
    if (error) {
      mainWindow.webContents.send(AUTH_ERROR, `GitHub sign-in failed: ${error}`)
      focusMainWindow()
      return
    }

    const grant = url.searchParams.get('grant')
    if (!grant) {
      throw new Error('Desktop auth callback is missing a grant')
    }

    const result = await exchangeDesktopGrant(authConfig, grant)
    storeToken('github', result.accessToken)
    storeAuthMethod('github', result.authMethod)
    mainWindow.webContents.send(AUTH_COMPLETED, {
      user: result.user,
      authMethod: result.authMethod
    })
    focusMainWindow()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not complete desktop sign-in'
    getMainWindow()?.webContents.send(AUTH_ERROR, message)
    focusMainWindow()
  }
}
