# Academic Meeting Status — Phase 1

## Purpose and boundary

Meeting Status records whether an Academic-program santri joined a tahfidz meeting on a calendar day. It is learning context, not school attendance and not a learning activity. `HADIR` with no Hafalan or Murojaah is valid.

Phase 1 is strictly Academic. Boarding, dashboard, reports, PDF export, and Excel export do not read this entity.

## Data model

`MeetingStatus` contains `studentId`, `programType`, date-only `date`, `status`, nullable `note`, `teacherId`, and timestamps. `MeetingAttendanceStatus` supports `HADIR`, `IZIN`, `SAKIT`, and `ALFA`.

The unique key `(studentId, programType, date)` enforces one status per student/day/program, while a database check constraint rejects non-Academic rows. The server action always writes `ProgramType.ACADEMIC` and uses upsert so editing a date cannot create a duplicate. Foreign keys cascade when a Student is deleted and restrict Teacher deletion while referenced.

## Query and workflow

```text
Academic Student Detail
  -> Meeting Status (one per day)
       -> 0..N Hafalan summaries for the Jakarta day
       -> 0..N Murojaah summaries for the Jakarta day
```

`getStudentDetailData` requests Meeting Status records only with `programType = ACADEMIC`. It builds the timeline only when the student's ClassGroup is Academic. Activity timestamps are converted to Asia/Jakarta day keys; the date-only status value remains the canonical meeting date.

The create/edit page validates active-student scope, teacher ownership (or admin role), Academic program membership, date shape, and enum status. Note input has no `required` attribute and stores blank input as `null`. Save returns to Student Detail with the existing URL-driven highlight behavior.

## Student Detail UX

Academic Student Detail presents the meeting context in this order:

1. A small header metadata line for **today's exact Jakarta date**. If that date has no row, it says “Belum dicatat”; it never falls back to the latest prior status.
2. A compact `Semester Aktif` summary for Hadir, Izin, Sakit, and Alfa. Its boundary comes from the configured active Academic Year and the same active-semester resolver used by the other academic modules.
3. Meeting History grouped into monthly disclosure sections, where activity days show the activity count followed by compact Hafalan/Murojaah summaries, while zero-activity days remain valid and explicit.

The existing Academic Meeting Status timeline query remains capped at 50 rows through today's Jakarta date and continues to supply exact-today metadata. Semester totals cannot safely reuse that capped dataset, so a separate PostgreSQL `groupBy status` query covers the active Academic Year's active-semester date range and returns at most four aggregate rows. The Student, timeline, and aggregation queries run concurrently after authorization. Boarding executes neither Meeting Status query. The Student Detail cache key includes the Jakarta day so a midnight rollover cannot reuse yesterday's “today” metadata.

Monthly grouping is an O(n) in-memory transformation of that existing timeline result and does not add a query. The newest month is open by default and earlier months are closed. Each native `<details>` section can be toggled independently without database or navigation persistence. When `highlight` or `highlights` targets an older meeting, its month is rendered open so the existing scroll/highlight workflow can still reveal it.

## Regression boundaries

- Hafalan, Murojaah, Tasmi, target, Formative, and Summative mutations are unchanged.
- Student list queries, grade filters, ProgramType selectors, and student creation are unchanged.
- Boarding gets no route access, mutation, relation query, or rendered section.
- Navigation/scroll persistence primitives are reused, not modified.
- Report helpers and every report/export route are unchanged.
- Dashboard helpers and pages are unchanged.

## Database rollout

Apply migration `20260722000000_add_academic_meeting_status` through `npm run db:deploy`. The migration is additive: one enum, one table, indexes, a unique constraint, and two foreign keys. It does not backfill or mutate existing records.
