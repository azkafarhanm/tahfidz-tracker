-- Add academicYear and semester columns to MemorizationRecord
ALTER TABLE "MemorizationRecord" ADD COLUMN "academicYear" TEXT;
ALTER TABLE "MemorizationRecord" ADD COLUMN "semester" "Semester";

-- Backfill MemorizationRecord: derive academicYear and semester from date
UPDATE "MemorizationRecord"
SET
  "academicYear" = CASE
    WHEN EXTRACT(MONTH FROM "date") >= 7
      THEN EXTRACT(YEAR FROM "date") || '/' || (EXTRACT(YEAR FROM "date") + 1)
    ELSE (EXTRACT(YEAR FROM "date") - 1) || '/' || EXTRACT(YEAR FROM "date")
  END,
  "semester" = CASE
    WHEN EXTRACT(MONTH FROM "date") >= 7 THEN 'GANJIL'::"Semester"
    ELSE 'GENAP'::"Semester"
  END
WHERE "academicYear" IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE "MemorizationRecord" ALTER COLUMN "academicYear" SET NOT NULL;
ALTER TABLE "MemorizationRecord" ALTER COLUMN "semester" SET NOT NULL;

-- Add indexes
CREATE INDEX "MemorizationRecord_academicYear_idx" ON "MemorizationRecord"("academicYear");
CREATE INDEX "MemorizationRecord_semester_idx" ON "MemorizationRecord"("semester");
CREATE INDEX "MemorizationRecord_studentId_academicYear_semester_idx" ON "MemorizationRecord"("studentId", "academicYear", "semester");

-- Add academicYear and semester columns to RevisionRecord
ALTER TABLE "RevisionRecord" ADD COLUMN "academicYear" TEXT;
ALTER TABLE "RevisionRecord" ADD COLUMN "semester" "Semester";

-- Backfill RevisionRecord
UPDATE "RevisionRecord"
SET
  "academicYear" = CASE
    WHEN EXTRACT(MONTH FROM "date") >= 7
      THEN EXTRACT(YEAR FROM "date") || '/' || (EXTRACT(YEAR FROM "date") + 1)
    ELSE (EXTRACT(YEAR FROM "date") - 1) || '/' || EXTRACT(YEAR FROM "date")
  END,
  "semester" = CASE
    WHEN EXTRACT(MONTH FROM "date") >= 7 THEN 'GANJIL'::"Semester"
    ELSE 'GENAP'::"Semester"
  END
WHERE "academicYear" IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE "RevisionRecord" ALTER COLUMN "academicYear" SET NOT NULL;
ALTER TABLE "RevisionRecord" ALTER COLUMN "semester" SET NOT NULL;

-- Add indexes
CREATE INDEX "RevisionRecord_academicYear_idx" ON "RevisionRecord"("academicYear");
CREATE INDEX "RevisionRecord_semester_idx" ON "RevisionRecord"("semester");
CREATE INDEX "RevisionRecord_studentId_academicYear_semester_idx" ON "RevisionRecord"("studentId", "academicYear", "semester");
