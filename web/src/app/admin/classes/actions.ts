"use server";

import { Prisma } from "@/generated/prisma-next/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  createFailFn,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";

type AcademicClassFormInput = {
  grade: string;
  section: string;
  isActive: boolean;
};

function readAcademicClassFormInput(formData: FormData): AcademicClassFormInput {
  return {
    grade: readString(formData, "grade"),
    section: readString(formData, "section"),
    isActive: formData.get("isActive") === "on",
  };
}

function getAcademicClassFormExtras(input: AcademicClassFormInput) {
  return {
    grade: input.grade,
    section: input.section,
    isActive: input.isActive ? "true" : "false",
  };
}

async function validateAcademicClassInput(
  input: AcademicClassFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const t = await getTranslations("Validation");
  const extras = getAcademicClassFormExtras(input);
  const grade = Number.parseInt(input.grade, 10);

  if (!Number.isFinite(grade) || grade < 1 || grade > 12) {
    fail(t("classGradeRange"), extras);
  }

  if (!input.section || input.section.length > 5) {
    fail(t("classSectionRequired"), extras);
  }
}

function redirectAdminClassesWithMessage(
  type: "success" | "error",
  message: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/classes?${params.toString()}`);
}

function revalidateAdminClassPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/students");
  invalidateCache("admin-dashboard");
  invalidateCache("report-admin");
  invalidateCache("students");
  invalidateCache("quick-log-students");
}

function isDeleteRaceError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2003", "P2025", "P2034"].includes(error.code)
  );
}

export async function createAcademicClass(formData: FormData) {
  await requireAdminScope();

  const input = readAcademicClassFormInput(formData);
  const fail = createFailFn("/admin/classes/new");
  const t = await getTranslations("Validation");
  const academicYear = await getActiveAcademicYear();

  await validateAcademicClassInput(input, fail);

  const grade = Number.parseInt(input.grade, 10);
  const name = `${grade}${input.section}`;

  const existing = await prisma.academicClass.findUnique({
    where: {
      name_academicYear: {
        name,
        academicYear,
      },
    },
    select: { id: true },
  });

  if (existing) {
    fail(
      t("classDuplicate", { name, year: academicYear }),
      getAcademicClassFormExtras(input),
    );
  }

  await prisma.academicClass.create({
    data: {
      grade,
      section: input.section,
      name,
      academicYear,
      isActive: input.isActive,
    },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage("success", t("classCreated"));
}

export async function updateAcademicClass(
  academicClassId: string,
  formData: FormData,
) {
  await requireAdminScope();

  const input = readAcademicClassFormInput(formData);
  const fail = createFailFn(`/admin/classes/${academicClassId}/edit`);
  const academicYear = await getActiveAcademicYear();

  await validateAcademicClassInput(input, fail);

  const t = await getTranslations("Validation");

  const academicClass = await prisma.academicClass.findUnique({
    where: { id: academicClassId },
    select: { id: true },
  });

  if (!academicClass) {
    redirectAdminClassesWithMessage("error", t("classNotFound"));
  }

  const grade = Number.parseInt(input.grade, 10);
  const name = `${grade}${input.section}`;

  const existing = await prisma.academicClass.findUnique({
    where: {
      name_academicYear: {
        name,
        academicYear,
      },
    },
    select: { id: true },
  });

  if (existing && existing.id !== academicClass.id) {
    fail(
      t("classDuplicate", { name, year: academicYear }),
      getAcademicClassFormExtras(input),
    );
  }

  await prisma.academicClass.update({
    where: { id: academicClass.id },
    data: {
      grade,
      section: input.section,
      name,
      academicYear,
      isActive: input.isActive,
    },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage("success", t("classUpdated"));
}

export async function toggleAcademicClassActive(
  academicClassId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  const academicClass = await prisma.academicClass.findUnique({
    where: { id: academicClassId },
    select: { id: true, name: true, academicYear: true },
  });

  if (!academicClass) {
    redirectAdminClassesWithMessage("error", t("classNotFound"));
  }

  if (!nextActiveState) {
    const activeStudentCount = await prisma.student.count({
      where: { academicClassId: academicClass.id, isActive: true },
    });

    if (activeStudentCount > 0) {
      redirectAdminClassesWithMessage(
        "error",
        t("classHasStudents", { name: academicClass.name, count: activeStudentCount }),
      );
    }
  }

  await prisma.academicClass.update({
    where: { id: academicClass.id },
    data: { isActive: nextActiveState },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage(
    "success",
    nextActiveState
      ? t("classActivated", { name: academicClass.name, year: academicClass.academicYear })
      : t("classDeactivated", { name: academicClass.name, year: academicClass.academicYear }),
  );
}

export async function deleteAcademicClass(academicClassId: string) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const academicClass = await tx.academicClass.findUnique({
          where: { id: academicClassId },
          select: { id: true, name: true, academicYear: true },
        });

        if (!academicClass) {
          return { status: "notFound" as const };
        }

        const studentCount = await tx.student.count({
          where: { academicClassId: academicClass.id },
        });

        if (studentCount > 0) {
          return {
            status: "blocked" as const,
            academicClass,
            studentCount,
          };
        }

        await tx.academicClass.delete({
          where: { id: academicClass.id },
        });

        return { status: "deleted" as const, academicClass };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isDeleteRaceError(error)) {
      return { ok: false as const, error: t("deleteRaceDetected") };
    }
    throw error;
  }

  if (result.status === "notFound") {
    return { ok: false as const, error: t("classNotFound") };
  }

  if (result.status === "blocked") {
    return {
      ok: false as const,
      error: t("classHasAnyStudents", {
        name: result.academicClass.name,
        count: result.studentCount,
      }),
    };
  }

  revalidateAdminClassPaths();
  return {
    ok: true as const,
    success: t("classDeleted", {
      name: result.academicClass.name,
      year: result.academicClass.academicYear,
    }),
  };
}
