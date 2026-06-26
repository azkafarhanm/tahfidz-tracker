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
| `DATABASE_POOL_MAX` | No | `10` | Max Prisma pool connections. Defaults to 10 (production), 5 (dev) |
| `APP_CACHE_DEBUG` | No | `true` | Enable cache hit/miss logging. Leave unset in production |
| `APP_MEMORY_CACHE_MAX_ENTRIES` | No | `500` | Max in-memory cache entries. Defaults to 500 |

**Do not set** `NEXTAUTH_URL` — the app uses `AUTH_URL` (NextAuth 5 convention).

### Timezone

All date and time formatting is hardcoded to `Asia/Jakarta` (WIB, UTC+7). This applies to:
- Dashboard recent activity timestamps
- Formative and summative detail "recorded at" timestamps
- Student detail history
- Excel and PDF export dates
- PDF footer generated date

There is no per-user timezone setting. If deploying for a different timezone, the `timeZone` value in `web/src/lib/format.ts` and all export route formatters must be changed.

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

### Migration Inventory

All migrations live in `web/prisma/migrations/`:

| Timestamp / Name | Description |
|---|---|
| `20260428061120_init` | Initial schema |
| `20260428190000_academic_classes_halaqah_levels` | Academic class + halaqah level fields |
| `20260504083000_classgroup_academic_class_link` | Link ClassGroup to AcademicClass |
| `20260504103000_classgroup_grade_year_model` | ClassGroup grade + academic year model |
| `20260516193000_add_hot_path_indexes` | Hot-path database indexes |
| `20260520000000_fix_classgroup_unique_add_level` | Fix ClassGroup unique constraint + level |
| `20260524093000_merge_duplicate_classgroups_restore_unique` | Merge duplicate ClassGroups |
| `20260527193000_add_case_insensitive_search_indexes` | Case-insensitive search indexes |
| `20260611092007_add_academic_year_table` | AcademicYear model |
| `20260612124926_add_username_to_user` | User.username field (unique) |
| `20260614105819_add_academic_year_semester_to_records` | academicYear + semester on record tables |
| `20260614193915_add_academic_year_status` | AcademicYearStatus enum + status field |
| `20260615120000_add_audit_log` | AuditLog model + AuditAction enum |
| `20260615140000_add_tasmi_record` | TasmiRecord model + TasmiGrade/TasmiStatus enums |
| `20260615160000_add_program_type` | ProgramType enum on AcademicClass + ClassGroup |
| `audit_log_user_nullable` | AuditLog.userId nullable + onDelete: SetNull |
| `tasmi_student_createdAt_idx` | TasmiRecord @@index([studentId, createdAt]) |

## AcademicYear Setup

After deploying for the first time (or after a database reset):

1. Log in as admin
2. Navigate to **Admin > Tahun Ajaran** (`/admin/academic-years`)
3. Create at least one AcademicYear with start/end dates
4. Set one year as active (only one can be active at a time)
5. The active year is used as the default `academicYear` filter for all records, targets, and scores

Without an active AcademicYear, the system falls back to a default year string. Teachers and students will not function correctly until an active year is established.

## ProgramType Notes

- `AcademicClass` and `ClassGroup` default to `ProgramType.ACADEMIC` when created
- Existing pre-migration data was assigned `ACADEMIC` during the `add_program_type` migration
- Boarding classes/halaqah must be created or edited via admin forms with the Boarding program type selected
- The program type filter is page-level only — there is no global mode switch
- Admin "Semua" (All) queries pass `undefined` for programType, returning both programs

## Database Reset Scripts

For fresh installs or UAT data resets (run from `web/`):

```bash
# Full fresh-install reset: keeps only admin User + 114 Surah
# Deletes ALL teachers, students, classes, halaqah, records, audit logs
node --env-file=.env --import tsx prisma/reset-school.ts

# Operational data reset: keeps teachers, classes, halaqah, surah data
# Deletes students, all records, targets, scores, audit logs
node --env-file=.env --import tsx prisma/reset-uat-data.ts

# Testing data reset
node --env-file=.env --import tsx prisma/reset-testing-data.ts
```

These scripts use `pg` Client directly (not Prisma) and are transaction-wrapped. They do NOT apply migrations — run `npm run db:migrate` first.

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
- [ ] ProgramSelector appears (admin) and switches between ACADEMIC / BOARDING / Semua

### 2. Authentication

- [ ] Wrong password shows error toast
- [ ] Rate limiting works: 5 wrong attempts → temporarily blocked
- [ ] Unauthenticated access to `/students` redirects to `/login`
- [ ] Teacher cannot access `/admin` routes

### 3. Database connectivity

- [ ] Student list loads data from the database
- [ ] Creating a record persists (check after page refresh)
- [ ] Export to Excel downloads a file with data
- [ ] Dashboard timestamps show WIB (Asia/Jakarta) time, not UTC

### 4. AcademicYear

- [ ] At least one active AcademicYear exists
- [ ] Records created under the active year

### 5. PWA

- [ ] `/manifest.json` is accessible
- [ ] `/sw.js` is accessible
- [ ] `/offline` page renders

### 6. Infrastructure

- [ ] `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set (check in Vercel dashboard)
- [ ] Rate limiter is using Redis (check Vercel function logs for Redis calls, or confirm KV env vars are present)

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/verify.yml`) runs on every push to `main` and every PR:

1. **Prisma schema validation** (`npm run db:validate`)
2. **ESLint** (`npm run lint`)
3. **TypeScript type checking** (`npm run typecheck`)
4. **Vitest unit tests** (`npm run test`)
5. **Next.js production build** (`npm run build`)

All steps must pass before merging a PR.

CI uses a local PostgreSQL service container with `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tahfidzflow?schema=public`. Node.js 20 is used.
