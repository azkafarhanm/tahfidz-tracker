import { ProgramType, Semester, AcademicYearStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import {
  getAcademicYearForDate,
  resolveNewAcademicMeetingDays,
} from "@/lib/academic-year-rules";

export {
  getAcademicYearForDate,
  getSemesterDateRange,
  getSemesterForDate,
  resolveNewAcademicMeetingDays,
} from "@/lib/academic-year-rules";

const ACADEMIC_YEAR_CACHE_TTL_MS = 60_000; // 60 seconds
const ACADEMIC_YEAR_CACHE_KEY = "academic-year:active";

export async function getActiveAcademicYear(): Promise<string> {
  return cached(ACADEMIC_YEAR_CACHE_KEY, ACADEMIC_YEAR_CACHE_TTL_MS, async () => {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true, status: AcademicYearStatus.ACTIVE },
      select: { year: true },
    });

    if (activeYear) {
      return activeYear.year;
    }

    // Fallback: compute from date if no active year is configured
    return getAcademicYearForDate(new Date());
  });
}

export async function getAcademicFormativeTimeline(
  academicYear: string,
  semester: Semester,
) {
  const year = await prisma.academicYear.findUnique({
    where: { year: academicYear },
    select: { id: true },
  });

  if (!year) return [null];

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;

    const meetings = await tx.formativeMeeting.findMany({
      where: { academicYearId: year.id, semester },
      orderBy: { meetingNumber: "asc" },
      select: { meetingNumber: true, meetingDate: true },
    });

    if (meetings.length === 0) return [null];

    const recordWhere = {
      academicYear,
      semester,
      student: { classGroup: { programType: ProgramType.ACADEMIC } },
    } as const;
    const [memorizationRecords, revisionRecords] = await Promise.all([
      tx.memorizationRecord.findMany({
        where: recordWhere,
        select: { date: true },
      }),
      tx.revisionRecord.findMany({
        where: recordWhere,
        select: { date: true },
      }),
    ]);

    const existingDays = meetings.map((meeting) =>
      meeting.meetingDate.toISOString().slice(0, 10),
    );
    const lastMeeting = meetings.at(-1)!;
    const newDays = resolveNewAcademicMeetingDays(
      [...memorizationRecords, ...revisionRecords].map((record) => record.date),
      existingDays,
    );

    if (newDays.length > 0) {
      await tx.formativeMeeting.createMany({
        data: newDays.map((day, index) => ({
          academicYearId: year.id,
          semester,
          meetingNumber: lastMeeting.meetingNumber + index + 1,
          meetingDate: new Date(`${day}T00:00:00.000Z`),
        })),
      });
    }

    return [
      ...meetings.map((meeting) =>
        meeting.meetingDate.toISOString().slice(0, 10),
      ),
      ...newDays,
    ];
  });
}

export type TeacherProgramContext = {
  programs: ProgramType[];
  hasMultiple: boolean;
  resolvedProgramType: ProgramType;
};

export async function getTeacherProgramContext(
  teacherId: string,
  academicYear: string,
): Promise<TeacherProgramContext> {
  return cached(
    `teacher-program:${teacherId}:${academicYear}`,
    30_000,
    () => getTeacherProgramContextInner(teacherId, academicYear),
  );
}

async function getTeacherProgramContextInner(
  teacherId: string,
  academicYear: string,
): Promise<TeacherProgramContext> {
  const classGroups = await prisma.classGroup.findMany({
    where: { teacherId, academicYear, isActive: true },
    select: { programType: true },
    distinct: ["programType"],
  });

  const programOrder: Record<ProgramType, number> = {
    [ProgramType.ACADEMIC]: 0,
    [ProgramType.BOARDING]: 1,
  };
  const programs = classGroups
    .map((cg) => cg.programType)
    .sort((a, b) => programOrder[a] - programOrder[b]);
  const hasMultiple = programs.length > 1;
  const resolvedProgramType = programs[0] ?? ProgramType.ACADEMIC;

  return { programs, hasMultiple, resolvedProgramType };
}
