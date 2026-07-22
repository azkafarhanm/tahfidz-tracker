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
2. A compact `30 Hari Terakhir` summary for Hadir, Izin, Sakit, and Alfa. The inclusive rolling window is today plus the preceding 29 Jakarta calendar days.
3. Meeting History, where activity days show the activity count followed by Hafalan/Murojaah summaries, while zero-activity days remain valid and explicit.

The existing Academic Meeting Status query returns at most 50 rows through today's Jakarta date. Because the database permits only one row per student/day, those rows necessarily cover the complete rolling 30-day window even if future-dated rows exist. The today metadata and statistics are derived from that same result without another query. The Student and Academic Meeting Status queries run concurrently after authorization. The Student Detail cache key includes the Jakarta day so a midnight rollover cannot reuse yesterday's “today” metadata.

## Regression boundaries

- Hafalan, Murojaah, Tasmi, target, Formative, and Summative mutations are unchanged.
- Student list queries, grade filters, ProgramType selectors, and student creation are unchanged.
- Boarding gets no route access, mutation, relation query, or rendered section.
- Navigation/scroll persistence primitives are reused, not modified.
- Report helpers and every report/export route are unchanged.
- Dashboard helpers and pages are unchanged.

## Database rollout

Apply migration `20260722000000_add_academic_meeting_status` through `npm run db:deploy`. The migration is additive: one enum, one table, indexes, a unique constraint, and two foreign keys. It does not backfill or mutate existing records.
