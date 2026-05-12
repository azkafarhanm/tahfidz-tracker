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

export async function createTeacherStudent(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnly"))}`);
  }

  const fail = createFailFn("/students/new");

  const fullName = readString(formData, "fullName");
  const classGroupId = readOptionalString(formData, "classGroupId");
  const halaqahLevel = readOptionalString(formData, "halaqahLevel");
  const gradeRaw = readString(formData, "grade");
  const submittedGrade = gradeRaw ? parseInt(gradeRaw, 10) : 0;
  const academicClassId = readOptionalString(formData, "academicClassId");
  const gender = readString(formData, "gender");
  const joinDate = readString(formData, "joinDate");
  const notes = readOptionalString(formData, "notes");
  const failValues = {
    fullName,
    classGroupId: classGroupId ?? "",
    halaqahLevel: halaqahLevel ?? "",
    grade: gradeRaw,
    academicClassId: academicClassId ?? "",
    gender,
    joinDate,
    notes: notes ?? "",
  };

  if (!fullName || fullName.length > 120) {
    fail(t("studentNameRequired"), failValues);
  }

  if (gender && !validGenders.has(gender)) {
    fail(t("genderInvalid"), failValues);
  }

  let resolvedClassGroupId = classGroupId;
  let resolvedLevel = halaqahLevel;
  let resolvedGrade = submittedGrade;

  if (resolvedClassGroupId) {
    const classGroup = await prisma.classGroup.findFirst({
      where: { id: resolvedClassGroupId, teacherId, isActive: true },
      select: { id: true, grade: true, level: true },
    });

    if (!classGroup) {
      fail(t("halaqahMismatch"), failValues);
    }

    const activeClassGroup = classGroup!;

    resolvedLevel ??= activeClassGroup.level;
    resolvedGrade ||= activeClassGroup.grade;

    if (
      (halaqahLevel && halaqahLevel !== activeClassGroup.level) ||
      (submittedGrade && submittedGrade !== activeClassGroup.grade)
    ) {
      fail(t("halaqahMismatch"), failValues);
    }
  }

  if (!resolvedLevel || !validLevels.has(resolvedLevel)) {
    fail(t("halaqahLevelRequired"), failValues);
  }

  if (!resolvedGrade || resolvedGrade < 7 || resolvedGrade > 9) {
    fail(t("gradeRequired"), failValues);
  }

  if (!resolvedClassGroupId) {
    const level = resolvedLevel as HalaqahLevel;

    const existing = await prisma.classGroup.findFirst({
      where: { teacherId, grade: resolvedGrade, level, isActive: true },
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
          name: `${teacher?.fullName ?? "Halaqah"} - Kelas ${resolvedGrade}`,
          level,
          grade: resolvedGrade,
          academicYear: getCurrentAcademicYear(),
          isActive: true,
        },
      });

      resolvedClassGroupId = newClassGroup.id;
    }
  }

  await prisma.student.create({
    data: {
      teacherId,
      classGroupId: resolvedClassGroupId,
      academicClassId: academicClassId || null,
      fullName,
      gender: (gender as Gender) || null,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      isActive: true,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  invalidateCache("formative-");
  redirect(`/students?success=${encodeURIComponent(t("studentAdded", { name: fullName }))}`);
}
