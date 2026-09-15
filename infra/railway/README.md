# Railway Deployment — enterprise-agentic-assistant

## Services

### Agent API (FastAPI + LangGraph)
- **Root Directory**: repo root (builds from the uv workspace — needs `libs/*` + `services/shared` alongside `services/agentic-assistant`)
- **Builder**: Dockerfile at `services/agentic-assistant/Dockerfile`
- **Healthcheck**: `/health`
- **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT` (see `services/agentic-assistant/railway.json`)

Set on the agent service (`AGENTIC_ASSISTANT_*`, `OPENAI_*`, `LANGFUSE_*` — see `.env.example`):
`OPENAI_API_KEY`, `AGENTIC_ASSISTANT_SERVICE_TOKEN`, `AGENTIC_ASSISTANT_DATABASE_URL`,
`AGENTIC_ASSISTANT_JWT_SECRET`, `AGENTIC_ASSISTANT_TENANT`, model route vars.

### Assistant Web (Next.js)
- **Root Directory**: `apps/agentic-assistant-web`
- **Build**: `pnpm install --frozen-lockfile && pnpm build:assistant-web`
- **Start**: `pnpm start`
- **Env**: `NEXT_PUBLIC_AGENT_URL` → agent service URL.
