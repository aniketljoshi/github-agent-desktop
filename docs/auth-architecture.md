# Desktop Auth Service Architecture

This project supports two OAuth shapes:

1. Local development loopback auth in the Electron main process
2. Production-style backend auth through `auth-service/`

## Production-style flow

1. The desktop app opens the browser to:
   - `GET /auth/github/start?return_to=github-agent://auth/callback`
2. The auth service redirects to GitHub OAuth
3. GitHub redirects back to:
   - `GET /auth/github/callback`
4. The auth service exchanges the GitHub code for a user token using the OAuth app secret
5. The auth service creates a short-lived one-time grant
6. The auth service redirects the browser back to:
   - `github-agent://auth/callback?grant=<grant>`
7. Electron catches the custom protocol callback
8. Electron calls:
   - `POST /auth/exchange`
9. Electron stores the returned `gho_` token securely and updates renderer auth state

## Local development

The desktop app still supports the local loopback flow using:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL=http://127.0.0.1:48163/callback`

## Backend configuration

Auth service variables live in `auth-service/.env` or `auth-service/.env.local`:

- `PORT`
- `APP_BASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `DESKTOP_PROTOCOL`
- `STATE_TTL_SECONDS`
- `GRANT_TTL_SECONDS`

Desktop app variables:

- `GITHUB_AUTH_SERVICE_URL`
- `DESKTOP_AUTH_CALLBACK_URL`

## Notes

- The desktop app should use backend auth in shared or production environments.
- The local loopback flow remains useful for development and private testing.
- The backend keeps the GitHub OAuth client secret off the desktop binary.
