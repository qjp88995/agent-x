# @agent-x/web

React 19 frontend for Agent-X platform.

## Design Standards

Dark-first, Linear/Vercel-inspired minimal design with Zinc + Emerald accent. Components from `@agent-x/design` library.

### Design Philosophy

- 极简克制：去掉一切不必要的视觉噪音，用排版和留白说话
- 信息密度优先：紧凑但不拥挤
- 深色为主 + 翡翠绿点缀：科技感与生命力兼具
- 微妙动效：不喧宾夺主，服务于交互反馈

### Color System

Hex color tokens, defined in `@agent-x/design/index.css` and bridged via `src/index.css`. Dark mode is the default (no class); light mode uses `.light` class.

| Token                  | Dark (default) | Light     | Usage                  |
| ---------------------- | -------------- | --------- | ---------------------- |
| `--background`         | `#09090b`      | `#ffffff` | Page background        |
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

Additional inline colors (not tokenized):

| Hex       | Usage                             |
| --------- | --------------------------------- |
| `#111`    | Code block background, input bg   |
| `#161616` | User message bubble background    |
| `#1a1a1a` | Fine borders (table rows, panels) |
| `#3f3f46` | Tertiary text, icons              |
| `#e4e4e7` | Emphasized text in dark mode      |
| `#d4d4d8` | AI response body text             |

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

---

## Layout

### Sidebar

Uses `IconSidebar` from design lib: collapsed 52px, expanded 200px on hover. Main content offset: `md:ml-[var(--sidebar-collapsed)]`.

- Logo: 32×32px rounded-lg, Emerald background, white "X" bold text
- Nav icons: 36×36px rounded-lg, active item has `emerald/10` background + emerald text
- Bottom: Settings icon + user avatar (28px circle)
- Expand animation: width 52→200px, 200ms ease-in-out; text labels fade-in with 50ms delay

### Header Heights

| Context             | Height | Class  |
| ------------------- | ------ | ------ |
| Dashboard top bar   | 48px   | `h-12` |
| Chat sidebar header | 48px   | `h-12` |
| Chat panel header   | 48px   | `h-12` |
| Filter/sub-nav bar  | 40px   | `h-10` |

Standard header structure: `flex h-12 shrink-0 items-center border-b px-5`

### Layout Widths

| Page Type            | Width      | Class / Style                                             | Examples                                    |
| -------------------- | ---------- | --------------------------------------------------------- | ------------------------------------------- |
| Auth forms           | 320px      | `w-[320px]`                                               | login, register                             |
| Dashboard form cards | 672px      | `max-w-2xl`                                               | providers/create, skills/editor, mcp/editor |
| Agent create form    | Full width | Left-right 50/50 split (`w-1/2` each)                     | agents/create                               |
| Agent edit tab cards | 896px      | `max-w-4xl`                                               | All tabs + save button area                 |
| Chat messages        | 640px      | `max-w-[640px] mx-auto`                                   | chat-panel, shared chat, chat-input         |
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
| Between fields (auth forms)           | 12px         | `gap-3` on CardContent                        |
| Between fields (dashboard forms)      | 24px         | `gap-6` on CardContent                        |
| Label to input (within a field)       | 4px          | `gap-1` (label 11px, font-weight 500)         |
| CardFooter with border-t separator    | 24px padding | `border-t pt-6` (auto via `[.border-t]:pt-6`) |

---

## Dashboard Pages

### List Page Pattern

All list pages (Agents, Providers, Skills, MCP, Prompts) share:

- **Top bar** (48px): Page title (13px semibold, letter-spacing -0.3px) + search input (200px, `#111` bg, `#1a1a1a` border) + `⌘K` badge + "New" button (emerald bg)
- **Filter bar** (40px): Tab-style filter with active underline (`2px solid #10b981`) + count badges + Table/Grid view toggle
- **`ListPageHeader`** (`components/shared/list-page-header.tsx`)
- **`FilterTabs`** (from `@agent-x/design`): with optional count badges
- **`ViewToggle`** (from `@agent-x/design`): Grid/table view switcher
- **`useViewMode(pageKey)`** (`hooks/use-view-mode.ts`): Persists view mode per page in localStorage
- **`useFilteredSearch(items, options)`** (`hooks/use-filtered-search.ts`): Debounced search + filter state

