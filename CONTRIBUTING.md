# Contributing to GitHub Agent Desktop

Thank you for considering contributing! Here's how to get started.

## Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/github-agent-desktop.git
   cd github-agent-desktop
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Copy environment config**
   ```bash
   cp .env.example .env
   ```
   Fill in `GITHUB_CLIENT_ID` from a [GitHub OAuth App](https://github.com/settings/developers).

4. **Start in dev mode**
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
  main/        # Electron main process
  preload/     # Context bridge
  renderer/    # React UI
  shared/      # Types, events, Zod schemas
tests/
  unit/        # Vitest unit tests
  e2e/         # Playwright E2E tests
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev mode with hot reload |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier format |
| `pnpm typecheck` | TypeScript type check |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add device flow authentication
fix: handle token refresh race condition
docs: update BYOK configuration guide
test: add path-guard unit tests
```

## Pull Requests

1. Fork the repo and create a feature branch from `main`
2. Write tests for new functionality
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass
4. Open a PR with a clear description of changes

## Code Style

- TypeScript strict mode
- Immutable patterns (no mutation)
- Functions under 50 lines
- Files under 800 lines
- Zod validation on all IPC boundaries
