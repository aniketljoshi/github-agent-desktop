# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅         |
| < latest | ❌        |

## Reporting a Vulnerability

**Please do NOT open a public issue for security vulnerabilities.**

Instead, report vulnerabilities by emailing [SECURITY_EMAIL] with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Security Model

- **Context isolation**: `contextIsolation: true`, `nodeIntegration: false`
- **Token storage**: Uses Electron's `safeStorage` API for encrypted credential storage
- **Path traversal guard**: All file operations validated against workspace root
- **Shell risk classification**: Dangerous commands require explicit user approval
- **IPC validation**: All IPC inputs validated with Zod schemas
- **CSP**: Content Security Policy headers set on the renderer
- **No remote code execution**: No `eval()`, no `new Function()`, no remote module

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Token theft | safeStorage encryption, no plaintext storage |
| Path traversal | Workspace root boundary check |
| Command injection | Risk classifier + user approval gate |
| XSS via chat | React JSX auto-escapes, CSP headers |
| Malicious IPC | Zod schema validation on every handler |
