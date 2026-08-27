#!/bin/bash
# Local dev: load .env and start the Orbit web app on its own port (default 5173).
# The web app proxies /api to the API server (API_PROXY_TARGET, default http://localhost:5000).
set -euo pipefail
cd "$(dirname "$0")"
set -a
[ -f .env ] && source .env
set +a
export PORT="${WEB_PORT:-5173}"
export BASE_PATH="${BASE_PATH:-/}"
export API_PROXY_TARGET="${API_PROXY_TARGET:-http://localhost:5000}"
exec pnpm --filter @workspace/orbit run dev
