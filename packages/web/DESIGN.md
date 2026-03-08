# @agent-x/web

React 19 frontend for Agent-X platform.

## Design Standards

AI/Chatbot Platform visual style. Purple/Cyan OKLCH color palette with Plus Jakarta Sans font.

### Color System

OKLCH color space, defined in `src/index.css`. Key tokens:

| Token          | Light                               | Dark                     | Usage                       |
| -------------- | ----------------------------------- | ------------------------ | --------------------------- |
| `--primary`    | `oklch(0.541 0.25 293)` purple      | `oklch(0.7 0.18 293)`    | Buttons, links, focus rings |
| `--background` | `oklch(0.98 0.005 290)` near-white  | `oklch(0.145 0.02 280)`  | Page background             |
| `--sidebar`    | `oklch(0.195 0.05 280)` dark indigo | `oklch(0.145 0.025 280)` | Sidebar background          |

Gradient: `oklch(0.541 0.25 293)` purple -> `oklch(0.715 0.143 215)` cyan, 135deg angle.

### Custom Utility Classes

Defined in `src/index.css` `@layer utilities`:

| Class           | Effect                             | Usage                           |
| --------------- | ---------------------------------- | ------------------------------- |
| `gradient-bg`   | Purple-to-cyan gradient background | Primary buttons, avatars, icons |
| `gradient-text` | Gradient text (clip + transparent) | Brand text                      |
| `glow-primary`  | 20px/40px purple box-shadow        | Hero icons, empty states        |
| `glow-sm`       | 10px purple box-shadow             | Cards (login/register)          |

### Typography

- Font: **Plus Jakarta Sans** (loaded via Google Fonts in `index.html`)
- Configured as `--font-sans` in `@theme inline`

### Layout Widths

#### Dashboard (`pages/dashboard/layout.tsx`)

```
Sidebar (w-64, 256px) | Main content (flex-1, full width, p-6)
```

- Main content fills all available space (no max-width constraint)
- Each page controls its own content width internally

#### Width Standards by Page Type

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

### Spacing Conventions

#### Card + Form Pattern (Important)

shadcn/ui Card uses `flex flex-col gap-6` for spacing between its direct children. When a `<form>` wraps CardHeader, CardContent, and CardFooter, it blocks Card's gap from reaching them.

**Rule: Always add `className="flex flex-col gap-6"` to `<form>` elements that are direct children of Card.**

```tsx
// CORRECT
<Card>
  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
    <CardHeader>...</CardHeader>
    <CardContent>...</CardContent>
    <CardFooter>...</CardFooter>
  </form>
</Card>

// WRONG - 0px gap between CardHeader and CardContent
<Card>
  <form onSubmit={handleSubmit}>
    <CardHeader>...</CardHeader>
    <CardContent>...</CardContent>
    <CardFooter>...</CardFooter>
  </form>
</Card>
```

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
| Link                 | `variant="link"`              | Inline text links             |

### Empty State Pattern

Consistent structure across all list pages:

```tsx
<div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
  <Icon className="size-8" />
</div>
<h3 className="mb-1 text-lg font-semibold">Title</h3>
<p className="text-muted-foreground text-sm">Description</p>
```

### Card Hover (List Pages)

All list page cards: `hover:shadow-md hover:border-primary/20 transition-all duration-200`

### Form Patterns (react-hook-form + zod)

#### Select 受控模式

Radix Select 的 `value` 只接受 `string`。传 `undefined` 会使其进入非受控模式，后续值更新可能被忽略。

```tsx
// CORRECT - 始终传字符串，空字符串时自动显示 placeholder
<Select value={field.value} onValueChange={field.onChange}>

// WRONG - undefined 导致非受控/受控模式切换，值更新不可靠
<Select value={field.value || undefined} onValueChange={field.onChange}>
```

#### 编辑表单异步数据初始化

编辑页面需要异步加载数据再填充表单。由于 React hooks 不能条件调用，`useForm` 必须在组件顶部执行，此时数据可能未就绪。

**规则：编辑表单拆分为 loader 外壳 + form 子组件。** 外壳负责数据加载和 loading/error 状态，子组件在 mount 时数据已就绪，`defaultValues` 从第一帧就是正确的。

```tsx
// CORRECT - 分层：外壳加载数据，子组件初始化表单
function EditPage() {
  const { data, isLoading } = useData(id);
  if (isLoading) return <LoadingState />;
  return <EditForm data={data} />;
}

function EditForm({ data }) {
  const form = useForm({ defaultValues: { name: data.name } }); // 第一帧就正确
}

// WRONG - useForm 在数据加载前就初始化，依赖 useEffect 异步填充
function EditPage() {
  const { data, isLoading } = useData(id);
  const form = useForm({ defaultValues: { name: '' } });
  useEffect(() => {
    if (data) form.reset(data);
  }, [data]);
  // 第一帧渲染空值，Select 等组件可能无法正确更新
}
```

#### Zod Schema 验证消息

Schema 中的 `message` 使用 i18n key，由 `FormMessage` 组件自动翻译：

```tsx
z.string().min(1, 'validation.required'); // 对应 locales/{en,zh}.json 中的 validation.required
```
