# TahfidzFlow

TahfidzFlow is a mobile-first tahfidz tracking system for SMP grades 7-9. It helps teachers record hafalan and murojaah, review formative progress, manage flexible summative assessments, and export reports. Admins can manage teachers, halaqah, classes, students, and system-wide reports.

## Main Features

### Teacher workflow
- Dashboard with daily stats, weekly target progress, and recent activity
- Student list with search, pagination, latest records, and review indicators
- Quick Log guided record entry
- Hafalan and murojaah create/edit/delete with surah + ayah range input
- Formative recap generated automatically from daily records, per semester
- Flexible summative assessment per student and per surah
- Active targets with cancel/complete actions
- Student detail with history, targets, and exports (Excel + PDF)
- Teacher reports with Excel and PDF export

### Admin workflow
- Admin dashboard with system-wide statistics
- Teacher CRUD with activate/deactivate/delete safety guards
- Academic class CRUD
- Halaqah CRUD with teacher assignment and level
- Student CRUD across teachers with admin detail view
- Admin reports with Excel and PDF export

### Platform
- Next.js 15 App Router with Server Components and Server Actions
- Prisma 7 + PostgreSQL (Neon)
- NextAuth 5 (beta) role-based auth with JWT sessions
- Rate-limited login with Upstash Redis persistence
- Full i18n: Indonesian, English, Arabic with RTL support
- PWA: install prompt, service worker, offline banner
- Dark mode (system/light/dark/auto with 6am/6pm schedule)
- Responsive desktop/mobile layout with sidebar navigation
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, COOP
- GitHub Actions CI: schema validation, lint, typecheck, unit tests, build

## Demo Accounts

| Role | Login | Password |
|---|---|---|
| Admin | `admin` | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Database | PostgreSQL (Neon), Prisma 7 |
| Auth | NextAuth 5 beta, bcryptjs |
| Rate Limiting | Upstash Redis |
| i18n | next-intl (id, en, ar) |
| Exports | exceljs (Excel), pdfkit (PDF) |
| Icons | lucide-react |
| Toasts | sonner |
| PWA | Custom service worker, Web App Manifest |
| CI | GitHub Actions |

## Project Layout

```text
tahfidz-tracker/
  .github/workflows/verify.yml
  docs/
  rules.md
  web/
    prisma/
      schema.prisma
      seed.ts
      seed-summative.ts
      migrations/
    messages/
      id.json, en.json, ar.json
    public/
      manifest.json, sw.js
    src/
      app/          -- Next.js App Router pages and layouts
      components/   -- Shared React components
      i18n/         -- Locale config, actions, request handler
      lib/          -- Server utilities (prisma, session, rate-limit, etc.)
      generated/    -- Prisma generated client
```

The Next.js app lives in `web/`. Vercel Root Directory must be set to `web`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host/db?sslmode=require`) |
| `AUTH_SECRET` | Yes | Random secret for NextAuth JWT signing. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Yes | Production URL (e.g., `https://your-domain.com`). Omit for local dev (defaults to `http://localhost:3000`) |
| `KV_REST_API_URL` | Recommended | Upstash Redis REST URL. Rate limiting falls back to in-memory without it |
| `KV_REST_API_TOKEN` | Recommended | Upstash Redis REST token |
| `APP_DEFAULT_LOCALE` | No | Default locale. Defaults to `id` |

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Neon)

### Steps

```bash
cd web
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL and AUTH_SECRET

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000/login`.

### Commands (from `web/`)

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |
| `npm run verify:fast` | generate + validate + lint + typecheck |
| `npm run verify` | Full pipeline including tests and build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:migrate` | Create and apply migration |
| `npm run db:seed` | Seed demo + surah data |
| `npm run db:studio` | Open Prisma Studio |

### Pre-push verification

```bash
npm run verify:fast && npm run build
```

CI runs on every push to `main` and every PR.

## Data Model

- `User` -- auth account (`ADMIN` or `TEACHER` role)
- `Teacher` -- profile linked to User
- `AcademicClass` -- school class (7A, 8B, 9C) scoped by academic year
- `ClassGroup` -- halaqah, owned by a teacher, scoped by grade + academic year
- `Student` -- linked to teacher, class group, and optional academic class
- `MemorizationRecord` -- daily hafalan record (formative source)
- `RevisionRecord` -- daily murojaah record (formative source)
- `Target` -- progress target with date range and status lifecycle
- `SummativeScore` -- per-surah assessment per semester
- `Account`, `Session` -- NextAuth persistent sessions

Business rules:
- Formative scores derive from real daily hafalan and murojaah records
- Summative scores are flexible per student and per surah
- Targets track status lifecycle: ACTIVE -> COMPLETED / CANCELLED / MISSED

## Security

- Role-based auth (ADMIN / TEACHER) enforced at layout and server action level
- Teacher-scoped data isolation via `teacherId` on all user-data models
- IDOR protection in record and student flows
- Login rate limiting: 5 attempts / 10 min window / 15 min block (Upstash Redis)
- Delete/deactivate guards for entities with dependent records
- Security headers on all routes (X-Frame-Options DENY, nosniff, etc.)
- Locale cookie validation prevents injection attacks

## Documentation

| File | Purpose |
|---|---|
| `docs/DEPLOYMENT.md` | Vercel deployment, migrations, KV setup, post-deploy checklist |
| `docs/ROLLBACK.md` | Rollback procedures for Vercel and database |
| `docs/KNOWN_ISSUES.md` | Known outstanding issues |
| `docs/TEST_RESULTS.md` | Full UAT audit results (192 items) |
