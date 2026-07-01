# TahfidzFlow v1.0.0 — Release Checklist

**Version:** 1.0.0 · **Target date:** 2026-07-01 (WIB) · **Source commit:** `94ee97b`
**Deploy target:** Vercel (Root Directory = `web`) + Neon PostgreSQL + Upstash Redis

> Work through the gates in order. Do not begin a gate until the previous gate is fully checked
> and signed off. Each command below is run from the repository root unless noted otherwise.

---

## Gate 0 — Scope & sign-off owners

- [ ] Release scope confirmed against [`RELEASE_NOTES.md`](RELEASE_NOTES.md).
- [ ] Release owner assigned: ____________________
- [ ] Database owner (Neon) assigned: ____________________
- [ ] QA owner assigned: ____________________
- [ ] Rollback owner on-call during release window: ____________________

---

## Gate 1 — Code freeze & source integrity

- [ ] `main` is frozen for the release window (no unrelated merges).
- [ ] Working tree is clean: `git status` shows nothing to commit.
- [ ] Release is cut from the intended commit: `git rev-parse HEAD` = `94ee97b…`.
- [ ] Package manifest reviewed — no stray secrets, no `node_modules`, no generated Prisma
      client, no `.env` files (see [`MANIFEST.md`](MANIFEST.md)).
- [ ] `web/package.json` `version` field bumped to `1.0.0` **or** intentionally left as-is
      (decision recorded): ____________________

---

## Gate 2 — Automated verification (must be green)

Run the full pipeline (equivalent to CI):

```bash
# from web/
npm ci
npm run verify        # db:generate → db:validate → lint → typecheck → test → build
```

- [ ] `npm run db:validate` — Prisma schema valid.
- [ ] `npm run lint` — ESLint clean.
- [ ] `npm run typecheck` — no TypeScript errors.
- [ ] `npm run test` — Vitest unit tests pass (`academic-year`, `cache`, `form-helpers`,
      `rate-limit`, `students`).
- [ ] `npm run build` — production build succeeds.
- [ ] GitHub Actions **Verify** workflow is green on the release commit.

---

## Gate 3 — Manual QA & UAT

- [ ] Role-based manual QA completed per [`../../docs/MANUAL_TEST_CHECKLIST.md`](../../docs/MANUAL_TEST_CHECKLIST.md).
- [ ] UAT results reviewed and acceptable per [`../../docs/TEST_RESULTS.md`](../../docs/TEST_RESULTS.md)
      and [`../../docs/UAT_CHECKLIST.md`](../../docs/UAT_CHECKLIST.md).
- [ ] No open **P0** issues per [`../../docs/KNOWN_ISSUES.md`](../../docs/KNOWN_ISSUES.md).
- [ ] Core flows spot-checked: login → dashboard → Quick Log → hafalan → murojaah → Tasmi'
      → formative → summative → export (Excel + PDF).
- [ ] Admin flows spot-checked: teacher/class/halaqah/student CRUD + academic-year archive.
- [ ] Dual-program checks: `ProgramSelector` switches Academic / Boarding / **Semua**;
      Boarding hides grade level & section.
- [ ] i18n: UI switches across Indonesian / English / Arabic; Arabic renders RTL.
- [ ] Dark mode toggles correctly.

### PWA gate (if shipping as an installable PWA)

- [ ] PWA release decision recorded (online-first vs offline-capable) per
      [`../../docs/RELEASE_CHECKLIST.md`](../../docs/RELEASE_CHECKLIST.md).
- [ ] If **online-first**: release notes state that data entry/admin changes require internet
      (already noted in [`RELEASE_NOTES.md`](RELEASE_NOTES.md)).
- [ ] No open PWA **BLOCKER** items per [`../../docs/PWA_BUGS.md`](../../docs/PWA_BUGS.md).
- [ ] Lighthouse PWA audit reviewed; `/manifest.json`, `/sw.js`, `/offline` reachable.

---

## Gate 4 — Environment & infrastructure

- [ ] Neon production database provisioned; connection string uses `sslmode=require`
      (or `verify-full`).
