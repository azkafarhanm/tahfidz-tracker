"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AcademicYearStatus, AuditAction, ProgramType } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";
import { halaqahLevelLabels, statusLabels, formatRange } from "@/lib/format";
import { tasmiGradeLabels, tasmiStatusLabel } from "@/lib/tasmi";

function revalidateAcademicYearPaths() {
  revalidatePath("/admin/academic-years");
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/formative");
  revalidatePath("/summative");
  revalidatePath("/reports");
  invalidateCache("academic-year");
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("formative-");
  invalidateCache("summative-");
  invalidateCache("report-");
}

function redirectWithMessage(type: "success" | "error", message: string) {
  redirect(`/admin/academic-years?${type}=${encodeURIComponent(message)}`);
}

export async function getAdminAcademicYearsData() {
  const years = await prisma.academicYear.findMany({
    orderBy: { year: "desc" },
  });

  const yearsWithCounts = await Promise.all(
    years.map(async (year) => {
      const [studentCount, classGroupCount] = await Promise.all([
        prisma.student.count({
          where: { classGroup: { academicYear: year.year } },
        }),
        prisma.classGroup.count({
          where: { academicYear: year.year },
        }),
      ]);
      return {
        id: year.id,
        year: year.year,
        startDate: year.startDate.toISOString().slice(0, 10),
        endDate: year.endDate.toISOString().slice(0, 10),
        isActive: year.isActive,
        status: year.status,
        studentCount,
        classGroupCount,
      };
    }),
  );

  return yearsWithCounts;
}

export async function archiveAcademicYear(yearId: string) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    redirectWithMessage("error", t("yearNotFound"));
    return;
  }

  if (year.status === AcademicYearStatus.ARCHIVED) {
    redirectWithMessage("success", t("yearAlreadyArchived"));
    return;
  }

  if (year.isActive) {
    redirectWithMessage("error", t("cannotArchiveActive"));
    return;
  }

  await prisma.academicYear.update({
    where: { id: yearId },
    data: { status: AcademicYearStatus.ARCHIVED },
  });

  revalidateAcademicYearPaths();
  redirectWithMessage("success", t("yearArchived", { year: year.year }));
}

export async function restoreAcademicYear(yearId: string) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    redirectWithMessage("error", t("yearNotFound"));
    return;
  }

  if (year.status === AcademicYearStatus.ACTIVE) {
    redirectWithMessage("success", t("yearAlreadyActive"));
    return;
  }

  await prisma.academicYear.update({
    where: { id: yearId },
    data: { status: AcademicYearStatus.ACTIVE },
  });

  revalidateAcademicYearPaths();
  redirectWithMessage("success", t("yearRestored", { year: year.year }));
}

// Phase 1: Archived year detail grouped by teacher
export async function getArchivedYearDetail(yearId: string, programType?: string) {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return null;
  }

  const classGroups = await prisma.classGroup.findMany({
    where: {
      academicYear: year.year,
      ...(programType ? { programType: programType as ProgramType } : {}),
    },
    select: {
      id: true,
      name: true,
      grade: true,
      level: true,
      programType: true,
      isActive: true,
      teacherId: true,
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { students: true } },
    },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  // Group by teacher
  const teacherMap = new Map<string, {
    teacherId: string;
    teacherName: string;
    classGroups: typeof classGroups;
    totalStudents: number;
  }>();

  for (const cg of classGroups) {
    const key = cg.teacherId;
    if (!teacherMap.has(key)) {
      teacherMap.set(key, {
        teacherId: cg.teacherId,
        teacherName: cg.teacher.fullName,
        classGroups: [],
        totalStudents: 0,
      });
    }
    const entry = teacherMap.get(key)!;
    entry.classGroups.push(cg);
    entry.totalStudents += cg._count.students;
  }

  const teachers = Array.from(teacherMap.values()).sort((a, b) =>
    a.teacherName.localeCompare(b.teacherName),
  );

  return {
    year: {
      id: year.id,
      year: year.year,
      startDate: year.startDate.toISOString().slice(0, 10),
      endDate: year.endDate.toISOString().slice(0, 10),
      status: year.status,
    },
    teachers: teachers.map((t) => ({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      totalStudents: t.totalStudents,
      totalClassGroups: t.classGroups.length,
      classGroups: t.classGroups.map((cg) => ({
        id: cg.id,
        name: cg.name,
        grade: cg.grade,
        level: cg.programType === "BOARDING" ? "" : halaqahLevelLabels[cg.level],
        programType: cg.programType,
        studentCount: cg._count.students,
      })),
    })),
    summary: {
      totalTeachers: teachers.length,
      totalStudents: teachers.reduce((sum, t) => sum + t.totalStudents, 0),
      totalClassGroups: classGroups.length,
    },
  };
}

