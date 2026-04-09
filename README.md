<div align="center">

<br />

```
   ╔══════════════════════════════════════════════════════╗
   ║                                                      ║
   ║    ●  Ask  ·  Plan  ·  Agent                         ║
   ║   ┌──────────────────────────────────────────────┐   ║
   ║   │  > How do I add auth to this Express app?    │   ║
   ║   │                                              │   ║
   ║   │  I'll set up Passport.js with JWT tokens.    │   ║
   ║   │  Here's a 4-step plan:                       │   ║
   ║   │                                              │   ║
   ║   │  1. Install dependencies     ○ low risk      │   ║
   ║   │  2. Create auth middleware   ○ low risk      │   ║
   ║   │  3. Add login route          ● medium risk   │   ║
   ║   │  4. Protect endpoints        ○ low risk      │   ║
   ║   │                                              │   ║
   ║   │  [Send to Agent ▶]                           │   ║
   ║   └──────────────────────────────────────────────┘   ║
   ║   ┌─ Terminal ───────────────────────────────────┐   ║
   ║   │  $ npm install passport passport-jwt bcrypt  │   ║
   ║   │  ✓ 3 packages installed                      │   ║
   ║   └──────────────────────────────────────────────┘   ║
   ╚══════════════════════════════════════════════════════╝
```

<br />

# GitHub Agent Desktop

**An unofficial, open-source desktop coding agent for GitHub.**

Ask questions. Generate plans. Let the agent execute — with your approval at every step.

