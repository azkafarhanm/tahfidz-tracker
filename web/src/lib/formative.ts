import { RecordStatus, Semester } from "@/generated/prisma-next/enums";
import { cached } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import {
  getDateFormatter,
  getTimeFormatter,
  halaqahLevelLabels,
  formatRange,
  statusLabels,
} from "@/lib/format";
import { getSemesterDateRange } from "@/lib/academic-year";

type FormativeRow = {
  id: string;
  studentId: string;
  studentName: string;
  type: "Hafalan" | "Murojaah";
  surah: string;
  fromAyah: number;
  toAyah: number;
  score: number | null;
  status: RecordStatus;
  notes: string | null;
  date: Date;
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
  latestScore: number | null;
  averageScore: number | null;
  latestDate: string;
  latestRange: string;
  latestStatus: string;
  needsReview: boolean;
};

export async function getTeacherFormativeOverview(
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
  locale = "id",
) {
  const cacheKey = `formative-overview:${teacherId}:${semester}:${academicYear}:${classLevel ?? "all"}:${locale}`;
  return cached(cacheKey, 30_000, () =>
    getTeacherFormativeOverviewInner(
      teacherId,
      semester,
      academicYear,
      classLevel,
      locale,
    ),
  );
}

async function getTeacherFormativeOverviewInner(
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel: number | undefined,
  locale: string,
) {
  const dateFormatter = getDateFormatter(locale);
  const { start, end } = getSemesterDateRange(academicYear, semester);

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
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const studentIds = students.map((student) => student.id);
  if (studentIds.length === 0) {
    return {
      students: [] as FormativeOverviewStudent[],
      totalAssessments: 0,
      averageScore: null as number | null,
    };
  }

  const rows = await getTeacherFormativeRows(
    teacherId,
    studentIds,
    semester,
    academicYear,
    start,
    end,
  );

  const grouped = new Map<string, FormativeRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.studentId) ?? [];
    list.push(row);
    grouped.set(row.studentId, list);
  }

  const allScores = rows
    .map((row) => row.score)
    .filter((score): score is number => score !== null);

  return {
    students: students.map((student) => {
      const studentRows = (grouped.get(student.id) ?? []).sort(
        (left, right) => right.date.getTime() - left.date.getTime(),
      );
      const latest = studentRows[0];
      const scores = studentRows
        .map((row) => row.score)
        .filter((score): score is number => score !== null);

      return {
        id: student.id,
        fullName: student.fullName,
        halaqahName: student.classGroup.name,
        halaqahLevel: halaqahLevelLabels[student.classGroup.level],
        academicClassName: student.academicClass?.name ?? "-",
        totalAssessments: studentRows.length,
        hafalanCount: studentRows.filter((row) => row.type === "Hafalan").length,
        murojaahCount: studentRows.filter((row) => row.type === "Murojaah").length,
        latestScore: latest?.score ?? null,
        averageScore:
          scores.length > 0
            ? Math.round(
                (scores.reduce((sum, score) => sum + score, 0) / scores.length) *
                  10,
              ) / 10
            : null,
        latestDate: latest ? dateFormatter.format(latest.date) : "-",
        latestRange: latest
          ? formatRange(latest.surah, latest.fromAyah, latest.toAyah)
          : "-",
        latestStatus: latest ? statusLabels[latest.status] : "-",
        needsReview: latest?.status === RecordStatus.PERLU_MUROJAAH,
      };
    }),
    totalAssessments: rows.length,
    averageScore:
      allScores.length > 0
        ? Math.round(
            (allScores.reduce((sum, score) => sum + score, 0) / allScores.length) *
              10,
          ) / 10
        : null,
  };
}

export async function getStudentFormativeDetail(
  studentId: string,
  teacherId: string,
  semester: Semester,
  academicYear: string,
  locale = "id",
) {
  const cacheKey = `formative-detail:${studentId}:${teacherId}:${semester}:${academicYear}:${locale}`;
  return cached(cacheKey, 30_000, () =>
    getStudentFormativeDetailInner(
      studentId,
      teacherId,
      semester,
      academicYear,
      locale,
    ),
  );
}

async function getStudentFormativeDetailInner(
  studentId: string,
  teacherId: string,
  semester: Semester,
  academicYear: string,
  locale: string,
) {
  const dateFormatter = getDateFormatter(locale);
  const timeFormatter = getTimeFormatter(locale);
  const { start, end } = getSemesterDateRange(academicYear, semester);

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
    start,
    end,
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
    halaqahLevel: halaqahLevelLabels[student.classGroup.level],
    classLevel: student.classGroup.grade,
    academicClassName: student.academicClass?.name ?? "-",
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
  teacherId: string,
  semester: Semester,
  academicYear: string,
  classLevel?: number,
) {
  const { start, end } = getSemesterDateRange(academicYear, semester);

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
          start,
          end,
        )
      : [];

  return { students, rows };
}

async function getTeacherFormativeRows(
  teacherId: string,
  studentIds: string[],
  semester: Semester,
  academicYear: string,
  start: Date,
  end: Date,
) {
  const [hafalan, murojaah] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: {
        teacherId,
        studentId: { in: studentIds },
        date: {
          gte: start,
          lte: end,
        },
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
        student: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.revisionRecord.findMany({
      where: {
        teacherId,
        studentId: { in: studentIds },
        date: {
          gte: start,
          lte: end,
        },
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
        student: {
          select: {
            fullName: true,
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
    type: "Hafalan",
    surah: record.surah,
    fromAyah: record.fromAyah,
    toAyah: record.toAyah,
    score: record.score,
    status: record.status,
    notes: record.notes,
    date: record.date,
  }));

  const murojaahRows: FormativeRow[] = murojaah.map((record) => ({
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.fullName,
    type: "Murojaah",
    surah: record.surah,
    fromAyah: record.fromAyah,
    toAyah: record.toAyah,
    score: record.score,
    status: record.status,
    notes: record.notes,
    date: record.date,
  }));

  return [...hafalanRows, ...murojaahRows]
    .filter((row) => {
      return row.date >= start && row.date <= end;
    })
    .map((row) => ({
      ...row,
      studentName: row.studentName,
      date: row.date,
      notes: row.notes,
      status: row.status,
      score: row.score,
      semester,
      academicYear,
    }))
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}
