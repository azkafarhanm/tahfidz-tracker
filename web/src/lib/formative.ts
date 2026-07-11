import { ProgramType, RecordStatus, Semester } from "@/generated/prisma-next/enums";
import { prisma, withRetry } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import {
  getDateFormatter,
  getTimeFormatter,
  halaqahLevelLabels,
  formatRange,
  statusLabels,
} from "@/lib/format";

type FormativeRow = {
  id: string;
  studentId: string;
  studentName: string;
  academicClassName: string;
  type: "Hafalan" | "Murojaah";
  surah: string;
  fromAyah: number;
  toAyah: number;
  score: number | null;
  status: RecordStatus;
  notes: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type FormativeOverviewStudent = {
  id: string;
  fullName: string;
  halaqahName: string;
  halaqahLevel: string;
  academicClassName: string;
  totalAssessments: number;
  hafalanCount: number;
  murojaahCount: number;
  dailyScores: Array<{
    id: string;
    type: "Hafalan" | "Murojaah";
    date: string;
    score: number;
  }>;
  latestScore: number | null;
  averageScore: number | null;
  latestType: "Hafalan" | "Murojaah" | null;
  latestDate: string;
  latestRange: string;
  latestStatus: string;
  needsReview: boolean;
};

export type FormativeOverviewResult = {
  students: FormativeOverviewStudent[];
  totalAssessments: number;
  averageScore: number | null;
  totalStudentCount: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
};

export async function getTeacherFormativeOverview(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  locale = "id",
  page?: number,
  pageSize?: number,
  programType?: ProgramType,
) {
  const cacheKey = `formative-overview:${teacherId ?? "admin"}:${semester}:${academicYear}:${classLevel ?? "all"}:${locale}:${page ?? 1}:${pageSize ?? "all"}:${programType ?? "all"}`;
  return cached(cacheKey, 30_000, () =>
    withRetry(() =>
      getTeacherFormativeOverviewInner(
        teacherId,
        semester,
        academicYear,
        classLevel,
        locale,
        page,
        pageSize,
        programType,
      ),
    ),
  );
}

async function getTeacherFormativeOverviewInner(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel: number | undefined,
  locale: string,
  page?: number,
  pageSize?: number,
  programType?: ProgramType,
) {
  const dateFormatter = getDateFormatter(locale);
  const studentWhere = {
    ...(teacherId ? { teacherId } : {}),
    isActive: true,
    classGroup: {
      academicYear,
      ...(programType ? { programType } : {}),
      ...(classLevel ? { grade: classLevel } : {}),
    },
  };
  const safePage = page ? Math.max(1, page) : undefined;
  const safePageSize = pageSize ? Math.max(1, pageSize) : undefined;

  const [totalStudentCount, students, hafalanAggregate, murojaahAggregate] =
    await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          fullName: true,
          classGroup: {
            select: {
              name: true,
              level: true,
              programType: true,
              grade: true,
            },
          },
          academicClass: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          fullName: "asc",
        },
        ...(safePage && safePageSize
          ? {
              skip: (safePage - 1) * safePageSize,
              take: safePageSize,
            }
          : {}),
      }),
      prisma.memorizationRecord.aggregate({
        where: {
          ...(teacherId ? { teacherId } : {}),
          academicYear,
          semester,
          student: studentWhere,
        },
        _count: { _all: true, score: true },
        _sum: { score: true },
      }),
      prisma.revisionRecord.aggregate({
        where: {
          ...(teacherId ? { teacherId } : {}),
          academicYear,
          semester,
          student: studentWhere,
        },
        _count: { _all: true, score: true },
        _sum: { score: true },
      }),
    ]);

  const studentIds = students.map((student) => student.id);
  const totalAssessments =
    hafalanAggregate._count._all + murojaahAggregate._count._all;
  const totalScoredAssessments =
    hafalanAggregate._count.score + murojaahAggregate._count.score;
  const scoreSum =
    (hafalanAggregate._sum.score ?? 0) + (murojaahAggregate._sum.score ?? 0);

  if (studentIds.length === 0) {
    return {
      students: [] as FormativeOverviewStudent[],
      totalAssessments,
      averageScore:
        totalScoredAssessments > 0
          ? Math.round((scoreSum / totalScoredAssessments) * 10) / 10
          : null,
      totalStudentCount,
      pagination:
        safePage && safePageSize
          ? {
              page: safePage,
              pageSize: safePageSize,
              totalPages: Math.max(1, Math.ceil(totalStudentCount / safePageSize)),
            }
          : null,
    } satisfies FormativeOverviewResult;
  }

  const rows = await getTeacherFormativeRows(
    teacherId,
    studentIds,
    semester,
    academicYear,
  );

  const grouped = new Map<string, FormativeRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.studentId) ?? [];
    list.push(row);
    grouped.set(row.studentId, list);
  }
  return {
    students: students.map((student) => {
      const studentRows = (grouped.get(student.id) ?? []).sort(
        (left, right) => right.date.getTime() - left.date.getTime(),
      );
      const latest = studentRows[0];
      const scoredRows = studentRows
        .filter((row): row is FormativeRow & { score: number } => row.score !== null)
        .slice()
        .sort((left, right) => left.date.getTime() - right.date.getTime());
      const scores = studentRows
        .map((row) => row.score)
        .filter((score): score is number => score !== null);

      return {
        id: student.id,
        fullName: student.fullName,
        halaqahName: student.classGroup.name,
        halaqahLevel: student.classGroup.programType === "BOARDING" ? "" : halaqahLevelLabels[student.classGroup.level],
        academicClassName: student.classGroup.programType === "BOARDING" ? String(student.classGroup.grade) : (student.academicClass?.name ?? "-"),
        totalAssessments: studentRows.length,
        hafalanCount: studentRows.filter((row) => row.type === "Hafalan").length,
        murojaahCount: studentRows.filter((row) => row.type === "Murojaah").length,
        dailyScores: scoredRows.map((row) => ({
          id: row.id,
          type: row.type,
          date: dateFormatter.format(row.date),
          score: row.score,
        })),
        latestScore: latest?.score ?? null,
        averageScore:
          scores.length > 0
            ? Math.round(
                (scores.reduce((sum, score) => sum + score, 0) / scores.length) *
                  10,
              ) / 10
            : null,
        latestType: latest?.type ?? null,
        latestDate: latest ? dateFormatter.format(latest.date) : "-",
        latestRange: latest
          ? formatRange(latest.surah, latest.fromAyah, latest.toAyah)
          : "-",
        latestStatus: latest ? statusLabels[latest.status] : "-",
        needsReview: latest?.status === RecordStatus.PERLU_MUROJAAH,
      };
    }),
    totalAssessments,
    averageScore:
      totalScoredAssessments > 0
        ? Math.round((scoreSum / totalScoredAssessments) * 10) / 10
        : null,
    totalStudentCount,
    pagination:
      safePage && safePageSize
        ? {
            page: safePage,
            pageSize: safePageSize,
            totalPages: Math.max(1, Math.ceil(totalStudentCount / safePageSize)),
          }
        : null,
  } satisfies FormativeOverviewResult;
}

