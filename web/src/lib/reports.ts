import { RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  dateFormatter,
  statusLabels,
  halaqahLevelLabels,
  formatRange,
} from "@/lib/format";

export async function getTeacherReportData(teacherId: string) {
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
        memorizationRecords: {
          orderBy: { date: "desc" },
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

  const allHafalan = students.flatMap((s) => s.memorizationRecords);
  const allMurojaah = students.flatMap((s) => s.revisionRecords);
  const allScores = [...allHafalan, ...allMurojaah]
    .map((r) => r.score)
    .filter((s): s is number => s !== null);
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

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
    totalHafalan: allHafalan.length,
    totalMurojaah: allMurojaah.length,
    avgScore,
    needsReviewCount: needsReview.length,
    activeTargetCount: students.reduce((sum, s) => sum + s.targets.length, 0),
    students: students.map((s) => {
      const lastH = s.memorizationRecords[0];
      const lastM = s.revisionRecords[0];
      const scores = [...s.memorizationRecords, ...s.revisionRecords]
        .map((r) => r.score)
        .filter((v): v is number => v !== null);
      const studentAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        id: s.id,
        fullName: s.fullName,
        halaqahName: s.classGroup.name,
        halaqahLevel: halaqahLevelLabels[s.classGroup.level],
        academicClassName: s.academicClass?.name ?? "-",
        hafalanCount: s.memorizationRecords.length,
        murojaahCount: s.revisionRecords.length,
        avgScore: studentAvg,
        lastActivity: lastH ?? lastM
          ? dateFormatter.format((lastH ?? lastM)!.date)
          : "Belum ada",
        lastRange: lastH
          ? formatRange(lastH.surah, lastH.fromAyah, lastH.toAyah)
          : lastM
            ? formatRange(lastM.surah, lastM.fromAyah, lastM.toAyah)
            : "-",
        lastStatus: lastH
          ? statusLabels[lastH.status]
          : lastM
            ? statusLabels[lastM.status]
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

export async function getStudentProgressData(
  studentId: string,
  teacherId?: string | null,
) {
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

export async function getAdminReportData() {
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
    })),
  };
}
