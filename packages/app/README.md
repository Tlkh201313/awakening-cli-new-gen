# Awakened Web App

SolidJS web application for the Awakened AI coding assistant.

## Local Development

The app requires a running Awakened backend server.

1. **Start the backend** (from `packages/awakened`):

   ```bash
   bun run --conditions=browser ./src/index.ts serve --port 4096
   ```

2. **Start the app dev server** (from `packages/app`):

   ```bash
   bun dev -- --port 4444
   ```

3. Open `http://localhost:4444` — it targets the backend at `http://localhost:4096`.

> **Note:** `awakened dev web` proxies `https://app.awakened.ai`, so local UI/CSS changes will not show there. Use the separate dev servers above for local development.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start Vite dev server |
| `bun run build` | Build for production to `dist/` |
| `bun run test:e2e:local` | Run Playwright E2E tests |

## E2E Testing

Playwright starts the Vite dev server automatically via `webServer`, and UI tests expect an awakened backend at `localhost:4096` by default.

```bash
bunx playwright install chromium
bun run test:e2e:local
bun run test:e2e:local -- --grep "settings"
```

Environment options:

- `PLAYWRIGHT_SERVER_HOST` / `PLAYWRIGHT_SERVER_PORT` — backend address (default: `localhost:4096`)
- `PLAYWRIGHT_PORT` — Vite dev server port (default: `3000`)
- `PLAYWRIGHT_BASE_URL` — override base URL (default: `http://localhost:<PLAYWRIGHT_PORT>`)
