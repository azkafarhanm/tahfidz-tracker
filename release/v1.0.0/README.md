# TahfidzFlow — Release Package v1.0.0

This folder is the **production release package** for TahfidzFlow v1.0.0. It bundles
everything a release owner needs to cut, ship, verify, and (if necessary) roll back the
v1.0.0 release. It contains **documentation and configuration templates only** — it does
not contain application code, build artifacts, or secrets.

- **Product:** TahfidzFlow — mobile-first Quran memorization (tahfidz) tracker for Islamic schools
- **Version:** 1.0.0
- **Release date:** 2026-07-01 (Asia/Jakarta, WIB)
- **Source commit:** `94ee97b` (`feat: improve admin halaqah workflow and i18n export notifications`)
- **Repository:** https://github.com/azkafarhanm/tahfidz-tracker
- **Deploy target:** Vercel (Root Directory = `web`), Neon PostgreSQL, Upstash Redis

## Contents

| File | Purpose |
|---|---|
| [`README.md`](README.md) | This index — how the release package is organized |
| [`RELEASE_NOTES.md`](RELEASE_NOTES.md) | What ships in v1.0.0: features, data model, known limitations |
| [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) | Gated pre-release → release → post-release checklist with sign-off |
| [`MANIFEST.md`](MANIFEST.md) | Every file that belongs in the release package, with include/exclude rules |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history for v1.0.0 |
| [`config/env.production.example`](config/env.production.example) | Production environment variable template (no secrets) |
| [`artifacts/README.md`](artifacts/README.md) | How to produce the versioned source tarball / build artifacts |

## How to use this package

1. Read [`RELEASE_NOTES.md`](RELEASE_NOTES.md) to confirm scope.
2. Work top-to-bottom through [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md); do not skip a gate.
3. Use [`MANIFEST.md`](MANIFEST.md) to build the source archive and confirm nothing extra
   (secrets, `node_modules`, generated client) is shipped.
4. Configure production environment variables from [`config/env.production.example`](config/env.production.example).
5. Deploy per [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md); keep
   [`../../docs/ROLLBACK.md`](../../docs/ROLLBACK.md) open during the release window.

## Authoritative source documents

This package **references** rather than duplicates the living project docs. The source of
truth for each area stays in `docs/`:

- Deployment: [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md)
- Rollback: [`docs/ROLLBACK.md`](../../docs/ROLLBACK.md)
- Known issues: [`docs/KNOWN_ISSUES.md`](../../docs/KNOWN_ISSUES.md)
- UAT audit: [`docs/TEST_RESULTS.md`](../../docs/TEST_RESULTS.md) and [`docs/UAT_CHECKLIST.md`](../../docs/UAT_CHECKLIST.md)
- Manual QA: [`docs/MANUAL_TEST_CHECKLIST.md`](../../docs/MANUAL_TEST_CHECKLIST.md)
- PWA release gate: [`docs/RELEASE_CHECKLIST.md`](../../docs/RELEASE_CHECKLIST.md), [`docs/PWA_READINESS_REPORT.md`](../../docs/PWA_READINESS_REPORT.md), [`docs/PWA_BUGS.md`](../../docs/PWA_BUGS.md)
