import { ProgramType } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear } from "@/lib/academic-year";
import {
  buildFoundationStudentReport,
  isDayKey,
  periodBounds,
  resolveDefaultPeriod,
  todayDayKey,
  type FoundationStudentReport,
} from "@/lib/foundation-report";
import { getJakartaDayKey } from "@/lib/jakarta-date";
import { prisma } from "@/lib/prisma";

/** Only Boarding reports to the foundation; Academic keeps its semester reports. */
const PROGRAM = ProgramType.BOARDING;

function dayKeyOf(date: Date) {
  return date.toISOString().slice(0, 10);
}

function asDate(dayKey: string) {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

/** The teacher's active Boarding students in the current academic year. */
async function boardingStudentWhere(teacherId: string) {
  const academicYear = await getActiveAcademicYear();
  return {
    teacherId,
    isActive: true,
    classGroup: { isActive: true, academicYear, programType: PROGRAM },
  };
}

export type FoundationPeriodRecord = {
  id: string;
  periodStart: string;
  periodEnd: string;
  createdAt: Date;
};

/** Last handed-in period, the suggested next period, and the history. */
export async function getFoundationReportContext(teacherId: string) {
  const studentWhere = await boardingStudentWhere(teacherId);
  const [periods, firstHafalan, firstMurojaah] = await Promise.all([
    prisma.foundationReportPeriod.findMany({
      where: { teacherId, programType: PROGRAM },
      orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: { id: true, periodStart: true, periodEnd: true, createdAt: true },
    }),
    prisma.memorizationRecord.findFirst({ where: { student: studentWhere }, orderBy: { date: "asc" }, select: { date: true } }),
    prisma.revisionRecord.findFirst({ where: { student: studentWhere }, orderBy: { date: "asc" }, select: { date: true } }),
  ]);

  const history: FoundationPeriodRecord[] = periods.map((period) => ({
    id: period.id,
    periodStart: dayKeyOf(period.periodStart),
    periodEnd: dayKeyOf(period.periodEnd),
    createdAt: period.createdAt,
  }));
  const firstDates = [firstHafalan?.date, firstMurojaah?.date].filter((date): date is Date => Boolean(date));
  const firstActivityDay = firstDates.length > 0
    ? getJakartaDayKey(new Date(Math.min(...firstDates.map((date) => date.getTime()))))
    : null;
  const today = todayDayKey();

  return {
    today,
    history,
    last: history[0] ?? null,
    suggested: resolveDefaultPeriod({ lastPeriodEnd: history[0]?.periodEnd ?? null, firstActivityDay, today }),
  };
}

export function validatePeriod(from: string, to: string, today = todayDayKey()) {
  if (!isDayKey(from) || !isDayKey(to)) return "Tanggal periode tidak valid.";
  if (from > to) return "Tanggal awal tidak boleh setelah tanggal akhir.";
  if (to > today) return "Tanggal akhir tidak boleh melewati hari ini.";
  return null;
}

export type FoundationReportStudent = {
  id: string;
  fullName: string;
  report: FoundationStudentReport;
};

export type FoundationReportData = {
  teacherName: string;
  from: string;
  to: string;
  grades: Array<{ grade: number; halaqahName: string; students: FoundationReportStudent[] }>;
};

/**
 * Everything the Excel and PDF files show, computed once so the two formats
 * can never disagree. Grades the teacher does not hold are left out entirely
 * rather than printed as empty sections.
 */
export async function getFoundationReportData(teacherId: string, from: string, to: string): Promise<FoundationReportData> {
  const { start, endExclusive } = periodBounds(from, to);
  const [teacher, students] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { fullName: true } }),
    prisma.student.findMany({
      where: await boardingStudentWhere(teacherId),
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, classGroup: { select: { grade: true, name: true } } },
    }),
  ]);
  const studentIds = students.map((student) => student.id);
  const recitationSelect = { studentId: true, surah: true, fromAyah: true, toAyah: true, date: true, createdAt: true } as const;
  const [hafalan, murojaah] = studentIds.length > 0
    ? await Promise.all([
        // Whole history up to the end: whether an ayah is new depends on what
        // was memorised before the period, possibly under another teacher.
        prisma.memorizationRecord.findMany({
          where: { studentId: { in: studentIds }, date: { lt: endExclusive } },
          select: recitationSelect,
        }),
        // Also the whole history: anything ever reviewed counts toward the
        // total, while the period's murojaah figures filter to the period.
        prisma.revisionRecord.findMany({
          where: { studentId: { in: studentIds }, date: { lt: endExclusive } },
          select: recitationSelect,
        }),
      ])
    : [[], []];

  const byStudent = <T extends { studentId: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) map.set(row.studentId, [...(map.get(row.studentId) ?? []), row]);
    return map;
  };
  const hafalanByStudent = byStudent(hafalan);
  const murojaahByStudent = byStudent(murojaah);

  const grades = new Map<number, FoundationReportData["grades"][number]>();
  for (const student of students) {
    const entry = grades.get(student.classGroup.grade) ?? {
      grade: student.classGroup.grade,
      halaqahName: student.classGroup.name,
      students: [],
    };
    entry.students.push({
      id: student.id,
      fullName: student.fullName,
      report: buildFoundationStudentReport(
        hafalanByStudent.get(student.id) ?? [],
        murojaahByStudent.get(student.id) ?? [],
        { start, endExclusive },
      ),
    });
    grades.set(student.classGroup.grade, entry);
  }

  return {
    teacherName: teacher?.fullName ?? "-",
    from,
    to,
    grades: [...grades.values()].sort((left, right) => left.grade - right.grade),
  };
}

export async function recordFoundationReportPeriod(teacherId: string, from: string, to: string) {
  const error = validatePeriod(from, to);
  if (error) throw new Error(error);
  return prisma.foundationReportPeriod.create({
    data: { teacherId, programType: PROGRAM, periodStart: asDate(from), periodEnd: asDate(to) },
    select: { id: true },
  });
}

/** Removes only the most recent mark, for when it was pressed by mistake. */
export async function undoLatestFoundationReportPeriod(teacherId: string) {
  const latest = await prisma.foundationReportPeriod.findFirst({
    where: { teacherId, programType: PROGRAM },
    orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  if (!latest) throw new Error("Belum ada laporan yang ditandai.");
  await prisma.foundationReportPeriod.delete({ where: { id: latest.id } });
  return latest;
}
