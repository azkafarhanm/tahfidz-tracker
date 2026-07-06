"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Gender, HalaqahLevel, ProgramType, TargetStatus } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  parseDateInput,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma-next/client";
import { requireSessionScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { halaqahLevelLabels } from "@/lib/format";

const validGenders = new Set<string>(Object.values(Gender));
const validLevels = new Set<string>(Object.values(HalaqahLevel));
const validProgramTypes = new Set<string>(Object.values(ProgramType));

function buildDeleteBlockerItems(
  counts: {
    activeTargets: number;
  },
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  return [
    counts.activeTargets > 0
      ? t("teacherStudentDeleteBlockedTargets", {
          count: counts.activeTargets,
        })
      : null,
  ].filter((item): item is string => Boolean(item));
}

export async function updateTeacherStudent(
  studentId: string,
  returnTo: string | undefined,
  formData: FormData,
) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnlyEdit"))}`);
  }

  const fail = createFailFn(`/students/${studentId}/edit${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`);

  const fullName = readString(formData, "fullName");
  const classGroupId = readOptionalString(formData, "classGroupId");
  const halaqahLevelRaw = readString(formData, "halaqahLevel");
  const gradeRaw = readString(formData, "grade");
  const grade = gradeRaw ? parseInt(gradeRaw, 10) : 0;
  const academicClassId = readString(formData, "academicClassId");
  const programType = (readString(formData, "programType") as ProgramType) || ProgramType.ACADEMIC;
  const gender = readString(formData, "gender");
  const joinDate = readString(formData, "joinDate");
  const parsedJoinDate = joinDate ? parseDateInput(joinDate) : null;
  const notes = readOptionalString(formData, "notes");
  const isBoarding = programType === ProgramType.BOARDING;

  if (!validProgramTypes.has(programType)) {
    return fail(t("halaqahMismatch"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  // For Boarding, skip halaqahLevel validation and assign default
  let halaqahLevel = halaqahLevelRaw;
  if (isBoarding) {
    if (!halaqahLevel || !validLevels.has(halaqahLevel)) {
      halaqahLevel = HalaqahLevel.LOW;
    }
  } else {
    if (!halaqahLevel || !validLevels.has(halaqahLevel)) {
      return fail(t("halaqahLevelRequired"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }
  }

  if (!fullName || fullName.length > 120) {
    return fail(t("studentNameRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!grade || grade < 7 || grade > 9) {
    return fail(t("gradeRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!academicClassId) {
    return fail(t("academicClassRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  const academicClass = await prisma.academicClass.findFirst({
    where: { id: academicClassId, isActive: true },
    select: { id: true, grade: true, programType: true },
  });

  if (
    !academicClass ||
    academicClass.grade !== grade ||
    academicClass.programType !== programType
  ) {
    return fail(t("academicClassGradeMismatch"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (gender && !validGenders.has(gender)) {
    return fail(t("genderInvalid"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (joinDate && !parsedJoinDate) {
    return fail(t("dateInvalid"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId },
    select: { id: true },
  });

  if (!student) {
    redirect(`/students?error=${encodeURIComponent(t("studentNotFound"))}`);
  }

  let resolvedClassGroupId: string;

  if (classGroupId) {
    const selectedClassGroup = await prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId, isActive: true },
      select: { id: true, grade: true, programType: true },
    });

    if (!selectedClassGroup) {
      return fail(t("halaqahMismatch"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }

    if (
      selectedClassGroup.grade !== grade ||
      selectedClassGroup.programType !== programType
    ) {
      return fail(t("halaqahMismatch"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }

    resolvedClassGroupId = selectedClassGroup.id;
  } else {
    const level = halaqahLevel as HalaqahLevel;
    const academicYear = await getActiveAcademicYear();

    const existingCg = await prisma.classGroup.findUnique({
      where: { teacherId_academicYear_grade_programType: { teacherId, academicYear, grade, programType } },
      select: { id: true, level: true },
    });

    if (existingCg) {
      if (!isBoarding && existingCg.level !== level) {
        return fail(
          t("halaqahLevelLocked", { grade, level: halaqahLevelLabels[existingCg.level] }),
          { fullName, gender, joinDate, notes: notes ?? "" },
        );
      }
      resolvedClassGroupId = existingCg.id;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { fullName: true },
      });

      const classGroup = await prisma.classGroup.create({
        data: {
          teacherId,
          name: teacher?.fullName ?? "Halaqah",
          level,
          grade,
          academicYear,
          programType,
          isActive: true,
        },
      });

      resolvedClassGroupId = classGroup.id;
    }
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: {
      fullName,
      gender: (gender as Gender) || null,
      joinDate: parsedJoinDate ?? undefined,
      notes,
      academicClassId,
      classGroupId: resolvedClassGroupId,
    },
    select: {
      classGroup: {
        select: { programType: true },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
  if (returnTo) {
    // Detail-origin Save returns to the Student Detail page. The detail page
    // does not consume `success` (no toast wired) and student-level highlight
    // is intentionally not used (highlight is reserved for list-item workflows:
    // memorization/revision/tasmi/target). Redirect to the bare detail pathname
    // so the saved scroll identity (pathname only, no query) matches exactly
    // and scroll restoration can fire on return.
    const [pathname] = returnTo.split("?", 2);
    redirect(pathname);
  }
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("studentUpdated"))}&programType=${updatedStudent.classGroup.programType}`);
}

export async function deactivateTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return { ok: false as const, error: t("teacherOnlyDeactivate") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId },
    select: { id: true, isActive: true },
  });

  if (!student) {
    return { ok: false as const, error: t("studentNotFound") };
  }

  if (!student.isActive) {
    revalidatePath("/");
    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
    invalidateStudentRelatedCaches(studentId);
    return { ok: true as const, message: t("studentDeactivated") };
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
  return { ok: true as const, message: t("studentDeactivated") };
}

export async function reactivateTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return { ok: false as const, error: t("teacherOnlyReactivate") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId, isActive: false },
    select: { id: true },
  });

  if (!student) {
    return { ok: false as const, error: t("studentNotFound") };
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: true },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
  return { ok: true as const, message: t("studentReactivated") };
}

export async function deleteTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return { ok: false as const, error: t("teacherOnlyDelete") };
  }

  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const student = await tx.student.findFirst({
          where: { id: studentId, teacherId, isActive: false },
          select: {
            id: true,
            fullName: true,
            _count: {
              select: {
                targets: { where: { status: TargetStatus.ACTIVE } },
              },
            },
          },
        });

        if (!student) {
          return { status: "notFound" as const };
        }

        const blockerItems = buildDeleteBlockerItems(
          {
            activeTargets: student._count.targets,
          },
          t,
        );

        if (blockerItems.length > 0) {
          return { status: "blocked" as const, student, blockerItems };
        }

        await tx.student.delete({
          where: { id: student.id },
        });

        return { status: "deleted" as const, student };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: t("studentNotFound") };
    }
    throw error;
  }

  if (result.status === "notFound") {
    return { ok: false as const, error: t("studentNotFound") };
  }

  if (result.status === "blocked") {
    return {
      ok: false as const,
      error: t("teacherStudentDeleteBlockedReason", {
        name: result.student.fullName,
        items: result.blockerItems.join(", "),
      }),
    };
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/quick-log");
  invalidateStudentRelatedCaches(studentId);
  return { ok: true as const, message: t("teacherStudentDeleted", { name: result.student.fullName }) };
}
