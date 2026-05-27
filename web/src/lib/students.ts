import {
  Gender,
  RecordStatus,
  TargetStatus,
  TargetType,
} from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  getDateFormatter,
  statusLabels,
  halaqahLevelLabels,
  formatRange,
  formatClassSummary,
} from "@/lib/format";

function formatLatestRecord(
  record:
    | {
        surah: string;
        fromAyah: number;
        toAyah: number;
        date: Date;
        status: RecordStatus;
      }
    | undefined,
  dateFormatter: Intl.DateTimeFormat,
) {
  if (!record) {
    return null;
  }

  return {
    range: formatRange(record.surah, record.fromAyah, record.toAyah),
    dateTimeIso: record.date.toISOString(),
    date: dateFormatter.format(record.date),
    status: statusLabels[record.status],
    needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
  };
}

function formatRecord(
  record: {
    id: string;
    surah: string;
    fromAyah: number;
    toAyah: number;
    date: Date;
    status: RecordStatus;
    score: number | null;
    notes: string | null;
  },
  type: "Hafalan" | "Murojaah",
  dateFormatter: Intl.DateTimeFormat,
) {
  return {
    id: record.id,
    type,
    range: formatRange(record.surah, record.fromAyah, record.toAyah),
    dateTimeIso: record.date.toISOString(),
    date: dateFormatter.format(record.date),
    status: statusLabels[record.status],
    score: record.score,
    notes: record.notes,
    needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
    timestamp: record.date.getTime(),
  };
}

function formatTarget(target: {
  id: string;
  type: TargetType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  startDate: Date;
  endDate: Date;
  notes: string | null;
}, dateFormatter: Intl.DateTimeFormat) {
  const now = new Date();
  const totalDays = target.endDate.getTime() - target.startDate.getTime();
  const elapsed = now.getTime() - target.startDate.getTime();
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 0;
  const isOverdue = now > target.endDate;

  return {
    id: target.id,
    type: targetTypeLabels[target.type],
    range: formatRange(target.surah, target.fromAyah, target.toAyah),
    startDate: dateFormatter.format(target.startDate),
    endDate: dateFormatter.format(target.endDate),
    notes: target.notes,
    timeProgress,
    isOverdue,
  };
}

const targetTypeLabels: Record<TargetType, string> = {
  [TargetType.HAFALAN]: "Hafalan",
  [TargetType.MUROJAAH]: "Murojaah",
};

const genderLabels: Record<Gender, string> = {
  [Gender.MALE]: "Laki-laki",
  [Gender.FEMALE]: "Perempuan",
};

export async function getStudentsData(query = "", teacherId?: string | null, locale = "id") {
  const normalizedQuery = query.trim().toLowerCase();
  const result = await getStudentsDataInner(normalizedQuery, teacherId, locale, 1, 12);
  return result.students;
}

export async function getStudentsPageData(
  query = "",
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = 12,
) {
  const normalizedQuery = query.trim().toLowerCase();
  return getStudentsDataInner(normalizedQuery, teacherId, locale, page, pageSize);
}