// Phase 2: Teacher archive detail
export async function getArchivedTeacherDetail(yearId: string, teacherId: string, programType?: string) {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return null;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, fullName: true },
  });

  if (!teacher) return null;

  const classGroups = await prisma.classGroup.findMany({
    where: {
      academicYear: year.year,
      teacherId,
      ...(programType ? { programType: programType as ProgramType } : {}),
    },
    select: {
      id: true,
      name: true,
      grade: true,
      level: true,
      programType: true,
      isActive: true,
    },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  const classGroupIds = classGroups.map((cg) => cg.id);

  const students = classGroupIds.length > 0
    ? await prisma.student.findMany({
        where: { classGroupId: { in: classGroupIds } },
        select: {
          id: true,
          fullName: true,
          isActive: true,
          classGroup: { select: { id: true, name: true, level: true, grade: true } },
          academicClass: { select: { name: true } },
          memorizationRecords: {
            orderBy: { date: "desc" },
            take: 1,
            select: { surah: true, fromAyah: true, toAyah: true, date: true, status: true, score: true },
          },
          revisionRecords: {
            orderBy: { date: "desc" },
            take: 1,
            select: { surah: true, fromAyah: true, toAyah: true, date: true, status: true, score: true },
          },
          targets: {
            select: { id: true, status: true },
          },
          summativeScores: {
            select: { score: true },
          },
        },
        orderBy: { fullName: "asc" },
      })
    : [];

  const studentIds = students.map((s) => s.id);

  const [memCount, revCount] = await Promise.all([
    prisma.memorizationRecord.count({
      where: { studentId: { in: studentIds }, academicYear: year.year },
    }),
    prisma.revisionRecord.count({
      where: { studentId: { in: studentIds }, academicYear: year.year },
    }),
  ]);

  // Build halaqah groups
  const halaqahGroups = classGroups.map((cg) => {
    const cgStudents = students.filter((s) => s.classGroup.id === cg.id);
    return {
      id: cg.id,
      name: cg.name,
      grade: cg.grade,
      level: cg.programType === "BOARDING" ? "" : halaqahLevelLabels[cg.level],
      programType: cg.programType,
      studentCount: cgStudents.length,
      students: cgStudents.map((s) => {
        const latestMem = s.memorizationRecords[0];
        const latestRev = s.revisionRecords[0];
        const avgScore = s.summativeScores.length > 0
          ? Math.round(s.summativeScores.reduce((sum, sc) => sum + sc.score, 0) / s.summativeScores.length)
          : null;
        const lastActivity = [latestMem?.date, latestRev?.date]
          .filter(Boolean)
          .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;

        return {
          id: s.id,
          fullName: s.fullName,
          isActive: s.isActive,
          academicClassName: s.academicClass?.name ?? "-",
          latestMem: latestMem ? {
            range: formatRange(latestMem.surah, latestMem.fromAyah, latestMem.toAyah),
            status: statusLabels[latestMem.status],
            score: latestMem.score,
          } : null,
          latestRev: latestRev ? {
            range: formatRange(latestRev.surah, latestRev.fromAyah, latestRev.toAyah),
            status: statusLabels[latestRev.status],
            score: latestRev.score,
          } : null,
          activeTargetCount: s.targets.filter((t) => t.status === "ACTIVE").length,
          summativeAvg: avgScore,
          lastActivityDate: lastActivity ? lastActivity.toISOString().slice(0, 10) : "-",
        };
      }),
    };
  });

  return {
    year: {
      id: year.id,
      year: year.year,
      startDate: year.startDate.toISOString().slice(0, 10),
      endDate: year.endDate.toISOString().slice(0, 10),
    },
    teacher: {
      id: teacher.id,
      fullName: teacher.fullName,
    },
    summary: {
      totalStudents: students.length,
      totalClassGroups: classGroups.length,
      totalMemorization: memCount,
      totalRevision: revCount,
      totalAssessments: memCount + revCount,
      totalSummativeScores: students.reduce((sum, s) => sum + s.summativeScores.length, 0),
      averageScore: (() => {
        const allScores = students.flatMap((s) => s.summativeScores.map((sc) => sc.score));
        return allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : null;
      })(),
    },
    halaqahGroups,
  };
}

// Phase 5: Student archive history
export async function getArchivedStudentDetail(yearId: string, studentId: string) {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return null;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      gender: true,
      joinDate: true,
      notes: true,
      teacher: { select: { id: true, fullName: true } },
      classGroup: { select: { id: true, name: true, level: true, grade: true, academicYear: true, programType: true } },
      academicClass: { select: { name: true } },
    },
  });

  if (!student || student.classGroup.academicYear !== year.year) {
    return null;
  }

  const [memRecords, revRecords, targets, summativeScores, tasmiRecords] = await Promise.all([
    prisma.memorizationRecord.findMany({
      where: { studentId, academicYear: year.year },
      orderBy: { date: "desc" },
      select: {
        id: true, surah: true, fromAyah: true, toAyah: true,
        date: true, status: true, score: true, notes: true,
      },
    }),
    prisma.revisionRecord.findMany({
      where: { studentId, academicYear: year.year },
      orderBy: { date: "desc" },
      select: {
        id: true, surah: true, fromAyah: true, toAyah: true,
        date: true, status: true, score: true, notes: true,
      },
    }),
    prisma.target.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, type: true, surah: true, fromAyah: true, toAyah: true,
        startDate: true, endDate: true, status: true, notes: true,
      },
    }),
    prisma.summativeScore.findMany({
      where: { studentId, academicYear: year.year },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, surahId: true, semester: true, score: true, notes: true, createdAt: true,
        surah: { select: { name: true, number: true } },
      },
    }),
    prisma.tasmiRecord.findMany({
      where: { studentId, academicYear: year.year },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, juz: true, grade: true, status: true,
        examinerName: true, date: true, notes: true, semester: true,
      },
    }),
  ]);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  return {
    year: {
      id: year.id,
      year: year.year,
    },
    student: {
      id: student.id,
      fullName: student.fullName,
      isActive: student.isActive,
      gender: student.gender,
      joinDate: formatDate(student.joinDate),
      notes: student.notes,
      teacherId: student.teacher.id,
      teacherName: student.teacher.fullName,
      halaqahName: student.classGroup.name,
      halaqahLevel: student.classGroup.programType === "BOARDING" ? "" : halaqahLevelLabels[student.classGroup.level],
      programType: student.classGroup.programType,
      grade: student.classGroup.grade,
      academicClassName: student.classGroup.programType === "BOARDING" ? String(student.classGroup.grade) : (student.academicClass?.name ?? "-"),
    },
    memorizationRecords: memRecords.map((r) => ({
      id: r.id,
      surah: r.surah,
      range: formatRange(r.surah, r.fromAyah, r.toAyah),
      date: formatDate(r.date),
      status: statusLabels[r.status],
      score: r.score,
      notes: r.notes,
    })),
    revisionRecords: revRecords.map((r) => ({
      id: r.id,
      surah: r.surah,
      range: formatRange(r.surah, r.fromAyah, r.toAyah),
      date: formatDate(r.date),
      status: statusLabels[r.status],
      score: r.score,
      notes: r.notes,
    })),
    targets: targets.map((t) => ({
      id: t.id,
      type: t.type,
      surah: t.surah,
      range: formatRange(t.surah, t.fromAyah, t.toAyah),
      startDate: formatDate(t.startDate),
      endDate: formatDate(t.endDate),
      status: t.status,
      notes: t.notes,
    })),
    summativeScores: summativeScores.map((s) => ({
      id: s.id,
      surahName: s.surah.name,
      surahNumber: s.surah.number,
      semester: s.semester,
      score: s.score,
      notes: s.notes,
      date: formatDate(s.createdAt),
    })),
    tasmiRecords: tasmiRecords.map((t) => ({
      id: t.id,
      juz: t.juz,
      grade: tasmiGradeLabels[t.grade],
      status: tasmiStatusLabel[t.status],
      examinerName: t.examinerName,
      date: formatDate(t.date),
      notes: t.notes,
      semester: t.semester,
    })),
  };
}