export async function getStudentFormativeDetail(
  studentId: string,
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  locale = "id",
) {
  return getStudentFormativeDetailInner(
    studentId,
    teacherId,
    semester,
    academicYear,
    locale,
  );
}

async function getStudentFormativeDetailInner(
  studentId: string,
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  locale: string,
) {
  const dateFormatter = getDateFormatter(locale);
  const timeFormatter = getTimeFormatter(locale);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      classGroup: {
        select: {
          name: true,
          level: true,
          grade: true,
          programType: true,
        },
      },
      academicClass: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const rows = await getTeacherFormativeRows(
    teacherId,
    [studentId],
    semester,
    academicYear,
  );

  const sortedRows = rows.sort(
    (left, right) => right.date.getTime() - left.date.getTime(),
  );
  const scores = sortedRows
    .map((row) => row.score)
    .filter((score): score is number => score !== null);

  return {
    id: student.id,
    fullName: student.fullName,
    halaqahName: student.classGroup.name,
    halaqahLevel: student.classGroup.programType === "BOARDING" ? "" : halaqahLevelLabels[student.classGroup.level],
    programType: student.classGroup.programType,
    classLevel: student.classGroup.grade,
    academicClassName: student.classGroup.programType === "BOARDING" ? String(student.classGroup.grade) : (student.academicClass?.name ?? "-"),
    totalAssessments: sortedRows.length,
    hafalanCount: sortedRows.filter((row) => row.type === "Hafalan").length,
    murojaahCount: sortedRows.filter((row) => row.type === "Murojaah").length,
    averageScore:
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
          ) / 10
        : null,
    records: sortedRows.map((row) => ({
      id: row.id,
      type: row.type,
      surah: row.surah,
      range: formatRange(row.surah, row.fromAyah, row.toAyah),
      dateTimeIso: row.date.toISOString(),
      date: dateFormatter.format(row.date),
      time: timeFormatter.format(row.date),
      score: row.score,
      status: statusLabels[row.status],
      notes: row.notes,
      needsReview: row.status === RecordStatus.PERLU_MUROJAAH,
    })),
  };
}

