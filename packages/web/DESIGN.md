# @agent-x/web

React 19 frontend for Agent-X platform.

## Design Standards

Dark-first Zinc + Emerald design system. Components from `@agent-x/design` library.

### Color System

Hex color tokens, defined in `@agent-x/design/index.css` and bridged via `src/index.css`. Dark mode is the default (no class); light mode uses `.light` class.

| Token                  | Dark (default) | Light     | Usage                  |
| ---------------------- | -------------- | --------- | ---------------------- |
| `--background`         | `#09090b` zinc | `#ffffff` | Page background        |
| `--foreground`         | `#fafafa`      | `#09090b` | Primary text           |
| `--card`               | `#18181b`      | `#f4f4f5` | Card/surface elevation |
| `--surface`            | `#27272a`      | `#e4e4e7` | Subtle backgrounds     |
| `--primary`            | `#10b981`      | `#059669` | Emerald accent, CTAs   |
| `--primary-foreground` | `#022c22`      | `#ecfdf5` | Text on primary        |
| `--destructive`        | `#ef4444`      | `#dc2626` | Error/delete actions   |
| `--border`             | `#27272a`      | `#e4e4e7` | Borders                |
| `--ring`               | `#10b981`      | `#059669` | Focus rings            |
| `--foreground-muted`   | `#a1a1aa`      | `#71717a` | Secondary text         |
| `--foreground-ghost`   | `#52525b`      | `#a1a1aa` | Placeholder, disabled  |

### Component Imports

All shared UI components from `@agent-x/design`:

```tsx
import { Button, Card, CardHeader, CardContent, Badge, Avatar, Dialog, ... } from '@agent-x/design';
```

Retained in `@/components/ui/` (app-specific): `form.tsx`, `calendar.tsx`, `date-picker.tsx`, `context-menu.tsx`, `resizable.tsx`.

### Typography

- Font: **System font stack** (`system-ui, -apple-system, sans-serif`)
- Configured as `--font-sans` in `@theme inline`

### Theme System

Dark mode is default. Light mode toggled by `.light` class on `<html>`.

### Sidebar

Uses `IconSidebar` from design lib: collapsed 52px, expanded 200px. Main content offset: `md:ml-[var(--sidebar-collapsed)]`.

### Header Height

All full-screen page headers (chat, workspace, shared) use a consistent height:

| Token  | Value | Class  | Usage                                                         |
| ------ | ----- | ------ | ------------------------------------------------------------- |
| Header | 56px  | `h-14` | Chat sidebar header, chat panel header, workspace page header |

Standard header structure: `flex h-14 shrink-0 items-center border-b px-4`

### Layout Widths

| Page Type            | Width      | Class                                                     | Examples                                    |
| -------------------- | ---------- | --------------------------------------------------------- | ------------------------------------------- |
| Auth forms           | 384px      | `max-w-sm`                                                | login, register                             |
| Dashboard form cards | 672px      | `max-w-2xl`                                               | providers/create, skills/editor, mcp/editor |
| Agent create form    | Full width | Left-right 50/50 split (`w-1/2` each)                     | agents/create                               |
| Agent edit tab cards | 896px      | `max-w-4xl`                                               | All tabs + save button area                 |
| Chat messages        | 768px      | `max-w-3xl mx-auto`                                       | chat-panel, shared chat, chat-input         |
| Dashboard list grids | Full width | `grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | providers, agents, skills, mcp              |
| API keys table       | Full width | (no constraint)                                           | api-keys                                    |
| Test chat panel      | 400px      | `w-[400px]`                                               | agents/edit sidebar                         |
| Workspace page       | Full width | Resizable split: workspace 60% / chat 40%                 | chat workspace, shared workspace            |

### Spacing Conventions

#### Card + Form Pattern

Always add `className="flex flex-col gap-6"` to `<form>` elements that are direct children of Card.

#### Form Field Spacing

| Context                               | Gap          | Class                                         |
| ------------------------------------- | ------------ | --------------------------------------------- |
| Between form sections (Card children) | 24px         | `gap-6` (via form or Card)                    |
| Between fields (auth forms)           | 16px         | `gap-4` on CardContent                        |
| Between fields (dashboard forms)      | 24px         | `gap-6` on CardContent                        |
| Label to input (within a field)       | 8px          | `gap-2`                                       |
| CardFooter with border-t separator    | 24px padding | `border-t pt-6` (auto via `[.border-t]:pt-6`) |

#### Dashboard Form CardFooter

- With visual separator: `className="flex justify-end gap-3 border-t pt-6"`
- Without separator (auth forms): no extra padding needed (form `gap-6` provides spacing)

### Button Styles

| Type                 | Variant                       | Usage                         |
| -------------------- | ----------------------------- | ----------------------------- |
| Primary action (CTA) | `variant="primary"`           | Create, submit, save          |
| Default action       | (default, no variant)         | Dialogs, secondary actions    |
| Secondary/Cancel     | `variant="outline"`           | Cancel, back, close           |
| Ghost/icon           | `variant="ghost"`             | Toolbar icons, inline actions |
| Destructive (solid)  | `variant="destructive"`       | Confirm delete in dialogs     |
| Destructive (ghost)  | `variant="ghost-destructive"` | Card delete icon buttons      |

### Badge Variants

`default`, `outline`, `success`, `warning`, `destructive`, `info`, `muted`

### Empty State Pattern

```tsx
<div className="bg-primary flex size-16 items-center justify-center rounded-full text-white mb-4">
  <Icon className="size-8" />
