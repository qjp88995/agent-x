# Shared Package (@agent-x/shared)

Shared TypeScript type definitions consumed by both `@agent-x/server` and `@agent-x/web`.

## Directory Structure

```
src/
├── index.ts           # Re-exports all types
└── types/             # Type definition files
    ├── common.ts      # Common types
    ├── auth.ts        # Auth DTOs
    ├── provider.ts    # Provider types
    ├── agent.ts       # Agent types
    ├── agent-version.ts
    ├── skill.ts       # Skill types
    ├── mcp.ts         # MCP server types
    ├── chat.ts        # Chat/message types
    ├── api-key.ts     # API key types
    ├── share-token.ts # Share token types
    ├── workspace.ts   # Workspace types
    ├── preferences.ts # User preferences
    ├── prompt.ts      # Prompt types
    ├── system-config.ts # System config types
    └── user.ts        # User management types
```

## Conventions

- Types only — no runtime code, no compiled output
- All types re-exported from `src/index.ts` via `export *`
- When adding/modifying types, consider impact on both server and web packages
