-- Create AcademicYearStatus enum
CREATE TYPE "AcademicYearStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- Add status column to AcademicYear with default ACTIVE
ALTER TABLE "AcademicYear" ADD COLUMN "status" "AcademicYearStatus" NOT NULL DEFAULT 'ACTIVE';

-- Create index on status
CREATE INDEX "AcademicYear_status_idx" ON "AcademicYear"("status");
