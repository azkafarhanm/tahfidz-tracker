# Changelog

All notable changes to **TahfidzFlow v1.1.1** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2026-07-14

### Improved — Teacher Record Entry

- **Faster Surah selection.** Hafalan, Murojaah, Quick Log, and Target forms now
  provide a Juz filter so teachers can narrow the Surah list before making a
  selection.
- **Easier Surah search.** Surah names can be found using more natural searches,
  including searches without spaces or hyphens and commonly used name variations.
- **Improved Target entry.** Target creation and editing now use the same Juz
  filter and improved Surah search as daily record-entry forms.
- **Existing selections remain safe when editing.** A previously selected Surah
  remains available when editing, even when it falls outside the currently
  selected Juz filter.

### Fixed

- **More stable Ayat input.** Ayat fields now accept digits consistently and
  avoid accidental changes caused by native number-field controls.
- **Consistent input across teacher workflows.** Hafalan, Murojaah, Quick Log,
  record editing, and Target forms now share the same Surah and Ayat input
  behavior.

---

## [1.1.0] — 2026-07-14

See [`../v1.1.0/CHANGELOG.md`](../v1.1.0/CHANGELOG.md) for the complete v1.1.0
history.

[1.1.1]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.1.0
