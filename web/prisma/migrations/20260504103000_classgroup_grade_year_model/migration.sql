-- AlterTable
ALTER TABLE "ClassGroup"
ADD COLUMN "academicYear" TEXT,
ADD COLUMN "grade" INTEGER;

-- Backfill new halaqah grouping fields from the previously linked academic class.
UPDATE "ClassGroup" AS cg
SET
  "academicYear" = ac."academicYear",
  "grade" = ac."grade"
FROM "AcademicClass" AS ac
WHERE cg."academicClassId" = ac."id";

-- Make the new fields required.
ALTER TABLE "ClassGroup"
ALTER COLUMN "academicYear" SET NOT NULL,
ALTER COLUMN "grade" SET NOT NULL;

-- Drop old one-class-per-halaqah linkage.
ALTER TABLE "ClassGroup" DROP CONSTRAINT "ClassGroup_academicClassId_fkey";
DROP INDEX "ClassGroup_academicClassId_key";
ALTER TABLE "ClassGroup" DROP COLUMN "academicClassId";

-- New indexes and business-rule uniqueness.
CREATE INDEX "ClassGroup_academicYear_idx" ON "ClassGroup"("academicYear");
CREATE INDEX "ClassGroup_grade_idx" ON "ClassGroup"("grade");
CREATE UNIQUE INDEX "ClassGroup_teacherId_academicYear_grade_key"
ON "ClassGroup"("teacherId", "academicYear", "grade");
