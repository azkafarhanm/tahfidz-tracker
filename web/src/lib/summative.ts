import { Prisma } from "@/generated/prisma-next/client";
import { Semester } from "@/generated/prisma-next/enums";
import { cached, invalidateCache } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { getDateFormatter, halaqahLevelLabels } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type ClassTargetSurah = {
  surahId: string;
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  juz: number;
  isRequired: boolean;
};

export type SummativeScoreRow = {
  id: string;
  surahId: string;
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  score: number;
  notes: string | null;
  semester: Semester;
  academicYear: string;
  createdAt: Date;
};

export type SummativeOverviewStudent = {
  id: string;
  fullName: string;
  halaqahName: string;
  halaqahLevel: string;
  academicClassName: string;
  totalAssessments: number;
  averageScore: number | null;
  latestAssessment: string;
  latestDate: string;
};

export type SummativeOverviewResult = {
  students: SummativeOverviewStudent[];
  totalAssessments: number;
  totalStudentCount: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
};

export type SummativeAssessmentDetail = {
  id: string;
  surahId: string;
  surahName: string;
  surahNumber: number;
  surahArabicName: string;
  score: number;
  notes: string | null;
  semester: Semester;
  semesterLabel: string;
  recordedAt: string;
};

export type StudentSummativeDetail = {
  id: string;
  fullName: string;
  halaqahName: string;
  halaqahLevel: string;
  classLevel: number;
  academicClassName: string;
  totalAssessments: number;
  averageScore: number | null;
  assessments: SummativeAssessmentDetail[];
};

export type SummativeExportRow = {
  studentId: string;
  studentName: string;
  academicClassName: string;
  halaqahName: string;
  classLevel: number;
  semester: Semester;
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  score: number;
  notes: string | null;
  createdAt: Date;
};

export function semesterLabel(value: Semester | string): string {
  return value === Semester.GANJIL ? "Ganjil" : "Genap";
}

export function isSemesterValue(value: string): value is Semester {
  return value === Semester.GANJIL || value === Semester.GENAP;
}

export function parseSemester(value: string): Semester {
  if (isSemesterValue(value)) {
    return value;
  }

  throw new Error(`Invalid semester: ${value}`);
}

export async function getClassTargets(
  classLevel: number,
  semester: Semester,
  academicYear?: string,
): Promise<ClassTargetSurah[]> {
  const year = academicYear ?? await getActiveAcademicYear();
  const cacheKey = `summative-targets:${classLevel}:${semester}:${year}`;

  return cached(cacheKey, 30_000, () =>
    getClassTargetsInner(classLevel, semester, year),
  );
}

async function getClassTargetsInner(
  classLevel: number,
  semester: Semester,
  academicYear: string,
): Promise<ClassTargetSurah[]> {
  const targets = await prisma.targetSurah.findMany({
    where: {
      classLevel,
      semester,
      academicYear,
    },
    include: {
      surah: {
        select: {
          id: true,
          number: true,
          name: true,
          arabicName: true,
          totalAyahs: true,
          juz: true,
        },
      },
    },
    orderBy: {
      surah: {
        number: "asc",
      },
    },
  });

  return targets.map((target) => ({
    surahId: target.surah.id,
    number: target.surah.number,
    name: target.surah.name,
    arabicName: target.surah.arabicName,
    totalAyahs: target.surah.totalAyahs,
    juz: target.surah.juz,
    isRequired: target.isRequired,
  }));
}

export async function getTeacherSummativeOverview(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  locale = "id",
  page?: number,
  pageSize?: number,
) {
  return getTeacherSummativeOverviewInner(
    teacherId,
    semester,
    academicYear,
    classLevel,
    locale,
    page,
    pageSize,
  );
}

