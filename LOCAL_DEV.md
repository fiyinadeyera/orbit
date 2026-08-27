# Running Orbit locally

The backend (API + Postgres + AI keys) is shared by both the web app and the
mobile app, so set it up once.

## Prerequisites

- Node 24+ and pnpm (`npm install -g pnpm`)
- A Postgres database (this project uses hosted Neon)
- Anthropic API key (note extraction) and OpenAI API key (voice transcription)

## First-time setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create your env file from the template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   `.env` is gitignored. Never commit real keys.
3. Create the database tables (pushes the Drizzle schema to `DATABASE_URL`):
   ```bash
   set -a; source .env; set +a
   pnpm --filter @workspace/db run push
   ```

## Run

- API server (port 5000):
  ```bash
  ./run-api.sh
  ```
- Web app (port 5173, proxies `/api` to the API server):
  ```bash
  ./run-web.sh
  ```
- Health check:
  ```bash
  curl http://localhost:5000/api/healthz
  ```

## Mobile app (Expo)

The mobile app lives in `artifacts/orbit-mobile` and talks to the same API.
Point it at the API with `EXPO_PUBLIC_DOMAIN` (a host the phone can reach, e.g.
your Mac's LAN IP or an Expo tunnel), then:
```bash
pnpm --filter @workspace/orbit-mobile run dev
```

## Notes

- Replit-specific config (`.replit`, Replit Vite plugins) is kept but auto-
  disables locally (the plugins are gated on `REPL_ID`, and the `/api` Vite
  proxy only activates when `REPL_ID` is unset).