#### Table View

- Header row: 10px uppercase, letter-spacing 0.8px, color `#3f3f46`
- Data rows: 12px, `border-bottom: 1px solid #111`, hover `background: #111`
- Agent name cell: 28×28px colored avatar square (rounded-md) + name + description
- Status badge: pill shape (`padding: 2px 8px`, `border-radius: 10px`), active = emerald/10 bg + emerald text, archived = zinc/30 bg
- Row actions: icon buttons (chat 💬, edit ✏️, more ⋯) in `#3f3f46`, right-aligned

#### Grid View

- `StaggerList` / `StaggerItem` (from `@agent-x/design`) wrapping card grid
- Card hover: `hover:shadow-md hover:border-primary/20 transition-all duration-200`

### Form Page Pattern

All create/edit form pages (Providers, Agents, MCP Servers, Prompts, Skills) share the same full-height layout:

```
┌─ PageHeader ─────────────────────────────────────┐
│ [←]  Page Title                                  │  h-(--header-height), border-b
└──────────────────────────────────────────────────┘
│                                                  │
│  Form fields (max-w-2xl, left-aligned)           │  flex-1 overflow-auto p-5
│  ┌─ Name ──────────────────────────┐             │
│  └─────────────────────────────────┘             │
│  ┌─ Protocol (grid) ──────────────┐              │
│  └─────────────────────────────────┘             │
│  ── Separator ──────────────────────             │
│  ┌─ Base URL ──────────────────────┐             │
│  └─────────────────────────────────┘             │
│  ┌─ API Key ───────────────────────┐             │
│  └─────────────────────────────────┘             │
│  ── Separator ──────────────────────             │
│  [Test Connection]          [Cancel] [Save]      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Structure:**

```tsx
<div className="flex h-full flex-col">
  <PageHeader leading={<BackButton />} title="Page Title" />
  <div className="flex-1 overflow-auto p-5">
    <form className="flex max-w-2xl flex-col gap-6">
      {/* form fields */}
      <Separator />
      {/* action buttons */}
    </form>
  </div>
</div>
```

**Key conventions:**

- **Outer container**: `flex h-full flex-col` — matches list page full-height layout
- **PageHeader**: from `@agent-x/design`, with `leading` prop for back button (`ArrowLeft` icon, ghost variant, `size-7`)
- **Content area**: `flex-1 overflow-auto p-5` — scrollable, same padding as list page
- **Form**: `flex max-w-2xl flex-col gap-6` — left-aligned (no `mx-auto`), `gap-6` between fields
- **Action buttons**: at form bottom, separated by `<Separator />`. Left side for secondary actions (e.g. Test Connection), right side for Cancel + Submit (`flex-1` spacer between)
- **Form components**: `Form`, `FormField`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` from `@agent-x/design`

**Two-column variant** — Agent create/edit, Prompt editor, and Skills editor use the same shell but with a two-column layout (`lg:flex-row lg:w-1/2`) for config fields + editor side-by-side. No Card wrappers — section headers use plain `h3` + `p` text elements.

**Agent edit page** — extends the pattern with a `<Tabs>` inside the content area and an optional `<TestChatPanel>` side panel. Uses `PageHeader` `actions` prop for status badge and action buttons (version management, archive, publish).

### Login Page

Centered on page, 320px width:

- Brand: 40×40px emerald rounded-lg logo + "Agent-X" (22px bold, -0.5px tracking) + "Intelligent Agent Console" subtitle (12px, `#52525b`)
- Form fields: `#111` background, `#1a1a1a` border, 6px radius, 12px font
- Labels: 11px, `#71717a`, font-weight 500, margin-bottom 4px
- Submit button: emerald background, white text, 6px radius, full width
- Register link: 11px, `#52525b` text + emerald link