// ─── Audit Helper ────────────────────────────────────────────────

async function logAudit(
  userId: string,
  action: AuditAction,
  opts: {
    academicYearId?: string;
    academicYear?: string;
    targetType: string;
    targetId?: string;
    targetName?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      academicYearId: opts.academicYearId ?? null,
      academicYear: opts.academicYear ?? null,
      targetType: opts.targetType,
      targetId: opts.targetId ?? null,
      targetName: opts.targetName ?? null,
      metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    },
  });
}

// ─── Phase 1: Single Student Deletion ────────────────────────────

export type DeletionImpact = {
  studentCount: number;
  memorizationCount: number;
  revisionCount: number;
  targetCount: number;
  summativeCount: number;
  tasmiCount: number;
};

export async function getStudentDeletionImpact(
  yearId: string,
  studentId: string,
): Promise<{ ok: true; impact: DeletionImpact; studentName: string } | { ok: false; error: string }> {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false, error: "Tahun ajaran tidak ditemukan atau belum diarsipkan." };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
      classGroup: { select: { academicYear: true } },
    },
  });

  if (!student || student.classGroup.academicYear !== year.year) {
    return { ok: false, error: "Santri tidak ditemukan pada tahun ajaran ini." };
  }

  const [memorizationCount, revisionCount, targetCount, summativeCount, tasmiCount] = await Promise.all([
    prisma.memorizationRecord.count({ where: { studentId, academicYear: year.year } }),
    prisma.revisionRecord.count({ where: { studentId, academicYear: year.year } }),
    prisma.target.count({ where: { studentId } }),
    prisma.summativeScore.count({ where: { studentId, academicYear: year.year } }),
    prisma.tasmiRecord.count({ where: { studentId, academicYear: year.year } }),
  ]);

  return {
    ok: true,
    impact: { studentCount: 1, memorizationCount, revisionCount, targetCount, summativeCount, tasmiCount },
    studentName: student.fullName,
  };
}

