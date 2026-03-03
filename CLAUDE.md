# Agent-X

Self-hosted intelligent agent publishing platform with model provider management, MCP/Skills configuration, Chat UI, and OpenAI-compatible API access.

## Project Structure

pnpm monorepo with Turborepo:

```
packages/
├── server/          # NestJS 11 backend (TypeScript, Prisma v7, PostgreSQL)
│   ├── prisma/      # Schema and migrations
│   ├── prisma.config.ts  # Prisma v7 CLI config (datasource URL)
│   └── src/
│       ├── common/         # Shared utilities (crypto.util.ts)
│       ├── generated/prisma/  # Generated Prisma client (gitignored)
│       ├── prisma/         # PrismaModule (global)
│       └── modules/
│           ├── auth/       # JWT auth, guards, decorators
│           ├── provider/   # Model provider CRUD + encryption
│           ├── agent/      # Agent lifecycle (DRAFT→PUBLISHED→ARCHIVED)
│           ├── skill/      # System/custom skills
│           ├── mcp/        # MCP server marketplace + custom
│           ├── chat/       # Streaming chat + AgentRuntimeService
│           ├── api-key/    # API key management
│           └── openai-compat/  # /v1/chat/completions
├── web/             # React 19 frontend (Vite, Tailwind CSS v4, shadcn/ui)
│   └── src/
│       ├── components/     # UI components (chat/, auth/, ui/)
│       ├── hooks/          # React Query hooks (use-agents, use-chat, etc.)
│       ├── pages/          # Route pages (dashboard/, chat/)
│       ├── stores/         # Zustand stores (auth-store)
│       └── lib/            # Utilities (api.ts, utils.ts)
└── shared/          # Shared TypeScript types (DTOs, responses, enums)
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
npx prisma db push                     # push schema without migration
```

### Type Checking
```bash
cd packages/server && npx tsc --noEmit  # backend
cd packages/web && npx tsc --noEmit     # frontend
```

## Key Technical Details

### Prisma v7
- Config file: `packages/server/prisma.config.ts` (NOT inside prisma/)
- Schema: `packages/server/prisma/schema.prisma`
- Generated client: `packages/server/src/generated/prisma/client` (import from here)
- Uses `PrismaPg` adapter (NOT url-based connection)
- Datasource URL is in prisma.config.ts, NOT in schema.prisma

### Auth
- Global AuthGuard (JWT) applied via APP_GUARD
- Use `@Public()` decorator to bypass auth on specific endpoints
- Use `@CurrentUser()` decorator to get `{ id, email }` from request
- API keys (sk-agx-...) use separate ApiKeyGuard for /v1/ endpoints

### Provider API Keys
- Encrypted with AES-256-GCM via `src/common/crypto.util.ts`
- Encryption secret from `ENCRYPTION_SECRET` env var

### Frontend Patterns
- All pages lazy-loaded via `React.lazy()`
- React Query hooks in `src/hooks/` for API calls
- Zustand for auth state
- shadcn/ui components in `src/components/ui/`
- Axios client at `src/lib/api.ts` with auth interceptors
- Dashboard routes inside `DashboardLayout`, chat is full-screen outside

### API Routes
- Backend API prefix: `/api` (except `/v1/chat/completions`)
- Frontend dev proxy: Vite proxies `/api` and `/v1` to backend (:3000)

## Docker Deployment
```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

## Conventions
- pnpm only (no npm/yarn)
- Commit messages in English: conventional commits (feat/fix/refactor/docs/test/chore)
- Tests: Jest for backend, TDD approach
- TypeScript strict mode in all packages
- Immutable data patterns (create new objects, don't mutate)
