"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Gender, HalaqahLevel } from "@/generated/prisma-next/enums";
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
import { getCurrentAcademicYear } from "@/lib/academic-year";

const validGenders = new Set<string>(Object.values(Gender));
const validLevels = new Set<string>(Object.values(HalaqahLevel));

export async function updateTeacherStudent(
  studentId: string,
  formData: FormData,
) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnlyEdit"))}`);
  }

  const fail = createFailFn(`/students/${studentId}/edit`);

  const fullName = readString(formData, "fullName");
  const classGroupId = readOptionalString(formData, "classGroupId");
  const halaqahLevel = readString(formData, "halaqahLevel");
  const gradeRaw = readString(formData, "grade");
  const grade = gradeRaw ? parseInt(gradeRaw, 10) : 0;
  const academicClassId = readOptionalString(formData, "academicClassId");
  const gender = readString(formData, "gender");
  const joinDate = readString(formData, "joinDate");
  const parsedJoinDate = joinDate ? parseDateInput(joinDate) : null;
  const notes = readOptionalString(formData, "notes");

  if (!fullName || fullName.length > 120) {
    return fail(t("studentNameRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!halaqahLevel || !validLevels.has(halaqahLevel)) {
    return fail(t("halaqahLevelRequired"), {
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
    where: { id: studentId, teacherId, isActive: true },
    select: { id: true },
  });

  if (!student) {
    redirect(`/students?error=${encodeURIComponent(t("studentNotFound"))}`);
  }

  let resolvedClassGroupId: string;

  if (classGroupId) {
    const selectedClassGroup = await prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId, isActive: true },
      select: { id: true, grade: true },
    });

    if (!selectedClassGroup) {
      return fail(t("halaqahMismatch"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }

    if (selectedClassGroup.grade !== grade) {
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
    const existing = await prisma.classGroup.findFirst({
      where: { teacherId, grade, level, isActive: true },
    });

    if (existing) {
      resolvedClassGroupId = existing.id;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { fullName: true },
      });

      const newClassGroup = await prisma.classGroup.create({
        data: {
          teacherId,
          name: `${teacher?.fullName ?? "Halaqah"} - Kelas ${grade}`,
          level,
          grade,
          academicYear: getCurrentAcademicYear(),
          isActive: true,
        },
      });

      resolvedClassGroupId = newClassGroup.id;
    }
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      fullName,
      gender: (gender as Gender) || null,
      joinDate: parsedJoinDate ?? undefined,
      notes,
      academicClassId: academicClassId || null,
      classGroupId: resolvedClassGroupId,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("studentUpdated"))}`);
}

export async function deactivateTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return { ok: false as const, error: t("teacherOnlyDeactivate") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId, isActive: true },
    select: { id: true },
  });

  if (!student) {
    return { ok: false as const, error: t("studentNotFound") };
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });

  revalidatePath("/");
  revalidatePath("/students");
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
                memorizationRecords: true,
                revisionRecords: true,
                summativeScores: true,
              },
            },
          },
        });

        if (!student) {
          return { status: "notFound" as const };
        }

        const relatedDataCount =
          student._count.memorizationRecords +
          student._count.revisionRecords +
          student._count.summativeScores;

        if (relatedDataCount > 0) {
          return { status: "blocked" as const, student, relatedDataCount };
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
      error: t("teacherStudentHasRelatedData", {
        name: result.student.fullName,
        count: result.relatedDataCount,
      }),
    };
  }

  revalidatePath("/");
  revalidatePath("/students");
  invalidateStudentRelatedCaches(studentId);
  return { ok: true as const, message: t("teacherStudentDeleted", { name: result.student.fullName }) };
}
