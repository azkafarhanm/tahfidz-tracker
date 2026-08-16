-- CreateTable
CREATE TABLE "TahsinRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "jilid" INTEGER NOT NULL,
    "startPage" INTEGER NOT NULL,
    "endPage" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'CUKUP',
    "notes" TEXT,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TahsinRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TahsinRecord_studentId_academicYear_semester_idx" ON "TahsinRecord"("studentId", "academicYear", "semester");
CREATE INDEX "TahsinRecord_studentId_createdAt_idx" ON "TahsinRecord"("studentId", "createdAt");
CREATE INDEX "TahsinRecord_teacherId_academicYear_semester_idx" ON "TahsinRecord"("teacherId", "academicYear", "semester");
CREATE INDEX "TahsinRecord_academicYear_semester_idx" ON "TahsinRecord"("academicYear", "semester");
CREATE INDEX "TahsinRecord_teacherId_date_idx" ON "TahsinRecord"("teacherId", "date");

-- AddForeignKey
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
