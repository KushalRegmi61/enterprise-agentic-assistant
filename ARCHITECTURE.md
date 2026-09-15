# Architecture — enterprise-agentic-assistant

## Components

- **apps/agentic-assistant-web/** — Next.js chat UI (App Router, Tailwind, react-query, react-markdown). Talks to the agent backend on `NEXT_PUBLIC_AGENT_URL` (:8001).
- **services/agentic-assistant/** — FastAPI backend (`main.py`): ingestion (`POST /ingest`), auth (`POST /auth/login`, `WS /ask` tickets), projects + project-tokens, persistent `WS /ask` chat streaming LangGraph workflow events. LangGraph (`src/agent/graph/`: retrieve → grade → rewrite/generate → grounding) over `libs/rag`, LangFuse tracing optional.
- **libs/rag/** (`ai-saas-rag`) — importable retrieval engine (vectors + registry/cache, RBAC via caller-passed `AccessFilter`).
- **libs/auth/** (`ai-saas-auth`) — roles, password hashing, token mint/verify, user store helpers.
- **services/shared/** (`ai-saas-shared`) — zero-dependency pure primitives.

## Data stores

- Neon Postgres — assistant users, conversations/summaries, RAG registry + cache (`AGENTIC_ASSISTANT_DATABASE_URL`).
- Qdrant — vector index used via `libs/rag`.

## Deployment

- Local: `pnpm dev` (web :3001, agent :8001).
- Docker: `docker build -f services/agentic-assistant/Dockerfile .` (root context; workspace sources stay at `libs/*`, `services/*`).
- Railway: `services/agentic-assistant/railway.json` (Dockerfile builder, `/health` healthcheck). See `infra/railway/README.md`.
