import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/main/**', 'src/shared/**'],
      exclude: [
        '**/*.d.ts',
        'src/main/index.ts',
        'src/main/ipc.ts',
        'src/main/windows.ts',
        'src/main/auth/github-oauth.ts',
        'src/shared/events.ts',
        'src/shared/types.ts'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
})
