import { Semester } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached, invalidateCache } from "@/lib/cache";
import { getCurrentAcademicYear } from "@/lib/academic-year";

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
  semester: string;
  academicYear: string;
};

export type SemesterSummary = {
  studentId: string;
  fullName: string;
  totalSurahs: number;
  scoredSurahs: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completionRate: number;
};

export function semesterLabel(s: string): string {
  return s === "GANJIL" ? "Ganjil" : "Genap";
}

export function isSemesterValue(value: string): value is Semester {
  return value === Semester.GANJIL || value === Semester.GENAP;
}

export function parseSemester(value: string): Semester {
  if (isSemesterValue(value)) return value;
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
    where: { classLevel, semester, academicYear },
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
    orderBy: { surah: { number: "asc" } },
  });

  return targets.map((t) => ({
    surahId: t.surah.id,
    number: t.surah.number,
    name: t.surah.name,
    arabicName: t.surah.arabicName,
    totalAyahs: t.surah.totalAyahs,
    juz: t.surah.juz,
    isRequired: t.isRequired,
  }));
}

export async function getSummativeScores(
  studentIds: string[],
  semester: Semester,
  academicYear?: string,
): Promise<Map<string, SummativeScoreRow[]>> {
  if (studentIds.length === 0) return new Map();

  const year = academicYear ?? getCurrentAcademicYear();
  const scores = await prisma.summativeScore.findMany({
    where: {
      studentId: { in: studentIds },
      semester,
      academicYear: year,
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
  });

  const map = new Map<string, SummativeScoreRow[]>();
  for (const s of scores) {
    const list = map.get(s.studentId) ?? [];
    list.push({
      id: s.id,
      surahId: s.surahId,
      surahNumber: s.surah.number,
      surahName: s.surah.name,
      surahArabicName: s.surah.arabicName,
      score: s.score,
      notes: s.notes,
      semester: s.semester,
      academicYear: s.academicYear,
    });
    map.set(s.studentId, list);
  }
  return map;
}

export async function getSummativeGrid(
  classLevel: number,
  semester: Semester,
  teacherId: string,
  academicYear?: string,
): Promise<{
  targets: ClassTargetSurah[];
  students: {
    studentId: string;
    fullName: string;
    scores: { surahId: string; score: number | null }[];
  }[];
}> {
  const year = academicYear ?? getCurrentAcademicYear();
  const cacheKey = `summative-grid:${classLevel}:${semester}:${teacherId}:${year}`;
  return cached(cacheKey, 15_000, () =>
    getSummativeGridInner(classLevel, semester, teacherId, year),
  );
}

async function getSummativeGridInner(
  classLevel: number,
  semester: Semester,
  teacherId: string,
  academicYear: string,
) {
  const [targets, students] = await Promise.all([
    getClassTargetsInner(classLevel, semester, academicYear),
    prisma.student.findMany({
      where: {
        teacherId,
        isActive: true,
        classGroup: { grade: classLevel },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const studentIds = students.map((s) => s.id);
  const scoresMap = await getSummativeScores(studentIds, semester, academicYear);

  const surahIdSet = new Set(targets.map((t) => t.surahId));

  return {
    targets,
    students: students.map((s) => {
      const studentScores = scoresMap.get(s.id) ?? [];
      const scoreBySurah = new Map(
        studentScores.map((sc) => [sc.surahId, sc.score]),
      );
      return {
        studentId: s.id,
        fullName: s.fullName,
        scores: targets.map((t) => ({
          surahId: t.surahId,
          score: surahIdSet.has(t.surahId) ? (scoreBySurah.get(t.surahId) ?? null) : null,
        })),
      };
    }),
  };
}

export async function saveSummativeScore(input: {
  studentId: string;
  surahId: string;
  semester: Semester;
  academicYear: string;
  score: number;
  notes?: string | null;
}): Promise<void> {
  if (input.score < 0 || input.score > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  await prisma.summativeScore.upsert({
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

  invalidateSummativeCache(input.studentId);
}

export async function batchSaveSummativeScores(
  inputs: {
    studentId: string;
    surahId: string;
    score: number;
    notes?: string | null;
  }[],
  semester: Semester,
  academicYear: string,
): Promise<void> {
  for (const input of inputs) {
    if (input.score < 0 || input.score > 100) {
      throw new Error(`Invalid score ${input.score} for student ${input.studentId}`);
    }
  }

  await prisma.$transaction(
    inputs.map((input) =>
      prisma.summativeScore.upsert({
        where: {
          studentId_surahId_semester_academicYear: {
            studentId: input.studentId,
            surahId: input.surahId,
            semester,
            academicYear,
          },
        },
        update: {
          score: input.score,
          notes: input.notes ?? null,
        },
        create: {
          studentId: input.studentId,
          surahId: input.surahId,
          semester,
          academicYear,
          score: input.score,
          notes: input.notes ?? null,
        },
      }),
    ),
  );

  const studentIds = Array.from(new Set(inputs.map((i) => i.studentId)));
  for (const studentId of studentIds) {
    invalidateSummativeCache(studentId);
  }
}

export function calculateSemesterSummary(
  studentId: string,
  fullName: string,
  scores: SummativeScoreRow[],
  totalTargets: number,
): SemesterSummary {
  const validScores = scores.map((s) => s.score);
  const scoredCount = validScores.length;

  if (scoredCount === 0) {
    return {
      studentId,
      fullName,
      totalSurahs: totalTargets,
      scoredSurahs: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      completionRate: 0,
    };
  }

  const sum = validScores.reduce((a, b) => a + b, 0);
  return {
    studentId,
    fullName,
    totalSurahs: totalTargets,
    scoredSurahs: scoredCount,
    averageScore: Math.round((sum / scoredCount) * 10) / 10,
    highestScore: Math.max(...validScores),
    lowestScore: Math.min(...validScores),
    completionRate: Math.round((scoredCount / totalTargets) * 100),
  };
}

export async function getClassSummaries(
  classLevel: number,
  semester: Semester,
  teacherId: string,
  academicYear?: string,
): Promise<SemesterSummary[]> {
  const { targets, students } = await getSummativeGrid(
    classLevel,
    semester,
    teacherId,
    academicYear,
  );

  const year = academicYear ?? getCurrentAcademicYear();
  const studentIds = students.map((s) => s.studentId);
  const scoresMap = await getSummativeScores(studentIds, semester, year);

  return students.map((s) => {
    const studentScores = scoresMap.get(s.studentId) ?? [];
    return calculateSemesterSummary(
      s.studentId,
      s.fullName,
      studentScores,
      targets.length,
    );
  });
}

export async function getStudentSummativeHistory(
  studentId: string,
  academicYear?: string,
): Promise<SummativeScoreRow[]> {
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
    where: { studentId, academicYear },
    include: {
      surah: {
        select: { number: true, name: true, arabicName: true },
      },
    },
    orderBy: [{ semester: "asc" }, { surah: { number: "asc" } }],
  });

  return scores.map((s) => ({
    id: s.id,
    surahId: s.surahId,
    surahNumber: s.surah.number,
    surahName: s.surah.name,
    surahArabicName: s.surah.arabicName,
    score: s.score,
    notes: s.notes,
    semester: s.semester,
    academicYear: s.academicYear,
  }));
}

export function invalidateSummativeCache(studentId?: string) {
  if (studentId) {
    invalidateCache(`summative-history:${studentId}`);
    invalidateCache(`summative-student-report:${studentId}`);
  }
  invalidateCache("summative-grid:");
  invalidateCache("summative-targets:");
}
