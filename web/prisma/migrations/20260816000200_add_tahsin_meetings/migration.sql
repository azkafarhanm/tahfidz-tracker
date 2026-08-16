ALTER TYPE "AuditAction" ADD VALUE 'ADVANCE_TAHSIN_MEETING';
ALTER TYPE "AuditAction" ADD VALUE 'RESET_TAHSIN_MEETING_TIMELINE';

CREATE TABLE "TahsinMeetingTimeline" (
  "id" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "semester" "Semester" NOT NULL,
  "runNumber" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TahsinMeetingTimeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TahsinMeeting" (
  "id" TEXT NOT NULL,
  "timelineId" TEXT NOT NULL,
  "meetingNumber" INTEGER NOT NULL,
  "meetingDate" DATE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TahsinMeeting_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TahsinRecord" ADD COLUMN "meetingId" TEXT;
CREATE UNIQUE INDEX "TahsinMeetingTimeline_academicYearId_semester_runNumber_key" ON "TahsinMeetingTimeline"("academicYearId", "semester", "runNumber");
CREATE UNIQUE INDEX "TahsinMeeting_timelineId_meetingNumber_key" ON "TahsinMeeting"("timelineId", "meetingNumber");
CREATE UNIQUE INDEX "TahsinMeetingTimeline_one_active_per_context" ON "TahsinMeetingTimeline"("academicYearId", "semester") WHERE "isActive";
CREATE UNIQUE INDEX "TahsinMeeting_one_active_per_timeline" ON "TahsinMeeting"("timelineId") WHERE "isActive";
CREATE INDEX "TahsinMeetingTimeline_academicYearId_semester_isActive_idx" ON "TahsinMeetingTimeline"("academicYearId", "semester", "isActive");
CREATE INDEX "TahsinMeeting_timelineId_isActive_idx" ON "TahsinMeeting"("timelineId", "isActive");
CREATE INDEX "TahsinRecord_meetingId_idx" ON "TahsinRecord"("meetingId");
ALTER TABLE "TahsinMeetingTimeline" ADD CONSTRAINT "TahsinMeetingTimeline_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TahsinMeeting" ADD CONSTRAINT "TahsinMeeting_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "TahsinMeetingTimeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "TahsinMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
