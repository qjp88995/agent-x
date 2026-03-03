# Agent-X

Self-hosted intelligent agent publishing platform.

## Project Structure

pnpm monorepo with Turborepo:
- `packages/server/` - NestJS 11 backend (TypeScript, Prisma v7, PostgreSQL)
- `packages/web/` - React 19 frontend (Vite, Tailwind CSS v4, shadcn/ui)
- `packages/shared/` - Shared TypeScript types

## Development

### Prerequisites
- Node.js 22
- pnpm 9.15.0
- PostgreSQL 16

### Setup
```bash
pnpm install
cp packages/server/.env.example packages/server/.env
# Edit .env with your database credentials
cd packages/server && npx prisma migrate dev && cd ..
```

### Dev Server
```bash
pnpm dev  # starts both frontend (5173) and backend (3000)
```

### Testing
```bash
pnpm test                    # run all tests
pnpm --filter @agent-x/server test  # server tests only
```

### Database
```bash
pnpm db:migrate   # run migrations
pnpm db:generate  # regenerate Prisma client
pnpm db:studio    # open Prisma Studio
```

## Architecture

### Backend Modules
- **Auth** - JWT authentication with refresh tokens
- **Provider** - Model provider management (OpenAI/Anthropic/Gemini) with encrypted API keys
- **Agent** - Agent CRUD with DRAFT/PUBLISHED/ARCHIVED lifecycle
- **Skill** - System and custom skills (Markdown)
- **MCP** - MCP server marketplace and custom servers
- **Chat** - Streaming chat with Vercel AI SDK orchestration
- **API Key** - External API key management
- **OpenAI Compat** - /v1/chat/completions endpoint

### Frontend
- Dashboard with sidebar navigation
- Provider, Agent, Skill, MCP server management pages
- Full-screen chat UI with streaming
- API key management with usage docs

## Docker Deployment
```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

## Conventions
- pnpm only (no npm/yarn)
- Commit messages: conventional commits (feat/fix/refactor/docs/test/chore)
- Tests: Jest for backend, 80%+ coverage target
- TypeScript strict mode
