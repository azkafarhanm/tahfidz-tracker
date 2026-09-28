-- Reporting periods handed to the foundation (yayasan) for the Boarding
-- progress report. Purely additive: one new table, no existing data touched.

-- CreateTable
CREATE TABLE "FoundationReportPeriod" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "programType" "ProgramType" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundationReportPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoundationReportPeriod_teacherId_programType_periodEnd_idx" ON "FoundationReportPeriod"("teacherId", "programType", "periodEnd");

-- AddForeignKey
ALTER TABLE "FoundationReportPeriod" ADD CONSTRAINT "FoundationReportPeriod_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A period cannot end before it starts.
ALTER TABLE "FoundationReportPeriod" ADD CONSTRAINT "FoundationReportPeriod_range_check" CHECK ("periodStart" <= "periodEnd");
