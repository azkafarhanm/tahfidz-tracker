import {
  Gender,
  TargetStatus,
  UserRole,
} from "@/generated/prisma-next/enums";
import {
  getDateFormatter,
  formatClassSummary,
  halaqahLevelLabels,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cached, invalidateCache } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";

export { invalidateCache };

const genderLabels: Record<Gender, string> = {
  [Gender.MALE]: "Laki-laki",
  [Gender.FEMALE]: "Perempuan",
};

export async function buildAcademicYearOptions(existingAcademicYears: string[]) {
  // Get years from AcademicYear table
  const dbYears = await prisma.academicYear.findMany({
    select: { year: true },
    orderBy: { year: "asc" },
  });

  const dbYearStrings = dbYears.map((ay) => ay.year);

  // Merge with existing years from data, deduplicate and sort
  const allYears = new Set([...dbYearStrings, ...existingAcademicYears]);

  // If no years exist at all, generate from current year
  if (allYears.size === 0) {
    const currentYear = new Date().getFullYear();
    return [`${currentYear}/${currentYear + 1}`];
  }

  return Array.from(allYears).sort();
}

function formatHalaqahGradeLabel(grade: number) {
  return `Kelas ${grade}`;
}

function mapTeacherSummary(teacher: {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  user: {
    email: string;
    isActive: boolean;
  };
  _count: {
    students: number;
    classes: number;
  };
}, dateFormatter: Intl.DateTimeFormat) {
  const isActive = teacher.isActive && teacher.user.isActive;

  return {
    id: teacher.id,
    fullName: teacher.fullName,
    email: teacher.user.email,
    phoneNumber: teacher.phoneNumber,
    studentCount: teacher._count.students,
    classGroupCount: teacher._count.classes,
    isActive,
    joinedAt: dateFormatter.format(teacher.createdAt),
  };
}

function mapStudentSummary(student: {
  id: string;
  fullName: string;
  gender: Gender | null;
  joinDate: Date;
  isActive: boolean;
  teacherId: string;
  classGroupId: string;
  academicClassId: string | null;
  teacher: {
    fullName: string;
  };
  classGroup: {
    name: string;
    level: "LOW" | "MEDIUM" | "HIGH";
  };
  academicClass: {
    name: string;
  } | null;
  _count: {
    targets: number;
    memorizationRecords: number;
    revisionRecords: number;
    summativeScores: number;
  };
}, dateFormatter: Intl.DateTimeFormat) {
  const classInfo = formatClassSummary(student);
  const totalRecordCount =
    student._count.memorizationRecords + student._count.revisionRecords;
  const deleteBlockingDataCount = student._count.targets;

  return {
    id: student.id,
    fullName: student.fullName,
    gender: student.gender ? genderLabels[student.gender] : "Belum diisi",
    joinDate: dateFormatter.format(student.joinDate),
    isActive: student.isActive,
    teacherId: student.teacherId,
    teacherName: student.teacher.fullName,
    classGroupId: student.classGroupId,
    academicClassId: student.academicClassId,
    academicClassName: classInfo.academicClassName,
    halaqahName: student.classGroup.name,
    halaqahLevel: halaqahLevelLabels[student.classGroup.level],
    classSummary: classInfo.classSummary,
    activeTargetCount: student._count.targets,
    totalRecordCount,
    summativeScoreCount: student._count.summativeScores,
    deleteBlockingDataCount,
  };
}

export async function getAdminDashboardData(locale = "id") {
  return cached(`admin-dashboard:${locale}`, 30_000, () => getAdminDashboardDataInner(locale));
}

async function getAdminDashboardDataInner(locale = "id") {
  const dateFormatter = getDateFormatter(locale);
  const [
    adminCount,
    teacherCount,
    activeTeacherCount,
    studentCount,
    activeStudentCount,
    academicClassCount,
    classGroupCount,
    activeTargetCount,
    memorizationRecordCount,
    revisionRecordCount,
    recentTeachers,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    }),
    prisma.user.count({
      where: { role: UserRole.TEACHER },
    }),
    prisma.teacher.count({
      where: {
        isActive: true,
        user: { isActive: true },
      },
    }),
    prisma.student.count(),
    prisma.student.count({
      where: { isActive: true },
    }),
    prisma.academicClass.count({
      where: { isActive: true },
    }),
    prisma.classGroup.count({
      where: { isActive: true },
    }),
    prisma.target.count({
      where: { status: TargetStatus.ACTIVE },
    }),
    prisma.memorizationRecord.count(),
    prisma.revisionRecord.count(),
    prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
    }),
  ]);

  return {
    counts: {
      adminCount,
      teacherCount,
      activeTeacherCount,
      studentCount,
      activeStudentCount,
      academicClassCount,
      classGroupCount,
      activeTargetCount,
      totalRecordCount: memorizationRecordCount + revisionRecordCount,
      memorizationRecordCount,
      revisionRecordCount,
    },
    recentTeachers: recentTeachers.map((teacher) => ({
      ...mapTeacherSummary(teacher, dateFormatter),
    })),
  };
}

