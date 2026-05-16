# TahfidzFlow

TahfidzFlow is a mobile-first tahfidz tracking system for SMP grades 7-9. It helps teachers record hafalan and murojaah, review formative progress, manage flexible summative assessments, and export reports. Admins can manage teachers, halaqah, classes, students, and system-wide reports.

Status: production-ready core, with CI verification and strong teacher/admin workflows.

## Main Features

### Teacher workflow
- Dashboard with daily stats, weekly target progress, and recent activity
- Student list with search, latest records, and review indicators
- Quick Log guided record entry
- Hafalan and murojaah create/edit/delete
- Formative recap generated automatically from daily records
- Flexible summative assessment per student and per surah
- Student detail with history, targets, and exports
- Teacher reports with Excel and PDF export

### Admin workflow
- Admin dashboard with system-wide statistics
- Teacher CRUD with safety guards
- Academic class CRUD
- Halaqah CRUD with teacher assignment
- Student CRUD across teachers
- Admin reports with Excel and PDF export

### Platform
- Next.js App Router with Server Components and Server Actions
- Prisma 7 + PostgreSQL
- NextAuth 5 role-based auth
- Full i18n: Indonesian, English, Arabic with RTL support
- PWA install prompt, service worker, offline banner
- Dark mode and responsive desktop/mobile layout
- GitHub Actions CI for schema validation, lint, typecheck, and build

## Demo Accounts

| Role | Login | Password |
|---|---|---|
| Admin | `admin` | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

## Tech Stack

- Next.js 15.5.15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Prisma 7
- PostgreSQL / Neon
- next-intl
- next-auth
- exceljs
- pdfkit
- lucide-react
- sonner

## Project Layout

```text
tahfidz-tracker/
  AI_CONTEXT.md
  README.md
  package.json
  .github/workflows/verify.yml
  web/
    package.json
    prisma/
      schema.prisma
      seed.ts
      seed-summative.ts
    messages/
      id.json
      en.json
      ar.json
    src/
      app/
      components/
      i18n/
      lib/
      generated/
```

Important:
- Repository root is `D:\tahfidz-tracker`
- The real Next.js app lives in `web/`
- Vercel Root Directory must be `web`

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Run locally

```bash
npm install
cp web/.env.example web/.env
# Fill DATABASE_URL and AUTH_SECRET

npm run db:generate
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000/login
```

## Commands

From repo root:

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run verify:fast` | Fast local check |
| `npm run verify` | Full validation pipeline |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:seed` | Seed demo data |
| `npm run db:deploy` | Deploy Prisma migrations |

## Verification Workflow

Recommended local workflow before pushing:

```bash
npm run verify:fast
npm run build
```

CI runs automatically on every push to `main` and every pull request.

Current CI checks:
- Prisma client generation
- Prisma schema validation
- ESLint
- TypeScript
- Next.js production build

## Deployment

### Vercel
1. Connect the repository
2. Set Root Directory to `web`
3. Framework Preset: `Next.js`
4. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL`
5. Deploy

## Data Model Summary

- `User`: auth account with `ADMIN` or `TEACHER`
- `Teacher`: linked to a user
- `AcademicClass`: school class such as `7A`, `8B`, `9C`
- `ClassGroup`: halaqah owned by a teacher, scoped by grade and academic year
- `Student`: linked to teacher, halaqah, and optional academic class
- `MemorizationRecord`: daily hafalan record, also formative source
- `RevisionRecord`: daily murojaah record, also formative source
- `Target`: progress target with date range
- `SummativeScore`: flexible per-surah assessment per semester
- `Surah` and `TargetSurah`: surah master data and target recommendations

Business rule:
- Formative scores come from real daily hafalan and murojaah records
- Summative scores are flexible per student and per surah
- Class targets are for monitoring and recommendation, not rigid grading limits

## Security and Reliability

- Role-based auth
- Teacher-scoped data isolation
- IDOR protection in record flows
- Delete/deactivate guards for related data
- Build-green verification path
- 30-second in-memory cache with explicit invalidation

## Current Gaps

- No automated unit test suite yet
- No automated browser/e2e tests yet
- Cache is in-memory only, not shared across instances
- Large export jobs are still synchronous request-time generation
- Some accessibility polish remains on icon-only controls

## Practical Status

The app is very close to complete for real daily use. The biggest remaining work is not missing core features anymore. The next best improvements are:

1. Add a real automated test layer
2. Add browser/e2e workflow coverage
3. Improve export scalability for larger datasets
4. Continue polish and accessibility cleanup
