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

## Regression boundaries

- Hafalan, Murojaah, Tasmi, target, Formative, and Summative mutations are unchanged.
- Student list queries, grade filters, ProgramType selectors, and student creation are unchanged.
- Boarding gets no route access, mutation, relation query, or rendered section.
- Navigation/scroll persistence primitives are reused, not modified.
- Report helpers and every report/export route are unchanged.
- Dashboard helpers and pages are unchanged.

## Database rollout

Apply migration `20260722000000_add_academic_meeting_status` through `npm run db:deploy`. The migration is additive: one enum, one table, indexes, a unique constraint, and two foreign keys. It does not backfill or mutate existing records.