export async function deleteArchivedStudent(yearId: string, studentId: string) {
  const scope = await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    return { ok: false as const, error: t("yearNotFound") };
  }

  if (year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false as const, error: t("cannotDeleteFromActiveYear") };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
      classGroup: { select: { academicYear: true } },
    },
  });

  if (!student || student.classGroup.academicYear !== year.year) {
    return { ok: false as const, error: t("studentNotFoundInYear") };
  }

  const [memCount, revCount, targetCount, summativeCount] = await Promise.all([
    prisma.memorizationRecord.count({ where: { studentId, academicYear: year.year } }),
    prisma.revisionRecord.count({ where: { studentId, academicYear: year.year } }),
    prisma.target.count({ where: { studentId } }),
    prisma.summativeScore.count({ where: { studentId, academicYear: year.year } }),
  ]);

  await prisma.student.delete({ where: { id: studentId } });

  await logAudit(scope.session.user.id, AuditAction.DELETE_STUDENT, {
    academicYearId: yearId,
    academicYear: year.year,
    targetType: "student",
    targetId: studentId,
    targetName: student.fullName,
    metadata: { memorizationCount: memCount, revisionCount: revCount, targetCount, summativeCount },
  });

  revalidatePath(`/admin/academic-years/${yearId}`);
  revalidatePath(`/admin/academic-years/${yearId}/teachers`);
  invalidateCache("academic-year");
  invalidateCache("dashboard");
  invalidateCache("students");

  return { ok: true as const, message: t("studentDeleted", { name: student.fullName }) };
}

// ─── Phase 2: Bulk Delete Students ───────────────────────────────

export async function getBulkDeletionImpact(yearId: string): Promise<
  | { ok: true; impact: DeletionImpact }
  | { ok: false; error: string }
> {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false, error: "Tahun ajaran tidak ditemukan atau belum diarsipkan." };
  }

  const studentIds = (
    await prisma.student.findMany({
      where: { classGroup: { academicYear: year.year } },
      select: { id: true },
    })
  ).map((s) => s.id);

  if (studentIds.length === 0) {
    return {
      ok: true,
      impact: { studentCount: 0, memorizationCount: 0, revisionCount: 0, targetCount: 0, summativeCount: 0, tasmiCount: 0 },
    };
  }

  const [memorizationCount, revisionCount, targetCount, summativeCount, tasmiCount] = await Promise.all([
    prisma.memorizationRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
    prisma.revisionRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
    prisma.target.count({ where: { studentId: { in: studentIds } } }),
    prisma.summativeScore.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
    prisma.tasmiRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
  ]);

  return {
    ok: true,
    impact: { studentCount: studentIds.length, memorizationCount, revisionCount, targetCount, summativeCount, tasmiCount },
  };
}

