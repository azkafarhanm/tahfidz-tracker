import { RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import {
  getDateFormatter,
  statusLabels,
  halaqahLevelLabels,
  formatRange,
} from "@/lib/format";

export async function getTeacherReportData(teacherId: string, locale = "id") {
  return cached(`report-teacher:${teacherId}:${locale}`, 30_000, () => getTeacherReportDataInner(teacherId, locale));
}

async function getTeacherReportDataInner(teacherId: string, locale = "id") {
  const dateFormatter = getDateFormatter(locale);
  const [classGroups, students] = await Promise.all([
    prisma.classGroup.findMany({
      where: { teacherId, isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { students: { where: { isActive: true } } } },
      },
    }),
    prisma.student.findMany({
      where: { teacherId, isActive: true },
      orderBy: { fullName: "asc" },
      include: {
        classGroup: { select: { name: true, level: true } },
        academicClass: { select: { name: true } },
        _count: {
          select: {
            memorizationRecords: true,
            revisionRecords: true,
          },
        },
        memorizationRecords: {
          orderBy: { date: "desc" },
          take: 1,
          select: {
            surah: true,
            fromAyah: true,
            toAyah: true,
            date: true,
            status: true,
            score: true,
          },
        },
        revisionRecords: {
          orderBy: { date: "desc" },
          take: 1,
          select: {
            surah: true,
            fromAyah: true,
            toAyah: true,
            date: true,
            status: true,
            score: true,
          },
        },
        targets: {
          where: { status: TargetStatus.ACTIVE },
          select: {
            id: true,
            surah: true,
            fromAyah: true,
            toAyah: true,
            endDate: true,
          },
        },
      },
    }),
  ]);

  const studentIds = students.map((student) => student.id);
  const [
    memorizationScoreStats,
    revisionScoreStats,
    memorizationStudentStats,
    revisionStudentStats,
  ] = studentIds.length > 0
    ? await Promise.all([
        prisma.memorizationRecord.aggregate({
          where: {
            studentId: { in: studentIds },
            score: { not: null },
          },
          _avg: { score: true },
          _count: { score: true },
        }),
        prisma.revisionRecord.aggregate({
          where: {
            studentId: { in: studentIds },
            score: { not: null },
          },
          _avg: { score: true },
          _count: { score: true },
        }),
        prisma.memorizationRecord.groupBy({
          by: ["studentId"],
          where: {
            studentId: { in: studentIds },
            score: { not: null },
          },
          _avg: { score: true },
          _count: { score: true },
        }),
        prisma.revisionRecord.groupBy({
          by: ["studentId"],
          where: {
            studentId: { in: studentIds },
            score: { not: null },
          },
          _avg: { score: true },
          _count: { score: true },
        }),
      ])
    : [
        { _avg: { score: null }, _count: { score: 0 } },
        { _avg: { score: null }, _count: { score: 0 } },
        [],
        [],
      ] as const;

  const totalHafalan = students.reduce(
    (sum, student) => sum + student._count.memorizationRecords,
    0,
  );
  const totalMurojaah = students.reduce(
    (sum, student) => sum + student._count.revisionRecords,
    0,
  );
  const avgScore = weightedAverage([
    memorizationScoreStats,
    revisionScoreStats,
  ]);
  const studentScoreStats = new Map<string, { scoreTotal: number; count: number }>();

  for (const row of [...memorizationStudentStats, ...revisionStudentStats]) {
    const average = row._avg.score;
    const count = row._count.score;
    if (average === null || count === 0) continue;

    const current = studentScoreStats.get(row.studentId) ?? {
      scoreTotal: 0,
      count: 0,
    };
    current.scoreTotal += average * count;
    current.count += count;
    studentScoreStats.set(row.studentId, current);
  }

  const needsReview = students.filter((s) => {
    const lastH = s.memorizationRecords[0];
    const lastM = s.revisionRecords[0];
    return (
      lastH?.status === RecordStatus.PERLU_MUROJAAH ||
      lastM?.status === RecordStatus.PERLU_MUROJAAH
    );
  });

  return {
    classGroups: classGroups.map((cg) => ({
      id: cg.id,
      name: cg.name,
      level: halaqahLevelLabels[cg.level],
      studentCount: cg._count.students,
    })),
    studentCount: students.length,
    totalHafalan,
    totalMurojaah,
    avgScore,
    needsReviewCount: needsReview.length,
    activeTargetCount: students.reduce((sum, s) => sum + s.targets.length, 0),
    students: students.map((s) => {
      const lastH = s.memorizationRecords[0];
      const lastM = s.revisionRecords[0];
      const latest = [lastH, lastM]
        .filter((record): record is NonNullable<typeof lastH> => Boolean(record))
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const scoreStats = studentScoreStats.get(s.id);
      const studentAvg = scoreStats
        ? Math.round(scoreStats.scoreTotal / scoreStats.count)
        : 0;

      return {
        id: s.id,
        fullName: s.fullName,
        halaqahName: s.classGroup.name,
        halaqahLevel: halaqahLevelLabels[s.classGroup.level],
        academicClassName: s.academicClass?.name ?? "-",
        hafalanCount: s._count.memorizationRecords,
        murojaahCount: s._count.revisionRecords,
        avgScore: studentAvg,
        lastActivity: latest
          ? dateFormatter.format(latest.date)
          : "Belum ada",
        lastRange: latest
          ? formatRange(latest.surah, latest.fromAyah, latest.toAyah)
            : "-",
        lastStatus: latest
          ? statusLabels[latest.status]
            : "-",
        needsReview:
          lastH?.status === RecordStatus.PERLU_MUROJAAH ||
          lastM?.status === RecordStatus.PERLU_MUROJAAH,
        activeTargets: s.targets.map((t) => ({
          range: formatRange(t.surah, t.fromAyah, t.toAyah),
          endDate: dateFormatter.format(t.endDate),
        })),
      };
    }),
  };
}

