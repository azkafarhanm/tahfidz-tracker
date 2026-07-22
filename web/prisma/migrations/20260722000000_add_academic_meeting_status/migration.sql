CREATE TYPE "MeetingAttendanceStatus" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALFA');

CREATE TABLE "MeetingStatus" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programType" "ProgramType" NOT NULL DEFAULT 'ACADEMIC',
    "date" DATE NOT NULL,
    "status" "MeetingAttendanceStatus" NOT NULL,
    "note" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetingStatus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MeetingStatus_academic_only_check" CHECK ("programType" = 'ACADEMIC')
);

CREATE UNIQUE INDEX "MeetingStatus_studentId_programType_date_key"
ON "MeetingStatus"("studentId", "programType", "date");
CREATE INDEX "MeetingStatus_studentId_date_idx" ON "MeetingStatus"("studentId", "date");
CREATE INDEX "MeetingStatus_teacherId_date_idx" ON "MeetingStatus"("teacherId", "date");
CREATE INDEX "MeetingStatus_programType_date_idx" ON "MeetingStatus"("programType", "date");

ALTER TABLE "MeetingStatus"
ADD CONSTRAINT "MeetingStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeetingStatus"
ADD CONSTRAINT "MeetingStatus_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
