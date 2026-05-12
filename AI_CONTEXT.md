# AI Context: TahfidzFlow

Updated: 2026-05-12

This file is the current handoff context for the TahfidzFlow codebase.

## Snapshot

- **Status: Production-ready (99%+)**
- All core features implemented and deployed
- All server action messages fully translated (ID/EN/AR)
- Security hardened (IDOR, orphan prevention, error boundaries)
- Performance optimized (server cache, dynamic imports, font optimization)
- PWA with service worker, offline banner, and install prompt

## Completion by Area

| Area | Status |
|---|---|
| Foundation (auth, DB, layout) | 100% |
| Teacher workflow (records, targets, reports) | 100% |
| Summative assessment (per-surah scoring, grid, export) | 100% |
| Admin management (CRUD, guards) | 100% |
| Reports & export (Excel, PDF) | 100% |
| Multilingual (ID/EN/AR, RTL) | 100% |
| Dark mode + desktop layout | 100% |
| Performance optimization | 100% |
| Security hardening | 100% |
| PWA (service worker, offline) | 95% |
| Telegram integration | 0% (not planned) |
| AI parser | 0% (not planned) |

## What the App Does

### Teacher side
- Dashboard with stats, progress, overdue targets, motivation card
- Student list with search, review status indicators
- Quick Log guided flow for fast entry
- Create/edit/delete hafalan and murojaah records
- Student detail with history, scores, targets
- Target CRUD with progress bars
- Edit/deactivate/reactivate students
- Teacher reports with Excel and PDF export
- Summative per-surah scoring with spreadsheet grid UI
- Summative Excel export per class/semester

### Admin side
- Admin dashboard with system-wide stats
- Teacher CRUD with deletion guards
- Academic class CRUD with deactivation guards
- Halaqah CRUD with teacher assignment and duplication check
- Student CRUD with cross-teacher management
- Admin reports with system-wide exports

### Platform
- NextAuth 5 JWT auth with role-based access
- Teacher-scoped data isolation
- PWA install + service worker + offline banner
- Full i18n: 40 namespaces across ID/EN/AR with RTL
- Dark mode (next-themes, system-aware)
- Desktop sidebar + mobile bottom nav
- Surah autocomplete (114 surahs) with juz auto-calculation
- 70+ animated Quran motivation verses
- Initials avatars with color hash

## Business Rules

- `AcademicClass` = school class (7A, 7B, 8A, 9C)
- `ClassGroup` = halaqah per teacher per grade per year
- Unique constraint: `@@unique([teacherId, academicYear, grade])`
- Students from different sections can share a halaqah
- `Student` belongs to one `Teacher`, one `ClassGroup`, optional `AcademicClass`
- Halaqah levels: LOW, MEDIUM, HIGH (English labels in UI)
- Record statuses: LANCAR, CUKUP, PERLU_MUROJAAH
- Grades restricted to 7-9 (SMP only)
- Exports (PDF/Excel) always output in Indonesian via `export-lang.ts`

## Demo Accounts

| Role | Login | Password |
|---|---|---|
| Admin | `admin` (alias for admin@tahfidzflow.local) | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

## Tech Stack

- Next.js 15.5.15 (App Router, Server Components, Server Actions)
- React 19, TypeScript 5
- Tailwind CSS 4 (CSS-based config)
- Prisma 7 with `@prisma/adapter-pg` adapter pattern
- PostgreSQL (Neon serverless)
- NextAuth 5 beta (JWT strategy)
- next-intl (40 namespaces × 3 locales)
- exceljs, pdfkit (exports)
- sonner (toasts), lucide-react (icons)
- next-themes (dark mode)
- Vercel deployment

## Critical Technical Notes

