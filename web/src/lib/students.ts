import {
  Gender,
  ProgramType,
  RecordStatus,
  TargetStatus,
  TargetType,
} from "@/generated/prisma-next/enums";
import {
  getActiveAcademicYear,
  getSemesterDateRange,
  getSemesterForDate,
} from "@/lib/academic-year";
import { computeTargetCoverage } from "@/lib/target-progress";
import { cached } from "@/lib/cache";
import { prisma, withRetry } from "@/lib/prisma";
import {
  getDateFormatter,
  getTimeFormatter,
  statusLabels,
  halaqahLevelLabels,
  formatRange,
  formatClassSummary,
} from "@/lib/format";
import { tasmiGradeLabels, tasmiStatusLabel, formatTasmiJuzSummary, getHighestCompletedTasmiJuz, getCompletedTasmiJuzList } from "@/lib/tasmi";
import { normalizeSearchText } from "@/lib/search";
import {
  buildMeetingTimeline,
  buildMeetingStatusCounts,
  getTodayMeetingStatus,
  parseMeetingDate,
} from "@/lib/meeting-status";
import { getJakartaDayKey } from "@/lib/jakarta-date";

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
  timeFormatter: Intl.DateTimeFormat,
) {
  return {
    id: record.id,
    type,
    range: formatRange(record.surah, record.fromAyah, record.toAyah),
    dateTimeIso: record.date.toISOString(),
    date: dateFormatter.format(record.date),
    time: timeFormatter.format(record.date),
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
}, dateFormatter: Intl.DateTimeFormat, matchingRecords?: { surah: string; fromAyah: number; toAyah: number }[]) {
  const now = new Date();
  const totalDays = target.endDate.getTime() - target.startDate.getTime();
  const elapsed = now.getTime() - target.startDate.getTime();
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 0;
  const isOverdue = now > target.endDate;

  const totalAyahs = target.toAyah - target.fromAyah + 1;
  const coverage = matchingRecords
    ? computeTargetCoverage(target, matchingRecords)
    : { coveredAyahs: 0, totalAyahs, percent: 0, isComplete: false };

  return {
    id: target.id,
    type: targetTypeLabels[target.type],
    range: formatRange(target.surah, target.fromAyah, target.toAyah),
    startDate: dateFormatter.format(target.startDate),
    endDate: dateFormatter.format(target.endDate),
    notes: target.notes,
    timeProgress,
    isOverdue,
    ayahProgress: coverage.percent,
    coveredAyahs: coverage.coveredAyahs,
    totalAyahs: coverage.totalAyahs,
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

const STUDENT_CACHE_TTL_MS = 30_000;

function scopeKey(teacherId?: string | null) {
  return teacherId ?? "admin";
}

export async function getStudentsData(query = "", teacherId?: string | null, locale = "id", programType?: ProgramType) {
  const normalizedQuery = normalizeSearchText(query);
  const result = await cached(
    `students:list:${scopeKey(teacherId)}:${locale}:${normalizedQuery}:1:12:${programType ?? "all"}`,
    STUDENT_CACHE_TTL_MS,
    () => getStudentsDataInner(normalizedQuery, teacherId, locale, 1, 12, programType),
  );
  return result.students;
}

export async function getStudentsPageData(
  query = "",
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = 12,
  programType?: ProgramType,
) {
  const normalizedQuery = normalizeSearchText(query);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  return cached(
    `students:list:${scopeKey(teacherId)}:${locale}:${normalizedQuery}:${safePage}:${safePageSize}:${programType ?? "all"}`,
    STUDENT_CACHE_TTL_MS,
    () =>
      getStudentsDataInner(
        normalizedQuery,
        teacherId,
        locale,
        safePage,
        safePageSize,
        programType,
      ),
  );
}

async function getStudentsDataInner(
  normalizedQuery: string,
  teacherId?: string | null,
  locale = "id",
  page = 1,
  pageSize = 12,
  programType?: ProgramType,
) {
  const dateFormatter = getDateFormatter(locale);
  const where = {
    isActive: true,
    ...(teacherId ? { teacherId } : {}),
    classGroup: {
      ...(programType ? { programType } : {}),
    },
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
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalCount = await prisma.student.count({ where });
  const students = await prisma.student.findMany({
    where,
    include: {
      classGroup: {
        select: { name: true, level: true, programType: true, grade: true },
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
      const needsReview = Boolean(
        latestHafalan?.needsReview || latestMurojaah?.needsReview,
      );
      const classInfo = formatClassSummary(student);

      return {
        id: student.id,
        fullName: student.fullName,
        ...classInfo,
        notes: student.notes,
        activeTargetCount: student._count.targets,
        latestHafalan,
        latestMurojaah,
        needsReview,
      };
    }),
  };
}

export async function getInactiveStudentsData(teacherId?: string | null, programType?: ProgramType) {
  return cached(
    `students:inactive:${scopeKey(teacherId)}:${programType ?? "all"}`,
    STUDENT_CACHE_TTL_MS,
    () => getInactiveStudentsDataInner(teacherId, programType),
  );
}

async function getInactiveStudentsDataInner(teacherId?: string | null, programType?: ProgramType) {
  const students = await prisma.student.findMany({
    where: {
      isActive: false,
      ...(teacherId ? { teacherId } : {}),
      classGroup: {
        ...(programType ? { programType } : {}),
      },
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
  });

  return students.map((s) => ({
    activeTargetCount: s._count.targets,
    deleteBlockingDataCount: s._count.targets,
    id: s.id,
    fullName: s.fullName,
    ...formatClassSummary(s),
  }));
}

export async function getStudentDetailData(studentId: string, teacherId?: string | null, locale = "id") {
  const jakartaToday = getJakartaDayKey(new Date());
  return cached(
    `students:detail:${scopeKey(teacherId)}:${locale}:${studentId}:${jakartaToday}`,
    STUDENT_CACHE_TTL_MS,
    () => getStudentDetailDataInner(studentId, teacherId, locale, jakartaToday),
  );
}

async function getStudentDetailDataInner(
  studentId: string,
  teacherId?: string | null,
  locale = "id",
  jakartaToday = getJakartaDayKey(new Date()),
) {
  const dateFormatter = getDateFormatter(locale);
  const timeFormatter = getTimeFormatter(locale);
  const todayDate = parseMeetingDate(jakartaToday)!;

  const check = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, isActive: true, teacherId: true, fullName: true, classGroup: { select: { academicYear: true, programType: true } } }
  });

  if (!check) {
    return null;
  }

  const activeAcademicYear = teacherId || check.classGroup.programType === ProgramType.ACADEMIC
    ? await getActiveAcademicYear()
    : check.classGroup.academicYear;

  // Verify student belongs to active academic year (teacher access only)
  if (teacherId) {
    if (check.classGroup.academicYear !== activeAcademicYear) {
      return null;
    }
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

  const activeSemester = getSemesterForDate(todayDate);
  const semesterRange = getSemesterDateRange(activeAcademicYear, activeSemester);
  const semesterStart = new Date(Date.UTC(
    semesterRange.start.getFullYear(),
    semesterRange.start.getMonth(),
    semesterRange.start.getDate(),
  ));
  const semesterEnd = new Date(Date.UTC(
    semesterRange.end.getFullYear(),
    semesterRange.end.getMonth(),
    semesterRange.end.getDate(),
  ));

  const [student, meetingStatuses, meetingStatusGroups] = await Promise.all([
    prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        classGroup: {
          select: { id: true, name: true, level: true, grade: true, programType: true },
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
        tasmiRecords: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            juz: true,
            grade: true,
            status: true,
            examinerName: true,
            date: true,
            notes: true,
            semester: true,
          },
        },
      },
    }),
    check.classGroup.programType === ProgramType.ACADEMIC
      ? prisma.meetingStatus.findMany({
          where: {
            studentId,
            programType: ProgramType.ACADEMIC,
            date: { lte: todayDate },
          },
          orderBy: { date: "desc" },
          take: 50,
          select: { id: true, date: true, status: true, note: true },
        })
      : Promise.resolve([]),
    check.classGroup.programType === ProgramType.ACADEMIC
      ? prisma.meetingStatus.groupBy({
          by: ["status"],
          where: {
            studentId,
            programType: ProgramType.ACADEMIC,
            date: { gte: semesterStart, lte: semesterEnd },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  if (!student) {
    return null;
  }

  const hafalanRecords = student.memorizationRecords.map((record) =>
    formatRecord(record, "Hafalan", dateFormatter, timeFormatter),
  );
  const murojaahRecords = student.revisionRecords.map((record) =>
    formatRecord(record, "Murojaah", dateFormatter, timeFormatter),
  );

  const meetingTimeline = student.classGroup.programType === ProgramType.ACADEMIC
    ? buildMeetingTimeline(
        meetingStatuses,
        [
          ...student.memorizationRecords.map((record) => ({
            id: record.id,
            type: "Hafalan" as const,
            range: formatRange(record.surah, record.fromAyah, record.toAyah),
            date: record.date,
          })),
          ...student.revisionRecords.map((record) => ({
            id: record.id,
            type: "Murojaah" as const,
            range: formatRange(record.surah, record.fromAyah, record.toAyah),
            date: record.date,
          })),
        ],
        dateFormatter,
      )
    : [];
  const meetingSummary = student.classGroup.programType === ProgramType.ACADEMIC
    ? {
        todayStatus: getTodayMeetingStatus(meetingStatuses, jakartaToday),
        counts: buildMeetingStatusCounts(meetingStatusGroups),
      }
    : null;

  const tasmiRecords = student.tasmiRecords.map((record) => ({
    id: record.id,
    type: "Tasmi'" as const,
    range: `Tasmi' Juz ${record.juz}`,
    dateTimeIso: record.date.toISOString(),
    date: dateFormatter.format(record.date),
    time: timeFormatter.format(record.date),
    status: tasmiStatusLabel[record.status],
    grade: tasmiGradeLabels[record.grade],
    juz: record.juz,
    examinerName: record.examinerName,
    notes: record.notes,
    semester: record.semester,
    score: null as number | null,
    needsReview: false,
    timestamp: record.date.getTime(),
  }));

  const historyRecords = [...hafalanRecords, ...murojaahRecords, ...tasmiRecords].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  const latestActivity = historyRecords.slice(0, 6);
  const needsReviewCount = historyRecords.filter(
    (record) => record.needsReview,
  ).length;
  const classInfo = formatClassSummary(student);

  const hafalanRanges = student.memorizationRecords.map((r) => ({
    surah: r.surah,
    fromAyah: r.fromAyah,
    toAyah: r.toAyah,
  }));
  const murojaahRanges = student.revisionRecords.map((r) => ({
    surah: r.surah,
    fromAyah: r.fromAyah,
    toAyah: r.toAyah,
  }));

  return {
    id: student.id,
    fullName: student.fullName,
    classGroupId: student.classGroup.id,
    classGroupLevel: student.classGroup.level,
    classGroupGrade: student.classGroup.grade,
    ...classInfo,
    gender: student.gender ? genderLabels[student.gender] : "Belum diisi",
    joinDate: dateFormatter.format(student.joinDate),
    notes: student.notes,
    activeTargets: student.targets.map((target) =>
      formatTarget(
        target,
        dateFormatter,
        target.type === TargetType.HAFALAN ? hafalanRanges : murojaahRanges,
      ),
    ),
    latestHafalan: hafalanRecords[0] ?? null,
    latestMurojaah: murojaahRecords[0] ?? null,
    latestTasmi: tasmiRecords[0] ?? null,
    hafalanRecords,
    murojaahRecords,
    tasmiRecords,
    highestTasmiJuz: getHighestCompletedTasmiJuz(student.tasmiRecords),
    completedTasmiJuz: getCompletedTasmiJuzList(student.tasmiRecords),
    tasmiJuzSummary: formatTasmiJuzSummary(getCompletedTasmiJuzList(student.tasmiRecords)),
    recentActivity: latestActivity,
    meetingTimeline,
    meetingSummary,
    historyRecords,
    needsReviewCount,
  };
}

export async function getTeacherStudentFormOptions(teacherId: string) {
  const academicYear = await getActiveAcademicYear();
  const classGroups = await withRetry(() =>
    prisma.classGroup.findMany({
      where: {
        teacherId,
        isActive: true,
        academicYear,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        level: true,
        grade: true,
        programType: true,
        teacher: {
          select: { fullName: true },
        },
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    }),
  );

  // Fetch all active academic classes for the active academic year
  const academicClasses = await withRetry(() =>
    prisma.academicClass.findMany({
      where: { isActive: true, academicYear },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
        grade: true,
        programType: true,
      },
    }),
  );

  return {
    classGroups: classGroups.map((cg) => ({
      id: cg.id,
      name: cg.name,
      level: halaqahLevelLabels[cg.level],
      levelKey: cg.level,
      grade: cg.grade,
      programType: cg.programType,
      teacherName: cg.teacher.fullName,
      studentCount: cg._count.students,
      label: cg.programType === ProgramType.BOARDING
        ? `${cg.name} (Kelas ${cg.grade})`
        : `${cg.name} (Kelas ${cg.grade} - ${halaqahLevelLabels[cg.level]})`,
    })),
    academicClasses: academicClasses.map((ac) => ({
      id: ac.id,
      name: ac.name,
      grade: ac.grade,
      programType: ac.programType,
      label: ac.name,
    })),
  };
}

export async function getStudentFormContext(
  studentId: string,
  teacherId?: string | null,
  locale = "id",
  options?: { includeInactive?: boolean },
) {
  const dateFormatter = getDateFormatter(locale);
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(options?.includeInactive ? {} : { isActive: true }),
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
        select: { id: true, name: true, level: true, grade: true, programType: true },
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

export async function getLatestStudentRecordMaterial(
  studentId: string,
  teacherId: string | null | undefined,
  recordType: "hafalan" | "murojaah",
) {
  const where = {
    studentId,
    student: {
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
  };
  const query = {
    where,
    orderBy: [{ date: "desc" as const }, { createdAt: "desc" as const }],
    select: { surah: true, fromAyah: true },
  };

  return recordType === "hafalan"
    ? prisma.memorizationRecord.findFirst(query)
    : prisma.revisionRecord.findFirst(query);
}