</div>
<h3 className="mb-1 text-lg font-semibold">Title</h3>
<p className="text-foreground-muted text-sm">Description</p>
```

### List Page Patterns

All list pages (Agents, Providers, Skills, MCP, Prompts) use a shared infrastructure:

- **`ListPageHeader`** (`components/shared/list-page-header.tsx`): Fixed-height header bar with title, optional search input, and trailing slot (ViewToggle + Create button). Class: `flex h-14 shrink-0 items-center gap-3 border-b border-border px-4`.
- **`FilterTabs`** (from `@agent-x/design`): Tab-style filter with optional count badges. Used below the header.
- **`ViewToggle`** (from `@agent-x/design`): Grid/table view switcher.
- **`useViewMode(pageKey)`** (`hooks/use-view-mode.ts`): Persists view mode per page in localStorage.
- **`useFilteredSearch(items, options)`** (`hooks/use-filtered-search.ts`): Combines debounced search + filter tab state. Returns `{ search, setSearch, filter, setFilter, filtered }`.
- **Grid view**: `StaggerList` / `StaggerItem` (from `@agent-x/design`) wrapping card grid.
- **Table view**: `DataTable` (from `@agent-x/design`) with sortable columns, row actions dropdown.

### Command Palette (⌘K)

Global command palette (`components/shared/app-command-palette.tsx`) available in dashboard and chat layouts.

- Groups: Navigation, Actions (create new items), Theme toggle
- Uses `CommandPalette*` components and `useCommandPalette()` from `@agent-x/design`
- Keyboard shortcut: ⌘K / Ctrl+K

### Motion System

- **Page transitions**: `PageTransition` + `AnimatePresence` wrapping `<Outlet>` in dashboard layout.
- **List stagger**: `StaggerList` / `StaggerItem` for card grids on list pages.
- **Table fade-in**: `motion.div` with `initial={{ opacity: 0, y: 8 }}` for Users and API Keys tables.
- Respects `prefers-reduced-motion` (handled via CSS in `index.css`).

### Card Hover (List Pages)

All list page cards: `hover:shadow-md hover:border-primary/20 transition-all duration-200`

### Form Patterns (react-hook-form + zod)

- Select `value` 必须传 `string`，不能传 `undefined`
- 编辑表单拆分为 loader 外壳 + form 子组件
- Zod `message` 使用 i18n key: `z.string().min(1, 'validation.required')`

### Workspace UI Patterns

#### File Tree (`components/workspace/file-tree.tsx`)

- 树形结构从扁平文件列表构建
- 支持右键上下文菜单（复制、剪切、粘贴、下载、删除）
- 内联重命名/创建输入框
- 根据 MIME 类型显示文件图标
- 目录可展开/折叠

#### File Editor (`components/workspace/file-editor.tsx`)

- Monaco 编辑器，支持 50+ 语言语法高亮
- 标签式多文件编辑
- 脏状态（修改未保存）追踪
- 失去焦点时自动保存
- 支持文本文件编辑和图片文件预览
- 自定义主题 `agentx-light` / `agentx-dark`（定义在 `lib/monaco-themes.ts`，Zinc/Emerald 配色），跟随系统明暗模式切换

#### File Change Card (`components/workspace/file-change-card.tsx`)

- 在聊天消息中展示 AI 工具调用产生的文件变更
- 显示操作类型（创建、更新、删除、重命名等）
- 连续的 workspace 工具调用会被分组展示

#### ChatInput (`components/chat/chat-input.tsx`)

- Wraps `ChatInput` from `@agent-x/design` (textarea-based, replaces previous Tiptap editor)
- External API: `onSend(content: string)`, `onStop()`, `isLoading`, `disabled`
- Internal state: text value, file attachments (UI-only), slash command menu
- Toolbar: file upload button, slash commands, voice (skeleton), send/stop button
- Outer wrapper: `border-t bg-background p-4` with `max-w-3xl mx-auto`

#### Workspace Panel (`components/workspace/workspace-panel.tsx`)

- 左右可调整大小的分栏（文件树 | 编辑器）
- 管理标签状态和打开的文件
- 支持剪贴板操作（复制/剪切/粘贴），粘贴时自动去重文件名