[![CI](https://img.shields.io/github/actions/workflow/status/AniketJoshi/github-agent-desktop/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/AniketJoshi/github-agent-desktop/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-34-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

[Getting Started](#getting-started) · [How It Works](#how-it-works) · [Architecture](#architecture) · [Contributing](#contributing) · [Security](#security-model)

</div>

---

## Why This Exists

GitHub Copilot coding agents are powerful — but they live inside VS Code or the browser. If you want a **standalone desktop experience** that talks directly to GitHub Models and the Copilot SDK, nothing exists yet.

This project fills that gap: a native desktop app where you can **ask** a model anything, **plan** multi-step changes with risk visibility, and hand the plan to an **agent** that executes it — with explicit permission gates before every file write, shell command, or network call.

It is **unofficial** and **community-driven**. Not affiliated with GitHub or Microsoft.

---

## Features

### Three Modes, One Workflow

| Mode | What It Does | Powered By |
|------|-------------|------------|
| **Ask** | Multi-turn chat with any GitHub Models model. Attach workspace files as context. Stream responses in real time. | GitHub Models API |
| **Plan** | Describe what you want. Get a structured plan with steps, affected files, and risk levels. Review before anything happens. | GitHub Models API |
| **Agent** | Execute the plan. The agent reads files, writes code, runs shell commands — each action requires your explicit approval. | Copilot SDK |

### Security-First Agent

Every agent action passes through a permission gate:

```
  read file     → auto-approved within workspace
  write file    → diff shown, you approve or reject
  shell command → risk-classified (safe / review / dangerous)
  dangerous cmd → blocked by default, override requires confirmation
```

Shell commands are classified by a risk engine before they reach you:

| Classification | Examples | Behavior |
|---------------|----------|----------|
| **Safe** | `ls`, `git status`, `cat`, `pwd` | Auto-approved |
| **Review** | `npm install`, `node script.js` | Show for approval |
| **Dangerous** | `rm -rf`, `sudo`, `curl \| bash` | Blocked + warning |

### BYOK Status

Bring-your-own-key support is planned, but it is intentionally hidden in this build until
provider routing and model selection are fully wired.

### Additional Highlights

- **GitHub browser sign-in + Device Flow + PAT** — three auth paths, all encrypting tokens via the OS keychain
- **Model picker** — browse the full GitHub Models catalog, grouped by publisher, with capability badges
- **Monaco diff viewer** — review every proposed file change in a real code editor
- **Integrated terminal** — xterm.js panel for command output and interaction
- **Plan → Agent handoff** — one click to convert a plan into an agent execution
- **Session persistence** — resume agent sessions across app restarts
- **Cross-platform** — Windows, macOS, Linux builds via electron-builder

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- A **GitHub account** (for GitHub OAuth / Models API access)

### Install & Run

```bash
# Clone
git clone https://github.com/AniketJoshi/github-agent-desktop.git
cd github-agent-desktop

# Install dependencies
pnpm install

# Configure
cp .env.example .env
# Edit .env — add your GitHub OAuth App client_id

# Start dev mode (hot-reload)
pnpm dev
```

### First Launch

1. Click **Continue with GitHub** (opens your browser and shows a device code in-app)
2. Pick a model from the catalog
3. Start with **Ask** mode — type a question
4. Switch to **Plan** to generate a structured plan
5. Hit **Send to Agent** to execute it

### Build for Distribution

```bash
pnpm build:win     # Windows  → .exe / portable
pnpm build:mac     # macOS    → .dmg
pnpm build:linux   # Linux    → .AppImage / .deb
```

---

## How It Works

### Ask Mode

You chat. The model streams back. Workspace files can be attached as context so the model understands your codebase.

```
You:   How should I structure the database layer for this Express app?
Model: Based on your project structure, I'd recommend a repository pattern...
       [streams in real time via SSE]
```

### Plan Mode

Describe an objective. The model returns a structured JSON plan:

```json
{
  "goal": "Add JWT authentication to the Express API",
  "assumptions": ["Express 4.x", "PostgreSQL for user storage"],
  "steps": [
    { "title": "Install dependencies",   "files": ["package.json"], "risk": "low" },
    { "title": "Create auth middleware",  "files": ["src/middleware/auth.ts"], "risk": "low" },
    { "title": "Add login/register routes", "files": ["src/routes/auth.ts"], "risk": "medium" },
    { "title": "Protect existing routes", "files": ["src/routes/api.ts"], "risk": "low" }
  ]
}
```

Each step shows affected files and a risk badge. You review, reorder, or remove steps before proceeding.

### Agent Mode

The Copilot SDK takes the plan and executes it. Every tool invocation surfaces in the UI:

```
  ▸ Reading src/routes/api.ts          ✓ auto-approved
  ▸ Writing src/middleware/auth.ts      ⏸ awaiting your approval
    ┌─ Diff ──────────────────────────────────────┐
    │ + import jwt from 'jsonwebtoken'             │
    │ + export function authenticate(req, res, next) { │
    │ +   ...                                      │
    └──────────────────────────────────────────────┘
    [Approve] [Reject]
```

You stay in control. Nothing writes to disk or runs a command without your say.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Electron Main Process                  │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Auth    │  │ GitHub Models│  │    Copilot SDK         │ │
│  │          │  │   API        │  │    (adapter.ts only)    │ │
│  │ • OAuth  │  │ • Catalog    │  │ • Session management   │ │
│  │ • Device │  │ • Inference  │  │ • Permission handling  │ │
│  │ • PAT    │  │ • Streaming  │  │ • Tool execution       │ │
│  └──────────┘  └──────────────┘  └────────────────────────┘ │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │Workspace │  │    Shell     │  │      Services          │ │
│  │ • Repo   │  │ • Terminal   │  │ • ask-service          │ │
│  │ • Files  │  │ • Risk       │  │ • plan-service         │ │
│  │ • Guard  │  │   classifier │  │ • agent-service        │ │
│  └──────────┘  └──────────────┘  └────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  IPC Layer — Zod-validated on every handle()             ││
│  └──────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│                   Preload (context bridge)                    │
├──────────────────────────────────────────────────────────────┤
│                     Renderer (React 19)                      │
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐ │
│  │  Auth  │ │ Models │ │  Chat  │ │  Plan  │ │   Agent   │ │
│  │ Login  │ │ Picker │ │ Thread │ │  View  │ │  RunView  │ │
│  │ Chip   │ │        │ │ Prompt │ │  Cards │ │  ToolList │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └───────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Zustand Stores: auth, models, session, workspace, ui │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Single SDK import file** | `adapter.ts` is the only file that touches `@github/copilot-sdk`. If the SDK breaks, you update one file. |
| **Zod on every IPC boundary** | The renderer is untrusted. Every `ipcMain.handle` validates input with a Zod schema before processing. |
| **safeStorage for tokens** | Tokens are encrypted via the OS keychain (Windows Credential Manager / macOS Keychain / libsecret). Never stored as plaintext. |
| **Path traversal guard** | Every file operation is checked against the workspace root + `path.sep`. No `../` escape possible. |
| **Risk classifier for shell** | Shell commands pass through regex-based classification before reaching the user. Dangerous patterns are blocked by default. |
| **contextIsolation + no nodeIntegration** | The renderer has zero access to Node.js APIs. Everything goes through the typed preload bridge. |

### Project Structure

```
src/
├── shared/                  # Shared between main + renderer
│   ├── types.ts             # All domain types
│   ├── events.ts            # IPC channel constants
│   └── ipc-schemas.ts       # Zod schemas for every IPC call
├── main/                    # Electron main process
│   ├── index.ts             # Entry point
│   ├── windows.ts           # BrowserWindow creation
│   ├── ipc.ts               # All handle() registrations
│   ├── auth/                # OAuth, device flow, PAT, token store
│   ├── github/              # Models API catalog + inference
│   ├── copilot/             # SDK adapter + permission handling
│   ├── services/            # Ask, Plan, Agent business logic
│   ├── workspace/           # Repo management + path guard
│   └── shell/               # Terminal execution + risk classifier
├── preload/
│   └── index.ts             # contextBridge typed API
└── renderer/
    ├── main.tsx             # React entry
    ├── app/
    │   ├── App.tsx          # Root component with auth gate
    │   ├── store/           # Zustand stores (6 stores)
    │   ├── layout/          # Topbar, Sidebar, BottomPanel, Inspector
    │   └── features/        # Auth, Models, Chat, Plan, Agent, Settings
    └── styles/
        ├── tokens.css       # Design tokens (oklch palette)
        └── global.css       # Base styles + Tailwind
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start in development mode with hot reload |
| `pnpm build` | Production build (main + preload + renderer) |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:coverage` | Unit tests with V8 coverage report |
| `pnpm test:e2e` | Run E2E tests (Playwright + Electron) |
| `pnpm typecheck` | TypeScript type checking (both tsconfigs) |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier format all source files |
| `pnpm build:win` | Build Windows distributables (.exe) |
| `pnpm build:mac` | Build macOS distributables (.dmg) |
| `pnpm build:linux` | Build Linux distributables (.AppImage, .deb) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 34 |
| UI framework | React 19 |
| Language | TypeScript 5.9 (strict) |
| Build | electron-vite 5 (Vite 7 under the hood) |
| Styling | Tailwind CSS 4 with oklch design tokens |
| State | Zustand 5 |
| AI (Ask/Plan) | GitHub Models API (streaming SSE) |
| AI (Agent) | @github/copilot-sdk 0.2.x |
| Code viewer | Monaco Editor |
| Terminal | xterm.js |
| Animation | Framer Motion 12 |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Icons | Lucide React |
| IPC validation | Zod 3.25 |
| Tests | Vitest 3 + Playwright |
| Packaging | electron-builder |
| CI/CD | GitHub Actions |

---

## Security Model

This app runs an AI agent that can read files, write code, and execute shell commands on your machine. Security is not optional.

| Boundary | Protection |
|----------|-----------|
| **Renderer ↔ Main** | `contextIsolation: true`, `nodeIntegration: false`. Every IPC input Zod-validated. |
| **File system** | Path traversal guard rejects any access outside workspace root. |
| **Shell execution** | Risk classifier categorizes every command. Dangerous commands blocked. All require approval. |
| **Token storage** | OS-level encryption via Electron `safeStorage` (Credential Manager / Keychain / libsecret). |
| **Permissions** | Every agent tool invocation surfaces in the UI. Write and shell ops require explicit user approval. |
| **CSP** | Content Security Policy headers on the renderer. No `eval()`, no `innerHTML`. |
| **Dependencies** | Copilot SDK is in `optionalDependencies` — the app works without it (Ask/Plan still function). |

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, commit conventions, and the PR process.

Quick version:

```bash
git clone https://github.com/AniketJoshi/github-agent-desktop.git
cd github-agent-desktop
pnpm install
cp .env.example .env
pnpm dev             # hack away
pnpm test            # before you push
```

---

## Roadmap

- [ ] **v0.1** — Current: Ask, Plan, Agent with GitHub OAuth + Models + Copilot SDK
- [ ] **v0.2** — Session history persistence, conversation export, file context improvements
- [ ] **v0.3** — BYOK Ask/Plan, then BYOK Agent mode once provider routing is stable
- [ ] **v0.4** — MCP tool support, custom tool definitions
- [ ] **v0.5** — Multi-workspace support, project switching
- [ ] **v1.0** — Stable release with auto-update

---

## License

[MIT](LICENSE) — use it, fork it, ship it.

---

<div align="center">

**Built by [Aniket Joshi](https://github.com/AniketJoshi) and contributors.**

Not affiliated with GitHub or Microsoft. GitHub, Copilot, and GitHub Models are trademarks of their respective owners.

</div>
