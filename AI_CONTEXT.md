# AI Context: TahfidzFlow

Updated: 2026-05-16

This file is the current handoff context for the TahfidzFlow codebase.

## Current Status

- Production-ready core
- Teacher and admin flows are implemented and build-green
- Formative and summative grading architecture has been refactored
- GitHub Actions CI now verifies schema, lint, typecheck, and build
- Remaining work is mostly test coverage, long-term scaling, and final polish

## Completion Snapshot

| Area | Status |
|---|---|
| Foundation | 100% |
| Teacher workflow | 96% |
| Admin workflow | 100% |
| Grading architecture | 95% |
| Reports and export | 93% |
| Multilingual UI | 95% |
| Layout and theming | 100% |
| Security hardening | 100% |
| Performance baseline | 95% |
| CI verification | 100% |
| Automated tests | 0% |

## What the App Does

### Teacher side
- Dashboard with stats, progress, motivation card, and recent activity
- Student list and detail pages
- Quick Log for fast entry
- Create/edit/delete hafalan and murojaah
- Target CRUD
- Formative recap generated from daily records
- Flexible summative assessments per student and per surah
- Teacher Excel and PDF exports

### Admin side
- Admin dashboard
- Teacher CRUD with deletion guards
- Academic class CRUD
- Halaqah CRUD
- Student CRUD
- Admin-level reports and exports

### Platform
- PWA with install prompt and offline banner
- i18n with Indonesian, English, and Arabic
- RTL support
- Dark mode
- Responsive desktop sidebar and mobile bottom nav

## Important Business Rules

- `AcademicClass` is the school class such as `7A`, `8B`, `9C`
- `ClassGroup` is the halaqah owned by a teacher for a grade and year
- Students from multiple academic sections can share one halaqah
- Formative is derived from daily hafalan and murojaah records
- Summative is flexible per student and per surah
- Target recommendations are not hard grading limits
- Exports remain Indonesian by institutional requirement

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
- Prisma 7 with `@prisma/adapter-pg`
- PostgreSQL / Neon
- NextAuth 5 beta
- next-intl
- exceljs
- pdfkit
- next-themes

## Critical Technical Notes

- Repo root: `D:\tahfidz-tracker`
- App root: `web/`
- Vercel Root Directory must be `web`
- Prisma enums are imported from `@/generated/prisma-next/enums`
- Prisma client is generated under `web/src/generated/prisma-next`
- `next build` is strict and will fail on lint/type issues
- In-memory cache lives in `web/src/lib/cache.ts`
- CI lives in `.github/workflows/verify.yml`

## Key Files

| Path | Purpose |
|---|---|
| `web/src/app/page.tsx` | Teacher/admin dashboard entry |
| `web/src/app/formative/page.tsx` | Formative recap overview |
| `web/src/app/formative/[studentId]/page.tsx` | Formative detail |
| `web/src/app/summative/page.tsx` | Summative overview |
| `web/src/app/summative/[studentId]/page.tsx` | Summative detail |
| `web/src/app/summative/actions.ts` | Summative save/update/delete |
| `web/src/lib/formative.ts` | Formative recap query layer |
| `web/src/lib/summative.ts` | Summative query/save/export helpers |
| `web/src/lib/admin.ts` | Admin query layer |
| `web/src/lib/dashboard.ts` | Dashboard query layer |
| `web/src/auth.ts` | NextAuth setup |
| `web/src/middleware.ts` | Auth middleware |
| `web/prisma/schema.prisma` | Database schema |
| `web/prisma/seed.ts` | Base demo seed |
| `web/prisma/seed-summative.ts` | Surah and target seed |
| `README.md` | Public repo guide |

## Commands

From repo root:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run verify:fast
npm run verify
npm run db:generate
npm run db:validate
npm run db:seed
npm run db:deploy
```

## CI

GitHub Actions runs on:
- push to `main`
- pull requests

Current CI coverage:
- Prisma generate
- Prisma validate
- ESLint
- TypeScript
- Production build

Current CI does not yet include:
- unit tests
- integration tests
- browser/e2e tests

## Remaining Known Gaps

- No automated test suite yet
- No e2e coverage yet
- In-memory cache is per-instance only
- Export routes are synchronous and may need scaling later
- Some accessibility and UX polish remains

## Practical Summary

TahfidzFlow is already suitable for real daily school use. The next best engineering steps are:

1. Add automated tests
2. Add browser/e2e workflow coverage
3. Improve export scalability
4. Keep docs and CI aligned with each refactor
