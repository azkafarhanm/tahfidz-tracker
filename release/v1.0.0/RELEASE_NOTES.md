# Release Notes — TahfidzFlow v1.0.0

**Release date:** 1 July 2026
**Release type:** First production release (General Availability)
**Codename:** —
**Application name:** TahfidzFlow *(unchanged)*

---

## What is TahfidzFlow?

TahfidzFlow is a mobile-first Quran memorization tracking platform for Islamic
schools (SMP grades 7–9). It helps teachers record Hafalan, Murojaah, and Tasmi'
sessions, review auto-generated formative recaps, manage flexible summative
assessments, and export reports. Admins manage teachers, halaqah, classes,
students, and academic years with a full audit trail for destructive operations.

It is built around a **dual-program architecture** (Academic and Boarding) so a
single school can run both a regular day program and a residential (pondok)
program in one system.

---

## What's new in v1.0.0

This is the inaugural release. Highlights:

- **Complete teacher workflow** — Dashboard → Students → Quick Log →
  Hafalan → Murojaah → Tasmi' → Formative recap → Summative → Reports.
- **Dual-program system** — Academic / Boarding context switching with
  program-aware filtering on every page.
- **Audit trail** — all destructive operations (student / year / Tasmi'
  deletion) are logged and survive user deletion.
- **Exports** — Excel and PDF, scoped per teacher, student, and admin, with
  program-suffixed filenames.
- **Trilingual + RTL** — Indonesian, English, and Arabic.
- **Installable online-first PWA** — manifest, service worker, install prompt,
  and cached offline page.
- **Security** — role-based auth, rate limiting (Redis-backed), IDOR protection,
  security headers.

---

## Important notes before deploying

### 1. This is an online-first PWA

Data entry and all admin changes **require an internet connection**. There is no
offline mutation queue, background sync, or draft persistence in this release.
End users should be told this up front. The cached `/offline` page only handles
navigation failures, not form submissions. See
`documentation/PWA_READINESS_REPORT.md` for the full offline-behavior matrix.

### 2. Required environment variables

Production deployment requires, at minimum:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon PostgreSQL connection string (must include `sslmode=require` or `verify-full`) |
| `AUTH_SECRET` | **Yes** | Random 32-byte base64 secret (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | **Yes** | Exact production URL, no trailing slash |
| `KV_REST_API_URL` | Recommended | Upstash Redis — without it, rate limiting falls back to in-memory |
| `KV_REST_API_TOKEN` | Recommended | Paired with `KV_REST_API_URL` |

> Do **not** set `NEXTAUTH_URL` — the app uses `AUTH_URL` (NextAuth 5 convention).
> See `documentation/DEPLOYMENT.md` and `source-reference/.env.example`.

### 3. Pre-release P0 issues — all resolved

Four P0 issues were found during UAT and **all are fixed** before this release:

1. Global error page used hardcoded Indonesian → English fallback added.
2. No locale-cookie validation → guard added with silent fallback.
3. In-memory rate limiter not production-safe → Redis primary, in-memory fallback.
4. Arabic locale missing 9 keys → all nine added.

See `documentation/KNOWN_ISSUES.md`.

---

## Compatibility

- **Runtime:** Vercel serverless (Node.js).
- **Database:** PostgreSQL (Neon), via Prisma 7.8 and `@prisma/adapter-pg`.
- **Browsers:** Modern evergreen browsers; PWA install supported on Chromium
  (Android/Desktop/Windows) and iOS Safari Add-to-Home-Screen.
- **Supported locale:** `id` (default), `en`, `ar`.

---

## Installation / Deployment

TahfidzFlow deploys to Vercel from the `main` branch (root directory: `web`).

1. Push `main` to GitHub.
2. Import the repository in Vercel (Framework Preset: Next.js; Build: `npm run build`).
3. Add the required environment variables (see above) for the **Production** environment.
4. Deploy. Subsequent pushes to `main` auto-deploy.

Full step-by-step instructions, rollback procedure, and verification commands
are in `documentation/DEPLOYMENT.md` and `documentation/ROLLBACK.md`.

---

## Verification status

- Lint, typecheck, and build scripts are defined in the source reference
  (`source-reference/package.web.json`): `npm run lint`, `npm run typecheck`,
  `npm run build`, and the combined `npm run verify`.
- UAT audit snapshot and manual test checklists are in `documentation/`.

---

## Known limitations

- **Online-first only** (see above).
- **No prior release tags** — this is the first tagged release; no upgrade path exists yet.
- PWA install guidance is present for Chromium; iOS-specific guidance is minimal.

---

## What's in this package

See `README.md` (this folder) for a description of every folder, and
`MANIFEST.md` for the full file listing.

---

## Support

For defects or questions, follow your organization's issue-reporting process and
attach the relevant document from the `documentation/` folder.
