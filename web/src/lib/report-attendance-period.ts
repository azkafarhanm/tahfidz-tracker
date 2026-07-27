import { ProgramType, Semester } from "@/generated/prisma-next/enums";

export type AttendancePeriod = {
  academicYear: string;
  semester: Semester;
};

export function attendancePeriodValue(period: AttendancePeriod) {
  return `${period.academicYear}:${period.semester}`;
}

export function ensureActiveAttendancePeriods(
  periods: AttendancePeriod[],
  activeAcademicYear: string,
) {
  if (periods.some(({ academicYear }) => academicYear === activeAcademicYear)) {
    return periods;
  }

  return [
    { academicYear: activeAcademicYear, semester: Semester.GANJIL },
    { academicYear: activeAcademicYear, semester: Semester.GENAP },
    ...periods,
  ];
}

export function resolveAttendancePeriod(
  periods: AttendancePeriod[],
  requestedValue: string | undefined,
  defaultPeriod: AttendancePeriod,
) {
  const requested = periods.find(
    (period) => attendancePeriodValue(period) === requestedValue,
  );
  if (requested) return requested;

  return periods.find(
    (period) =>
      period.academicYear === defaultPeriod.academicYear &&
      period.semester === defaultPeriod.semester,
  ) ?? defaultPeriod;
}

export function getAcademicReportRecordPeriodFilter(
  programType: ProgramType | undefined,
  period: AttendancePeriod,
  teacherId: string,
  enabled: boolean,
) {
  return programType === ProgramType.ACADEMIC && enabled
    ? {
        academicYear: period.academicYear,
        semester: period.semester,
        teacherId,
      }
    : {};
}
