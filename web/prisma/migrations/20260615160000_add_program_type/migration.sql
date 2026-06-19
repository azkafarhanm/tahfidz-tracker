-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('ACADEMIC', 'BOARDING');

-- AlterTable: AcademicClass
ALTER TABLE "AcademicClass" ADD COLUMN "programType" "ProgramType" NOT NULL DEFAULT 'ACADEMIC';

-- AlterTable: ClassGroup
ALTER TABLE "ClassGroup" ADD COLUMN "programType" "ProgramType" NOT NULL DEFAULT 'ACADEMIC';

-- DropOldUnique: AcademicClass (drop index, not constraint)
DROP INDEX IF EXISTS "AcademicClass_name_academicYear_key";

-- DropOldUnique: ClassGroup (drop index, not constraint)
DROP INDEX IF EXISTS "ClassGroup_teacherId_academicYear_grade_key";

-- CreateNewUnique: AcademicClass
CREATE UNIQUE INDEX "AcademicClass_name_academicYear_programType_key" ON "AcademicClass"("name", "academicYear", "programType");

-- CreateNewUnique: ClassGroup
CREATE UNIQUE INDEX "ClassGroup_teacherId_academicYear_grade_programType_key" ON "ClassGroup"("teacherId", "academicYear", "grade", "programType");

-- CreateIndex: AcademicClass
CREATE INDEX IF NOT EXISTS "AcademicClass_programType_idx" ON "AcademicClass"("programType");

-- CreateIndex: ClassGroup
CREATE INDEX IF NOT EXISTS "ClassGroup_programType_idx" ON "ClassGroup"("programType");
