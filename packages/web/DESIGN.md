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

| Page Type            | Width      | Class                                | Examples                                                   |
| -------------------- | ---------- | ------------------------------------ | ---------------------------------------------------------- |
| Auth forms           | 384px      | `max-w-sm`                           | login, register                                            |
| Dashboard form cards | 672px      | `max-w-2xl`                          | agents/create, providers/create, skills/editor, mcp/editor |
| Agent edit tab cards | 896px      | `max-w-4xl`                          | All tabs + save button area                                |
| Chat messages        | 768px      | `max-w-3xl mx-auto`                  | chat-panel, shared chat, chat-input                        |
| Dashboard list grids | Full width | `grid sm:grid-cols-2 lg:grid-cols-3` | providers, agents, skills, mcp                             |
| API keys table       | Full width | (no constraint)                      | api-keys                                                   |
| Test chat panel      | 400px      | `w-[400px]`                          | agents/edit sidebar                                        |

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

| Type             | Class                                                    |
| ---------------- | -------------------------------------------------------- |
| Primary action   | `gradient-bg text-white hover:opacity-90 cursor-pointer` |
| Secondary/Cancel | `variant="outline"`                                      |
| Ghost/icon       | `variant="ghost"` + `cursor-pointer`                     |
| Destructive      | `variant="destructive"`                                  |

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
