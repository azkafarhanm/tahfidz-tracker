-- Tahsin for grades 8 and 9: Qur'an reading assessed by surah and ayah, with
-- meetings counted per halaqah per week. Grade 7 keeps its jilid records and
-- its school-wide daily meeting timeline unchanged; every existing row becomes
-- material JILID through the column default.


-- CreateEnum
CREATE TYPE "TahsinMaterial" AS ENUM ('JILID', 'QURAN');

-- AlterTable
ALTER TABLE "TahsinRecord" ADD COLUMN     "endAyah" INTEGER,
ADD COLUMN     "halaqahMeetingId" TEXT,
ADD COLUMN     "material" "TahsinMaterial" NOT NULL DEFAULT 'JILID',
ADD COLUMN     "startAyah" INTEGER,
ADD COLUMN     "surahId" TEXT,
ALTER COLUMN "jilid" DROP NOT NULL,
ALTER COLUMN "startPage" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TahsinHalaqahMeeting" (
    "id" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "meetingDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TahsinHalaqahMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TahsinHalaqahMeeting_classGroupId_semester_weekStart_key" ON "TahsinHalaqahMeeting"("classGroupId", "semester", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "TahsinHalaqahMeeting_classGroupId_semester_meetingNumber_key" ON "TahsinHalaqahMeeting"("classGroupId", "semester", "meetingNumber");

-- CreateIndex
CREATE INDEX "TahsinRecord_halaqahMeetingId_idx" ON "TahsinRecord"("halaqahMeetingId");

-- CreateIndex
CREATE INDEX "TahsinRecord_studentId_material_date_idx" ON "TahsinRecord"("studentId", "material", "date");

-- AddForeignKey
ALTER TABLE "TahsinHalaqahMeeting" ADD CONSTRAINT "TahsinHalaqahMeeting_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_halaqahMeetingId_fkey" FOREIGN KEY ("halaqahMeetingId") REFERENCES "TahsinHalaqahMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A record carries exactly one kind of material. The application enforces this
-- too; the constraint keeps a half-filled row from ever reaching the table.
ALTER TABLE "TahsinRecord" ADD CONSTRAINT "TahsinRecord_material_fields_check" CHECK (
  ("material" = 'JILID' AND "jilid" IS NOT NULL AND "startPage" IS NOT NULL AND "surahId" IS NULL AND "startAyah" IS NULL AND "endAyah" IS NULL)
  OR
  ("material" = 'QURAN' AND "surahId" IS NOT NULL AND "startAyah" IS NOT NULL AND "jilid" IS NULL AND "startPage" IS NULL AND "endPage" IS NULL)
);
