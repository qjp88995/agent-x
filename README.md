# Agent-X

Self-hosted intelligent agent publishing platform. Create, configure, and publish AI agents with multi-provider support, MCP tools, custom skills, and an OpenAI-compatible API.

## Features

- **Multi-Provider Support** - Connect OpenAI, Anthropic, Gemini, DeepSeek, Qwen, Zhipu, Moonshot with unified management
- **Agent Lifecycle** - Create, configure, publish, and archive agents with version control
- **MCP Integration** - Browse marketplace and add custom MCP servers (STDIO/SSE/Streamable HTTP)
- **Skills Marketplace** - Admin-curated system skills + user custom skills for agents
- **Streaming Chat UI** - Real-time conversation interface with multi-part message rendering
- **OpenAI-Compatible API** - Expose agents via `/v1/chat/completions` endpoint with API key auth
- **Secure by Default** - JWT auth, AES-256-GCM encrypted provider keys, API key management

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Backend  | NestJS 11, TypeScript, Prisma v7, PostgreSQL 16               |
| Frontend | React 19, Vite 6, Tailwind CSS v4, shadcn/ui, React Router v7 |
| AI       | Vercel AI SDK, 7 provider protocols                           |
| State    | Zustand v5, TanStack React Query v5                           |
| Infra    | Docker, nginx, Turborepo, pnpm                                |

## Quick Start (Docker)

```bash
git clone https://github.com/your-org/agent-x.git
cd agent-x
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, ENCRYPTION_SECRET
docker compose up -d
```

Open `http://localhost` to access the web UI.

## Development Setup

### Prerequisites

- Node.js 22
- pnpm 9.15.0
- PostgreSQL 16

### Install & Run

```bash
# Install dependencies
pnpm install

# Configure environment
cp packages/server/.env.example packages/server/.env
# Edit packages/server/.env with your database credentials

# Run database migrations
cd packages/server && npx prisma migrate dev && cd ../..

# Start dev servers (frontend :5173 + backend :3000)
pnpm dev
```

### Useful Commands

```bash
pnpm dev            # Start all dev servers
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm typecheck      # Type check all packages
pnpm lint           # Lint all packages
pnpm format         # Format code with Prettier

# Database
pnpm db:migrate     # Run migrations
pnpm db:generate    # Regenerate Prisma client
pnpm db:studio      # Open Prisma Studio
```

## Project Structure

```
agent-x/
├── packages/
│   ├── server/          # NestJS backend
│   │   ├── prisma/      # Database schema & migrations
│   │   └── src/modules/ # auth, provider, agent, skill, mcp, chat, api-key, openai-compat
│   ├── web/             # React frontend
│   │   └── src/
│   │       ├── pages/       # login, register, dashboard/*, chat
│   │       ├── components/  # chat, auth, ui (shadcn)
│   │       ├── hooks/       # React Query hooks
│   │       └── stores/      # Zustand stores
│   └── shared/          # Shared TypeScript types & DTOs
├── docker/              # Dockerfiles & nginx config
├── docker-compose.yml   # Production deployment
└── turbo.json           # Turborepo pipeline
```

## API Overview

All backend routes are prefixed with `/api` except the OpenAI-compatible endpoint.

| Module        | Endpoints                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`                                                            |
| Providers     | `GET/POST /api/providers`, `GET/PUT/DELETE /api/providers/:id`, `POST /api/providers/:id/test`, `POST /api/providers/:id/sync-models`                      |
| Agents        | `GET/POST /api/agents`, `GET/PUT/DELETE /api/agents/:id`, `POST /api/agents/:id/publish`, `POST /api/agents/:id/archive`                                   |
| Skills        | `GET /api/skills/market`, `POST/PUT/DELETE /api/skills/market(/:id)` (admin), `GET/POST /api/skills`, `GET/PUT/DELETE /api/skills/:id`                     |
| MCP Servers   | `GET /api/mcp-servers/market`, `POST/PUT/DELETE /api/mcp-servers/market(/:id)` (admin), `GET/POST /api/mcp-servers`, `GET/PUT/DELETE /api/mcp-servers/:id` |
| Chat          | `POST/GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/chat`                                                   |
| API Keys      | `GET/POST /api/api-keys`, `DELETE /api/api-keys/:id`                                                                                                       |
| OpenAI Compat | `POST /v1/chat/completions`                                                                                                                                |

## OpenAI-Compatible API

Expose any published agent as an OpenAI-compatible endpoint:

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-agx-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-agent-id",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## Environment Variables

### Local Development (`packages/server/.env`)

| Variable                 | Description                  | Default                 |
| ------------------------ | ---------------------------- | ----------------------- |
| `DATABASE_URL`           | PostgreSQL connection string | —                       |
| `JWT_SECRET`             | JWT signing secret           | —                       |
| `JWT_EXPIRES_IN`         | Access token expiry          | `7d`                    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry         | `30d`                   |
| `ENCRYPTION_SECRET`      | AES-256-GCM key (32 chars)   | —                       |
| `PORT`                   | Server port                  | `3000`                  |
| `CORS_ORIGIN`            | Allowed CORS origin          | `http://localhost:5173` |
| `AI_SDK_TELEMETRY`       | Enable OpenTelemetry tracing | `false`                 |

### Docker Production (`.env`)

| Variable            | Description                | Default   |
| ------------------- | -------------------------- | --------- |
| `DB_NAME`           | Database name              | `agent_x` |
| `DB_USER`           | Database user              | `agent_x` |
| `DB_PASSWORD`       | Database password          | —         |
| `JWT_SECRET`        | JWT signing secret         | —         |
| `ENCRYPTION_SECRET` | AES-256-GCM key (32 chars) | —         |
| `PORT`              | Exposed web port           | `80`      |

## License

MIT