async function getTeacherSummativeOverviewInner(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel: number | undefined,
  locale: string,
  page?: number,
  pageSize?: number,
) {
  const dateFormatter = getDateFormatter(locale);
  const studentWhere = {
    ...(teacherId ? { teacherId } : {}),
    isActive: true,
    ...(classLevel ? { classGroup: { grade: classLevel } } : {}),
  };
  const safePage = page ? Math.max(1, page) : undefined;
  const safePageSize = pageSize ? Math.max(1, pageSize) : undefined;
  const [totalStudentCount, totalAssessments, students] = await Promise.all([
    prisma.student.count({ where: studentWhere }),
    prisma.summativeScore.count({
      where: {
        semester,
        academicYear,
        student: studentWhere,
      },
    }),
    prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        classGroup: {
          select: {
            name: true,
            level: true,
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
  ]);

  const studentIds = students.map((student) => student.id);
  if (studentIds.length === 0) {
    return {
      students: [],
      totalAssessments,
      totalStudentCount,
      pagination:
        safePage && safePageSize
          ? {
              page: safePage,
              pageSize: safePageSize,
              totalPages: Math.max(1, Math.ceil(totalStudentCount / safePageSize)),
            }
          : null,
    } satisfies SummativeOverviewResult;
  }

  const studentScoreWhere = {
    studentId: { in: studentIds },
    semester,
    academicYear,
  } satisfies Prisma.SummativeScoreWhereInput;

  const [scoreStats, latestTimestamps] = await Promise.all([
    prisma.summativeScore.groupBy({
      by: ["studentId"],
      where: studentScoreWhere,
      _count: { _all: true },
      _avg: { score: true },
    }),
    prisma.summativeScore.groupBy({
      by: ["studentId"],
      where: studentScoreWhere,
      _max: { createdAt: true },
    }),
  ]);

  const latestRows =
    latestTimestamps.length > 0
      ? await prisma.summativeScore.findMany({
          where: {
            OR: latestTimestamps
              .filter((row) => row._max.createdAt)
              .map((row) => ({
                studentId: row.studentId,
                createdAt: row._max.createdAt!,
                semester,
                academicYear,
              })),
          },
          select: {
            studentId: true,
            createdAt: true,
            surah: {
              select: {
                name: true,
              },
            },
          },
        })
      : [];

  const statsByStudent = new Map(
    scoreStats.map((row) => [
      row.studentId,
      {
        totalAssessments: row._count._all,
        averageScore:
          row._avg.score !== null ? roundAverage([row._avg.score]) : null,
      },
    ]),
  );
  const latestByStudent = new Map<string, { latestAssessment: string; latestDate: string }>();
  for (const row of latestRows) {
    if (latestByStudent.has(row.studentId)) {
      continue;
    }
    latestByStudent.set(row.studentId, {
      latestAssessment: row.surah.name,
      latestDate: dateFormatter.format(row.createdAt),
    });
  }

  return {
    students: students.map((student) => {
      const stats = statsByStudent.get(student.id);
      const latest = latestByStudent.get(student.id);

      return {
        id: student.id,
        fullName: student.fullName,
        halaqahName: student.classGroup.name,
        halaqahLevel: halaqahLevelLabels[student.classGroup.level],
        academicClassName: student.academicClass?.name ?? "-",
        totalAssessments: stats?.totalAssessments ?? 0,
        averageScore: stats?.averageScore ?? null,
        latestAssessment: latest?.latestAssessment ?? "-",
        latestDate: latest?.latestDate ?? "-",
      } satisfies SummativeOverviewStudent;
    }),
    totalAssessments,
    totalStudentCount,
    pagination:
      safePage && safePageSize
        ? {
            page: safePage,
            pageSize: safePageSize,
            totalPages: Math.max(1, Math.ceil(totalStudentCount / safePageSize)),
          }
        : null,
  } satisfies SummativeOverviewResult;
}

export async function getStudentSummativeDetail(
  studentId: string,
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  locale = "id",
) {
  return getStudentSummativeDetailInner(
    studentId,
    teacherId,
    semester,
    academicYear,
    locale,
  );
}

async function getStudentSummativeDetailInner(
  studentId: string,
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  locale: string,
): Promise<StudentSummativeDetail | null> {
  const dateFormatter = getDateFormatter(locale);

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
        },
      },
      academicClass: {
        select: {
          name: true,
        },
      },
      summativeScores: {
        where: {
          semester,
          academicYear,
        },
        include: {
          surah: {
            select: {
              id: true,
              name: true,
              number: true,
              arabicName: true,
            },
          },
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            surah: {
              number: "asc",
            },
          },
        ],
      },
    },
  });

  if (!student) {
    return null;
  }

  const scores = student.summativeScores.map((assessment) => assessment.score);

  return {
    id: student.id,
    fullName: student.fullName,
    halaqahName: student.classGroup.name,
    halaqahLevel: halaqahLevelLabels[student.classGroup.level],
    classLevel: student.classGroup.grade,
    academicClassName: student.academicClass?.name ?? "-",
    totalAssessments: student.summativeScores.length,
    averageScore: scores.length > 0 ? roundAverage(scores) : null,
    assessments: student.summativeScores.map((assessment) => ({
      id: assessment.id,
      surahId: assessment.surah.id,
      surahName: assessment.surah.name,
      surahNumber: assessment.surah.number,
      surahArabicName: assessment.surah.arabicName,
      score: assessment.score,
      notes: assessment.notes,
      semester: assessment.semester,
      semesterLabel: semesterLabel(assessment.semester),
      recordedAt: dateFormatter.format(assessment.createdAt),
    })),
  };
}

