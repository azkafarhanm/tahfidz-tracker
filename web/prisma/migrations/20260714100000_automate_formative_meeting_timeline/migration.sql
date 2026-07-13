-- Remove inferred meetings that never had Academic Formative activity. Meeting
-- 1 is always retained because it is the administrator-defined semester start.
DELETE FROM "FormativeMeeting" fm
WHERE fm."meetingNumber" > 1
  AND NOT EXISTS (
      SELECT 1
      FROM (
          SELECT mr."date", mr."studentId", mr."academicYear", mr."semester"
          FROM "MemorizationRecord" mr
          UNION ALL
          SELECT rr."date", rr."studentId", rr."academicYear", rr."semester"
          FROM "RevisionRecord" rr
      ) records
      JOIN "Student" student ON student."id" = records."studentId"
      JOIN "ClassGroup" class_group ON class_group."id" = student."classGroupId"
      JOIN "AcademicYear" academic_year ON academic_year."year" = records."academicYear"
      WHERE academic_year."id" = fm."academicYearId"
        AND records."semester" = fm."semester"
        AND class_group."programType" = 'ACADEMIC'::"ProgramType"
        AND (records."date" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date = fm."meetingDate"
  );

-- Close numbering gaps after removing inactive inferred dates.
WITH desired_numbers AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "academicYearId", "semester"
            ORDER BY "meetingDate", "meetingNumber"
        )::integer AS desired_number
    FROM "FormativeMeeting"
)
UPDATE "FormativeMeeting" fm
SET "meetingNumber" = -desired.desired_number
FROM desired_numbers desired
WHERE fm."id" = desired."id";

UPDATE "FormativeMeeting"
SET "meetingNumber" = -"meetingNumber"
WHERE "meetingNumber" < 0;

ALTER TABLE "AcademicYear" DROP COLUMN "formativeMeetingGanjil";
ALTER TABLE "AcademicYear" DROP COLUMN "formativeMeetingGenap";