---

## Chat Page

### Chat Sidebar

- Width: **260px**, `border-right: 1px solid #1a1a1a`
- Header (48px): Back arrow (`#3f3f46`) + "Chat" title (13px semibold) + New conversation button (28px emerald square with `+`)
- Agent filter: Dropdown select below header (`border: 1px solid #1a1a1a`, 6px radius)
- Conversation list: Scrollable, 4px horizontal padding
  - Active item: `background: emerald/6`, `border: 1px solid emerald/12`, 6px radius
  - Inactive item: transparent, hover `background: #111`
  - Title: 12px medium, active = `#e4e4e7`, inactive = `#a1a1aa`
  - Meta: 10px, `#3f3f46`, format "Agent Name · time ago"

### Chat Header

- Height: **48px**, `border-bottom: 1px solid #1a1a1a`
- Content: Agent avatar (24×24px emerald rounded-md) + conversation title (12px medium) + workspace icon `⟨/⟩` on right

### Message Bubbles

#### User Message (Right-aligned)

```
justify-content: flex-end
max-width: 75%
padding: 10px 14px
background: #161616
border: 1px solid #1a1a1a
border-radius: 12px 12px 2px 12px    /* tail on bottom-right */
font-size: 13px
line-height: 1.6
color: #e4e4e7
```

#### AI Message (Left-aligned)

```
display: flex, gap: 10px
avatar: 26×26px, rounded-md, emerald bg, white initials (9px bold)
body: no background, max-width 75%
font-size: 13px
line-height: 1.7
color: #d4d4d8
```

Strong/bold text in AI response: `color: #e4e4e7`

#### Thinking Block (Collapsed)

```
padding: 6px 10px
background: emerald/4
border: 1px solid emerald/10
border-radius: 8px
margin-bottom: 8px
font-size: 11px
color: #52525b
```

- Default collapsed, shows "▶ Thinking · Xs"
- Click to expand with height transition
- Green accent border for subtlety

#### Code Block (in messages)

```
background: #111
border: 1px solid #1a1a1a
border-radius: 6px
padding: 10px 12px
font-family: monospace
font-size: 11px
color: #a1a1aa
```

- Top bar: language label (10px, `#3f3f46`) + Copy button
- Copy feedback: clipboard icon → ✓ for 1.5s

#### File Change Card

```
background: #111
border: 1px solid #1a1a1a
border-radius: 8px
padding: 10px 12px
font-size: 11px
max-width: 320px
```

- Header: "📁 File Changes" + count badge (`#1a1a1a` bg pill)
- File list: `+` green for created, `~` amber for modified, `-` red for deleted

#### Streaming Indicator

```
avatar (26×26px emerald) + pulsing dot (5px, emerald, opacity 0.6) + "···" (10px, #3f3f46)
```

### Chat Input

Textarea-based input at bottom, `border-top: 1px solid #1a1a1a`, padding 12px 16px.

#### Container

```
max-width: 640px, margin: 0 auto
border: 1px solid #27272a
border-radius: 12px
background: #09090b
```

#### Text Area

```
padding: 12px 14px 8px
font-size: 13px
placeholder color: #52525b
```

#### Toolbar (below textarea)

```
padding: 4px 8px 8px
display: flex, align-items: center, gap: 2px
```

Toolbar buttons (30×30px, rounded-md):

| Button         | Icon                 | Default color | Active state                        |
| -------------- | -------------------- | ------------- | ----------------------------------- |
| File upload    | 📎                   | `#52525b`     | Emerald bg tint when files attached |
| Slash commands | `/` (monospace bold) | `#52525b`     | Emerald bg tint when menu open      |
| Voice input    | 🎙                   | `#52525b`     | Red bg tint when recording          |

Right side:

- Keyboard hint: "⏎ Send · ⇧⏎ Newline" (10px, `#27272a`)
- Send button: 30×30px, rounded-md
  - Empty: `#27272a` bg, `#3f3f46` arrow, cursor not-allowed
  - Has content: `#10b981` bg, white `↑` arrow
  - Streaming: morphs to `■` stop icon (200ms transition)

#### File Attachments (above textarea)

```
padding: 10px 12px 0
display: flex, gap: 6px, flex-wrap: wrap
```

File chip:

```
display: flex, align-items: center, gap: 6px
padding: 5px 10px
background: #111
border: 1px solid #1a1a1a
border-radius: 6px
font-size: 11px
```

- File icon colored by type (📄 blue for docs)
- Name in `#a1a1aa`, size in `#3f3f46` (9px)
- Close `×` button in `#3f3f46`
- Image files show 18×18px thumbnail preview

#### Slash Command Menu (floating above input)

```
background: #111
border: 1px solid #27272a
border-radius: 10px
box-shadow: 0 -8px 32px rgba(0,0,0,0.4)
```

- Search bar: `/` prefix (emerald monospace) + typed text + cursor
- Results grouped: "Matched Commands" / "All Commands"
- Active item: `emerald/8` bg, `⏎` badge on right
- Each item: 28×28px icon square + name (12px) + description (10px)
- Keyboard: `↑↓` navigate, `⏎` select, `Esc` close
- Entrance: slide-up + fade, 150ms

#### Voice Input States

**Recording**:

```
border: 1px solid rgba(239,68,68,0.3)
background: rgba(239,68,68,0.03)
```

- Red pulsing dot (8px) + "Recording..." (12px red) + timer (12px, tabular-nums)
- Waveform: 10 bars, 2px wide, varying heights, red with varying opacity
- Toolbar: "Cancel" text button + "■ Stop & Send" red button

**Transcribing**:

- Normal border, text appearing progressively
- Spinner (12px) + "Transcribing..." in emerald
- Send button active once text present

#### Drag & Drop

Full chat area overlay:

```
border: 2px dashed emerald/40
border-radius: 12px
background: emerald/3
```

Center: 44×44px icon square (`emerald/10` bg) + "Drop files here" (13px emerald) + file type hint (11px, `#3f3f46`)

### Empty Chat State

Centered vertically:

- Icon: 48×48px rounded-xl, `emerald/10` bg, 💬 22px emerald
- Title: "Start a conversation" (15px semibold, `#e4e4e7`)
- Description: 12px, `#3f3f46`, max-width 260px

### Mobile Chat

- Sidebar and chat area are mutually exclusive (swipe/back button to switch)
- Mobile conversation list: Full width, 12px padding, larger touch targets
- Mobile chat input: Compact, same structure

---

## Feedback Patterns

### Toast Messages

Position: **top-right**, stacked (max 3), auto-dismiss 3s.

```
background: #111
border: 1px solid #1a1a1a
border-radius: 8px
padding: 12px 14px
box-shadow: 0 4px 12px rgba(0,0,0,0.4)
```

- Icon: 18px circle with colored bg tint (emerald for success, red for error, amber for warning)
- Title: 12px medium, `#e4e4e7`
- Description: 11px, `#52525b`
- Close `×`: `#3f3f46`
- Entrance: `translateX(100%) → 0`, 200ms ease-out
- Exit: `opacity → 0` + `translateX(20px)`, 150ms ease-in
- Stack: new toast pushes old ones down (layout animation)

### Confirm Dialog

**Destructive (delete):**

```
background: #111
border: 1px solid #1a1a1a
border-radius: 10px
box-shadow: 0 16px 48px rgba(0,0,0,0.5)
width: 380px
```

- **Red top accent line**: `height: 2px, background: #ef4444` at top of dialog
- Icon: 32×32px rounded-lg, `red/10` bg, ⚠ warning icon
- Title: 14px semibold
- Description: 12px, `#71717a`, line-height 1.6
- Buttons: Cancel (outline, `#27272a` border) + Delete (solid red bg)

