import { cookies } from "next/headers";
import { ProgramType, RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma, withRetry } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import {
  getDateFormatter,
  getTimeFormatter,
  statusLabels,
  formatRange,
} from "@/lib/format";
import { tasmiGradeLabels, tasmiStatusLabel } from "@/lib/tasmi";

function getUserToday(timezoneOffsetMinutes: number | null): Date {
  const now = new Date();
  if (timezoneOffsetMinutes === null) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }
  const utcMs = now.getTime();
  const userWallMs = utcMs - timezoneOffsetMinutes * 60_000;
  const userWall = new Date(userWallMs);
  const userMidnightUtcMs = Date.UTC(
    userWall.getUTCFullYear(),
    userWall.getUTCMonth(),
    userWall.getUTCDate(),
    0, 0, 0, 0,
  );
  return new Date(userMidnightUtcMs + timezoneOffsetMinutes * 60_000);
}

function getWeekStart(today: Date, timezoneOffsetMinutes: number | null): Date {
  const ms = today.getTime();
  let day: number;
  if (timezoneOffsetMinutes === null) {
    day = new Date(ms).getUTCDay();
  } else {
    const userWallMs = ms - timezoneOffsetMinutes * 60_000;
    day = new Date(userWallMs).getUTCDay();
  }
  const diff = day === 0 ? 6 : day - 1;
  return new Date(ms - diff * 86_400_000);
}

function teacherFilter(teacherId?: string | null) {
  return teacherId ? { teacherId } : {};
}

async function readTimezoneOffset(): Promise<number | null> {
  try {
    const store = await cookies();
    const raw = store.get("tz-offset")?.value;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : null;
  } catch {
    return null;
  }
}

export async function getDashboardData(teacherId?: string | null, locale = "id", programType?: ProgramType) {
  const tzOffset = await readTimezoneOffset();
  const cacheKey = `dashboard:${teacherId ?? "admin"}:${locale}:${tzOffset ?? "utc"}:${programType ?? "all"}`;
  return cached(cacheKey, 30_000, () => withRetry(() => getDashboardDataInner(teacherId, locale, tzOffset, programType)));
}

async function getDashboardDataInner(teacherId?: string | null, locale = "id", tzOffset: number | null = null, programType?: ProgramType) {
  const today = getUserToday(tzOffset);
  const weekStart = getWeekStart(today, tzOffset);
  const academicYear = await getActiveAcademicYear();
  const teacherOnly = teacherFilter(teacherId);
  const programFilter = programType ? { student: { classGroup: { programType } } } : {};
  const recordFilter = { ...teacherOnly, academicYear, ...programFilter };
  const dateFormatter = getDateFormatter(locale);
  const timeFormatter = getTimeFormatter(locale);

  const [
    memorizationRecords,
    revisionRecords,
    tasmiRecords,
    todayMemorizationCount,
    todayRevisionCount,
    todayTasmiCount,
    weeklyMemorizationCount,
    weeklyRevisionCount,
    weeklyTasmiCount,
    weeklyCompletedTargets,
    needsReviewCount,
    overdueTargets,
  ] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: recordFilter,
      include: { student: { select: { id: true, fullName: true, classGroup: { select: { programType: true } } } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.revisionRecord.findMany({
      where: recordFilter,
      include: { student: { select: { id: true, fullName: true, classGroup: { select: { programType: true } } } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.tasmiRecord.findMany({
      where: recordFilter,
      include: { student: { select: { id: true, fullName: true, classGroup: { select: { programType: true } } } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.memorizationRecord.count({
      where: { ...recordFilter, date: { gte: today } },
    }),
    prisma.revisionRecord.count({
      where: { ...recordFilter, date: { gte: today } },
    }),
    prisma.tasmiRecord.count({
      where: { ...recordFilter, date: { gte: today } },
    }),
    prisma.memorizationRecord.count({
      where: { ...recordFilter, date: { gte: weekStart } },
    }),
    prisma.revisionRecord.count({
      where: { ...recordFilter, date: { gte: weekStart } },
    }),
    prisma.tasmiRecord.count({
      where: { ...recordFilter, date: { gte: weekStart } },
    }),
    prisma.target.count({
      where: {
        ...teacherOnly,
        status: TargetStatus.COMPLETED,
        updatedAt: { gte: weekStart },
        student: {
          classGroup: {
            academicYear,
            ...(programType ? { programType } : {}),
          },
        },
      },
    }),
    (async () => {
      const [mem, rev] = await Promise.all([
        prisma.memorizationRecord.count({
          where: { ...recordFilter, status: RecordStatus.PERLU_MUROJAAH },
        }),
        prisma.revisionRecord.count({
          where: { ...recordFilter, status: RecordStatus.PERLU_MUROJAAH },
        }),
      ]);
      return mem + rev;
    })(),
    prisma.target.findMany({
      where: {
        ...teacherOnly,
        status: TargetStatus.ACTIVE,
        endDate: { lt: new Date() },
        student: {
          classGroup: {
            academicYear,
            ...(programType ? { programType } : {}),
          },
        },
      },
      select: {
        id: true,
        surah: true,
        fromAyah: true,
        toAyah: true,
        endDate: true,
        student: { select: { id: true, fullName: true } },
      },
      take: 5,
    }),
  ]);

  const recentRecords = [
    ...memorizationRecords.map((record) => ({
      id: `hafalan-${record.id}`,
      studentId: record.studentId,
      student: record.student.fullName,
      programType: record.student.classGroup.programType,
      type: "Hafalan",
      range: formatRange(record.surah, record.fromAyah, record.toAyah),
      status: statusLabels[record.status],
      needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
      dateTimeIso: record.date.toISOString(),
      date: dateFormatter.format(record.date),
      time: timeFormatter.format(record.date),
      timestamp: record.date.getTime(),
    })),
    ...revisionRecords.map((record) => ({
      id: `murojaah-${record.id}`,
      studentId: record.studentId,
      student: record.student.fullName,
      programType: record.student.classGroup.programType,
      type: "Murojaah",
      range: formatRange(record.surah, record.fromAyah, record.toAyah),
      status: statusLabels[record.status],
      needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
      dateTimeIso: record.date.toISOString(),
      date: dateFormatter.format(record.date),
      time: timeFormatter.format(record.date),
      timestamp: record.date.getTime(),
    })),
    ...tasmiRecords.map((record) => ({
      id: `tasmi-${record.id}`,
      studentId: record.studentId,
      student: record.student.fullName,
      programType: record.student.classGroup.programType,
      type: "Tasmi'",
      range: `Tasmi' Juz ${record.juz}`,
      status: tasmiStatusLabel[record.status],
      grade: tasmiGradeLabels[record.grade],
      needsReview: false,
      dateTimeIso: record.date.toISOString(),
      date: dateFormatter.format(record.date),
      time: timeFormatter.format(record.date),
      timestamp: record.date.getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return {
    todayRecordCount: todayMemorizationCount + todayRevisionCount + todayTasmiCount,
    weeklyMemorizationCount,
    weeklyRevisionCount,
    weeklyTasmiCount,
    weeklyCompletedTargets,
    needsReviewCount,
    recentRecords,
    overdueTargets: overdueTargets.map((t) => ({
      id: t.id,
      studentId: t.student.id,
      studentName: t.student.fullName,
      range: formatRange(t.surah, t.fromAyah, t.toAyah),
      endDate: dateFormatter.format(t.endDate),
    })),
  };
}
