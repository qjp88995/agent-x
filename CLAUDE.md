# Agent-X

Self-hosted intelligent agent publishing platform with model provider management, MCP/Skills configuration, Chat UI, Workspace IDE, and OpenAI-compatible API access.

## Project Structure

pnpm monorepo with Turborepo:

```
packages/
├── server/          # NestJS 11 backend (TypeScript, Prisma v7, PostgreSQL)
│   ├── prisma/      # Schema and migrations
│   ├── prisma.config.ts  # Prisma v7 CLI config (datasource URL, PrismaPg adapter)
│   └── src/
│       ├── common/         # Shared utilities (crypto.util.ts, ai-provider.util.ts, request-logger.middleware.ts)
│       ├── generated/prisma/  # Generated Prisma client (gitignored)
│       ├── prisma/         # PrismaModule (global)
│       ├── telemetry.ts    # OpenTelemetry SDK (opt-in via AI_SDK_TELEMETRY=true)
│       └── modules/
│           ├── auth/       # JWT auth, guards, decorators (@Public, @CurrentUser)
│           ├── provider/   # Model provider CRUD + encryption + model sync
│           ├── agent/      # Agent lifecycle (ACTIVE→ARCHIVED), skill/mcp binding, versions, share tokens
│           ├── skill/      # Skill marketplace (admin) + custom skills management
│           ├── mcp/        # MCP server marketplace + custom servers + client
│           ├── prompt/     # Prompt template library (marketplace + custom CRUD, categories)
│           ├── chat/       # Streaming chat (Vercel AI SDK) + AgentRuntimeService + StreamManager
│           │   └── tools/  # Built-in tools: workspace file ops (14 tools), getCurrentTime
│           ├── workspace/  # Workspace file management (CRUD, disk storage, path validation)
│           ├── public-chat/ # Public shared chat via share tokens (@Public endpoints)
│           ├── preferences/ # User preferences (theme, language) CRUD
│           ├── api-key/    # API key management (sk-agx-... prefix)
│           ├── openai-compat/  # /v1/chat/completions (OpenAI wire format)
│           ├── user/       # User management (admin): list, create, role/status update, password reset
│           └── system-config/  # System-level provider management + feature config + AI-powered features (admin)
├── web/             # React 19 frontend (Vite 6, Tailwind CSS v4, shadcn/ui)
│   └── src/
│       ├── components/     # UI components
│       │   ├── chat/       # Chat panel, message list, message items, chat input
│       │   ├── workspace/  # Workspace panel, file tree, file editor, file change card
│       │   ├── agents/     # Agent forms, cards, test chat panel
│       │   ├── shared/     # Reusable form components (form-card, page-header, prompt-editor, etc.)
│       │   ├── users/      # User management components (create-user-dialog)
│       │   ├── auth/       # Protected route, login/register forms
│       │   └── ui/         # shadcn/ui primitives (button, dialog, input, etc.)
│       ├── contexts/       # React contexts (workspace-api-context for auth/public API switching)
│       ├── hooks/          # React Query hooks (use-agents, use-chat, use-workspace, etc.)
│       ├── i18n.ts         # i18next config + changeLanguage() wrapper with sync option
│       ├── locales/        # Translation files (en.json, zh.json)
│       ├── pages/          # Route pages (login, register, dashboard/*, chat/, shared/)
│       ├── stores/         # Zustand v5 stores (auth-store, theme-store)
│       └── lib/            # Utilities
│           ├── api.ts              # Axios client with auth interceptor + token refresh
│           ├── public-api.ts       # Unauthenticated Axios client for public endpoints
│           ├── chat-transport.ts   # Authenticated chat streaming transport
│           ├── shared-chat-transport.ts  # Public chat streaming transport
│           ├── message-utils.ts    # Backend MessageResponse[] → AI SDK UIMessage[] conversion
│           ├── stream-parser.ts    # SSE stream parsing utilities
│           ├── workspace-utils.ts  # Extract file changes from AI tool calls
│           ├── sync-preferences.ts # Centralized backend preference sync (persistPreference)
│           ├── utils.ts            # General utilities (cn, etc.)
│           └── schemas/            # Zod validation schemas (agent, provider, skill, mcp, api-key, user)
├── shared/          # Shared TypeScript types (DTOs, responses, enums)
│   └── src/types/   # auth, provider, agent, agent-version, skill, mcp, chat, api-key, share-token, workspace, preferences, system-config, user
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
- Generated client: `packages/server/src/generated/prisma` (import `client` from here, e.g. `from '../../generated/prisma/client'`)
- Uses `PrismaPg` adapter (NOT url-based connection)
- Datasource URL is in prisma.config.ts, NOT in schema.prisma

### AI SDK Integration

- `AgentRuntimeService` (`chat/agent-runtime.service.ts`) uses Vercel AI SDK `streamText`
- Supports 7 provider protocols: OpenAI, Anthropic, Gemini, DeepSeek, Qwen (Alibaba), Zhipu, Moonshot
- Common AI provider utilities in `src/common/ai-provider.util.ts`:
  - `createLanguageModel(protocol, baseUrl, apiKey, modelId)` — unified model creation for all 7 protocols
  - `getThinkingProviderOptions(protocol, enabled, maxTokens)` — per-provider thinking/reasoning config
  - `clampTemperature(protocol, temperature)` — clamp to provider limits (Zhipu/Moonshot: 0-1, others: 0-2)
  - `getDefaultModelId(protocol)` — default lightweight model per protocol (for connection tests)
- Thinking/reasoning support per provider:
  - Anthropic/DeepSeek/Moonshot/Zhipu: `thinking: { type: 'enabled'|'disabled' }` (with `budgetTokens` for Anthropic/Moonshot)
  - Qwen (Alibaba): `enableThinking: true|false` + `thinkingBudget`
  - Gemini: `thinkingConfig: { includeThoughts, thinkingBudget }` (enabled only; no explicit disable needed)
  - OpenAI: no explicit thinking config (reasoning models handle it natively)
- Use `generateText` + `Output.object()` for structured output (NOT deprecated `generateObject`)
- Skills content is concatenated into the system prompt
- Chat streaming uses `pipeUIMessageStreamToResponse()` server-side with `StreamManagerService` for buffered replay
- Client-side streaming via native `fetch` + `ReadableStream` in `use-chat` and `use-shared-chat` hooks
- Chat history rendering unified via `MessageList` component (`components/chat/message-list.tsx`)
- Backend `MessageResponse[]` → AI SDK `UIMessage[]` conversion via `toUIMessages()` (`lib/message-utils.ts`)

### Chat Tools

Built-in tools available to agents during chat (defined in `chat/tools/`):

- **Workspace tools** (14): createFile, readFile, updateFile, deleteFile, writeFiles (atomic batch), fileExists, fileInfo, readFileLines, listFiles, searchFiles, patchFile, renameFile, createDirectory, deleteDirectory, renameDirectory
- **Utility tools**: getCurrentTime (with timezone support)

### Workspace

- File storage on disk at `data/workspaces/{conversationId}/` (configurable via `WORKSPACE_BASE_DIR`)
- Database tracks metadata in `WorkspaceFile` model (path, mimeType, size, isDirectory)
- Path validation prevents directory traversal and illegal characters
- File size limit: 5MB default (configurable via `WORKSPACE_MAX_FILE_SIZE`)
- Atomic batch writes via temp directory strategy
- Text files stored as UTF-8, binary files as base64 in transit
- Frontend uses Monaco editor with syntax highlighting (50+ languages)
- `useWorkspaceSync()` hook auto-refreshes file list when AI completes tool calls
- Public workspace access via `WorkspaceApiProvider` context (switches between auth/public API)

### Auth

- Global AuthGuard (JWT) applied via APP_GUARD
- Use `@Public()` decorator to bypass auth on specific endpoints
- Use `@CurrentUser()` decorator to get `{ id, email }` from request
- Use `@Roles('ADMIN')` decorator for admin-only endpoints (skill/mcp marketplace, system config)
- API keys (sk-agx-...) use separate ApiKeyGuard for /v1/ endpoints
- Tokens stored in localStorage, auto-refresh on 401 via Axios interceptor

### User Preferences

- `UserPreferences` table with 1:1 relation to `User` (theme, language — both nullable)
- Backend: `GET /api/preferences` + `PATCH /api/preferences` (upsert semantics)
- Sync strategy: **database-first** — on login/checkAuth, server preferences override local
- Store-layer auto-sync: `setTheme()` and `changeLanguage()` automatically call `persistPreference()` via `lib/sync-preferences.ts`
- Both accept `{ sync: false }` option to skip backend write (used for server sync and cross-tab sync)
- Unauthenticated users still use localStorage only; `persistPreference()` checks for access token before calling API

### Prompt Management

- `PromptCategory` table with SYSTEM (predefined) and CUSTOM (user-created) categories
- `Prompt` table with marketplace (SYSTEM, admin-managed) and custom (CUSTOM, user-owned) prompts
- Backend: `GET/POST /prompts/categories`, `GET/POST/PUT/DELETE /prompts/market` (admin), `GET/POST/PUT/DELETE /prompts` (user)
- Frontend: Prompts list page with marketplace/custom tabs, prompt editor with inline category creation
- Agent integration: PromptPickerDialog in agent edit page lets users browse prompt library and fill system prompt; "Save to My Prompts" saves current system prompt to user's library

### System Configuration

- `SystemProvider` table — system-level AI providers independent from user providers (same encryption, same 7 protocols)
- `SystemFeatureConfig` table — per-feature AI configuration (featureKey unique, links to SystemProvider, stores modelId + systemPrompt + temperature + maxTokens + thinkingEnabled + isEnabled)
- Backend: `system-config` module at `/api/system/*`
  - Provider CRUD: `GET/POST /system/providers`, `GET/PUT/DELETE /system/providers/:id`, `POST /system/providers/:id/test`, `GET /system/providers/:id/models` (all @Roles('ADMIN'))
  - Feature config: `GET /system/features`, `PUT /system/features/:featureKey` (@Roles('ADMIN'))
  - Polish endpoint: `POST /system/polish` (any authenticated user) — calls AI with configured provider/model/prompt
- Default feature `PROMPT_POLISH` is seeded on module init (isEnabled: false until admin configures provider)
- Frontend: `/system-config` page (admin-only sidebar entry with Wrench icon), tabs for providers and features
- Agent edit page: "Polish" button in system prompt editor calls `/api/system/polish`, shows result in dialog for user to apply or discard

### User Management

- `User` model with `UserRole` (ADMIN, USER) and `UserStatus` (ACTIVE, DISABLED, DELETED) enums
- Backend: `user` module at `/api/users` (all @Roles('ADMIN'))
  - `GET /users` — paginated list with search, role/status filters
  - `GET /users/:id` — user detail with activity stats (agents, conversations, files, API keys, skills)
  - `POST /users` — create user (email, password, name, role)
  - `PATCH /users/:id/role` — update role (cannot change own role)
  - `PATCH /users/:id/status` — update status (cannot disable self)
  - `POST /users/:id/reset-password` — generate temporary password
- Frontend: `/users` (admin-only sidebar entry with Users icon), `/users/:id` detail page
- Hooks: `use-users.ts` with React Query hooks
- Components: `components/users/create-user-dialog.tsx`

### Provider API Keys

- Encrypted with AES-256-GCM via `src/common/crypto.util.ts`
- Encryption secret from `ENCRYPTION_SECRET` env var

### Frontend Patterns

- **Design standards (colors, spacing, layout widths, component conventions) are in `packages/web/README.md`**
- React Router v7 for routing
- All dashboard pages lazy-loaded via `React.lazy()`
- React Query v5 hooks in `src/hooks/` for all API calls
- Zustand v5 stores: `auth-store.ts` (auth state + server preference sync), `theme-store.ts` (system/light/dark theme with persist + auto backend sync)
- i18n via `react-i18next` + `i18next-browser-languagedetector`: auto-detects browser language, falls back to English, persists preference in localStorage. Use exported `changeLanguage(lng, opts?)` from `@/i18n` (not `i18n.changeLanguage()` directly) to ensure backend sync. Translation files in `src/locales/{en,zh}.json`. All UI strings use `t()` calls.
- Toast notifications via `sonner` (`@/components/ui/sonner`). Use `toast.success()` / `toast.error()` for mutation feedback.
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
- `/agents` - agent list, `/agents/new`, `/agents/:id/edit`, `/agents/:id/versions` (version management), `/agents/:id/versions/:versionId/conversations` (version conversations)
- `/skills` - skills list, `/skills/new`, `/skills/:id/edit`
- `/mcp-servers` - MCP server list, `/mcp-servers/new`, `/mcp-servers/:id/edit`
- `/prompts` - prompts list, `/prompts/new`, `/prompts/:id/edit`
- `/api-keys` - API key management
- `/users` - user management (admin-only), `/users/:id` (user detail)
- `/settings` - user preferences (theme, language)
- `/system-config` - system configuration (admin-only: system providers, feature config)
- `/chat` - full-screen chat UI (outside dashboard layout)
- `/chat/:conversationId/workspace` - full-screen IDE workspace view (resizable split: workspace 60% | chat 40%)
- `/s/:token` - shared chat page (public, no auth required)
- `/s/:token/workspace/:conversationId` - shared workspace page (public)

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
- `WORKSPACE_BASE_DIR` - Workspace file storage path (default: data/workspaces)
- `WORKSPACE_MAX_FILE_SIZE` - Max file size in bytes (default: 5242880 / 5MB)

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
