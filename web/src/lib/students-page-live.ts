import { ProgramType, RecordStatus, TargetStatus } from "@/generated/prisma-next/enums";
import { prisma, withRetry } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import {
  formatClassSummary,
  formatRange,
  getDateFormatter,
  statusLabels,
} from "@/lib/format";
import { formatTasmiJuzSummary, getCompletedTasmiJuzList } from "@/lib/tasmi";
import { normalizeSearchText } from "@/lib/search";

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
  programType: ProgramType = ProgramType.ACADEMIC,
  academicYear?: string,
  highlightId?: string,
  grade?: 7 | 8 | 9,
) {
  const cacheKey = [
    "students:list",
    teacherId ?? "admin",
    locale,
    page,
    pageSize,
    programType,
    normalizeSearchText(query),
    academicYear ?? "active",
    highlightId ?? "none",
    grade ?? "all",
  ].join(":");

  return cached(cacheKey, 15_000, () =>
    getLiveStudentsPageDataInner(
      query,
      teacherId,
      locale,
      page,
      pageSize,
      programType,
      academicYear,
      highlightId,
      grade,
    ),
  );
}

async function getLiveStudentsPageDataInner(
  query = "",
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = PAGE_SIZE_FALLBACK,
  programType: ProgramType = ProgramType.ACADEMIC,
  academicYear?: string,
  highlightId?: string,
  grade?: 7 | 8 | 9,
) {
  const dateFormatter = getDateFormatter(locale);
  const normalizedQuery = normalizeSearchText(query);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const year = academicYear ?? await getActiveAcademicYear();
  const where = {
    isActive: true,
    classGroup: { academicYear: year, programType, ...(grade ? { grade } : {}) },
    ...scopeWhere(teacherId),
    ...(normalizedQuery
      ? {
          OR: [
            { fullName: { contains: normalizedQuery, mode: "insensitive" as const } },
            {
              academicClass: {
                name: { contains: normalizedQuery, mode: "insensitive" as const },
              },
            },
            {
              classGroup: {
                name: { contains: normalizedQuery, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [totalCount, students] = await withRetry(() => Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        classGroup: { select: { name: true, level: true, programType: true, grade: true } },
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
        tasmiRecords: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            juz: true,
            grade: true,
            status: true,
            date: true,
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
    }),
  ]));

  if (highlightId && !students.some(({ id }) => id === highlightId)) {
    const highlighted = await prisma.student.findFirst({
      where: { id: highlightId, isActive: true, classGroup: { academicYear: year, programType, ...(grade ? { grade } : {}) }, ...scopeWhere(teacherId) },
      include: {
        classGroup: { select: { name: true, level: true, programType: true, grade: true } },
        academicClass: { select: { name: true } },
        memorizationRecords: { orderBy: { date: "desc" }, take: 1, select: { surah: true, fromAyah: true, toAyah: true, date: true, status: true } },
        revisionRecords: { orderBy: { date: "desc" }, take: 1, select: { surah: true, fromAyah: true, toAyah: true, date: true, status: true } },
        tasmiRecords: { orderBy: { createdAt: "desc" }, take: 5, select: { juz: true, grade: true, status: true, date: true } },
        _count: { select: { targets: { where: { status: TargetStatus.ACTIVE } } } },
      },
    });
    if (highlighted) students.push(highlighted);
  }

  return {
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / safePageSize)),
    students: students.map((student) => {
      const latestHafalan = formatLatestRecord(student.memorizationRecords[0], dateFormatter);
      const latestMurojaah = formatLatestRecord(student.revisionRecords[0], dateFormatter);
      const completedJuz = getCompletedTasmiJuzList(student.tasmiRecords);
      const tasmiJuzSummary = formatTasmiJuzSummary(completedJuz);

      return {
        id: student.id,
        fullName: student.fullName,
        ...formatClassSummary(student),
        notes: student.notes,
        activeTargetCount: student._count.targets,
        latestHafalan,
        latestMurojaah,
        tasmiJuzSummary,
        needsReview: Boolean(
          latestHafalan?.needsReview || latestMurojaah?.needsReview,
        ),
      };
    }),
  };
}

export async function getLiveInactiveStudentsData(
  teacherId?: string | null,
  programType: ProgramType = ProgramType.ACADEMIC,
  academicYear?: string,
  grade?: 7 | 8 | 9,
) {
  return cached(
    `students:inactive:${teacherId ?? "admin"}:${programType}:${academicYear ?? "active"}:${grade ?? "all"}`,
    15_000,
    () => getLiveInactiveStudentsDataInner(teacherId, programType, academicYear, grade),
  );
}

async function getLiveInactiveStudentsDataInner(
  teacherId?: string | null,
  programType: ProgramType = ProgramType.ACADEMIC,
  academicYear?: string,
  grade?: 7 | 8 | 9,
) {
  const year = academicYear ?? await getActiveAcademicYear();
  const students = await withRetry(() =>
    prisma.student.findMany({
      where: {
        isActive: false,
        classGroup: { academicYear: year, programType, ...(grade ? { grade } : {}) },
        ...scopeWhere(teacherId),
      },
      orderBy: { fullName: "asc" },
      include: {
        classGroup: { select: { name: true, level: true, programType: true, grade: true } },
        academicClass: { select: { name: true } },
        _count: {
          select: {
            targets: {
              where: { status: TargetStatus.ACTIVE },
            },
          },
        },
      },
    }),
  );

  return students.map((student) => ({
    activeTargetCount: student._count.targets,
    deleteBlockingDataCount: student._count.targets,
    id: student.id,
    fullName: student.fullName,
    ...formatClassSummary(student),
  }));
}
