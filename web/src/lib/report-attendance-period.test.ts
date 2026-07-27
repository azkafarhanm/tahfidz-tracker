import { describe, expect, it } from "vitest";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import {
  attendancePeriodValue,
  ensureActiveAttendancePeriods,
  getAcademicReportRecordPeriodFilter,
  resolveAttendancePeriod,
} from "@/lib/report-attendance-period";

const periods = [
  { academicYear: "2026/2027", semester: Semester.GANJIL },
  { academicYear: "2026/2027", semester: Semester.GENAP },
  { academicYear: "2025/2026", semester: Semester.GANJIL },
  { academicYear: "2025/2026", semester: Semester.GENAP },
];

describe("resolveAttendancePeriod", () => {
  it("defaults to the active semester without a query value", () => {
    expect(
      resolveAttendancePeriod(periods, undefined, {
        academicYear: "2026/2027",
        semester: Semester.GANJIL,
      }),
    ).toEqual({
      academicYear: "2026/2027",
      semester: Semester.GANJIL,
    });
  });

  it("accepts an available historical semester", () => {
    expect(
      resolveAttendancePeriod(periods, "2025/2026:GENAP", {
        academicYear: "2026/2027",
        semester: Semester.GANJIL,
      }),
    ).toEqual({
      academicYear: "2025/2026",
      semester: Semester.GENAP,
    });
  });

  it("rejects an unavailable period and returns the active default", () => {
    expect(
      resolveAttendancePeriod(periods, "2030/2031:GANJIL", {
        academicYear: "2026/2027",
        semester: Semester.GENAP,
      }),
    ).toEqual({
      academicYear: "2026/2027",
      semester: Semester.GENAP,
    });
  });
});

describe("ensureActiveAttendancePeriods", () => {
  it("adds both semesters when the computed active year is not configured", () => {
    const result = ensureActiveAttendancePeriods(periods, "2027/2028");

    expect(result.slice(0, 2).map(attendancePeriodValue)).toEqual([
      "2027/2028:GANJIL",
      "2027/2028:GENAP",
    ]);
  });
});

describe("getAcademicReportRecordPeriodFilter", () => {
  const selectedPeriod = {
    academicYear: "2025/2026",
    semester: Semester.GENAP,
  };

  it("filters Academic Reports by the selected year and semester", () => {
    expect(
      getAcademicReportRecordPeriodFilter(
        ProgramType.ACADEMIC,
        selectedPeriod,
        "teacher-1",
        true,
      ),
    ).toEqual({
      academicYear: "2025/2026",
      semester: Semester.GENAP,
      teacherId: "teacher-1",
    });
  });

  it("keeps Boarding Reports and export summaries cumulative", () => {
    expect(
      getAcademicReportRecordPeriodFilter(
        ProgramType.BOARDING,
        selectedPeriod,
        "teacher-1",
        true,
      ),
    ).toEqual({});
    expect(
      getAcademicReportRecordPeriodFilter(
        ProgramType.ACADEMIC,
        selectedPeriod,
        "teacher-1",
        false,
      ),
    ).toEqual({});
  });
});
