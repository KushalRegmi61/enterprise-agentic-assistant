#!/bin/sh
# Pick a free agent port, wire CORS + the web-side agent URL, then hand off to
# concurrently. Next.js handles its own port fallback natively.
set -e

HERE="$(dirname "$0")"
AGENT_PORT="$(node "$HERE/pick-port.mjs" 8001)"

if [ "$AGENT_PORT" != "8001" ]; then
  printf '\n⚠  Agent on http://localhost:%s (8001 was busy)\n\n' "$AGENT_PORT"
fi

export AGENT_PORT
export NEXT_PUBLIC_AGENT_URL="http://localhost:$AGENT_PORT"
# Dev-only: accept any localhost:<port> origin so the web side works
# regardless of which port `next dev` lands on. Never set in prod.
export AGENTIC_ASSISTANT_CORS_ORIGINS='["http://localhost:3000", "http://localhost:3001"]'

exec pnpm exec concurrently \
  --kill-others-on-fail \
  --names assistant-web,agent \
  --prefix-colors blue,green \
  "pnpm dev:assistant-web" "pnpm dev:agent"
