CREATE TABLE "FormativeMeeting" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "meetingDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormativeMeeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormativeMeeting_academicYearId_semester_meetingNumber_key"
ON "FormativeMeeting"("academicYearId", "semester", "meetingNumber");

CREATE INDEX "FormativeMeeting_academicYearId_semester_meetingDate_idx"
ON "FormativeMeeting"("academicYearId", "semester", "meetingDate");

ALTER TABLE "FormativeMeeting"
ADD CONSTRAINT "FormativeMeeting_academicYearId_fkey"
FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the exact record-day timeline used by the existing Academic
-- Formative export. Distinct days are right-aligned to the configured meeting
-- count, so previously empty early meetings remain empty.
WITH meeting_days AS (
    SELECT "academicYear", "semester", ("date" AT TIME ZONE 'Asia/Jakarta')::date AS meeting_date
    FROM "MemorizationRecord"
    UNION
    SELECT "academicYear", "semester", ("date" AT TIME ZONE 'Asia/Jakarta')::date AS meeting_date
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
visible_days AS (
    SELECT
        academic_year_id,
        "semester",
        meeting_date,
        meeting_count - reverse_position + 1 AS meeting_number
    FROM ranked_days
    WHERE reverse_position <= meeting_count
)
INSERT INTO "FormativeMeeting" (
    "id", "academicYearId", "semester", "meetingNumber", "meetingDate", "createdAt", "updatedAt"
)
SELECT
    'fm-' || academic_year_id || '-' || "semester"::text || '-' || meeting_number,
    academic_year_id,
    "semester",
    meeting_number,
    meeting_date,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM visible_days;
