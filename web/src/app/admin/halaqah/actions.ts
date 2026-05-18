"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HalaqahLevel } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";

const validLevels = new Set<string>(Object.values(HalaqahLevel));

type ClassGroupFormInput = {
  name: string;
  description: string;
  level: string;
  teacherId: string;
  academicYear: string;
  grade: string;
  isActive: boolean;
};

function readClassGroupFormInput(formData: FormData): ClassGroupFormInput {
  return {
    name: readString(formData, "name"),
    description: readString(formData, "description"),
    level: readString(formData, "level"),
    teacherId: readString(formData, "teacherId"),
    academicYear: readString(formData, "academicYear"),
    grade: readString(formData, "grade"),
    isActive: formData.get("isActive") === "on",
  };
}

function getClassGroupFormExtras(input: ClassGroupFormInput) {
  return {
    name: input.name,
    description: input.description,
    level: input.level,
    teacherId: input.teacherId,
    academicYear: input.academicYear,
    grade: input.grade,
    isActive: input.isActive ? "true" : "false",
  };
}

async function validateClassGroupInput(
  input: ClassGroupFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const t = await getTranslations("Validation");
  const extras = getClassGroupFormExtras(input);

  if (!input.name || input.name.length > 120) {
    fail(t("halaqahNameRequired"), extras);
  }

  if (input.description && input.description.length > 500) {
    fail(t("halaqahDescTooLong"), extras);
  }

  if (!validLevels.has(input.level)) {
    fail(t("halaqahLevelInvalid"), extras);
  }

  if (!input.teacherId) {
    fail(t("halaqahTeacherRequired"), extras);
  }

  if (!/^\d{4}\/\d{4}$/.test(input.academicYear)) {
    fail(t("halaqahAcademicYearInvalid"), extras);
  }

  if (!["7", "8", "9"].includes(input.grade)) {
    fail(t("halaqahGradeRequired"), extras);
  }
}

function redirectAdminHalaqahWithMessage(
  type: "success" | "error",
  message: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/halaqah?${params.toString()}`);
}

function revalidateAdminHalaqahPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/halaqah");
  revalidatePath("/admin/students");
  invalidateCache("admin-dashboard");
  invalidateCache("report-admin");
  invalidateCache("students");
  invalidateCache("dashboard");
}

async function resolveClassGroupRelations(
  input: ClassGroupFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
  currentClassGroupId?: string,
) {
  const t = await getTranslations("Validation");
  const grade = Number.parseInt(input.grade, 10);

  const [teacher, conflictingClassGroup] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: input.teacherId },
      select: { id: true },
    }),
    prisma.classGroup.findFirst({
      where: {
        teacherId: input.teacherId,
        academicYear: input.academicYear,
        grade,
      },
      select: { id: true, name: true },
    }),
  ]);

  const extras = getClassGroupFormExtras(input);

  if (!teacher) {
    fail(t("halaqahTeacherNotFound"), extras);
  }

  if (
    conflictingClassGroup &&
    conflictingClassGroup.id !== currentClassGroupId
  ) {
    fail(
      t("halaqahDuplicate", { year: input.academicYear, grade, name: conflictingClassGroup.name }),
      extras,
    );
  }

  return {
    teacherId: teacher!.id,
    academicYear: input.academicYear,
    grade,
  };
}

export async function createClassGroup(formData: FormData) {
  await requireAdminScope();

  const input = readClassGroupFormInput(formData);
  const fail = createFailFn("/admin/halaqah/new");

  await validateClassGroupInput(input, fail);
  const relations = await resolveClassGroupRelations(input, fail);

  await prisma.classGroup.create({
    data: {
      name: input.name,
      description: input.description || null,
      level: input.level as HalaqahLevel,
      teacherId: relations.teacherId,
      academicYear: relations.academicYear,
      grade: relations.grade,
      isActive: input.isActive,
    },
  });

  const t = await getTranslations("Validation");
  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage("success", t("halaqahCreated"));
}

export async function updateClassGroup(
  classGroupId: string,
  formData: FormData,
) {
  await requireAdminScope();

  const input = readClassGroupFormInput(formData);
  const fail = createFailFn(`/admin/halaqah/${classGroupId}/edit`);

  await validateClassGroupInput(input, fail);

  const t = await getTranslations("Validation");

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: { id: true },
  });

  if (!classGroup) {
    redirectAdminHalaqahWithMessage("error", t("halaqahNotFound"));
  }

  const relations = await resolveClassGroupRelations(input, fail, classGroup.id);
  const existingStudents = await prisma.student.findMany({
    where: { classGroupId: classGroup.id },
    select: {
      fullName: true,
      academicClass: {
        select: {
          grade: true,
          academicYear: true,
        },
      },
    },
  });

  const mismatchedStudent = existingStudents.find(
    (student) =>
      !student.academicClass ||
      student.academicClass.grade !== relations.grade ||
      student.academicClass.academicYear !== relations.academicYear,
  );

  if (mismatchedStudent) {
    fail(
      t("halaqahStudentMismatch", { name: mismatchedStudent.fullName, grade: relations.grade, year: relations.academicYear }),
      getClassGroupFormExtras(input),
    );
  }

  await prisma.$transaction([
    prisma.classGroup.update({
      where: { id: classGroup.id },
      data: {
        name: input.name,
        description: input.description || null,
        level: input.level as HalaqahLevel,
        teacherId: relations.teacherId,
        academicYear: relations.academicYear,
        grade: relations.grade,
        isActive: input.isActive,
      },
    }),
    prisma.student.updateMany({
      where: { classGroupId: classGroup.id },
      data: {
        teacherId: relations.teacherId,
      },
    }),
  ]);

  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage("success", t("halaqahUpdated"));
}

export async function toggleClassGroupActive(
  classGroupId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: { id: true, name: true },
  });

  if (!classGroup) {
    redirectAdminHalaqahWithMessage("error", t("halaqahNotFound"));
  }

  if (!nextActiveState) {
    const activeStudentCount = await prisma.student.count({
      where: { classGroupId: classGroup.id, isActive: true },
    });

    if (activeStudentCount > 0) {
      redirectAdminHalaqahWithMessage(
        "error",
        t("halaqahHasStudents", { name: classGroup.name, count: activeStudentCount }),
      );
    }
  }

  await prisma.classGroup.update({
    where: { id: classGroup.id },
    data: { isActive: nextActiveState },
  });

  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage(
    "success",
    nextActiveState
      ? t("halaqahActivated", { name: classGroup.name })
      : t("halaqahDeactivated", { name: classGroup.name }),
  );
}

export async function deleteClassGroup(classGroupId: string) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: { id: true, name: true },
  });

  if (!classGroup) {
    redirectAdminHalaqahWithMessage("error", t("halaqahNotFound"));
  }

  const studentCount = await prisma.student.count({
    where: { classGroupId: classGroup.id },
  });

  if (studentCount > 0) {
    redirectAdminHalaqahWithMessage(
      "error",
      t("halaqahHasAnyStudents", {
        name: classGroup.name,
        count: studentCount,
      }),
    );
  }

  await prisma.classGroup.delete({
    where: { id: classGroup.id },
  });

  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage(
    "success",
    t("halaqahDeleted", { name: classGroup.name }),
  );
}
