import { RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  formatClassSummary,
  formatRange,
  getDateFormatter,
  statusLabels,
} from "@/lib/format";

const PAGE_SIZE_FALLBACK = 12;

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

function scopeWhere(teacherId?: string | null) {
  return teacherId ? { teacherId } : {};
}

export async function getLiveStudentsPageData(
  query = "",
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = PAGE_SIZE_FALLBACK,
) {
  const dateFormatter = getDateFormatter(locale);
  const normalizedQuery = query.trim().toLowerCase();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const where = {
    isActive: true,
    ...scopeWhere(teacherId),
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

  const totalCount = await prisma.student.count({ where });
  const students = await prisma.student.findMany({
    where,
    include: {
      classGroup: { select: { name: true, level: true } },
      academicClass: { select: { name: true } },
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
      _count: {
        select: {
          targets: {
            where: { status: TargetStatus.ACTIVE },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  });

  return {
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / safePageSize)),
    students: students.map((student) => {
      const latestHafalan = formatLatestRecord(student.memorizationRecords[0], dateFormatter);
      const latestMurojaah = formatLatestRecord(student.revisionRecords[0], dateFormatter);

      return {
        id: student.id,
        fullName: student.fullName,
        ...formatClassSummary(student),
        notes: student.notes,
        activeTargetCount: student._count.targets,
        latestHafalan,
        latestMurojaah,
        needsReview: Boolean(
          latestHafalan?.needsReview || latestMurojaah?.needsReview,
        ),
      };
    }),
  };
}

export async function getLiveInactiveStudentsData(teacherId?: string | null) {
  const students = await prisma.student.findMany({
    where: {
      isActive: false,
      ...scopeWhere(teacherId),
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

  return students.map((student) => ({
    activeTargetCount: student._count.targets,
    deleteBlockingDataCount:
      student._count.memorizationRecords +
      student._count.revisionRecords +
      student._count.summativeScores +
      student._count.targets,
    id: student.id,
    fullName: student.fullName,
    ...formatClassSummary(student),
    summativeScoreCount: student._count.summativeScores,
    totalRecordCount:
      student._count.memorizationRecords + student._count.revisionRecords,
  }));
}
