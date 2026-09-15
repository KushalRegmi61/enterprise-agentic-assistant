# AGENTS.md — enterprise-agentic-assistant

## Repository Map

```
apps/agentic-assistant-web/  Next.js chat UI
services/agentic-assistant/  FastAPI + LangGraph agent backend
libs/rag/                    Shared RAG retrieval engine
libs/auth/                   Shared identity primitives
services/shared/             Shared pure-Python primitives
scripts/ci/                  Affected-project detection for CI
```

## Commands

```bash
pnpm dev               # assistant-web + agent
pnpm dev:assistant-web # frontend only (:3001)
pnpm dev:agent         # backend only (:8001)
pnpm lint:assistant-web / pnpm build:assistant-web / pnpm typecheck:assistant-web
.venv/bin/ruff check services/agentic-assistant libs/rag libs/auth services/shared
.venv/bin/python -m pytest services/agentic-assistant libs/rag libs/auth services/shared
```

## Invariants

- Backend layering per service README; no cross-layer backward imports.
- `apps/agentic-assistant-web/src/components/ui/` generated — never edit directly.
- Structured logging only, no `print()`. Files under 300 lines. Tests + docs with every change.