async function getStudentsDataInner(
  normalizedQuery: string,
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = 12,
) {
  const dateFormatter = getDateFormatter(locale);
  const where = {
    isActive: true,
    ...(teacherId ? { teacherId } : {}),
    ...(normalizedQuery
      ? {
          OR: [
            { fullName: { startsWith: normalizedQuery, mode: "insensitive" as const } },
            {
              academicClass: {
                name: { startsWith: normalizedQuery, mode: "insensitive" as const },
              },
            },
            {
              classGroup: {
                name: { startsWith: normalizedQuery, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const [totalCount, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        classGroup: {
          select: { name: true, level: true },
        },
        academicClass: {
          select: { name: true },
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
          },
        },
        targets: {
          where: { status: TargetStatus.ACTIVE },
          select: { id: true },
        },
      },
      orderBy: { fullName: "asc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  return {
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / safePageSize)),
    students: students.map((student) => {
      const latestHafalan = formatLatestRecord(student.memorizationRecords[0], dateFormatter);
      const latestMurojaah = formatLatestRecord(student.revisionRecords[0], dateFormatter);
      const needsReview = Boolean(
        latestHafalan?.needsReview || latestMurojaah?.needsReview,
      );
      const classInfo = formatClassSummary(student);

      return {
        id: student.id,
        fullName: student.fullName,
        ...classInfo,
        notes: student.notes,
        activeTargetCount: student.targets.length,
        latestHafalan,
        latestMurojaah,
        needsReview,
      };
    }),
  };
}

export async function getInactiveStudentsData(teacherId?: string | null) {
  return getInactiveStudentsDataInner(teacherId);
}

async function getInactiveStudentsDataInner(teacherId?: string | null) {
  const students = await prisma.student.findMany({
    where: {
      isActive: false,
      ...(teacherId ? { teacherId } : {}),
    },
    orderBy: { fullName: "asc" },
    include: {
      classGroup: { select: { name: true, level: true } },
      academicClass: { select: { name: true } },
      _count: {
        select: {
          memorizationRecords: true,
          revisionRecords: true,
          summativeScores: true,
          targets: {
            where: { status: TargetStatus.ACTIVE },
          },
        },
      },
    },
  });

  return students.map((s) => ({
    activeTargetCount: s._count.targets,
    deleteBlockingDataCount:
      s._count.memorizationRecords +
      s._count.revisionRecords +
      s._count.summativeScores +
      s._count.targets,
    id: s.id,
    fullName: s.fullName,
    ...formatClassSummary(s),
    summativeScoreCount: s._count.summativeScores,
    totalRecordCount:
      s._count.memorizationRecords + s._count.revisionRecords,
  }));
}

export async function getStudentDetailData(studentId: string, teacherId?: string | null, locale = "id") {
  const dateFormatter = getDateFormatter(locale);

  const check = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, isActive: true, teacherId: true, fullName: true }
  });

  if (!check) {
    return null;
  }

  if (teacherId && check.teacherId !== teacherId) {
    return { isUnauthorized: true } as const;
  }

  if (!check.isActive) {
    return {
      isInactive: true,
      id: check.id,
      fullName: check.fullName,
      isOwnStudent: !teacherId || check.teacherId === teacherId
    } as const;
  }

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    include: {
      classGroup: {
        select: { name: true, level: true },
      },
      academicClass: {
        select: { name: true },
      },
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
        take: 20,
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

  if (!student) {
    return null;
  }

  const hafalanRecords = student.memorizationRecords.map((record) =>
    formatRecord(record, "Hafalan", dateFormatter),
  );
  const murojaahRecords = student.revisionRecords.map((record) =>
    formatRecord(record, "Murojaah", dateFormatter),
  );
  const historyRecords = [...hafalanRecords, ...murojaahRecords].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  const latestActivity = historyRecords.slice(0, 6);
  const needsReviewCount = historyRecords.filter(
    (record) => record.needsReview,
  ).length;
  const classInfo = formatClassSummary(student);

  return {
    id: student.id,
    fullName: student.fullName,
    ...classInfo,
    gender: student.gender ? genderLabels[student.gender] : "Belum diisi",
    joinDate: dateFormatter.format(student.joinDate),
    notes: student.notes,
    activeTargets: student.targets.map((target) => formatTarget(target, dateFormatter)),
    latestHafalan: hafalanRecords[0] ?? null,
    latestMurojaah: murojaahRecords[0] ?? null,
    hafalanRecords,
    murojaahRecords,
    recentActivity: latestActivity,
    historyRecords,
    needsReviewCount,
  };
}

export async function getTeacherStudentFormOptions(teacherId: string) {
  const [classGroups, academicClasses] = await Promise.all([
    prisma.classGroup.findMany({
      where: {
        teacherId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        level: true,
        grade: true,
        teacher: {
          select: { fullName: true },
        },
      },
    }),
    prisma.academicClass.findMany({
      where: { isActive: true },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    classGroups: classGroups.map((cg) => ({
      id: cg.id,
      name: cg.name,
      level: halaqahLevelLabels[cg.level],
      levelKey: cg.level,
      grade: cg.grade,
      teacherName: cg.teacher.fullName,
      label: `${cg.name} (Kelas ${cg.grade} - ${halaqahLevelLabels[cg.level]})`,
    })),
    academicClasses: academicClasses.map((ac) => ({
      id: ac.id,
      name: ac.name,
      label: ac.name,
    })),
  };
}

export async function getStudentFormContext(studentId: string, teacherId?: string | null, locale = "id") {
  const dateFormatter = getDateFormatter(locale);
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      gender: true,
      joinDate: true,
      notes: true,
      academicClassId: true,
      classGroup: {
        select: { id: true, name: true, level: true, grade: true },
      },
      academicClass: {
        select: { id: true, name: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  return {
    id: student.id,
    fullName: student.fullName,
    ...formatClassSummary(student),
    gender: student.gender ?? "",
    joinDate: dateFormatter.format(student.joinDate),
    joinDateRaw: student.joinDate.toISOString().split("T")[0],
    notes: student.notes ?? "",
    academicClassId: student.academicClassId ?? "",
    classGroupId: student.classGroup.id,
    classGroupLevel: student.classGroup.level,
    classGroupGrade: student.classGroup.grade.toString(),
  };
}
