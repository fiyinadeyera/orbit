#!/bin/bash
# Local dev: load .env and start the Orbit API server (port from .env, default 5000).
set -euo pipefail
cd "$(dirname "$0")"
set -a
[ -f .env ] && source .env
set +a
: "${PORT:=5000}"
export PORT
exec pnpm --filter @workspace/api-server run dev
