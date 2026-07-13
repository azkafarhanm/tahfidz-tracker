import { Semester } from "@/generated/prisma-next/enums";
import { getJakartaDayKey } from "@/lib/jakarta-date";

export function getAcademicYearForDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

export function getSemesterForDate(date: Date): Semester {
  return date.getMonth() >= 6 ? Semester.GANJIL : Semester.GENAP;
}

export function resolveNewAcademicMeetingDays(
  recordDates: readonly Date[],
  existingDays: readonly string[],
) {
  const existingDaySet = new Set(existingDays);
  const lastDay = existingDays.at(-1);
  if (!lastDay) return [];

  return [...new Set(recordDates.map(getJakartaDayKey))]
    .filter((day) => day > lastDay && !existingDaySet.has(day))
    .sort((left, right) => left.localeCompare(right));
}

export function getSemesterDateRange(academicYear: string, semester: Semester) {
  const [startYearValue, endYearValue] = academicYear.split("/");
  const startYear = Number.parseInt(startYearValue, 10);
  const endYear = Number.parseInt(endYearValue, 10);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    throw new Error(`Invalid academic year: ${academicYear}`);
  }

  if (semester === Semester.GANJIL) {
    return {
      start: new Date(startYear, 6, 1, 0, 0, 0, 0),
      end: new Date(startYear, 11, 31, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(endYear, 0, 1, 0, 0, 0, 0),
    end: new Date(endYear, 5, 30, 23, 59, 59, 999),
  };
}
