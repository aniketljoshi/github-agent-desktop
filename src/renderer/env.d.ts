/// <reference types="vite/client" />
import type { PreloadApi } from './app/preload-api'

declare global {
  interface Window {
    api: PreloadApi
  }
}

export {}