- Project root: `D:\tahfidz-tracker`, app in `web/` subdirectory
- Vercel Root Directory must be `web`
- Prisma 7: adapter-based, output at `src/generated/prisma-next`
- Enum imports: `from "@/generated/prisma-next/enums"` (never `/client`)
- Legacy webpack only (Turbopack disabled)
- `prisma.config.ts` for datasource URL (not schema.prisma)
- PDFKit generates `Buffer` → wrap with `new Uint8Array()` for `NextResponse`
- `template.tsx` returns `{children}` directly (no animation wrapper — broke `position: fixed`)
- `AppShell` uses React fragments so Sidebar is direct child of `<body>`
- `next build` runs ESLint strictly — unused vars/imports fail the build
- Server cache (`lib/cache.ts`): 30s TTL, 60s GC sweep, prefix-based invalidation
- Service worker (`public/sw.js`): cache-first for static, network-first for pages
- `validate-record.ts`: shared validation with i18n via `getTranslations("Validation")`

## Key File Map

| Path | Purpose |
|---|---|
| `web/src/app/layout.tsx` | Root layout, fonts, providers, PWA |
| `web/src/app/page.tsx` | Dashboard (teacher or admin) |
| `web/src/app/admin/layout.tsx` | Admin layout with `AdminShell` |
| `web/src/app/login/page.tsx` | Login with FloatingSurahs animation |
| `web/src/app/global-error.tsx` | Standalone error boundary (no providers) |
| `web/src/app/admin/error.tsx` | Admin segment error boundary |
| `web/src/app/students/error.tsx` | Students segment error boundary |
| `web/src/components/Sidebar.tsx` | Desktop sidebar with translated nav |
| `web/src/components/AppShell.tsx` | Teacher layout wrapper |
| `web/src/components/AdminShell.tsx` | Admin layout wrapper |
| `web/src/components/OfflineBanner.tsx` | Offline detection banner |
| `web/src/app/summative/page.tsx` | Summative grid server page |
| `web/src/app/summative/SummativeGrid.tsx` | Spreadsheet grid client component |
| `web/src/app/summative/actions.ts` | Batch save summative scores |
| `web/src/app/api/reports/export-summative/route.ts` | Summative Excel export |
| `web/src/components/ServiceWorkerRegistrar.tsx` | SW registration (production only) |
| `web/src/lib/cache.ts` | In-memory TTL cache with GC |
| `web/src/lib/validate-record.ts` | Shared record validation with i18n |
| `web/src/lib/academic-year.ts` | Dynamic academic year calculation |
| `web/src/lib/export-lang.ts` | Indonesian-only dictionary for exports |
| `web/src/lib/dashboard.ts` | Dashboard queries (cached) |
| `web/src/lib/students.ts` | Student queries (cached) |
| `web/src/lib/reports.ts` | Report queries (cached) |
| `web/src/lib/summative.ts` | Summative score CRUD, grid, summary (cached) |
| `web/src/lib/admin.ts` | Admin queries (cached) |
| `web/src/lib/format.ts` | Date formatting, status labels |
| `web/src/i18n/request.ts` | next-intl config, cookie-based locale |
| `web/src/i18n/actions.ts` | `setLocale()` server action |
| `web/src/auth.ts` | NextAuth config, PrismaAdapter |
| `web/src/auth.config.ts` | Auth callbacks, middleware auth check |
| `web/src/middleware.ts` | NextAuth middleware |
| `web/messages/{id,en,ar}.json` | 40+ namespaces × 3 locales |
| `web/prisma/schema.prisma` | DB schema with 8 composite indexes + Surah, SummativeScore, TargetSurah |
| `web/prisma/seed-summative.ts` | Seeds 114 surahs + class target mappings |
| `web/public/sw.js` | Service worker |
| `web/public/manifest.json` | PWA manifest |

## Commands

From repo root:
```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run verify       # Full verification (generate + validate + lint + typecheck + build)
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed demo data
npm run db:seed-summative  # Seed surahs + targets (tsx prisma/seed-summative.ts)
npm run db:studio    # Prisma Studio
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=verify-full"
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Remaining Known Items

- No automated test suite
- No CI pipeline (manual verify before push)
- PWA maskable icon needs proper safe-area padding (cosmetic)
- Some `aria-label` attributes missing on icon-only buttons (accessibility)
- Pagination not implemented (fine for current scale, needed when data grows)

## Practical Summary

TahfidzFlow is a production-ready tahfidz tracking system. All core features, security, i18n, performance, and PWA are complete. The app is deployed on Vercel and ready for real users.