export async function getTeacherFormativeExportData(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  programType?: ProgramType,
) {
  return getTeacherFormativeExportDataInner(
    teacherId,
    semester,
    academicYear,
    classLevel,
    programType,
  );
}

async function getTeacherFormativeExportDataInner(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  programType?: ProgramType,
) {
  const students = await prisma.student.findMany({
    where: {
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
      classGroup: {
        academicYear,
        ...(programType ? { programType } : {}),
        ...(classLevel ? { grade: classLevel } : {}),
      },
    },
    select: {
      id: true,
      fullName: true,
      classGroup: {
        select: {
          grade: true,
          name: true,
          level: true,
          programType: true,
        },
      },
      academicClass: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const studentIds = students.map((student) => student.id);
  const rows =
    studentIds.length > 0
      ? await getTeacherFormativeRows(
          teacherId,
          studentIds,
          semester,
          academicYear,
        )
      : [];

  return { students, rows };
}

async function getTeacherFormativeRows(
  teacherId: string | null,
  studentIds: string[],
  semester: Semester,
  academicYear: string,
) {
  const [hafalan, murojaah] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: {
        ...(teacherId ? { teacherId } : {}),
        studentId: { in: studentIds },
        academicYear,
        semester,
      },
      select: {
        id: true,
        studentId: true,
        surah: true,
        fromAyah: true,
        toAyah: true,
        score: true,
        status: true,
        notes: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            fullName: true,
            academicClass: { select: { name: true } },
            classGroup: { select: { programType: true, grade: true } },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.revisionRecord.findMany({
      where: {
        ...(teacherId ? { teacherId } : {}),
        studentId: { in: studentIds },
        academicYear,
        semester,
      },
      select: {
        id: true,
        studentId: true,
        surah: true,
        fromAyah: true,
        toAyah: true,
        score: true,
        status: true,
        notes: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            fullName: true,
            academicClass: { select: { name: true } },
            classGroup: { select: { programType: true, grade: true } },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  const hafalanRows: FormativeRow[] = hafalan.map((record) => ({
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.fullName,
    academicClassName: record.student.classGroup.programType === "BOARDING" ? String(record.student.classGroup.grade) : (record.student.academicClass?.name ?? "-"),
    type: "Hafalan",
    surah: record.surah,
    fromAyah: record.fromAyah,
    toAyah: record.toAyah,
    score: record.score,
    status: record.status,
    notes: record.notes,
    date: record.date,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  const murojaahRows: FormativeRow[] = murojaah.map((record) => ({
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.fullName,
    academicClassName: record.student.classGroup.programType === "BOARDING" ? String(record.student.classGroup.grade) : (record.student.academicClass?.name ?? "-"),
    type: "Murojaah",
    surah: record.surah,
    fromAyah: record.fromAyah,
    toAyah: record.toAyah,
    score: record.score,
    status: record.status,
    notes: record.notes,
    date: record.date,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  return [...hafalanRows, ...murojaahRows]
    .map((row) => ({ ...row, semester, academicYear }))
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}
