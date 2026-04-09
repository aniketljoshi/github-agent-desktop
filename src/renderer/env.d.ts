/// <reference types="vite/client" />

interface Window {
  api: import('./app/preload-api').PreloadApi
}
