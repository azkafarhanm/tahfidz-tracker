import { RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  dateFormatter,
  statusLabels,
  formatRange,
} from "@/lib/format";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

function countAyahs(fromAyah: number, toAyah: number) {
  return Math.max(toAyah - fromAyah + 1, 0);
}

export async function getDashboardData(teacherId?: string | null) {
  const today = startOfToday();
  const weekStart = startOfWeek();
  const teacherFilter = teacherId ? { teacherId } : {};

  const [
    memorizationRecords,
    revisionRecords,
    todayMemorizationCount,
    todayRevisionCount,
    weeklyMemorization,
    weeklyRevision,
    activeTargets,
    completedTargets,
    needsReviewCount,
  ] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: teacherFilter,
      include: { student: true },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.revisionRecord.findMany({
      where: teacherFilter,
      include: { student: true },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.memorizationRecord.count({
      where: { ...teacherFilter, date: { gte: today } },
    }),
    prisma.revisionRecord.count({
      where: { ...teacherFilter, date: { gte: today } },
    }),
    prisma.memorizationRecord.findMany({
      where: { ...teacherFilter, date: { gte: weekStart } },
      select: { fromAyah: true, toAyah: true },
    }),
    prisma.revisionRecord.findMany({
      where: { ...teacherFilter, date: { gte: weekStart } },
      select: { fromAyah: true, toAyah: true },
    }),
    prisma.target.findMany({
      where: { ...teacherFilter, status: TargetStatus.ACTIVE },
      select: { fromAyah: true, toAyah: true },
    }),
    prisma.target.count({
      where: { ...teacherFilter, status: TargetStatus.COMPLETED },
    }),
    (async () => {
      const mem = await prisma.memorizationRecord.count({
        where: { ...teacherFilter, status: RecordStatus.PERLU_MUROJAAH },
      });
      const rev = await prisma.revisionRecord.count({
        where: { ...teacherFilter, status: RecordStatus.PERLU_MUROJAAH },
      });
      return mem + rev;
    })(),
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
      date: dateFormatter.format(record.date),
      time: timeFormatter.format(record.date),
      timestamp: record.date.getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const weeklyRecordedAyahs = [...weeklyMemorization, ...weeklyRevision].reduce(
    (total, record) => total + countAyahs(record.fromAyah, record.toAyah),
    0,
  );
  const weeklyTargetAyahs = activeTargets.reduce(
    (total, target) => total + countAyahs(target.fromAyah, target.toAyah),
    0,
  );
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
  };
}
