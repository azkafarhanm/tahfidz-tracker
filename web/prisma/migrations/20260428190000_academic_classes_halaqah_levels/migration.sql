-- CreateEnum
CREATE TYPE "HalaqahLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "ClassGroup" ADD COLUMN "level" "HalaqahLevel" NOT NULL DEFAULT 'LOW';

-- CreateTable
CREATE TABLE "AcademicClass" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicClass_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "academicClassId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicClass_name_academicYear_key" ON "AcademicClass"("name", "academicYear");

-- CreateIndex
CREATE INDEX "AcademicClass_grade_idx" ON "AcademicClass"("grade");

-- CreateIndex
CREATE INDEX "AcademicClass_isActive_idx" ON "AcademicClass"("isActive");

-- CreateIndex
CREATE INDEX "ClassGroup_level_idx" ON "ClassGroup"("level");

-- CreateIndex
CREATE INDEX "Student_academicClassId_idx" ON "Student"("academicClassId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicClassId_fkey" FOREIGN KEY ("academicClassId") REFERENCES "AcademicClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
