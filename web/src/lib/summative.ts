import { Prisma } from "@/generated/prisma-next/client";
import { Semester } from "@/generated/prisma-next/enums";
import { cached, invalidateCache } from "@/lib/cache";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import {
  formatRange,
  getDateFormatter,
  halaqahLevelLabels,
} from "@/lib/format";
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
  const year = academicYear ?? getCurrentAcademicYear();
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
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  locale = "id",
) {
  const cacheKey = `summative-overview:${teacherId}:${semester}:${academicYear}:${classLevel ?? "all"}:${locale}`;

  return cached(cacheKey, 30_000, () =>
    getTeacherSummativeOverviewInner(
      teacherId,
      semester,
      academicYear,
      classLevel,
      locale,
    ),
  );
}

async function getTeacherSummativeOverviewInner(
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel: number | undefined,
  locale: string,
) {
  const dateFormatter = getDateFormatter(locale);
  const students = await prisma.student.findMany({
    where: {
      teacherId,
      isActive: true,
      ...(classLevel ? { classGroup: { grade: classLevel } } : {}),
    },
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
      summativeScores: {
        where: {
          semester,
          academicYear,
        },
        include: {
          surah: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  return {
    students: students.map((student) => {
      const validScores = student.summativeScores.map((score) => score.score);
      const latest = student.summativeScores[0];

      return {
        id: student.id,
        fullName: student.fullName,
        halaqahName: student.classGroup.name,
        halaqahLevel: halaqahLevelLabels[student.classGroup.level],
        academicClassName: student.academicClass?.name ?? "-",
        totalAssessments: student.summativeScores.length,
        averageScore:
          validScores.length > 0
            ? roundAverage(validScores)
            : null,
        latestAssessment: latest ? latest.surah.name : "-",
        latestDate: latest ? dateFormatter.format(latest.createdAt) : "-",
      } satisfies SummativeOverviewStudent;
    }),
    totalAssessments: students.reduce(
      (sum, student) => sum + student.summativeScores.length,
      0,
    ),
  };
}

export async function getStudentSummativeDetail(
  studentId: string,
  teacherId: string,
  semester: Semester,
  academicYear: string,
  locale = "id",
) {
  const cacheKey = `summative-detail:${studentId}:${teacherId}:${semester}:${academicYear}:${locale}`;

  return cached(cacheKey, 30_000, () =>
    getStudentSummativeDetailInner(
      studentId,
      teacherId,
      semester,
      academicYear,
      locale,
    ),
  );
}

async function getStudentSummativeDetailInner(
  studentId: string,
  teacherId: string,
  semester: Semester,
  academicYear: string,
  locale: string,
): Promise<StudentSummativeDetail | null> {
  const dateFormatter = getDateFormatter(locale);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      teacherId,
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
  teacherId: string,
) {
  return prisma.summativeScore.findFirst({
    where: {
      id: assessmentId,
      studentId,
      student: {
        teacherId,
      },
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
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
) {
  const students = await prisma.student.findMany({
    where: {
      teacherId,
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
      summativeScores: {
        where: {
          semester,
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
    orderBy: {
      fullName: "asc",
    },
  });

  const rows: SummativeExportRow[] = students.flatMap((student) =>
    student.summativeScores.map((assessment) => ({
      studentId: student.id,
      studentName: student.fullName,
      academicClassName: student.academicClass?.name ?? "-",
      halaqahName: `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`,
      classLevel: student.classGroup.grade,
      semester: assessment.semester,
      surahNumber: assessment.surah.number,
      surahName: assessment.surah.name,
      surahArabicName: assessment.surah.arabicName,
      score: assessment.score,
      notes: assessment.notes,
      createdAt: assessment.createdAt,
    })),
  );

  return {
    students: students.map((student) => {
      const studentScores = student.summativeScores.map((assessment) => assessment.score);
      return {
        id: student.id,
        fullName: student.fullName,
        academicClassName: student.academicClass?.name ?? "-",
        halaqahName: `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`,
        classLevel: student.classGroup.grade,
        totalAssessments: student.summativeScores.length,
        averageScore: studentScores.length > 0 ? roundAverage(studentScores) : null,
      };
    }),
    rows,
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

export async function deleteSummativeAssessment(assessmentId: string) {
  const record = await prisma.summativeScore.delete({
    where: {
      id: assessmentId,
    },
  });

  invalidateSummativeCache(record.studentId);
  return record;
}

export async function getStudentSummativeHistory(
  studentId: string,
  academicYear?: string,
  teacherId?: string | null,
): Promise<SummativeScoreRow[]> {
  if (teacherId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      select: { id: true },
    });
    if (!student) return [];
  }

  const year = academicYear ?? getCurrentAcademicYear();
  const cacheKey = `summative-history:${studentId}:${year}`;

  return cached(cacheKey, 30_000, () =>
    getStudentSummativeHistoryInner(studentId, year),
  );
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
    invalidateCache(`summative-history:${studentId}`);
    invalidateCache(`report-student:${studentId}`);
  }
  invalidateCache("summative-");
  invalidateCache("report-teacher:");
}

function roundAverage(scores: number[]) {
  return Math.round(
    (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
  ) / 10;
}
