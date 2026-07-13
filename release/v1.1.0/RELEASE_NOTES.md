# Release Notes — TahfidzFlow v1.1.0

**Release date:** 14 July 2026  
**Release type:** Minor production release  
**Upgrade from:** v1.0.0

TahfidzFlow v1.1.0 refines the daily teacher workflow, formative and summative
assessment experience, reporting, and release operations without changing the
application's Academic/Boarding foundations.

## Highlights

### ✨ New capabilities

- Navigation, filter, pagination, and scroll context persist across common
  teacher and admin list/detail/edit workflows.
- Published **What's New** notes appear once after login and remain available
  from the Dashboard; the HTML Teacher Guide opens in a new tab.
- Admin sets the first Academic formative meeting date, after which the shared
  semester timeline grows automatically on dates with Academic formative
  activity.

### 📚 Academic formative assessment

- Classes 7, 8, and 9 use one official semester meeting timeline.
- Days without Academic formative activity do not create meetings.
- Empty meetings remain empty for a student; later values are not compressed or
  shifted.
- Academic Formative Excel headers include the official short date in compact,
  vertical meeting columns.

### 📝 Summative assessment

- Teachers can enter or update multiple curriculum target scores in one submit.
- All changed rows are highlighted after saving.
- Academic supports additional memorization entries where applicable.
- **Latest Assessment** follows the final Surah entered in the latest submit,
  preserving teacher input order rather than curriculum order.

### 📄 Reports and exports

- Academic Formative Excel uses the official dated meeting timeline.
- Boarding Formative Excel uses grade-based progress sheets.
- Boarding Summative Excel uses grade sheets with Surah/Nilai blocks and latest
  assessment summaries.
- Teacher PDF output has clearer Academic and Boarding grouping.
- Institutional exports omit the internal Halaqah Level while retaining useful
  class and Halaqah context.
- Program-specific workbook and report presentation behavior is more consistent.

### ⚡ Reliability and UX

- All score fields use a reusable digit-only 0–100 text input, eliminating
  accidental native number changes from wheel, touchpad, arrow keys, or browser
  spinners while keeping mobile numeric keyboards.
- Route-transition skeletons reduce visual flashes during navigation.
- Admin data loading is more resilient to transient database timeouts.
- Record date/time, return context, search reset, Academic Year scoping, and
  edited-record reveal behavior were corrected.
- `npm run verify` no longer depends on a developer's local `.env` for unit and
  regression tests.

## Teacher Guide

The bundled **Panduan Guru TahfidzFlow v1.1** documents What's New, current
program-aware formative and summative workflows, and revised export behavior.
Use `user-guide/User Guide Guru.html` for browser reading or the PDF for print.

## Deployment

1. Review `documentation/DEPLOYMENT.md` and `source-reference/.env.example`.
2. Configure production environment variables in the deployment platform.
3. Apply committed Prisma migrations with `prisma migrate deploy` as described
   in the deployment guide.
4. Run `npm --prefix web run verify` in CI or the release workspace.
5. Deploy the `web/` application and complete the release smoke checks.

## Compatibility and known limits

- Runtime: Vercel serverless / Node.js
- Database: PostgreSQL via Prisma
- Browsers: modern evergreen browsers; installable online-first PWA
- Locales: Indonesian, English, and Arabic
- Data entry remains online-first; there is no offline mutation queue or
  background synchronization.
- Admin CRUD for Release Notes is not included in v1.1.0.

See `CHANGELOG.md` for the complete implementation list and `MANIFEST.md` for
package integrity details.
