# Agent-X

Self-hosted intelligent agent publishing platform with model provider management, MCP/Skills configuration, Chat UI, Workspace IDE, and OpenAI-compatible API access.

## Project Structure

pnpm monorepo with Turborepo:

```
packages/
├── server/          # NestJS 11 backend (TypeScript, Prisma v7, PostgreSQL)
├── web/             # React 19 frontend (Vite 6, Tailwind CSS v4, shadcn/ui)
├── shared/          # Shared TypeScript types (DTOs, responses, enums)
├── ui/              # Design system (@agent-x/design)
└── docker/          # Dockerfile.server, Dockerfile.web, nginx.conf
```

## Development

### Prerequisites

- Node.js 22 (see .nvmrc)
- pnpm 9.15.0
- PostgreSQL 16

### Setup

```bash
pnpm install
cp packages/server/.env.example packages/server/.env
# Edit .env with your database credentials
cd packages/server && npx prisma migrate dev && cd ../..
```

### Dev Server

```bash
pnpm dev  # starts both frontend (:5173) and backend (:3000) via Turborepo
```

### Monorepo Scripts (root)

```bash
pnpm dev          # turbo dev (frontend + backend)
pnpm build        # turbo build
pnpm lint         # turbo lint
pnpm test         # turbo test
pnpm typecheck    # turbo typecheck (tsc --noEmit)
pnpm db:migrate   # run prisma migrate dev (server)
pnpm db:generate  # run prisma generate (server)
pnpm db:studio    # open prisma studio
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

## Docker Deployment

```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

Docker setup:

- `docker/Dockerfile.server` - Multi-stage build (node:22-alpine + pnpm)
- `docker/Dockerfile.web` - Multi-stage build (Vite → nginx:alpine)
- `docker/nginx.conf` - Reverse proxy: `/api/` and `/v1/` → server:3000, SPA fallback
- Services: postgres (16-alpine), server (:3000), web (:80)

### Docker Production Environment Variables (`.env`)

- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL credentials
- `JWT_SECRET`, `ENCRYPTION_SECRET` - Security secrets
- `PORT` - Exposed web port (default: 80)

## Agent Teams

When a task involves code changes across 2 or more packages, automatically use Agent Teams to parallelize work:

| Package path                           | Teammate | Agent definition             |
| -------------------------------------- | -------- | ---------------------------- |
| `packages/server/`, `packages/shared/` | backend  | `.claude/agents/backend.md`  |
| `packages/ui/`                         | design   | `.claude/agents/design.md`   |
| `packages/web/`                        | frontend | `.claude/agents/frontend.md` |

- If only one package is involved, work directly without creating a team
- Teammates communicate via SendMessage when coordination is needed (e.g., frontend needs a new component from design, backend changes shared types that affect frontend)
- Each teammate only modifies files within its own scope

## Component Extraction Rule

When writing frontend page components (`packages/web/`), always evaluate whether a component could be extracted as a reusable design system component in `@agent-x/design` (`packages/ui/`). If it can, notify the **design** teammate via SendMessage to implement it there first, then consume it from `@agent-x/design`.

## Conventions

- Minimum font size: 12px (`text-xs`). Never use `text-[10px]` or smaller — Chrome in Chinese locale enforces 12px minimum, causing inconsistent rendering across languages.
- pnpm only (no npm/yarn)
- Commit messages in English: conventional commits (feat/fix/refactor/docs/test/chore)
- Tests: Jest for backend, TDD approach
- TypeScript strict mode in all packages
- Immutable data patterns (create new objects, don't mutate)
- Backend API prefix: `/api` (except `/v1/chat/completions`)
- Frontend dev proxy: Vite proxies `/api` and `/v1` to backend (:3000)
- Pre-commit: lint-staged (Prettier + ESLint) via Husky
