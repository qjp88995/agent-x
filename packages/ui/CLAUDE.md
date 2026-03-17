# UI Package (@agent-x/design)

Design system and component library for Agent-X, built on Radix UI + Tailwind CSS v4 + class-variance-authority.

## Directory Structure

```
src/
├── index.css          # Global styles and Tailwind theme (@theme inline)
├── lib.css            # Library-specific styles
├── index.ts           # Public API — all component exports
├── lib/               # Utilities (cn, etc.)
├── tokens/            # Design tokens (colors, motion)
├── primitives/        # Base UI primitives (button, input, select, card, form, etc.)
├── data/              # Data display (data-table, filter-tabs, view-toggle, table)
├── feedback/          # Feedback components (dialog, alert-dialog, dropdown-menu, popover, sheet, toast, tooltip, command-palette)
├── navigation/        # Navigation (breadcrumb, icon-sidebar, page-header, pagination)
├── settings/          # Settings UI (settings-accordion, settings-layout, settings-nav)
├── layout/            # Layout helpers (page-transition, stagger-list)
└── chat/              # Chat UI (chat-input, message-bubble, thinking-block, voice-recorder, slash-command-menu)
```

## Development

```bash
pnpm --filter @agent-x/design dev           # watch mode
pnpm --filter @agent-x/design build         # production build
pnpm --filter @agent-x/design storybook     # storybook on :6006
pnpm --filter @agent-x/design lint          # eslint
pnpm --filter @agent-x/design typecheck     # tsc --noEmit
```

## Conventions

- Every public component must be exported from `src/index.ts`
- Components organized by category folder: `primitives/`, `data/`, `feedback/`, etc.
- Use CVA (`class-variance-authority`) for component variants
- Write Storybook stories for all components
- Tailwind CSS v4 theme tokens defined in `src/index.css`