export async function getAdminTeachersData(
  query = "",
  locale = "id",
  page = 1,
  pageSize = 12,
) {
  const dateFormatter = getDateFormatter(locale);
  const normalizedQuery = query.trim();
  const where = normalizedQuery
    ? {
        OR: [
          {
            fullName: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            phoneNumber: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            user: {
              email: {
                startsWith: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const [teachers, teacherCount, activeTeacherCount, filteredTeacherCount] = await Promise.all([
    prisma.teacher.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.teacher.count({ where }),
  ]);

  return {
    counts: {
      teacherCount,
      activeTeacherCount,
      inactiveTeacherCount: teacherCount - activeTeacherCount,
      filteredTeacherCount,
    },
    teachers: teachers.map((teacher) => mapTeacherSummary(teacher, dateFormatter)),
    query: normalizedQuery,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(filteredTeacherCount / safePageSize)),
    },
  };
}

export async function getAdminTeacherFormData(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      isActive: true,
      user: {
        select: {
          username: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  if (!teacher) {
    return null;
  }

  return {
    id: teacher.id,
    fullName: teacher.fullName,
    username: teacher.user.username,
    email: teacher.user.email,
    phoneNumber: teacher.phoneNumber ?? "",
    isActive: teacher.isActive && teacher.user.isActive,
  };
}

export async function getAdminStudentsData(
  query = "",
  locale = "id",
  page = 1,
  pageSize = 12,
) {
  const dateFormatter = getDateFormatter(locale);
  const normalizedQuery = query.trim();
  const where = normalizedQuery
    ? {
        OR: [
          {
            fullName: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            teacher: {
              fullName: {
                startsWith: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
          },
          {
            classGroup: {
              name: {
                startsWith: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
          },
          {
            academicClass: {
              name: {
                startsWith: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const [students, studentCount, activeStudentCount, filteredStudentCount] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      include: {
        teacher: {
          select: {
            fullName: true,
          },
        },
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
        _count: {
          select: {
            targets: {
              where: { status: TargetStatus.ACTIVE },
            },
            memorizationRecords: true,
            revisionRecords: true,
            summativeScores: true,
          },
        },
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.student.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.student.count({ where }),
  ]);

  return {
    counts: {
      studentCount,
      activeStudentCount,
      inactiveStudentCount: studentCount - activeStudentCount,
      filteredStudentCount,
    },
    students: students.map((student) =>
      mapStudentSummary(student, dateFormatter),
    ),
    query: normalizedQuery,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(filteredStudentCount / safePageSize)),
    },
  };
}

export async function getAdminStudentFormOptions() {
  const [teachers, classGroups, academicClasses] = await Promise.all([
    prisma.teacher.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.classGroup.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        level: true,
        teacherId: true,
        grade: true,
        academicYear: true,
        isActive: true,
        teacher: {
          select: {
            fullName: true,
            isActive: true,
            user: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    }),
    prisma.academicClass.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
        grade: true,
        academicYear: true,
        isActive: true,
      },
    }),
  ]);

  const academicYears = await buildAcademicYearOptions(
    academicClasses.map((academicClass) => academicClass.academicYear),
  );

  return {
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.user.email,
      isActive: teacher.isActive && teacher.user.isActive,
      label: teacher.fullName,
    })),
    classGroups: classGroups.map((classGroup) => ({
        id: classGroup.id,
        teacherId: classGroup.teacherId,
        grade: classGroup.grade,
        gradeLabel: formatHalaqahGradeLabel(classGroup.grade),
        academicYear: classGroup.academicYear,
        name: classGroup.name,
        level: classGroup.level,
        levelLabel: halaqahLevelLabels[classGroup.level],
        teacherName: classGroup.teacher.fullName,
        isActive:
          classGroup.isActive &&
          classGroup.teacher.isActive &&
          classGroup.teacher.user.isActive,
        label: `${formatHalaqahGradeLabel(classGroup.grade)} - ${classGroup.name}`,
      }))
      .sort((a, b) =>
        a.academicYear === b.academicYear
          ? a.grade - b.grade || a.name.localeCompare(b.name)
          : a.academicYear.localeCompare(b.academicYear),
      ),
    academicClasses: academicClasses.map((academicClass) => ({
      id: academicClass.id,
      name: academicClass.name,
      grade: academicClass.grade,
      academicYear: academicClass.academicYear,
      isActive: academicClass.isActive,
      label: academicClass.name,
    })),
    academicYears,
  };
}

export async function getAdminAcademicClassesData(
  query = "",
  page = 1,
  pageSize = 12,
) {
  const normalizedQuery = query.trim();
  const where = normalizedQuery
    ? {
        OR: [
          {
            name: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            academicYear: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const [academicClasses, totalCount, activeCount, filteredCount] = await Promise.all([
    prisma.academicClass.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { grade: "asc" }, { section: "asc" }],
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.academicClass.count(),
    prisma.academicClass.count({ where: { isActive: true } }),
    prisma.academicClass.count({ where }),
  ]);

  return {
    counts: {
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
      filteredCount,
    },
    academicClasses: academicClasses.map((academicClass) => ({
      id: academicClass.id,
      grade: academicClass.grade,
      section: academicClass.section,
      name: academicClass.name,
      academicYear: academicClass.academicYear,
      isActive: academicClass.isActive,
      studentCount: academicClass._count.students,
    })),
    query: normalizedQuery,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(filteredCount / safePageSize)),
    },
  };
}

export async function getAdminAcademicClassFormData(academicClassId: string) {
  const academicClass = await prisma.academicClass.findUnique({
    where: { id: academicClassId },
    select: {
      id: true,
      grade: true,
      section: true,
      name: true,
      academicYear: true,
      isActive: true,
    },
  });

  if (!academicClass) {
    return null;
  }

  return {
    id: academicClass.id,
    grade: String(academicClass.grade),
    section: academicClass.section,
    academicYear: academicClass.academicYear,
    isActive: academicClass.isActive,
  };
}

export async function getAdminAcademicClassFormOptions() {
  const academicClasses = await prisma.academicClass.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    select: {
      academicYear: true,
    },
  });

  const academicYears = await buildAcademicYearOptions(
    academicClasses.map((academicClass) => academicClass.academicYear),
  );

  return { academicYears };
}

export async function getAdminClassGroupsData(
  query = "",
  page = 1,
  pageSize = 12,
) {
  const normalizedQuery = query.trim();
  const parsedGrade = Number.parseInt(normalizedQuery, 10);
  const where = normalizedQuery
    ? {
        OR: [
          {
            name: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            teacher: {
              fullName: {
                startsWith: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
          },
          {
            academicYear: {
              startsWith: normalizedQuery,
              mode: "insensitive" as const,
            },
          },
          ...(Number.isFinite(parsedGrade)
            ? [
                {
                  grade: parsedGrade,
                },
              ]
            : []),
          {
            name: {
              startsWith: `Kelas ${normalizedQuery}`,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              startsWith: `Kelas ${normalizedQuery}`,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const [classGroups, totalCount, activeCount, filteredCount] = await Promise.all([
    prisma.classGroup.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        teacher: {
          select: {
            fullName: true,
            isActive: true,
            user: {
              select: {
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.classGroup.count(),
    prisma.classGroup.count({ where: { isActive: true } }),
    prisma.classGroup.count({ where }),
  ]);

  return {
    counts: {
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
      filteredCount,
    },
    classGroups: classGroups.map((classGroup) => ({
      id: classGroup.id,
      name: classGroup.name,
      description: classGroup.description,
      level: halaqahLevelLabels[classGroup.level],
      levelKey: classGroup.level,
      teacherId: classGroup.teacherId,
      teacherName: classGroup.teacher.fullName,
      grade: classGroup.grade,
      gradeLabel: formatHalaqahGradeLabel(classGroup.grade),
      academicYear: classGroup.academicYear,
      teacherIsActive:
        classGroup.teacher.isActive && classGroup.teacher.user.isActive,
      isActive: classGroup.isActive,
      studentCount: classGroup._count.students,
    })),
    query: normalizedQuery,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(filteredCount / safePageSize)),
    },
  };
}

export async function getAdminClassGroupFormData(classGroupId: string) {
  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
      teacherId: true,
      academicYear: true,
      grade: true,
      isActive: true,
    },
  });

  if (!classGroup) {
    return null;
  }

  return {
    id: classGroup.id,
    name: classGroup.name,
    description: classGroup.description ?? "",
    level: classGroup.level,
    teacherId: classGroup.teacherId,
    academicYear: classGroup.academicYear,
    grade: String(classGroup.grade),
    isActive: classGroup.isActive,
  };
}

export async function getAdminClassGroupFormOptions() {
  const [teachers, academicClasses] = await Promise.all([
    prisma.teacher.findMany({
      orderBy: { fullName: "asc" },
      where: {
        isActive: true,
        user: { isActive: true },
      },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.academicClass.findMany({
      orderBy: [{ academicYear: "desc" }],
      select: {
        academicYear: true,
      },
    }),
  ]);

  const academicYears = await buildAcademicYearOptions(
    academicClasses.map((academicClass) => academicClass.academicYear),
  );

  return {
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.user.email,
      isActive: teacher.isActive && teacher.user.isActive,
      label: teacher.fullName,
    })),
    academicYears,
  };
}

export async function getAdminStudentFormData(studentId: string) {
  const [student, options] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        teacherId: true,
        academicClassId: true,
        gender: true,
        joinDate: true,
        isActive: true,
        notes: true,
        academicClass: {
          select: {
            academicYear: true,
          },
        },
      },
    }),
    getAdminStudentFormOptions(),
  ]);

  if (!student) {
    return null;
  }

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      teacherId: student.teacherId,
      academicClassId: student.academicClassId ?? "",
      academicYear:
        student.academicClass?.academicYear ??
        options.academicYears[0] ??
        await getActiveAcademicYear(),
      gender: student.gender ?? "",
      joinDate: student.joinDate.toISOString().slice(0, 10),
      isActive: student.isActive,
      notes: student.notes ?? "",
    },
    options,
  };
}
