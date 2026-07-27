# Smart Default Material Lifecycle Audit

## Proven root cause

The database lookup was not the last writer.

Before this fix, every Hafalan form shared `record-material:hafalan` and every
Murojaah form shared `record-material:murojaah`. Neither key contained a
`studentId`. `JuzFilteredSurahInput` read that key in a client `useEffect` after
hydration whenever the server default was empty.

The failing sequence was:

1. Student B's form or Quick Log calls `saveSessionPreference` after a Surah or
   Juz interaction and writes Student B's `{ juz, surah }` to the global
   record-type key.
2. Student A's server query correctly returns `null`.
3. The server render and the first client render initialize
   `JuzFilteredSurahInput.currentValue` and `SurahInput.value` as empty.
4. After hydration, the session-restore effect sees an empty `defaultValue`,
   reads the global key, and calls `setSelectedJuz`, `setCurrentValue`,
   `setInputDefaultValue`, and `setInputVersion`.
5. Incrementing `inputVersion` remounts `SurahInput`. Its local `value` is then
   initialized from Student B's stored Surah.
6. There is no later server-prop synchronization effect, so Student B's Surah
   remains the final visible value for Student A.

This also explains why changing the query did not solve the bug: the query
returned the right empty value, but a later post-hydration writer replaced it.

## Source-by-source audit

| Source | When it runs | Value supplied | Can overwrite? | Effect on the failing final state |
| --- | --- | --- | --- | --- |
| Student record server query | During the Add Hafalan/Add Murojaah RSC render | The selected student's latest `{ surah, fromAyah }`, or `null` | It supplies initial props; it does not run again after hydration | Correct for Student A, but it was not the last writer |
| Quick Log server query | When the Quick Log page data is loaded/refreshed | Per-student latest Hafalan and Murojaah material | Replaces page data on a server refresh | Correctly keyed by student; not the leak |
| Quick Log smart-default helper | On each render after student/type selection | Hafalan history for Hafalan, or Murojaah history for Murojaah | Replaces the `defaultValue` used on the next keyed mount | Student- and type-specific; it never falls back across record types |
| Session Storage restore | Client effect after hydration and after each keyed mount | Previously stored `{ juz, surah }` | **Yes.** It writes four parent states and forces a child remount | **Root cause:** the old key was global by type, not scoped by student |
| Session Storage save | On Surah typing/selection and Juz changes | Current `{ juz, surah }` | Replaces the stored preference | Seeded the global key with Student B's material |
| `JuzFilteredSurahInput` local state | First render; later session restore, reset, or user input | Initial server props, then session/user/reset values | Yes | The session effect changed the correct initial empty state into Student B's Surah |
| Restore/reset `useEffect`s | Restore runs after hydration; reset runs when Quick Log reset key changes | Restore: stored Surah; reset: empty | Yes | Restore caused the bug. Reset can clear it only when explicitly triggered |
| `SurahInput` local state | On mount/remount and user interaction | `defaultValue` on mount, then controlled input text | Yes | It faithfully displayed the bad parent value after `inputVersion` forced a remount |
| Form initialization | Server render and client component state initialization | Server lookup result | Establishes state but does not continuously control it | Initially correct and empty for Student A |
| React hydration | Attaches the client tree, then runs effects | No material by itself | Hydration does not overwrite; post-hydration effects can | It establishes the timing boundary that lets the session restore win after the correct initial render |
| Shared hooks | Navigation and panel-scroll hooks only | URL/scroll context | No material state writes | Not involved |
| Browser `localStorage` | Never used by this material flow | None | No | Not involved |

## Fix

Material session keys are now scoped by both student and record type:

`record-material:<studentId>:<hafalan|murojaah>`

All Add, Edit, and Quick Log callers pass the active `studentId`. Legacy global
keys are left unread, so they cannot leak into any student form. A focused unit
test asserts that Student A and Student B produce different keys.

For Academic students, material lookup is also strictly isolated by record
type:

- Add/Quick Log Hafalan read only `MemorizationRecord`.
- Add/Quick Log Murojaah read only `RevisionRecord`.
- Edit forms read only the record being edited and do not restore a session
  material preference.
- When the matching history is absent, the lookup returns `null` and the UI
  keeps the application default (Juz 30 with no selected Surah). The opposite
  record type is never queried as a fallback.

## Temporary runtime trace

Development builds now emit ordered `[SmartDefaultTrace ...]` entries for:

- server query results and server form initialization;
- Quick Log student selection and smart-default selection;
- `JuzFilteredSurahInput` initialization, hydration, session read/save, reset,
  and committed state;
- `SurahInput` initialization, hydration, user writes, and committed state.

In the formerly failing Student A case, the decisive trace is now a read from
`record-material:<student-A-id>:<type>` with `rawPreference: null`. A value saved
for Student B appears under a different key and is never considered.
