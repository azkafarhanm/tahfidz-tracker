-- Drop the old unique constraint (teacherId, academicYear, grade)
DROP INDEX IF EXISTS "ClassGroup_teacherId_academicYear_grade_key";

-- Add the corrected unique constraint (teacherId, academicYear, grade, level)
CREATE UNIQUE INDEX "ClassGroup_teacherId_academicYear_grade_level_key"
  ON "ClassGroup" ("teacherId", "academicYear", "grade", "level");
