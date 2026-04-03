# Cluster Optimizer

Turn one seed topic into a structured, actionable content cluster — with page roles, publish order, internal link plans, and missing node detection. Powered by Claude AI.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4 + shadcn/ui**
- **PostgreSQL** via Prisma 7 — Neon in production, local Postgres in dev
- **NextAuth v5** — Google sign-in
- **@anthropic-ai/sdk** — Claude Sonnet 4

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL running locally, or a [Neon](https://neon.tech) dev branch

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```env
# Postgres — local instance or Neon dev branch
DATABASE_URL="postgresql://user:password@localhost:5432/cluster_optimizer"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Google OAuth (see step 3)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/gsc/callback"
```

### 3. Create a Google OAuth app

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. **Create OAuth 2.0 Client ID** → Application type: **Web application**
3. Under **Authorized redirect URIs**, add **both**:
   ```
   http://localhost:3000/api/auth/callback/google   ← NextAuth sign-in
   http://localhost:3000/api/auth/gsc/callback      ← GSC data connection
   ```
4. In **APIs & Services → Library**, enable:
   - **Google Search Console API**
5. Copy **Client ID** and **Client Secret** into `.env`

### 4. Init the database

```bash
npx prisma generate   # generate Prisma client
npx prisma db push    # create tables
```

> **Note:** This project uses Prisma 7. The `DATABASE_URL` is read from `.env` via `prisma.config.ts` — no `url =` needed in `schema.prisma`.

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Production (Vercel)

### Prerequisites

- **Vercel Pro** — required; the AI generation route needs up to 60s (Hobby plan caps at 10s)
- Repo pushed to GitHub/GitLab

### 1. Create a Neon database

**Option A — via Vercel (easiest):**
Vercel dashboard → your project → **Storage → Connect Database → Neon**
This automatically sets `DATABASE_URL` in your project env vars.

**Option B — manually:**
Create a DB at [neon.tech](https://neon.tech), copy the connection string, and add it as `DATABASE_URL` in Vercel env vars.

### 2. Push schema to Neon

With the Neon `DATABASE_URL` in your local `.env`:

```bash
npx prisma db push
```

### 3. Set env vars in Vercel

Go to **Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/gsc/callback` |

`DATABASE_URL` is already set if you used the Vercel ↔ Neon integration.

### 4. Add production redirect URIs to your Google OAuth app

In Google Cloud Console → your OAuth client → **Authorized redirect URIs**, add:

```
https://your-app.vercel.app/api/auth/callback/google
https://your-app.vercel.app/api/auth/gsc/callback
```

### 5. Deploy

```bash
vercel --prod
```

Or push to `main` if you have auto-deploy enabled.

---

## Optional: DataForSEO

Not required — the app works without it (falls back to AI-estimated keyword data). To enable real volume, difficulty, and CPC data:

1. Sign up at [dataforseo.com](https://dataforseo.com)
2. Log into the app → **Settings** → enter your DataForSEO login (email) and password
3. Credentials are stored in the database and used automatically on next generation

---

## Common Commands

```bash
npm run dev           # dev server at http://localhost:3000
npm run build         # production build
npm run lint          # ESLint
npx prisma studio     # database GUI
npx prisma db push    # sync schema changes to DB
npx prisma generate   # regenerate Prisma client after schema changes
```