function weightedAverage(
  stats: Array<{ _avg: { score: number | null }; _count: { score: number } }>,
) {
  const totals = stats.reduce(
    (acc, stat) => {
      const average = stat._avg.score;
      const count = stat._count.score;
      if (average === null || count === 0) return acc;

      acc.scoreTotal += average * count;
      acc.count += count;
      return acc;
    },
    { scoreTotal: 0, count: 0 },
  );

  return totals.count > 0 ? Math.round(totals.scoreTotal / totals.count) : 0;
}

export async function getStudentProgressData(
  studentId: string,
  teacherId?: string | null,
  locale = "id",
) {
  const cacheKey = `report-student:${studentId}:${teacherId ?? "admin"}:${locale}`;
  return cached(cacheKey, 30_000, () => getStudentProgressDataInner(studentId, teacherId, locale));
}

async function getStudentProgressDataInner(
  studentId: string,
  teacherId?: string | null,
  locale = "id",
) {
  const dateFormatter = getDateFormatter(locale);
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      classGroup: { select: { name: true, level: true } },
      academicClass: { select: { name: true } },
      memorizationRecords: {
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
          score: true,
          notes: true,
        },
      },
      revisionRecords: {
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
          score: true,
          notes: true,
        },
      },
      targets: {
        where: { status: TargetStatus.ACTIVE },
        orderBy: { endDate: "asc" },
        select: {
          id: true,
          type: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          startDate: true,
          endDate: true,
          notes: true,
        },
      },
    },
  });

  if (!student) return null;

  const hafalanRecords = student.memorizationRecords.map((r) => ({
    id: r.id,
    type: "Hafalan" as const,
    range: formatRange(r.surah, r.fromAyah, r.toAyah),
    date: dateFormatter.format(r.date),
    status: statusLabels[r.status],
    score: r.score,
    notes: r.notes,
    needsReview: r.status === RecordStatus.PERLU_MUROJAAH,
    timestamp: r.date.getTime(),
  }));

  const murojaahRecords = student.revisionRecords.map((r) => ({
    id: r.id,
    type: "Murojaah" as const,
    range: formatRange(r.surah, r.fromAyah, r.toAyah),
    date: dateFormatter.format(r.date),
    status: statusLabels[r.status],
    score: r.score,
    notes: r.notes,
    needsReview: r.status === RecordStatus.PERLU_MUROJAAH,
    timestamp: r.date.getTime(),
  }));

  const allRecords = [...hafalanRecords, ...murojaahRecords].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  const allScores = allRecords
    .map((r) => r.score)
    .filter((s): s is number => s !== null);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return {
    id: student.id,
    fullName: student.fullName,
    halaqahName: student.classGroup.name,
    halaqahLevel: halaqahLevelLabels[student.classGroup.level],
    academicClassName: student.academicClass?.name ?? "-",
    hafalanCount: hafalanRecords.length,
    murojaahCount: murojaahRecords.length,
    avgScore,
    records: allRecords,
    activeTargets: student.targets.map((t) => ({
      type: t.type === "HAFALAN" ? "Hafalan" : "Murojaah",
      range: formatRange(t.surah, t.fromAyah, t.toAyah),
      startDate: dateFormatter.format(t.startDate),
      endDate: dateFormatter.format(t.endDate),
      notes: t.notes,
    })),
  };
}

export async function getAdminReportData(locale = "id") {
  return cached(`report-admin:${locale}`, 30_000, () => getAdminReportDataInner(locale));
}

async function getAdminReportDataInner(locale = "id") {
  const dateFormatter = getDateFormatter(locale);
  const [teachers, totalStudents, totalHafalan, totalMurojaah, totalActiveTargets] =
    await Promise.all([
      prisma.teacher.findMany({
        where: { isActive: true },
        orderBy: { fullName: "asc" },
        include: {
          user: { select: { email: true } },
          _count: {
            select: {
              students: { where: { isActive: true } },
              classes: { where: { isActive: true } },
            },
          },
        },
      }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.memorizationRecord.count(),
      prisma.revisionRecord.count(),
      prisma.target.count({ where: { status: TargetStatus.ACTIVE } }),
    ]);

  return {
    totalTeachers: teachers.length,
    totalStudents,
    totalHafalan,
    totalMurojaah,
    totalActiveTargets,
    teachers: teachers.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      email: t.user.email,
      studentCount: t._count.students,
      classGroupCount: t._count.classes,
      joinedAt: dateFormatter.format(t.createdAt),
    })),
  };
}
