import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma-next/client";
import { RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import {
  getDateFormatter,
  getTimeFormatter,
  statusLabels,
  formatRange,
} from "@/lib/format";

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

type AyahTotalRow = {
  total: bigint | number | string | null;
};

function teacherFilterSql(teacherId?: string | null) {
  return teacherId ? Prisma.sql`AND "teacherId" = ${teacherId}` : Prisma.empty;
}

function toNumberTotal(value: AyahTotalRow["total"]) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function sumWeeklyMemorizationAyahs(teacherId: string | null | undefined, weekStart: Date) {
  const rows = await prisma.$queryRaw<AyahTotalRow[]>(Prisma.sql`
    SELECT COALESCE(SUM(GREATEST("toAyah" - "fromAyah" + 1, 0)), 0) AS total
    FROM "MemorizationRecord"
    WHERE "date" >= ${weekStart}
    ${teacherFilterSql(teacherId)}
  `);

  return toNumberTotal(rows[0]?.total);
}

async function sumWeeklyRevisionAyahs(teacherId: string | null | undefined, weekStart: Date) {
  const rows = await prisma.$queryRaw<AyahTotalRow[]>(Prisma.sql`
    SELECT COALESCE(SUM(GREATEST("toAyah" - "fromAyah" + 1, 0)), 0) AS total
    FROM "RevisionRecord"
    WHERE "date" >= ${weekStart}
    ${teacherFilterSql(teacherId)}
  `);

  return toNumberTotal(rows[0]?.total);
}

async function sumActiveTargetAyahs(teacherId: string | null | undefined) {
  const rows = await prisma.$queryRaw<AyahTotalRow[]>(Prisma.sql`
    SELECT COALESCE(SUM(GREATEST("toAyah" - "fromAyah" + 1, 0)), 0) AS total
    FROM "Target"
    WHERE "status" = ${TargetStatus.ACTIVE}::"TargetStatus"
    ${teacherFilterSql(teacherId)}
  `);

  return toNumberTotal(rows[0]?.total);
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

export async function getDashboardData(teacherId?: string | null, locale = "id") {
  const tzOffset = await readTimezoneOffset();
  const cacheKey = `dashboard:${teacherId ?? "admin"}:${locale}:${tzOffset ?? "utc"}`;
  return cached(cacheKey, 30_000, () => getDashboardDataInner(teacherId, locale, tzOffset));
}

async function getDashboardDataInner(teacherId?: string | null, locale = "id", tzOffset: number | null = null) {
  const today = getUserToday(tzOffset);
  const weekStart = getWeekStart(today, tzOffset);
  const teacherFilter = teacherId ? { teacherId } : {};
  const dateFormatter = getDateFormatter(locale);
  const timeFormatter = getTimeFormatter(locale);

  const [
    memorizationRecords,
    revisionRecords,
    todayMemorizationCount,
    todayRevisionCount,
    weeklyMemorizationAyahs,
    weeklyRevisionAyahs,
    weeklyTargetAyahs,
    completedTargets,
    needsReviewCount,
    overdueTargets,
  ] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: teacherFilter,
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.revisionRecord.findMany({
      where: teacherFilter,
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.memorizationRecord.count({
      where: { ...teacherFilter, date: { gte: today } },
    }),
    prisma.revisionRecord.count({
      where: { ...teacherFilter, date: { gte: today } },
    }),
    sumWeeklyMemorizationAyahs(teacherId, weekStart),
    sumWeeklyRevisionAyahs(teacherId, weekStart),
    sumActiveTargetAyahs(teacherId),
    prisma.target.count({
      where: { ...teacherFilter, status: TargetStatus.COMPLETED },
    }),
    (async () => {
      const [mem, rev] = await Promise.all([
        prisma.memorizationRecord.count({
          where: { ...teacherFilter, status: RecordStatus.PERLU_MUROJAAH },
        }),
        prisma.revisionRecord.count({
          where: { ...teacherFilter, status: RecordStatus.PERLU_MUROJAAH },
        }),
      ]);
      return mem + rev;
    })(),
    prisma.target.findMany({
      where: {
        ...teacherFilter,
        status: TargetStatus.ACTIVE,
        endDate: { lt: new Date() },
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
      type: "Murojaah",
      range: formatRange(record.surah, record.fromAyah, record.toAyah),
      status: statusLabels[record.status],
      needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
      dateTimeIso: record.date.toISOString(),
      date: dateFormatter.format(record.date),
      time: timeFormatter.format(record.date),
      timestamp: record.date.getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const weeklyRecordedAyahs = weeklyMemorizationAyahs + weeklyRevisionAyahs;
  const targetProgress =
    weeklyTargetAyahs > 0
      ? Math.min(Math.round((weeklyRecordedAyahs / weeklyTargetAyahs) * 100), 100)
      : completedTargets > 0
        ? 100
        : 0;

  return {
    todayRecordCount: todayMemorizationCount + todayRevisionCount,
    targetProgress,
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
