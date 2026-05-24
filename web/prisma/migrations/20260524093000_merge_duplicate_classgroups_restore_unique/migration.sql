WITH ranked_groups AS (
  SELECT
    cg.id,
    cg."teacherId",
    cg."academicYear",
    cg.grade,
    ROW_NUMBER() OVER (
      PARTITION BY cg."teacherId", cg."academicYear", cg.grade
      ORDER BY cg."isActive" DESC, cg."updatedAt" DESC, cg."createdAt" DESC, cg.id DESC
    ) AS row_number,
    FIRST_VALUE(cg.id) OVER (
      PARTITION BY cg."teacherId", cg."academicYear", cg.grade
      ORDER BY cg."isActive" DESC, cg."updatedAt" DESC, cg."createdAt" DESC, cg.id DESC
    ) AS keeper_id
  FROM "ClassGroup" cg
),
reassigned_students AS (
  UPDATE "Student" s
  SET "classGroupId" = rg.keeper_id
  FROM ranked_groups rg
  WHERE s."classGroupId" = rg.id
    AND rg.row_number > 1
  RETURNING s.id
)
DELETE FROM "ClassGroup" cg
USING ranked_groups rg
WHERE cg.id = rg.id
  AND rg.row_number > 1;

DROP INDEX IF EXISTS "ClassGroup_teacherId_academicYear_grade_level_key";
DROP INDEX IF EXISTS "ClassGroup_teacherId_academicYear_grade_key";

CREATE UNIQUE INDEX "ClassGroup_teacherId_academicYear_grade_key"
  ON "ClassGroup" ("teacherId", "academicYear", "grade");
