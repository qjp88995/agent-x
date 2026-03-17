# Server Package

NestJS 11 backend with Prisma v7 and PostgreSQL.

## Directory Structure

```
src/
├── common/         # Shared utilities (crypto.util.ts, ai-provider.util.ts, request-logger.middleware.ts)
├── generated/prisma/  # Generated Prisma client (gitignored)
├── prisma/         # PrismaModule (global)
├── telemetry.ts    # OpenTelemetry SDK (opt-in via AI_SDK_TELEMETRY=true)
└── modules/
    ├── auth/       # JWT auth, guards, decorators (@Public, @CurrentUser)
    ├── provider/   # Model provider CRUD + encryption + model sync
    ├── agent/      # Agent lifecycle (ACTIVE→ARCHIVED), skill/mcp binding, versions, share tokens
    ├── skill/      # Skill marketplace (admin) + custom skills management
    ├── mcp/        # MCP server marketplace + custom servers + client
    ├── prompt/     # Prompt template library (marketplace + custom CRUD, categories)
    ├── chat/       # Streaming chat (Vercel AI SDK) + AgentRuntimeService + StreamManager
    │   └── tools/  # Built-in tools: workspace file ops (14 tools), getCurrentTime
    ├── workspace/  # Workspace file management (CRUD, disk storage, path validation)
    ├── public-chat/ # Public shared chat via share tokens (@Public endpoints)
    ├── preferences/ # User preferences (theme, language) CRUD
    ├── api-key/    # API key management (sk-agx-... prefix)
    ├── openai-compat/  # /v1/chat/completions (OpenAI wire format)
    ├── user/       # User management (admin): list, create, role/status update, password reset
    └── system-config/  # System-level provider management + feature config + AI-powered features (admin)
```

## Testing & Database

```bash
npx jest            # all backend tests
npx jest -- auth    # specific module
npx jest --coverage # with coverage

npx prisma migrate dev --name <name>  # create migration
npx prisma generate                    # regenerate client
npx prisma studio                      # visual editor
```

## Environment Variables (`.env`)

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

## Prisma v7

- Config file: `prisma.config.ts` (NOT inside prisma/)
- Schema: `prisma/schema.prisma`
- Generated client: `src/generated/prisma` (import `client` from here, e.g. `from '../../generated/prisma/client'`)
- Uses `PrismaPg` adapter (NOT url-based connection)
- Datasource URL is in prisma.config.ts, NOT in schema.prisma
- **NEVER use `npx prisma db push`** to modify the database directly. Always use `npx prisma migrate dev --name <name>` to create proper migrations.

## AI SDK Integration

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

## Chat Tools

Built-in tools available to agents during chat (defined in `chat/tools/`):

- **Workspace tools** (14): createFile, readFile, updateFile, deleteFile, writeFiles (atomic batch), fileExists, fileInfo, readFileLines, listFiles, searchFiles, patchFile, renameFile, createDirectory, deleteDirectory, renameDirectory
- **Utility tools**: getCurrentTime (with timezone support)

## Auth

- Global AuthGuard (JWT) applied via APP_GUARD
- Use `@Public()` decorator to bypass auth on specific endpoints
- Use `@CurrentUser()` decorator to get `{ id, email }` from request
- Use `@Roles('ADMIN')` decorator for admin-only endpoints (skill/mcp marketplace, system config)
- API keys (sk-agx-...) use separate ApiKeyGuard for /v1/ endpoints

## Provider API Keys

- Encrypted with AES-256-GCM via `src/common/crypto.util.ts`
- Encryption secret from `ENCRYPTION_SECRET` env var

## Workspace

- File storage on disk at `data/workspaces/{conversationId}/` (configurable via `WORKSPACE_BASE_DIR`)
- Database tracks metadata in `WorkspaceFile` model (path, mimeType, size, isDirectory)
- Path validation prevents directory traversal and illegal characters
- File size limit: 5MB default (configurable via `WORKSPACE_MAX_FILE_SIZE`)
- Atomic batch writes via temp directory strategy
- Text files stored as UTF-8, binary files as base64 in transit

## User Preferences

- `UserPreferences` table with 1:1 relation to `User` (theme, language — both nullable)
- Backend: `GET /api/preferences` + `PATCH /api/preferences` (upsert semantics)
- Sync strategy: **database-first** — on login/checkAuth, server preferences override local

## Prompt Management

- `PromptCategory` table with SYSTEM (predefined) and CUSTOM (user-created) categories
- `Prompt` table with marketplace (SYSTEM, admin-managed) and custom (CUSTOM, user-owned) prompts
- Backend: `GET/POST /prompts/categories`, `GET/POST/PUT/DELETE /prompts/market` (admin), `GET/POST/PUT/DELETE /prompts` (user)

## System Configuration

- `SystemProvider` table — system-level AI providers independent from user providers (same encryption, same 7 protocols)
- `SystemFeatureConfig` table — per-feature AI configuration (featureKey unique, links to SystemProvider, stores modelId + systemPrompt + temperature + maxTokens + thinkingEnabled + isEnabled)
- Backend: `system-config` module at `/api/system/*`
  - Provider CRUD: `GET/POST /system/providers`, `GET/PUT/DELETE /system/providers/:id`, `POST /system/providers/:id/test`, `GET /system/providers/:id/models` (all @Roles('ADMIN'))
  - Feature config: `GET /system/features`, `PUT /system/features/:featureKey` (@Roles('ADMIN'))
  - Polish endpoint: `POST /system/polish` (any authenticated user) — calls AI with configured provider/model/prompt
- Default feature `PROMPT_POLISH` is seeded on module init (isEnabled: false until admin configures provider)

## User Management

- `User` model with `UserRole` (ADMIN, USER) and `UserStatus` (ACTIVE, DISABLED, DELETED) enums
- Backend: `user` module at `/api/users` (all @Roles('ADMIN'))
  - `GET /users` — paginated list with search, role/status filters
  - `GET /users/:id` — user detail with activity stats (agents, conversations, files, API keys, skills)
  - `POST /users` — create user (email, password, name, role)
  - `PATCH /users/:id/role` — update role (cannot change own role)
  - `PATCH /users/:id/status` — update status (cannot disable self)
  - `POST /users/:id/reset-password` — generate temporary password
