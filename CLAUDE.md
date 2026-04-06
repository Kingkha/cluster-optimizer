# CLAUDE.md

## What This Project Is

Cluster Optimizer is a **SaaS product** that turns one seed topic into a structured, actionable content cluster. It generates page roles, publish order, internal link plans, and missing node detection — all powered by Claude AI.

### SaaS Model
- **Multi-user**: users sign up, connect their own Google Search Console via OAuth, and manage their own projects
- **App-level OAuth**: the operator (us) registers one Google OAuth app; users just click "Connect GSC" — no credentials to enter
- **Billing**: planned via Stripe (not yet implemented)
- **Auth**: planned via NextAuth or Clerk (not yet implemented — currently single-user/open)

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4 + shadcn/ui** — component library in `src/components/ui/`
- **PostgreSQL** via Prisma 7 + `@prisma/adapter-pg` — Neon DB in production, local Postgres in dev
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

Models defined in `prisma/schema.prisma` (PostgreSQL via Neon):

- **Project** — seed topic + metadata + status (`pending | generating | enriching | ready | error`)
- **ClusterNode** — page in the cluster with role, scores, hierarchy (self-referential `parentId`)
- **LinkSuggestion** — source → target internal link with anchor text
- **MissingNode** — suggested coverage gap with confidence score

All child models cascade-delete when their parent Project is deleted.

## Generation Pipeline

Full pipeline in `/api/projects/[id]/generate/route.ts`. Total cost: **~$0.35** (~$0.07 DataForSEO + ~$0.28 Claude). Takes ~30-40s.

### Step 0: Fetch Real Data (~$0.06-0.12 DataForSEO)

```
Status: fetching-data
```

Uses cascading DataForSEO calls (`lib/data-sources/dataforseo.ts`):

1. **`getSerpResults`** ($0.05) — top 10 organic results + SERP features for competitor context
2. **`getKeywordSuggestions`** (Labs, $0.01) — seed keyword metrics (volume, KD, CPC) + up to 50 keyword variations with volume + difficulty. This is the primary data source.
3. **Fallback only if suggestions return <3 results** (niche keywords):
   - `getKeywordData` (Google Ads, $0.05) — seed volume/CPC
   - `getRelatedKeywords` (Google Ads, $0.075) — broader keyword ideas

Also crawls the user's site if domain is provided (up to 50 pages, cached).

**Cost optimization**: Labs endpoints are ~$0.01 each vs Google Ads at $0.05-0.075. Always try Labs first, fall back to Ads only for niche keywords with no Labs data. Labs endpoints require English-supported locations — non-English locations fall back to US (2840).

### Step 0.5: Group Keywords (~$0.01 Claude)

```
Status: fetching-data (continued)
```

`lib/ai/group-keywords.ts` — one Claude call groups related keywords into 4-8 subtopic clusters. Group count determines cluster size (3 groups → 5-8 pages, 8+ groups → 15-20 pages).

### Step 1: Generate Cluster Structure (~$0.05 Claude)

```
Status: generating
```

`lib/ai/generate-cluster.ts` — one Claude Sonnet call. Prompt includes seed metrics, grouped keywords, SERP competitors, and existing site pages. Returns 5-20 nodes + link suggestions as JSON.

After node creation, fetches **keyword difficulty** for all target keywords via Labs `bulk_keyword_difficulty` ($0.01). Volume for target keywords is reused from Step 0 suggestions data (no extra Google Ads call).

### Step 2: Score & Detect Missing Nodes (~$0.04 Claude)

```
Status: enriching
```

`lib/ai/score-and-enrich.ts` — one Claude call scores each node on 5 dimensions (0-100):

Priority score formula (`lib/scoring.ts`):
```
centrality × 0.30 + supportValue × 0.25 + opportunity × 0.20 + ease × 0.10 + serpClarity × 0.15
```

Also suggests 3-7 missing pages with confidence scores.

### Step 3: Generate Content Briefs (~$0.17 Claude)

```
Status: briefing
```

`lib/ai/generate-briefs.ts` — batches of 3 nodes per Claude call (max_tokens: 8192). Each brief includes target/secondary keywords, word count range, H2/H3 outline, key points, competitor angles.

### Polling & Stale Detection

- Client polls `GET /api/projects/[id]?status=1` every 2s (lightweight: only fetches status + error)
- Full data fetch only on initial load and when status changes to `ready`
- **Stale detection**: if status hasn't changed in >2 minutes, auto-marks as `error`
- Client-side 3-minute timeout as additional safety net

### Keyword Research (optional, pre-generation)

`/api/keyword-research` — "Find Best Keyword" button in new project form. Cascading fallback:
1. `getKeywordSuggestions` (Labs, $0.01) — if 5+ results, done
2. `getRelatedKeywordsLabs` (Labs, $0.01) — if 5+ results, done
3. `getRelatedKeywords` + `getKeywordData` (Google Ads, $0.12) — broadest, for niche keywords
4. `getKeywordDifficulty` (Labs, $0.01) — backfill KD for candidates missing it

Ranked by opportunity score: `volume × (1 - difficulty/100)²`

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
- **Polling** — project detail page polls `/api/projects/[id]?status=1` (lightweight) every 2s while generating; full fetch on completion
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
DATABASE_URL="postgresql://user:password@localhost:5432/cluster_optimizer"
ANTHROPIC_API_KEY=sk-ant-...

# DataForSEO — keyword data, SERP results, keyword difficulty
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...

# Google OAuth — set once by the operator; users just click "Connect GSC"
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gsc/callback
```

## Deploying to Vercel

### Prerequisites
- **Vercel Pro** ($20/mo) — required because the AI generation route needs up to 60s (Hobby is 10s max)
- **Turso** (free tier) — hosted SQLite; SQLite file doesn't persist on Vercel's serverless functions
- User-facing Stripe billing is **not yet implemented** (planned)

### Steps
1. In Vercel dashboard → Storage → **Connect Database** → create a Neon Postgres DB — this auto-sets `DATABASE_URL` in your project env vars
2. Push schema: `npx prisma db push` (with the Neon `DATABASE_URL` in your local `.env`)
3. Set remaining Vercel env vars: `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (`https://your-app.vercel.app/api/auth/gsc/callback`)
4. Add the production redirect URI to your Google OAuth app's authorized redirect URIs
5. Deploy: `vercel --prod`

The build script (`prisma generate && next build`) auto-generates the Prisma client on Vercel.

### Local dev with Postgres
Either run a local Postgres instance, or create a Neon **dev branch** and use its connection string as `DATABASE_URL` in `.env`.

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
- The generate endpoint has `maxDuration = 60` (seconds) for AI calls
- Export supports `?format=md` (default) and `?format=csv` query params
