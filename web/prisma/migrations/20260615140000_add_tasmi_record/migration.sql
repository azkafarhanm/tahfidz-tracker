-- CreateEnum
CREATE TYPE "TasmiGrade" AS ENUM ('MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL');

-- CreateEnum
CREATE TYPE "TasmiStatus" AS ENUM ('LULUS', 'MENGULANG');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_TASMI';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_TASMI';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_TASMI';

-- CreateTable
CREATE TABLE "TasmiRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "juz" INTEGER NOT NULL,
    "grade" "TasmiGrade" NOT NULL,
    "status" "TasmiStatus" NOT NULL,
    "examinerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasmiRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TasmiRecord_studentId_idx" ON "TasmiRecord"("studentId");
CREATE INDEX "TasmiRecord_teacherId_idx" ON "TasmiRecord"("teacherId");
CREATE INDEX "TasmiRecord_juz_idx" ON "TasmiRecord"("juz");
CREATE INDEX "TasmiRecord_academicYear_idx" ON "TasmiRecord"("academicYear");
CREATE INDEX "TasmiRecord_semester_idx" ON "TasmiRecord"("semester");
CREATE INDEX "TasmiRecord_studentId_academicYear_semester_idx" ON "TasmiRecord"("studentId", "academicYear", "semester");
CREATE INDEX "TasmiRecord_teacherId_academicYear_idx" ON "TasmiRecord"("teacherId", "academicYear");
CREATE INDEX "TasmiRecord_grade_idx" ON "TasmiRecord"("grade");
CREATE INDEX "TasmiRecord_status_idx" ON "TasmiRecord"("status");

-- AddForeignKey
ALTER TABLE "TasmiRecord" ADD CONSTRAINT "TasmiRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TasmiRecord" ADD CONSTRAINT "TasmiRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
