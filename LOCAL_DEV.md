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
It uses iOS 26 native tabs + liquid glass (`expo-glass-effect`,
`expo-router/unstable-native-tabs`), so it needs a real dev build. Expo Go
cannot run it.

API URL: the app reads `EXPO_PUBLIC_API_URL` (set in
`artifacts/orbit-mobile/.env.local`). The iOS Simulator reaches the Mac API on
`http://localhost:5001`; a physical iPhone on the same Wi-Fi needs the Mac's LAN
IP (e.g. `http://192.168.1.171:5001`).

### Run in the iOS Simulator (recommended local path)

Requires **full Xcode** (Mac App Store, ~7GB) and CocoaPods (`brew install cocoapods`).

```bash
# 1. make sure the API is running
./run-api.sh
# 2. build + launch the app in the Simulator (first run also does pod install)
pnpm --filter @workspace/orbit-mobile run ios
```

`expo run:ios` generates the native `ios/` project, installs pods, builds, and
boots the Simulator. Subsequent JS changes hot-reload; native/dependency changes
need another `run ios`.

### Ship to a real iPhone / the App Store (later)

Needs an Expo account and an Apple Developer account ($99/yr). Use EAS:
`eas build --profile development --platform ios` for on-device testing, then
`eas build --profile production` + `eas submit` for the store.

The Replit `dev` script (`pnpm --filter @workspace/orbit-mobile run dev`) is
Replit-only (it depends on `REPLIT_*` env vars) and won't run locally.

## Second machine (your other Mac)

The code is on GitHub and the database is on Neon, so your **data is shared
automatically** across both Macs. Only secrets and local build artifacts need
recreating, because they are gitignored on purpose (`.env`, `.neon`,
`.env.local`, `ios/`).

1. Prereqs: Node 24+, `npm install -g pnpm`, and for mobile: Xcode +
   `brew install cocoapods`.
2. Clone and install:
   ```bash
   git clone https://github.com/fiyinadeyera/orbit.git
   cd orbit && pnpm install
   ```
3. Recreate `.env` (never committed):
   ```bash
   cp .env.example .env
   # Database (same Neon project = same data as your other Mac):
   neon auth
   neon link --org-id org-shiny-sky-21291946 --project-id holy-shape-34186635
   neon checkout production        # pulls DATABASE_URL into .env
   ```
   Then edit `.env`: set `PORT=5001` and paste your Anthropic + OpenAI keys.
   (Fastest alternative: AirDrop the `.env` from this Mac. Never commit it.)
4. Mobile only: create `artifacts/orbit-mobile/.env.local` with
   `EXPO_PUBLIC_API_URL=http://localhost:5001`.
5. Run: `./run-api.sh`, and for mobile
   `LANG=en_US.UTF-8 pnpm exec expo run:ios --device "iPhone 17 Pro"`.

Two-machine git hygiene: `git pull` before you start working, and push when you
finish, so the two clones do not drift.

## Notes

- Replit-specific config (`.replit`, Replit Vite plugins) is kept but auto-
  disables locally (the plugins are gated on `REPL_ID`, and the `/api` Vite
  proxy only activates when `REPL_ID` is unset).
