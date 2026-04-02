# CLAUDE.md

## What This Project Is

Cluster Optimizer is a SaaS MVP that turns one seed topic into a structured, actionable content cluster. It generates page roles, publish order, internal link plans, and missing node detection — all powered by Claude AI.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4 + shadcn/ui** — component library in `src/components/ui/`
- **SQLite** via Prisma 7 + `@prisma/adapter-libsql`
- **@anthropic-ai/sdk** — Claude Sonnet 4 for AI generation
- **Sonner** — toast notifications

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── projects/          # GET list, POST create
│   │   ├── projects/[id]/     # GET, PATCH, DELETE single project
│   │   ├── projects/[id]/generate/  # POST — triggers AI pipeline
│   │   ├── nodes/             # POST create node
│   │   ├── nodes/[id]/        # PATCH, DELETE node
│   │   ├── links/[id]/        # DELETE link
│   │   └── export/[projectId]/ # GET — export as MD or CSV
│   ├── page.tsx               # Dashboard (list all projects)
│   ├── new/page.tsx           # New project form
│   └── project/[id]/
│       ├── layout.tsx         # Project layout with tabs + polling
│       ├── page.tsx           # Cluster map (tree view)
│       ├── publish-order/     # Priority-sorted table
│       ├── links/             # Internal link plan table
│       └── missing/           # Missing node suggestions
├── components/
│   ├── node-editor.tsx        # Edit/delete node dialog
│   └── ui/                    # shadcn/ui primitives
├── lib/
│   ├── ai/
│   │   ├── prompts.ts         # Prompt templates for both AI steps
│   │   ├── generate-cluster.ts # Step 1: cluster structure generation
│   │   ├── score-and-enrich.ts # Step 2: scoring + missing nodes
│   │   └── parse-response.ts  # JSON extraction from AI responses
│   ├── db.ts                  # Prisma client singleton (libsql adapter)
│   ├── types.ts               # Shared TypeScript interfaces
│   ├── scoring.ts             # Priority score formula
│   ├── export.ts              # Markdown + CSV formatters
│   └── slugify.ts             # URL slug generator
└── generated/prisma/          # Auto-generated Prisma client (gitignored)
```

## Database Schema (Prisma + SQLite)

4 models defined in `prisma/schema.prisma`:

- **Project** — seed topic + metadata + status (`pending | generating | enriching | ready | error`)
- **ClusterNode** — page in the cluster with role, scores, hierarchy (self-referential `parentId`)
- **LinkSuggestion** — source → target internal link with anchor text
- **MissingNode** — suggested coverage gap with confidence score

All child models cascade-delete when their parent Project is deleted.

## AI Pipeline

Two-step process in `/api/projects/[id]/generate/route.ts`:

1. **Generate Cluster Structure** (`lib/ai/generate-cluster.ts`) — single Claude call returns 12-20 nodes + link suggestions as JSON
2. **Score & Detect Missing Nodes** (`lib/ai/score-and-enrich.ts`) — second Claude call scores each node (0-100) on 5 dimensions and suggests 3-7 missing pages

Priority score formula (`lib/scoring.ts`):
```
centrality × 0.30 + supportValue × 0.25 + opportunity × 0.20 + ease × 0.10 + serpClarity × 0.15
```

Both steps use `claude-sonnet-4-20250514` with `max_tokens: 4096`.

JSON parsing (`lib/ai/parse-response.ts`) handles: direct parse, markdown code fences, and first-brace-to-last-brace extraction.

## Node Roles & Color Coding

| Role | Color | Purpose |
|------|-------|---------|
| pillar | indigo | Central topic page (exactly 1 per cluster) |
| sub-pillar | blue | Major subtopic (2-4 per cluster) |
| support | green | Supporting content |
| comparison | amber | X vs Y pages |
| list | purple | Listicle/roundup pages |
| informational | gray | FAQ/how-to/explainer pages |

## Key Patterns

- **Client components** — all pages use `"use client"` with React hooks
- **Project context** — `useProject()` hook in project layout provides shared state + polling
- **Polling** — project detail page polls `/api/projects/[id]` every 2s while status is `generating` or `enriching`
- **Path alias** — `@/*` maps to `./src/*`
- **Imports** — Prisma client from `@/generated/prisma/client`, not `@/generated/prisma`

## Setup & Running

```bash
npm install
npx prisma generate        # Generate Prisma client
npx prisma db push          # Create/sync SQLite DB
npm run dev                 # Start at http://localhost:3000
```

### Environment Variables (`.env`)

```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY=sk-ant-...
```

The SQLite database file lives at project root (`dev.db`), not inside `prisma/`.

## Common Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio    # Database GUI
npx prisma db push   # Sync schema changes to DB
npx prisma generate  # Regenerate Prisma client after schema changes
```

## Important Notes

- `.env` and `dev.db` are gitignored — never commit secrets or local DB
- `src/generated/prisma/` is gitignored — run `npx prisma generate` after cloning
- The generate endpoint has `maxDuration = 120` (seconds) for AI calls
- Export supports `?format=md` (default) and `?format=csv` query params
