# Web Package

React 19 frontend with Vite 6, Tailwind CSS v4, and shadcn/ui.

## Directory Structure

```
src/
├── components/     # UI components
│   ├── chat/       # Chat panel, message list, message items, chat input
│   ├── workspace/  # Workspace panel, file tree, file editor, file change card
│   ├── agents/     # Agent forms, cards, test chat panel
│   ├── shared/     # Reusable form components (form-card, page-header, prompt-editor, etc.)
│   ├── users/      # User management components (create-user-dialog)
│   ├── auth/       # Protected route, login/register forms
│   └── ui/         # shadcn/ui primitives (button, dialog, input, etc.)
├── contexts/       # React contexts (workspace-api-context for auth/public API switching)
├── hooks/          # React Query hooks (use-agents, use-chat, use-workspace, etc.)
├── i18n.ts         # i18next config + changeLanguage() wrapper with sync option
├── locales/        # Translation files (en.json, zh.json)
├── pages/          # Route pages (login, register, dashboard/*, chat/, shared/)
├── stores/         # Zustand v5 stores (auth-store, theme-store)
└── lib/            # Utilities
    ├── api.ts              # Axios client with auth interceptor + token refresh
    ├── public-api.ts       # Unauthenticated Axios client for public endpoints
    ├── chat-transport.ts   # Authenticated chat streaming transport
    ├── shared-chat-transport.ts  # Public chat streaming transport
    ├── message-utils.ts    # Backend MessageResponse[] → AI SDK UIMessage[] conversion
    ├── stream-parser.ts    # SSE stream parsing utilities
    ├── workspace-utils.ts  # Extract file changes from AI tool calls
    ├── sync-preferences.ts # Centralized backend preference sync (persistPreference)
    ├── utils.ts            # General utilities (cn, etc.)
    └── schemas/            # Zod validation schemas (agent, provider, skill, mcp, api-key, user)
```

## Frontend Patterns

- **Design standards (colors, spacing, layout widths, component conventions) are in `README.md`**
- React Router v7 for routing
- All dashboard pages lazy-loaded via `React.lazy()`
- React Query v5 hooks in `src/hooks/` for all API calls
- Zustand v5 stores: `auth-store.ts` (auth state + server preference sync), `theme-store.ts` (system/light/dark theme with persist + auto backend sync)
- i18n via `react-i18next` + `i18next-browser-languagedetector`: auto-detects browser language, falls back to English, persists preference in localStorage. Use exported `changeLanguage(lng, opts?)` from `@/i18n` (not `i18n.changeLanguage()` directly) to ensure backend sync. Translation files in `src/locales/{en,zh}.json`. All UI strings use `t()` calls.
- Toast notifications via `sonner` (`@/components/ui/sonner`). Use `toast.success()` / `toast.error()` for mutation feedback.
- shadcn/ui components (Radix UI) in `src/components/ui/`
- Axios client at `src/lib/api.ts` with auth interceptors + token refresh
- Dashboard routes inside `DashboardLayout`, chat is full-screen outside
- Client-side streaming via native `fetch` + `ReadableStream` in `use-chat` and `use-shared-chat` hooks
- Chat history rendering unified via `MessageList` component (`components/chat/message-list.tsx`)
- Backend `MessageResponse[]` → AI SDK `UIMessage[]` conversion via `toUIMessages()` (`lib/message-utils.ts`)
- Tokens stored in localStorage, auto-refresh on 401 via Axios interceptor
- Monaco editor with syntax highlighting (50+ languages) for workspace
- `useWorkspaceSync()` hook auto-refreshes file list when AI completes tool calls
- Public workspace access via `WorkspaceApiProvider` context (switches between auth/public API)

## User Preferences (Frontend)

- Store-layer auto-sync: `setTheme()` and `changeLanguage()` automatically call `persistPreference()` via `lib/sync-preferences.ts`
- Both accept `{ sync: false }` option to skip backend write (used for server sync and cross-tab sync)
- Unauthenticated users still use localStorage only; `persistPreference()` checks for access token before calling API

## Prompt Management (Frontend)

- Prompts list page with marketplace/custom tabs, prompt editor with inline category creation
- Agent integration: PromptPickerDialog in agent edit page lets users browse prompt library and fill system prompt; "Save to My Prompts" saves current system prompt to user's library

## System Configuration (Frontend)

- `/system-config` page (admin-only sidebar entry with Wrench icon), tabs for providers and features
- Agent edit page: "Polish" button in system prompt editor calls `/api/system/polish`, shows result in dialog for user to apply or discard

## User Management (Frontend)

- `/users` (admin-only sidebar entry with Users icon), `/users/:id` detail page
- Hooks: `use-users.ts` with React Query hooks
- Components: `components/users/create-user-dialog.tsx`

## Routes

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

## Tailwind CSS v4

Theme token → utility class mapping (defined in `packages/ui/src/index.css`):

| Token        | Utility prefix                 | Example                                                                          |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------- |
| `--color-*`  | `bg-`, `text-`, `border-`      | `bg-primary`, `text-foreground-muted`, `border-border`                           |
| `--radius-*` | `rounded-`                     | `rounded-sm` (5px), `rounded-md` (8px), `rounded-lg` (10px), `rounded-xl` (12px) |
| `--spacing`  | `p-`, `m-`, `gap-`, `w-`, `h-` | `p-4`, `gap-2`                                                                   |

For sizing tokens (not registered in `@theme inline`), use the CSS variable function syntax:

```css
w-(--sidebar-collapsed)   /* 52px */
w-(--sidebar-expanded)    /* 200px */
h-(--header-height)       /* 48px */
w-(--chat-sidebar)        /* 260px */
```