**Non-destructive (archive):**

- Same structure but no red accent line
- Amber icon instead
- Confirm button: white/light bg (`#fafafa`), dark text

### Command Palette (⌘K)

```
width: 480px
background: #111
border: 1px solid #27272a
border-radius: 10px
box-shadow: 0 16px 48px rgba(0,0,0,0.5)
```

- Centered horizontally, offset from top (~60px)
- Search input: 🔍 icon + placeholder "Type a command or search..."
- Results grouped by type: "Agents", "Actions"
- Active item: `emerald/8` bg
- Keyboard shortcut badges: `#1a1a1a` border pill (9px)
- Entrance: `translateY(-8px) → 0` + fade, 150ms ease-out
- Exit: fade out, 100ms

### Form Validation

- Valid field: green ✓ checkmark on right side of input
- Error field: `border-color: #ef4444`, error message below (10px red, ✕ icon + text)
- Hint text: 10px, `#3f3f46`, below input

---

## Motion System

### Page Transitions

Content area: fade + subtle slide-up, 150ms ease-out. Route changes feel near-instant.

Uses `PageTransition` + `AnimatePresence` wrapping `<Outlet>` in dashboard layout.

### List Stagger

Items fade-in sequentially with 30ms stagger delay after data loads. Uses `StaggerList` / `StaggerItem` from design lib.

### Dialog / Modal

- Entrance: `scale(0.96) → 1` + `opacity: 0 → 1`, 200ms `cubic-bezier(0.16, 1, 0.3, 1)`
- Exit: `scale(1) → 0.96` + fade, 150ms
- Background overlay fade concurrent

### Hover & Focus

- Table rows: hover background `#111`, 120ms transition
- Buttons: hover brightness increase
- All interactive elements: `focus-visible` ring (emerald)

### Loading States

- Skeleton shimmer pulse animation
- Table fade-in: `motion.div` with `initial={{ opacity: 0, y: 8 }}`

### Sidebar Expand

- Width: 52→200px, 200ms ease-in-out
- Text labels: fade-in with 50ms delay

### Tooltip

- Entrance: fade + `translateY(4px) → 0`, 100ms ease-out
- Delay: 300ms before appearing

### Dropdown Menu

- Entrance: `scale(0.95) → 1` + fade, 120ms ease-out
- Opens from trigger direction

### Reduced Motion

Respects `prefers-reduced-motion` (handled via CSS in `index.css`).

---

## Button Styles

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

---

## Form Patterns (react-hook-form + zod)

- Select `value` 必须传 `string`，不能传 `undefined`
- 编辑表单拆分为 loader 外壳 + form 子组件
- Zod `message` 使用 i18n key: `z.string().min(1, 'validation.required')`

---

## Workspace UI Patterns

### File Tree (`components/workspace/file-tree.tsx`)

- 树形结构从扁平文件列表构建
- 支持右键上下文菜单（复制、剪切、粘贴、下载、删除）
- 内联重命名/创建输入框
- 根据 MIME 类型显示文件图标
- 目录可展开/折叠

### File Editor (`components/workspace/file-editor.tsx`)

- Monaco 编辑器，支持 50+ 语言语法高亮
- 标签式多文件编辑
- 脏状态（修改未保存）追踪
- 失去焦点时自动保存
- 支持文本文件编辑和图片文件预览
- 自定义主题 `agentx-light` / `agentx-dark`（Zinc/Emerald 配色），跟随系统明暗模式切换

### File Change Card (`components/workspace/file-change-card.tsx`)

- 在聊天消息中展示 AI 工具调用产生的文件变更
- 显示操作类型（创建、更新、删除、重命名等）
- 连续的 workspace 工具调用会被分组展示

### Workspace Panel (`components/workspace/workspace-panel.tsx`)

- 左右可调整大小的分栏（文件树 | 编辑器）
- 管理标签状态和打开的文件
- 支持剪贴板操作（复制/剪切/粘贴），粘贴时自动去重文件名
