import { Semester } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";

const ACADEMIC_YEAR_CACHE_TTL_MS = 60_000; // 60 seconds
const ACADEMIC_YEAR_CACHE_KEY = "academic-year:active";

export function getAcademicYearForDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

export async function getActiveAcademicYear(): Promise<string> {
  return cached(ACADEMIC_YEAR_CACHE_KEY, ACADEMIC_YEAR_CACHE_TTL_MS, async () => {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { year: true },
    });

    if (activeYear) {
      return activeYear.year;
    }

    // Fallback: compute from date if no active year is configured
    return getAcademicYearForDate(new Date());
  });
}

export function getSemesterForDate(date: Date): Semester {
  return date.getMonth() >= 6 ? Semester.GANJIL : Semester.GENAP;
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
