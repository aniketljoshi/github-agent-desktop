import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { loadAuthServiceConfig } from './config.js'
import { applyAuthServiceEnvFiles } from './env-file.js'
import { createAuthService } from './server.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
applyAuthServiceEnvFiles(dirname(currentDir))

const config = loadAuthServiceConfig()
const { server } = createAuthService({ config })

server.listen(config.port, () => {
  console.log(`[auth-service] listening on ${config.appBaseUrl}`)
})