- [ ] Upstash Redis / Vercel KV provisioned in the same region (`sin1`).
- [ ] Vercel project configured: Root Directory = `web`, Framework = Next.js, Install =
      `npm ci`, Build = `npm run build`.
- [ ] Production environment variables set (template: [`config/env.production.example`](config/env.production.example)):
  - [ ] `DATABASE_URL`
  - [ ] `AUTH_SECRET` (freshly generated — **not** the dev secret)
  - [ ] `AUTH_URL` (exact production URL, no trailing slash)
  - [ ] `KV_REST_API_URL` + `KV_REST_API_TOKEN`
  - [ ] `APP_DEFAULT_LOCALE` (optional; defaults to `id`)
- [ ] `NEXTAUTH_URL` is **not** set (app uses `AUTH_URL`).

---

## Gate 5 — Database migration (before deploy)

> Migrations must be applied to the production database **before** the new code goes live.

- [ ] Review migration inventory in [`RELEASE_NOTES.md`](RELEASE_NOTES.md) (17 migrations).
- [ ] Take/confirm a Neon backup or note the pre-release restore point (branch/timestamp).
- [ ] Apply migrations:

  ```bash
  DATABASE_URL="<production>" npx prisma migrate deploy   # or: npm run db:deploy
  ```

- [ ] Confirm status: `DATABASE_URL="<production>" npx prisma migrate status` — up to date.
- [ ] (Optional, if surah reference data is missing) seed reference data only:
      `DATABASE_URL="<production>" npm run db:seed:summative` (idempotent).
- [ ] **Do not** seed demo teachers/students into production.

---

## Gate 6 — Deploy

- [ ] Merge/confirm release commit on `main` (triggers Vercel deploy) **or** trigger the deploy
      manually.
- [ ] Vercel build succeeds; deployment is promoted to Production.
- [ ] Tag the release: `git tag -a v1.0.0 -m "TahfidzFlow v1.0.0" && git push origin v1.0.0`.
- [ ] Create the GitHub Release from tag `v1.0.0` using [`RELEASE_NOTES.md`](RELEASE_NOTES.md).

---

## Gate 7 — Post-deploy verification

Run the post-deploy checklist from [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md):

- [ ] Production URL loads without error.
- [ ] Admin login renders the dashboard; teacher login renders the student list.
- [ ] Locale switches (id/en/ar); Arabic is RTL; dark mode applies.
- [ ] Wrong password shows an error toast; 5 wrong attempts trigger rate-limit block.
- [ ] Unauthenticated `/students` redirects to `/login`; teacher cannot reach `/admin`.
- [ ] Creating a record persists after refresh; Excel export downloads with data.
- [ ] Timestamps show WIB (Asia/Jakarta), not UTC.
- [ ] At least one **active `AcademicYear`** exists.
- [ ] `/manifest.json`, `/sw.js`, `/offline` are reachable.
- [ ] Rate limiter is using Redis (KV env vars present in Vercel; confirm in function logs).

---

## Gate 8 — Communication & closeout

- [ ] Stakeholders notified that v1.0.0 is live.
- [ ] Known limitations communicated (online-first PWA; fixed WIB timezone).
- [ ] `docs/KNOWN_ISSUES.md` reflects current state.
- [ ] Monitoring window observed (errors, login failures, DB connections) — nominal.
- [ ] Release retrospective notes captured (optional): ____________________

---

## Rollback readiness (keep ready throughout)

If any gate 6–8 check fails, follow [`../../docs/ROLLBACK.md`](../../docs/ROLLBACK.md):

- **Code-only issue:** Vercel → Deployments → promote last known-good build (or `npx vercel
  rollback`). Instant; no DB impact.
- **Schema issue:** roll back code, assess schema compatibility; if incompatible, create a Neon
  branch from before the migration and point `DATABASE_URL` at it.
- **Redis issue:** remove `KV_REST_API_URL` / `KV_REST_API_TOKEN` to fall back to in-memory
  rate limiting, redeploy, then fix Redis and restore the vars.

---

## Final sign-off

| Role | Name | Date | Approved |
|---|---|---|---|
| Release owner | | | [ ] |
| Database owner | | | [ ] |
| QA owner | | | [ ] |

- [ ] **v1.0.0 released and verified in production.**
