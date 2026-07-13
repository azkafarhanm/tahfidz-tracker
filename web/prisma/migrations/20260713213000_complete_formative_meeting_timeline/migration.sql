-- Fill legacy empty meeting slots without moving any existing official dates.
-- When a known meeting exists, infer weekly dates around that anchor. Otherwise,
-- use the academic semester start as the initial official date.
WITH year_semesters AS (
    SELECT
        ay."id" AS academic_year_id,
        ay."startDate"::date AS semester_start,
        'GANJIL'::"Semester" AS semester,
        ay."formativeMeetingGanjil" AS meeting_count
    FROM "AcademicYear" ay
    UNION ALL
    SELECT
        ay."id" AS academic_year_id,
        make_date(split_part(ay."year", '/', 2)::integer, 1, 1) AS semester_start,
        'GENAP'::"Semester" AS semester,
        ay."formativeMeetingGenap" AS meeting_count
    FROM "AcademicYear" ay
),
missing_meetings AS (
    SELECT
        ys.academic_year_id,
        ys.semester,
        meeting_number,
        COALESCE(
            (
                SELECT fm."meetingDate" - ((fm."meetingNumber" - meeting_number) * INTERVAL '7 days')
                FROM "FormativeMeeting" fm
                WHERE fm."academicYearId" = ys.academic_year_id
                  AND fm."semester" = ys.semester
                ORDER BY ABS(fm."meetingNumber" - meeting_number), fm."meetingNumber"
                LIMIT 1
            )::date,
            ys.semester_start + ((meeting_number - 1) * INTERVAL '7 days')
        )::date AS meeting_date
    FROM year_semesters ys
    CROSS JOIN LATERAL generate_series(1, GREATEST(1, ys.meeting_count)) AS generated(meeting_number)
    WHERE NOT EXISTS (
        SELECT 1
        FROM "FormativeMeeting" existing
        WHERE existing."academicYearId" = ys.academic_year_id
          AND existing."semester" = ys.semester
          AND existing."meetingNumber" = meeting_number
    )
)
INSERT INTO "FormativeMeeting" (
    "id", "academicYearId", "semester", "meetingNumber", "meetingDate", "createdAt", "updatedAt"
)
SELECT
    'fm-fill-' || academic_year_id || '-' || semester::text || '-' || meeting_number,
    academic_year_id,
    semester,
    meeting_number,
    meeting_date,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM missing_meetings;
