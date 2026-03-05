# Agent-X

Self-hosted intelligent agent publishing platform with model provider management, MCP/Skills configuration, Chat UI, and OpenAI-compatible API access.

## Project Structure

pnpm monorepo with Turborepo:

```
packages/
├── server/          # NestJS 11 backend (TypeScript, Prisma v7, PostgreSQL)
│   ├── docker/      # Dockerfile.server, Dockerfile.web, nginx.conf
│   ├── prisma/      # Schema and migrations
│   ├── prisma.config.ts  # Prisma v7 CLI config (datasource URL, PrismaPg adapter)
│   └── src/
│       ├── common/         # Shared utilities (crypto.util.ts, request-logger.middleware.ts)
│       ├── generated/prisma/  # Generated Prisma client (gitignored)
│       ├── prisma/         # PrismaModule (global)
│       ├── telemetry.ts    # OpenTelemetry SDK (opt-in via AI_SDK_TELEMETRY=true)
│       └── modules/
│           ├── auth/       # JWT auth, guards, decorators (@Public, @CurrentUser)
│           ├── provider/   # Model provider CRUD + encryption + model sync
│           ├── agent/      # Agent lifecycle (DRAFT→PUBLISHED→ARCHIVED), skill/mcp binding
│           ├── skill/      # System/custom skills management
│           ├── mcp/        # MCP server marketplace + custom servers + client
│           ├── chat/       # Streaming chat (Vercel AI SDK) + AgentRuntimeService
│           ├── api-key/    # API key management (sk-agx-... prefix)
│           └── openai-compat/  # /v1/chat/completions (OpenAI wire format)
├── web/             # React 19 frontend (Vite 6, Tailwind CSS v4, shadcn/ui)
│   └── src/
│       ├── components/     # UI components (chat/, auth/, ui/)
│       ├── hooks/          # React Query hooks (use-agents, use-chat, use-chat-stream, etc.)
│       ├── pages/          # Route pages (login, register, dashboard/*, chat/)
│       ├── stores/         # Zustand v5 stores (auth-store)
│       └── lib/            # Utilities (api.ts with auth interceptor, utils.ts)
└── shared/          # Shared TypeScript types (DTOs, responses, enums)
    └── src/types/   # auth, provider, agent, skill, mcp, chat, api-key
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

### Testing

```bash
cd packages/server && npx jest            # all backend tests
cd packages/server && npx jest -- auth    # specific module
cd packages/server && npx jest --coverage # with coverage
```

### Database

```bash
cd packages/server
npx prisma migrate dev --name <name>  # create migration
npx prisma generate                    # regenerate client
npx prisma studio                      # visual editor
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

## Key Technical Details

### Prisma v7

- Config file: `packages/server/prisma.config.ts` (NOT inside prisma/)
- Schema: `packages/server/prisma/schema.prisma`
- Generated client: `packages/server/src/generated/prisma/client` (import from here)
- Uses `PrismaPg` adapter (NOT url-based connection)
- Datasource URL is in prisma.config.ts, NOT in schema.prisma

### AI SDK Integration

- `AgentRuntimeService` (`chat/agent-runtime.service.ts`) uses Vercel AI SDK `streamText`
- Supports 7 provider protocols: OpenAI, Anthropic, Gemini, DeepSeek, Qwen (Alibaba), Zhipu, Moonshot
- Skills content is concatenated into the system prompt
- Chat streaming uses `pipeTextStreamToResponse()` server-side
- Client-side streaming via native `fetch` + `ReadableStream` in `useChatStream` hook

### Auth

- Global AuthGuard (JWT) applied via APP_GUARD
- Use `@Public()` decorator to bypass auth on specific endpoints
- Use `@CurrentUser()` decorator to get `{ id, email }` from request
- API keys (sk-agx-...) use separate ApiKeyGuard for /v1/ endpoints
- Tokens stored in localStorage, auto-refresh on 401 via Axios interceptor

### Provider API Keys

- Encrypted with AES-256-GCM via `src/common/crypto.util.ts`
- Encryption secret from `ENCRYPTION_SECRET` env var

### Frontend Patterns

- **Design standards (colors, spacing, layout widths, component conventions) are in `packages/web/DESIGN.md`**
- React Router v7 for routing
- All dashboard pages lazy-loaded via `React.lazy()`
- React Query v5 hooks in `src/hooks/` for all API calls
- Zustand v5 for auth state (`auth-store.ts`)
- shadcn/ui components (Radix UI) in `src/components/ui/`
- Axios client at `src/lib/api.ts` with auth interceptors + token refresh
- Dashboard routes inside `DashboardLayout`, chat is full-screen outside
- Pre-commit: lint-staged (Prettier + ESLint) via Husky

### API Routes

- Backend API prefix: `/api` (except `/v1/chat/completions`)
- Frontend dev proxy: Vite proxies `/api` and `/v1` to backend (:3000)

### Frontend Routes

- `/login`, `/register` - public auth pages
- `/` → redirects to `/providers`
- `/providers` - provider list, `/providers/new`, `/providers/:id/edit`
- `/agents` - agent list, `/agents/new`, `/agents/:id/edit`
- `/skills` - skills list, `/skills/new`, `/skills/:id/edit`
- `/mcp-servers` - MCP server list, `/mcp-servers/new`, `/mcp-servers/:id/edit`
- `/api-keys` - API key management
- `/chat` - full-screen chat UI (outside dashboard layout)

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

## Environment Variables

### Local Dev (`packages/server/.env`)

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Access token expiry (default: 7d)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: 30d)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)
- `ENCRYPTION_SECRET` - AES-256-GCM key for provider API keys (32 chars)
- `AI_SDK_TELEMETRY` - Enable OpenTelemetry tracing (optional, set to `true`)
- `OTLP_ENDPOINT` - OTLP HTTP endpoint for traces (default: http://localhost:4318/v1/traces)

### Docker Production (`.env`)

- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL credentials
- `JWT_SECRET`, `ENCRYPTION_SECRET` - Security secrets
- `PORT` - Exposed web port (default: 80)

## Conventions

- pnpm only (no npm/yarn)
- Commit messages in English: conventional commits (feat/fix/refactor/docs/test/chore)
- Tests: Jest for backend, TDD approach
- TypeScript strict mode in all packages
- Immutable data patterns (create new objects, don't mutate)
- **NEVER use `npx prisma db push`** to modify the database directly. Always use `npx prisma migrate dev --name <name>` to create proper migrations.

# currentDate

Today's date is 2026-03-04.
