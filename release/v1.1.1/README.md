# TahfidzFlow — Release v1.1.1

**Release date:** 14 July 2026  
**Application:** TahfidzFlow  
**Release type:** Patch production release

This folder is the release package for **TahfidzFlow v1.1.1**. It documents the
focused teacher input improvements included in this patch. The complete
application source remains in `web/`.

Read `RELEASE_NOTES.md` first for release highlights and deployment notes,
`CHANGELOG.md` for the exact changes, and `MANIFEST.md` for the release file list
and checksums.

## Folder structure

```text
release/v1.1.1/
├── README.md
├── CHANGELOG.md
├── RELEASE_NOTES.md
└── MANIFEST.md
```

## Release scope

- Easier Hafalan, Murojaah, and Quick Log Surah selection.
- Juz filtering for daily record and Target forms.
- More flexible Surah search.
- Consistent Target selection behavior.
- More stable Ayat input.

No assessment rules, data calculations, authorization rules, reporting logic,
or other business logic are changed by this patch.

## Source of truth

- Application version: `web/package.json`
- Detailed project history: root `CHANGELOG.md`
- In-app announcement: Prisma `ReleaseNote` data migration for version `1.1.1`
- Deployment process: `docs/DEPLOYMENT.md`
- Rollback process: `docs/ROLLBACK.md`

## Release boundaries

This package intentionally excludes generated Graphify artifacts, Codex-local
configuration, repository instruction files, old release ZIP files, and other
temporary local files.