export async function getStudentSummativeAssessmentForEdit(
  studentId: string,
  assessmentId: string,
  teacherId: string | null,
) {
  return prisma.summativeScore.findFirst({
    where: {
      id: assessmentId,
      studentId,
      ...(teacherId ? { student: { teacherId } } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          classGroup: {
            select: {
              grade: true,
            },
          },
        },
      },
      surah: {
        select: {
          name: true,
          number: true,
        },
      },
    },
  });
}

export async function getTeacherSummativeExportData(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
) {
  return getTeacherSummativeExportDataInner(
    teacherId,
    semester,
    academicYear,
    classLevel,
  );
}

async function getTeacherSummativeExportDataInner(
  teacherId: string | null,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
) {
  const students = await prisma.student.findMany({
    where: {
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
      ...(classLevel ? { classGroup: { grade: classLevel } } : {}),
    },
    select: {
      id: true,
      fullName: true,
      classGroup: {
        select: {
          grade: true,
          name: true,
          level: true,
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
      ? await prisma.summativeScore.findMany({
          where: {
            studentId: { in: studentIds },
            semester,
            academicYear,
          },
          select: {
            studentId: true,
            score: true,
            notes: true,
            createdAt: true,
            semester: true,
            surah: {
              select: {
                number: true,
                name: true,
                arabicName: true,
              },
            },
            student: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              surah: {
                number: "asc",
              },
            },
          ],
        })
      : [];

  const studentMetadata = new Map(
    students.map((student) => [
      student.id,
      {
        academicClassName: student.academicClass?.name ?? "-",
        halaqahName: `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`,
        classLevel: student.classGroup.grade,
      },
    ]),
  );
  const studentSummaries = new Map<
    string,
    { totalAssessments: number; scoreTotal: number; scoredCount: number }
  >();

  const exportRows: SummativeExportRow[] = rows.map((assessment) => {
    const current = studentSummaries.get(assessment.studentId) ?? {
      totalAssessments: 0,
      scoreTotal: 0,
      scoredCount: 0,
    };
    current.totalAssessments += 1;
    current.scoreTotal += assessment.score;
    current.scoredCount += 1;
    studentSummaries.set(assessment.studentId, current);
    const metadata = studentMetadata.get(assessment.studentId);

    return {
      studentId: assessment.studentId,
      studentName: assessment.student.fullName,
      academicClassName: metadata?.academicClassName ?? "-",
      halaqahName: metadata?.halaqahName ?? "-",
      classLevel: metadata?.classLevel ?? 0,
      semester: assessment.semester,
      surahNumber: assessment.surah.number,
      surahName: assessment.surah.name,
      surahArabicName: assessment.surah.arabicName,
      score: assessment.score,
      notes: assessment.notes,
      createdAt: assessment.createdAt,
    };
  });

  return {
    students: students.map((student) => {
      const summary = studentSummaries.get(student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        academicClassName: student.academicClass?.name ?? "-",
        halaqahName: `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`,
        classLevel: student.classGroup.grade,
        totalAssessments: summary?.totalAssessments ?? 0,
        averageScore:
          summary && summary.scoredCount > 0
            ? Math.round((summary.scoreTotal / summary.scoredCount) * 10) / 10
            : null,
      };
    }),
    rows: exportRows,
  };
}

export async function resolveSurahByInput(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  const surahNumber = Number.parseInt(trimmed, 10);
  const search: Prisma.SurahWhereInput[] = [
    {
      name: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
  ];

  if (Number.isFinite(surahNumber)) {
    search.unshift({
      number: surahNumber,
    });
  }

  return prisma.surah.findFirst({
    where: {
      OR: search,
    },
    select: {
      id: true,
      name: true,
      number: true,
      arabicName: true,
    },
  });
}

export async function saveSummativeAssessment(input: {
  studentId: string;
  surahId: string;
  semester: Semester;
  academicYear: string;
  score: number;
  notes?: string | null;
}) {
  if (input.score < 0 || input.score > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  const record = await prisma.summativeScore.upsert({
    where: {
      studentId_surahId_semester_academicYear: {
        studentId: input.studentId,
        surahId: input.surahId,
        semester: input.semester,
        academicYear: input.academicYear,
      },
    },
    update: {
      score: input.score,
      notes: input.notes ?? null,
    },
    create: {
      studentId: input.studentId,
      surahId: input.surahId,
      semester: input.semester,
      academicYear: input.academicYear,
      score: input.score,
      notes: input.notes ?? null,
    },
  });

  invalidateSummativeCache(record.studentId);
  return record;
}

export async function updateSummativeAssessment(
  assessmentId: string,
  input: {
    studentId: string;
    surahId: string;
    semester: Semester;
    academicYear: string;
    score: number;
    notes?: string | null;
  },
) {
  if (input.score < 0 || input.score > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  const record = await prisma.summativeScore.update({
    where: {
      id: assessmentId,
    },
    data: {
      studentId: input.studentId,
      surahId: input.surahId,
      semester: input.semester,
      academicYear: input.academicYear,
      score: input.score,
      notes: input.notes ?? null,
    },
  });

  invalidateSummativeCache(record.studentId);
  return record;
}

export async function deleteSummativeAssessment(
  assessmentId: string,
  studentId: string,
) {
  const result = await prisma.$transaction(async (tx) =>
    tx.summativeScore.deleteMany({
      where: {
        id: assessmentId,
        studentId,
      },
    }),
  );

  if (result.count !== 1) {
    return { deleted: false as const, count: result.count };
  }

  invalidateSummativeCache(studentId);
  return { deleted: true as const, count: result.count };
}

export async function getStudentSummativeHistory(
  studentId: string,
  academicYear?: string,
  teacherId?: string | null,
  options?: {
    skipTeacherOwnershipCheck?: boolean;
  },
): Promise<SummativeScoreRow[]> {
  if (teacherId && !options?.skipTeacherOwnershipCheck) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      select: { id: true },
    });
    if (!student) return [];
  }

  const year = academicYear ?? await getActiveAcademicYear();
  return getStudentSummativeHistoryInner(studentId, year);
}

async function getStudentSummativeHistoryInner(
  studentId: string,
  academicYear: string,
): Promise<SummativeScoreRow[]> {
  const scores = await prisma.summativeScore.findMany({
    where: {
      studentId,
      academicYear,
    },
    include: {
      surah: {
        select: {
          number: true,
          name: true,
          arabicName: true,
        },
      },
    },
    orderBy: [
      {
        semester: "asc",
      },
      {
        surah: {
          number: "asc",
        },
      },
    ],
  });

  return scores.map((score) => ({
    id: score.id,
    surahId: score.surahId,
    surahNumber: score.surah.number,
    surahName: score.surah.name,
    surahArabicName: score.surah.arabicName,
    score: score.score,
    notes: score.notes,
    semester: score.semester,
    academicYear: score.academicYear,
    createdAt: score.createdAt,
  }));
}

export function invalidateSummativeCache(studentId?: string) {
  if (studentId) {
    invalidateCache(`summative-detail:${studentId}:`);
    invalidateCache(`summative-history:${studentId}`);
    invalidateCache(`report-student:${studentId}`);
  } else {
    invalidateCache("summative-detail:");
  }
  invalidateCache("summative-");
  invalidateCache("report-teacher:");
}

function roundAverage(scores: number[]) {
  return Math.round(
    (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
  ) / 10;
}
