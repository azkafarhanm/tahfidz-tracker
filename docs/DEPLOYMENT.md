# Deployment Guide

## Architecture

TahfidzFlow runs on Vercel with:
- **Database**: Neon PostgreSQL (serverless)
- **Rate Limiting**: Upstash Redis (serverless)
- **Auth**: NextAuth 5 with JWT sessions (stateless)
- **Runtime**: Vercel serverless functions (Node.js)

## Vercel Deployment

### Initial Setup

1. Push code to GitHub (`main` branch)
2. In [Vercel Dashboard](https://vercel.com), import the repository
3. Configure:
   - **Root Directory**: `web`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm ci`
4. Add all environment variables (see below)
5. Deploy

### Subsequent Deployments

Every push to `main` triggers an automatic deployment via Vercel's GitHub integration. No manual steps required.

## Environment Variables

Set these in **Vercel Dashboard > Project > Settings > Environment Variables** for the **Production** environment:

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=verify-full` | Neon connection string. Must include `sslmode=require` or `sslmode=verify-full` |
| `AUTH_SECRET` | Yes | (random 32-byte base64 string) | Generate with `openssl rand -base64 32`. Never reuse the dev secret |
| `AUTH_URL` | Yes | `https://your-domain.com` | Must match the actual production URL. No trailing slash |
| `KV_REST_API_URL` | Recommended | `https://xxx.upstash.io` | From Upstash or Vercel KV. Without this, rate limiting is in-memory only |
| `KV_REST_API_TOKEN` | Recommended | (token string) | Paired with `KV_REST_API_URL` |

**Do not set** `NEXTAUTH_URL` — the app uses `AUTH_URL` (NextAuth 5 convention).

## Prisma Migration Procedure

### When schema changes are introduced

1. **Local development**:
   ```bash
   cd web
   npm run db:migrate   # creates migration SQL + applies locally
   ```

2. **Before deploying to production**, apply migrations to the production database:
   ```bash
   # Option A: via Prisma CLI with production DATABASE_URL
   DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=verify-full" \
     npx prisma migrate deploy

   # Option B: via Neon dashboard SQL editor
   # Copy the SQL from web/prisma/migrations/<timestamp>/migration.sql
   # Execute against the production database
   ```

3. **Verify migration status**:
   ```bash
   DATABASE_URL="<production>" npx prisma migrate status
   ```

4. **Then push to `main`** — Vercel will deploy the new code.

**Important**: Migrations must be applied to the database *before* the new code is deployed. If the code expects a column that doesn't exist yet, the deployment will serve errors until the migration completes.

### Migration files in this project

All migrations live in `web/prisma/migrations/`:

| Timestamp | Name |
|---|---|
| `20260428061120` | `init` |
| `20260428190000` | `academic_classes_halaqah_levels` |
| `20260504083000` | `classgroup_academic_class_link` |
| `20260504103000` | `classgroup_grade_year_model` |
| `20260516193000` | `add_hot_path_indexes` |
| `20260520000000` | `fix_classgroup_unique_add_level` |
| `20260524093000` | `merge_duplicate_classgroups_restore_unique` |
| `20260527193000` | `add_case_insensitive_search_indexes` |

## Upstash Redis / Vercel KV Setup

Rate limiting requires a persistent Redis store to work across serverless function instances.

### Option A: Vercel KV (recommended)

1. In Vercel Dashboard, go to **Storage > Create Database > KV (Redis)**
2. Select the same region as your Neon database
3. Link the KV store to your project
4. Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into the deployment environment

### Option B: Upstash Redis directly

1. Create a free account at [upstash.com](https://upstash.com)
2. Create a Redis database in the same region as your Vercel deployment
3. Copy the **REST API URL** and **REST API Token** from the dashboard
4. Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel environment variables

### Graceful fallback

If `KV_REST_API_URL` or `KV_REST_API_TOKEN` is not set, the rate limiter falls back to an in-memory `Map`. This works for local development but does not persist across serverless cold starts in production.

## Seeding Production

Seed data is for demo/development only. Do **not** seed production with demo accounts.

If surah reference data is needed:

```bash
DATABASE_URL="<production>" npm run db:seed:summative
```

This seeds the 114 Quran surah entries and target surah curriculum mappings. It is idempotent (uses `upsert`).

## Post-Deploy Verification Checklist

Run these checks after every production deployment:

### 1. Application health

- [ ] Open the production URL — page loads without error
- [ ] Log in as admin (`admin` / password) — dashboard renders
- [ ] Log in as teacher — student list renders
- [ ] Switch locale to English — UI translates
- [ ] Switch locale to Arabic — RTL layout renders
- [ ] Toggle dark mode — theme applies

### 2. Authentication

- [ ] Wrong password shows error toast
- [ ] Rate limiting works: 5 wrong attempts → temporarily blocked
- [ ] Unauthenticated access to `/students` redirects to `/login`
- [ ] Teacher cannot access `/admin` routes

### 3. Database connectivity

- [ ] Student list loads data from the database
- [ ] Creating a record persists (check after page refresh)
- [ ] Export to Excel downloads a file with data

### 4. PWA

- [ ] `/manifest.json` is accessible
- [ ] `/sw.js` is accessible
- [ ] `/offline` page renders

### 5. Infrastructure

- [ ] `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set (check in Vercel dashboard)
- [ ] Rate limiter is using Redis (check Vercel function logs for Redis calls, or confirm KV env vars are present)

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/verify.yml`) runs on every push to `main` and every PR:

1. Prisma schema validation
2. ESLint
3. TypeScript type checking
4. Vitest unit tests
5. Next.js production build

All steps must pass before merging a PR.
