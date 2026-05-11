"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Gender, HalaqahLevel } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";
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
  const notes = readOptionalString(formData, "notes");

  if (!fullName || fullName.length > 120) {
    fail(t("studentNameRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!halaqahLevel || !validLevels.has(halaqahLevel)) {
    fail(t("halaqahLevelRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!grade || grade < 7 || grade > 9) {
    fail(t("gradeRequired"), {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (gender && !validGenders.has(gender)) {
    fail(t("genderInvalid"), {
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
      fail(t("halaqahMismatch"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }

    const resolvedSelectedClassGroup = selectedClassGroup!;

    if (resolvedSelectedClassGroup.grade !== grade) {
      fail(t("halaqahMismatch"), {
        fullName,
        gender,
        joinDate,
        notes: notes ?? "",
      });
    }

    resolvedClassGroupId = resolvedSelectedClassGroup.id;
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
      joinDate: joinDate ? new Date(joinDate) : undefined,
      notes,
      academicClassId: academicClassId || null,
      classGroupId: resolvedClassGroupId,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  invalidateCache("report-student");
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("studentUpdated"))}`);
}

export async function deactivateTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnlyDeactivate"))}`);
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId, isActive: true },
    select: { id: true },
  });

  if (!student) {
    redirect(`/students?error=${encodeURIComponent(t("studentNotFound"))}`);
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });

  revalidatePath("/");
  revalidatePath("/students");
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  redirect(`/students?success=${encodeURIComponent(t("studentDeactivated"))}`);
}

export async function reactivateTeacherStudent(studentId: string) {
  const t = await getTranslations("Validation");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnlyReactivate"))}`);
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId, isActive: false },
    select: { id: true },
  });

  if (!student) {
    redirect(`/students?error=${encodeURIComponent(t("studentNotFound"))}`);
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: true },
  });

  revalidatePath("/");
  revalidatePath("/students");
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  redirect(`/students?success=${encodeURIComponent(t("studentReactivated"))}`);
}
