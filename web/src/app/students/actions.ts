"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Gender, HalaqahLevel, ProgramType } from "@/generated/prisma-next/enums";
import { Prisma } from "@/generated/prisma-next/client";
import {
  createFailFn,
  parseDateInput,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { halaqahLevelLabels } from "@/lib/format";

const validGenders = new Set<string>(Object.values(Gender));
const validLevels = new Set<string>(Object.values(HalaqahLevel));

export async function createTeacherStudent(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

  if (!teacherId) {
    redirect(`/students?error=${encodeURIComponent(t("teacherOnly"))}`);
  }

  const directoryQ = readOptionalString(formData, "directoryQ") ?? "";
  const directoryPage = readOptionalString(formData, "directoryPage") ?? "";

  const fullName = readString(formData, "fullName");
  const classGroupId = readOptionalString(formData, "classGroupId");
  const halaqahLevel = readOptionalString(formData, "halaqahLevel");
  const gradeRaw = readString(formData, "grade");
  const submittedGrade = gradeRaw ? parseInt(gradeRaw, 10) : 0;
  const academicClassId = readString(formData, "academicClassId");
  const programType = (readString(formData, "programType") as ProgramType) || ProgramType.ACADEMIC;
  const failParams = new URLSearchParams({ programType });
  if (directoryQ) failParams.set("q", directoryQ);
  if (directoryPage) failParams.set("page", directoryPage);
  const fail = createFailFn(`/students/new?${failParams.toString()}`);
  const gender = readString(formData, "gender");
  const joinDate = readString(formData, "joinDate");
  const parsedJoinDate = joinDate ? parseDateInput(joinDate) : new Date();
  const notes = readOptionalString(formData, "notes");
  const failValues = {
    fullName,
    classGroupId: classGroupId ?? "",
    halaqahLevel: halaqahLevel ?? "",
    grade: gradeRaw,
    academicClassId: academicClassId ?? "",
    programType,
    gender,
    joinDate,
    notes: notes ?? "",
  };

  if (!fullName || fullName.length > 120) {
    return fail(t("studentNameRequired"), failValues);
  }

  if (gender && !validGenders.has(gender)) {
    return fail(t("genderInvalid"), failValues);
  }

  if (!parsedJoinDate) {
    return fail(t("dateInvalid"), failValues);
  }

  if (!academicClassId) {
    return fail(t("academicClassRequired"), failValues);
  }

  let resolvedClassGroupId = classGroupId;
  let resolvedLevel = halaqahLevel;
  let resolvedGrade = submittedGrade;

  const isBoarding = programType === ProgramType.BOARDING;

  if (resolvedClassGroupId) {
    const classGroup = await prisma.classGroup.findFirst({
      where: { id: resolvedClassGroupId, teacherId, isActive: true },
      select: { id: true, grade: true, level: true },
    });

    if (!classGroup) {
      return fail(t("halaqahMismatch"), failValues);
    }

    resolvedLevel ??= classGroup.level;
    resolvedGrade ||= classGroup.grade;

    if (
      !isBoarding &&
      ((halaqahLevel && halaqahLevel !== classGroup.level) ||
      (submittedGrade && submittedGrade !== classGroup.grade))
    ) {
      return fail(t("halaqahMismatch"), failValues);
    }
  }

  // For Boarding, skip halaqahLevel validation and assign default
  if (isBoarding) {
    if (!resolvedLevel || !validLevels.has(resolvedLevel)) {
      resolvedLevel = HalaqahLevel.LOW;
    }
  } else {
    if (!resolvedLevel || !validLevels.has(resolvedLevel)) {
      return fail(t("halaqahLevelRequired"), failValues);
    }
  }

  if (!resolvedGrade || resolvedGrade < 7 || resolvedGrade > 9) {
    return fail(t("gradeRequired"), failValues);
  }

  const academicClass = await prisma.academicClass.findFirst({
    where: { id: academicClassId, isActive: true },
    select: { id: true, grade: true },
  });

  if (!academicClass || academicClass.grade !== resolvedGrade) {
    return fail(t("academicClassGradeMismatch"), failValues);
  }

  if (!resolvedClassGroupId) {
    const level = resolvedLevel as HalaqahLevel;
    const academicYear = await getActiveAcademicYear();

    const existingCg = await prisma.classGroup.findUnique({
      where: { teacherId_academicYear_grade_programType: { teacherId, academicYear, grade: resolvedGrade, programType } },
      select: { id: true, level: true },
    });

    if (existingCg) {
      if (!isBoarding && existingCg.level !== level) {
        return fail(
          t("halaqahLevelLocked", { grade: resolvedGrade, level: halaqahLevelLabels[existingCg.level] }),
          failValues,
        );
      }
      resolvedClassGroupId = existingCg.id;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { fullName: true },
      });

      try {
        const classGroup = await prisma.classGroup.create({
          data: {
            teacherId,
            name: teacher?.fullName ?? "Halaqah",
            level,
            grade: resolvedGrade,
            academicYear,
            programType,
            isActive: true,
          },
        });
        resolvedClassGroupId = classGroup.id;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const retryCg = await prisma.classGroup.findUnique({
            where: { teacherId_academicYear_grade_programType: { teacherId, academicYear, grade: resolvedGrade, programType } },
            select: { id: true },
          });
          if (retryCg) {
            resolvedClassGroupId = retryCg.id;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
  }

  const newStudent = await prisma.student.create({
    data: {
      teacherId,
      classGroupId: resolvedClassGroupId,
      academicClassId,
      fullName,
      gender: (gender as Gender) || null,
      joinDate: parsedJoinDate,
      isActive: true,
      notes,
    },
  });

  invalidateStudentRelatedCaches();
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/students/new");
  revalidatePath("/students/program-select");
  revalidatePath("/quick-log");
  revalidatePath("/formative");
  revalidatePath("/summative");
  revalidatePath("/reports");
  const resultParams = new URLSearchParams({ success: t("studentAdded", { name: fullName }), highlight: newStudent.id, programType });
  if (directoryQ) resultParams.set("q", directoryQ);
  if (directoryPage) resultParams.set("page", directoryPage);
  redirect(`/students?${resultParams.toString()}`);
}