export async function deleteAllArchivedStudents(yearId: string) {
  const scope = await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    return { ok: false as const, error: t("yearNotFound") };
  }

  if (year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false as const, error: t("cannotDeleteFromActiveYear") };
  }

  const studentIds = (
    await prisma.student.findMany({
      where: { classGroup: { academicYear: year.year } },
      select: { id: true },
    })
  ).map((s) => s.id);

  if (studentIds.length === 0) {
    return { ok: true as const, message: t("noStudentsToDelete") };
  }

  const [memCount, revCount, targetCount, summativeCount] = await Promise.all([
    prisma.memorizationRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
    prisma.revisionRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
    prisma.target.count({ where: { studentId: { in: studentIds } } }),
    prisma.summativeScore.count({ where: { studentId: { in: studentIds }, academicYear: year.year } }),
  ]);

  await prisma.student.deleteMany({
    where: { id: { in: studentIds } },
  });

  await logAudit(scope.session.user.id, AuditAction.DELETE_ARCHIVED_STUDENTS, {
    academicYearId: yearId,
    academicYear: year.year,
    targetType: "students",
    targetName: year.year,
    metadata: {
      studentCount: studentIds.length,
      memorizationCount: memCount,
      revisionCount: revCount,
      targetCount,
      summativeCount,
    },
  });

  revalidatePath(`/admin/academic-years/${yearId}`);
  revalidatePath("/admin/academic-years");
  invalidateCache("academic-year");
  invalidateCache("dashboard");
  invalidateCache("students");

  return {
    ok: true as const,
    message: t("allStudentsDeleted", { count: studentIds.length }),
  };
}

// ─── Phase 3: Delete Academic Year ───────────────────────────────

export type YearDeletionCheck = {
  canDelete: boolean;
  counts: {
    studentCount: number;
    memorizationCount: number;
    revisionCount: number;
    targetCount: number;
    summativeCount: number;
    tasmiCount: number;
    classGroupCount: number;
  };
};

export async function getYearDeletionCheck(yearId: string): Promise<
  | { ok: true; check: YearDeletionCheck }
  | { ok: false; error: string }
> {
  await requireAdminScope();

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year || year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false, error: "Tahun ajaran tidak ditemukan atau belum diarsipkan." };
  }

  const studentIds = (
    await prisma.student.findMany({
      where: { classGroup: { academicYear: year.year } },
      select: { id: true },
    })
  ).map((s) => s.id);

  const [memorizationCount, revisionCount, targetCount, summativeCount, tasmiCount, classGroupCount] = await Promise.all([
    studentIds.length > 0
      ? prisma.memorizationRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.revisionRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.target.count({ where: { studentId: { in: studentIds } } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.summativeScore.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.tasmiRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    prisma.classGroup.count({ where: { academicYear: year.year } }),
  ]);

  const counts = {
    studentCount: studentIds.length,
    memorizationCount,
    revisionCount,
    targetCount,
    summativeCount,
    tasmiCount,
    classGroupCount,
  };

  const canDelete =
    counts.studentCount === 0 &&
    counts.memorizationCount === 0 &&
    counts.revisionCount === 0 &&
    counts.targetCount === 0 &&
    counts.summativeCount === 0 &&
    counts.tasmiCount === 0 &&
    counts.classGroupCount === 0;

  return { ok: true, check: { canDelete, counts } };
}

export async function deleteAcademicYear(yearId: string) {
  const scope = await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    return { ok: false as const, error: t("yearNotFound") };
  }

  if (year.status !== AcademicYearStatus.ARCHIVED) {
    return { ok: false as const, error: t("cannotDeleteNonArchivedYear") };
  }

  if (year.isActive) {
    return { ok: false as const, error: t("cannotDeleteActiveYear") };
  }

  // Re-verify counts before deletion
  const studentIds = (
    await prisma.student.findMany({
      where: { classGroup: { academicYear: year.year } },
      select: { id: true },
    })
  ).map((s) => s.id);

  const [memCount, revCount, targetCount, summativeCount, tasmiCount, classGroupCount] = await Promise.all([
    studentIds.length > 0
      ? prisma.memorizationRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.revisionRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.target.count({ where: { studentId: { in: studentIds } } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.summativeScore.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    studentIds.length > 0
      ? prisma.tasmiRecord.count({ where: { studentId: { in: studentIds }, academicYear: year.year } })
      : Promise.resolve(0),
    prisma.classGroup.count({ where: { academicYear: year.year } }),
  ]);

  if (studentIds.length > 0 || memCount > 0 || revCount > 0 || targetCount > 0 || summativeCount > 0 || tasmiCount > 0 || classGroupCount > 0) {
    return { ok: false as const, error: t("yearStillHasData") };
  }

  await prisma.academicYear.delete({ where: { id: yearId } });

  await logAudit(scope.session.user.id, AuditAction.DELETE_ACADEMIC_YEAR, {
    academicYearId: yearId,
    academicYear: year.year,
    targetType: "academicYear",
    targetId: yearId,
    targetName: year.year,
  });

  revalidatePath("/admin/academic-years");
  invalidateCache("academic-year");
  invalidateCache("dashboard");

  redirect(`/admin/academic-years?success=${encodeURIComponent(t("yearDeleted", { year: year.year }))}`);
}
