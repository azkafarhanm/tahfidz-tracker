-- Correct legacy backfill dates to use the same UTC-to-Asia/Jakarta day
-- conversion as the existing TypeScript mapping.
WITH meeting_days AS (
    SELECT "academicYear", "semester", ("date" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date AS meeting_date
    FROM "MemorizationRecord"
    UNION
    SELECT "academicYear", "semester", ("date" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date AS meeting_date
    FROM "RevisionRecord"
),
ranked_days AS (
    SELECT
        ay."id" AS academic_year_id,
        md."semester",
        md.meeting_date,
        ROW_NUMBER() OVER (
            PARTITION BY ay."id", md."semester"
            ORDER BY md.meeting_date DESC
        ) AS reverse_position,
        CASE md."semester"
            WHEN 'GANJIL'::"Semester" THEN ay."formativeMeetingGanjil"
            ELSE ay."formativeMeetingGenap"
        END AS meeting_count
    FROM meeting_days md
    JOIN "AcademicYear" ay ON ay."year" = md."academicYear"
),
corrected_days AS (
    SELECT
        academic_year_id,
        "semester",
        meeting_date,
        meeting_count - reverse_position + 1 AS meeting_number
    FROM ranked_days
    WHERE reverse_position <= meeting_count
)
UPDATE "FormativeMeeting" fm
SET "meetingDate" = corrected_days.meeting_date,
    "updatedAt" = CURRENT_TIMESTAMP
FROM corrected_days
WHERE fm."academicYearId" = corrected_days.academic_year_id
  AND fm."semester" = corrected_days."semester"
  AND fm."meetingNumber" = corrected_days.meeting_number
  AND fm."id" LIKE 'fm-%'
  AND fm."id" NOT LIKE 'fm-fill-%';

-- Recalculate only inferred legacy slots around the corrected known dates.
WITH inferred_corrections AS (
    SELECT
        inferred."id",
        (
            SELECT (
                known."meetingDate"
                - ((known."meetingNumber" - inferred."meetingNumber") * INTERVAL '7 days')
            )::date
            FROM "FormativeMeeting" known
            WHERE known."academicYearId" = inferred."academicYearId"
              AND known."semester" = inferred."semester"
              AND known."id" NOT LIKE 'fm-fill-%'
            ORDER BY ABS(known."meetingNumber" - inferred."meetingNumber"), known."meetingNumber"
            LIMIT 1
        ) AS corrected_date
    FROM "FormativeMeeting" inferred
    WHERE inferred."id" LIKE 'fm-fill-%'
)
UPDATE "FormativeMeeting" inferred
SET "meetingDate" = corrections.corrected_date,
    "updatedAt" = CURRENT_TIMESTAMP
FROM inferred_corrections corrections
WHERE inferred."id" = corrections."id"
  AND corrections.corrected_date IS NOT NULL;
