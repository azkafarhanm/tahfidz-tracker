# Release Notes — TahfidzFlow v1.1.1

**Release date:** 14 July 2026  
**Release type:** Patch production release  
**Upgrade from:** v1.1.0

TahfidzFlow v1.1.1 makes daily record entry easier and more stable for teachers.
This release is limited to Surah selection, Juz filtering, Target entry, and Ayat
input improvements. It does not change assessment rules or other business logic.

## Highlights

### Easier Hafalan input

- Teachers can select a Juz first to shorten the Surah list.
- The same selection flow is available in Quick Log, Hafalan, Murojaah, record
  editing, and Target forms.

### Easier Surah search

- Surah names can be found using more natural searches.
- Searches without spaces or hyphens are supported.
- Existing Surah selections remain available when editing records and Targets.

### Improved Target entry

- Target creation and editing use the same Juz filter and Surah search as daily
  record entry.

### More stable Ayat input

- Ayat fields accept digits consistently.
- Native number controls can no longer cause accidental increases or decreases.

## Verification

- Manual QA passed before release preparation.
- Prisma generation and schema validation passed.
- ESLint and TypeScript checks passed.
- All automated tests passed.
- The production Next.js build passed.

## Deployment

1. Review the final release diff and confirm only intended product files are
   included.
2. Merge the verified release commit to `main` and wait for the Vercel production
   deployment to complete.
3. Complete production smoke checks for login, Quick Log, Hafalan, Murojaah,
   record editing, and Target entry.
4. Apply the committed Prisma data migration for the v1.1.1 ReleaseNote.
5. Verify the What's New modal with an unread account and then acknowledge it.

## Rollback

- Roll Vercel back to the last known-good deployment if the application regresses.
- If the announcement must be withdrawn, set the v1.1.1 `ReleaseNote.isPublished`
  value to `false`; do not delete user view history.
