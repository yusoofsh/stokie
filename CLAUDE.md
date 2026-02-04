# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev              # Start dev server (port 3000)
bun build            # Production build
bun test             # Run all tests (vitest)
bun check            # Lint & format (biome + ultracite)

# Database (PGlite - embedded PostgreSQL)
bun db:generate      # Generate migrations from schema
bun db:migrate       # Run migrations
bun db:studio        # Open Drizzle Studio
bun db:prepare       # Generate + migrate

# Shadcn components
bunx shadcn@latest add <component>
```

## Architecture

**TanStack Start** full-stack React framework with file-based routing and SSR.

### Key Directories
- `src/routes/` - File-based routes (TanStack Router). Route files export `Route` with loader/component
- `src/routes/api/` - API endpoints.
- `src/lib/` - Core utilities: auth, db, env, rpc, query
- `src/components/ui/` - Shadcn components (base-maia style)
- `data/schema/` - Drizzle ORM schema definitions
- `data/migrations/` - Database migrations

### Stack
- **Auth**: Better Auth with plugins (admin, organization, multiSession). Config in `src/lib/auth/index.ts`
- **Database**: Drizzle ORM with PGlite. Schema in `data/schema/`, client in `src/lib/db.ts`
- **Data Fetching**: TanStack Query integrated with router SSR
- **Environment**: t3-oss/env-core. Server vars + VITE_ prefixed client vars in `src/lib/env.ts`

### Path Aliases
- `@/*` → `./src/*`

### Code Style
Uses Biome with Ultracite preset. Pre-commit hook runs `bun check`. Double quotes, no semicolons, 120 line width.
