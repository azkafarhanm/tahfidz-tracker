"use server";

import { Prisma } from "@/generated/prisma-next/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Gender, TargetStatus } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  parseDateInput,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";

const validGenders = new Set<string>(Object.values(Gender));

type StudentFormInput = {
  fullName: string;
  teacherId: string;
  academicYear: string;
  academicClassId: string;
  gender: Gender | null;
  joinDate: Date | null;
  joinDateValue: string;
  isActive: boolean;
  notes: string | null;
};

function buildDeleteBlockerItems(
  counts: {
    activeTargets: number;
  },
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  return [
    counts.activeTargets > 0
      ? t("adminStudentDeleteBlockedTargets", {
          count: counts.activeTargets,
        })
      : null,
  ].filter((item): item is string => Boolean(item));
}

function readStudentFormInput(formData: FormData): StudentFormInput {
  const genderValue = readOptionalString(formData, "gender");
  const joinDateValue = readString(formData, "joinDate");

  return {
    fullName: readString(formData, "fullName"),
    teacherId: readString(formData, "teacherId"),
    academicYear: readString(formData, "academicYear"),
    academicClassId: readString(formData, "academicClassId"),
    gender: genderValue ? (genderValue as Gender) : null,
    joinDate: parseDateInput(joinDateValue),
    joinDateValue,
    isActive: formData.get("isActive") === "on",
    notes: readOptionalString(formData, "notes"),
  };
}

function getStudentFormExtras(input: StudentFormInput) {
  return {
    fullName: input.fullName,
    teacherId: input.teacherId,
    academicYear: input.academicYear,
    academicClassId: input.academicClassId,
    gender: input.gender ?? "",
    joinDate: input.joinDateValue,
    isActive: input.isActive ? "true" : "false",
    notes: input.notes ?? "",
  };
}

async function validateStudentInput(
  input: StudentFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const t = await getTranslations("Validation");
  const extras = getStudentFormExtras(input);

  if (!input.fullName || input.fullName.length > 120) {
    fail(t("adminStudentNameRequired"), extras);
  }

  if (!input.teacherId) {
    fail(t("adminTeacherRequired"), extras);
  }

  if (!input.academicClassId) {
    fail(t("adminAcademicClassRequired"), extras);
  }

  if (
    input.academicYear &&
    !/^\d{4}\/\d{4}$/.test(input.academicYear)
  ) {
    fail(t("adminAcademicYearInvalid"), extras);
  }

  if (!input.joinDate) {
    fail(t("adminJoinDateInvalid"), extras);
  }

  if (input.notes && input.notes.length > 1500) {
    fail(t("notesTooLong"), extras);
  }

  const rawGender = extras.gender;
  if (rawGender && !validGenders.has(rawGender)) {
    fail(t("adminGenderInvalid"), extras);
  }
}

function redirectAdminStudentsWithMessage(
  type: "success" | "error",
  message: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/students?${params.toString()}`);
}

function revalidateAdminStudentPaths(studentId?: string) {
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/formative");
  revalidatePath("/summative");
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  invalidateStudentRelatedCaches(studentId);

  if (studentId) {
    revalidatePath(`/students/${studentId}`);
  }
}

function isDeleteRaceError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2025", "P2034"].includes(error.code)
  );
}

async function resolveStudentRelations(
  input: StudentFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const t = await getTranslations("Validation");
  const [teacher, academicClass] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: input.teacherId },
      select: { id: true },
    }),
    prisma.academicClass.findUnique({
      where: { id: input.academicClassId },
      select: { id: true, academicYear: true, name: true, grade: true },
    }),
  ]);

  const extras = getStudentFormExtras(input);

  if (!teacher) {
    fail(t("adminTeacherNotFound"), extras);
  }

  if (!academicClass) {
    fail(t("adminAcademicClassNotFound"), extras);
  }

  if (input.academicYear && academicClass!.academicYear !== input.academicYear) {
    fail(t("adminAcademicClassYearMismatch"), extras);
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: {
      teacherId: teacher!.id,
      academicYear: academicClass!.academicYear,
      grade: academicClass!.grade,
    },
    select: { id: true, name: true },
  });

  if (!classGroup) {
    fail(
      t("adminTeacherNoHalaqah", { year: academicClass!.academicYear, grade: academicClass!.grade }),
      extras,
    );
  }

  return {
    teacherId: teacher!.id,
    classGroupId: classGroup!.id,
    academicClassId: academicClass!.id,
  };
}

export async function createStudent(formData: FormData) {
  await requireAdminScope();

  const input = readStudentFormInput(formData);
  const fail = createFailFn("/admin/students/new");

  await validateStudentInput(input, fail);
  const relations = await resolveStudentRelations(input, fail);

  const student = await prisma.student.create({
    data: {
      fullName: input.fullName,
      teacherId: relations.teacherId,
      classGroupId: relations.classGroupId,
      academicClassId: relations.academicClassId,
      gender: input.gender,
      joinDate: input.joinDate!,
      isActive: input.isActive,
      notes: input.notes,
    },
  });

  const t = await getTranslations("Validation");
  revalidateAdminStudentPaths(student.id);
  redirectAdminStudentsWithMessage("success", t("adminStudentCreated"));
}

export async function updateStudent(studentId: string, formData: FormData) {
  await requireAdminScope();

  const input = readStudentFormInput(formData);
  const fail = createFailFn(`/admin/students/${studentId}/edit`);

  await validateStudentInput(input, fail);

  const t = await getTranslations("Validation");

  const existingStudent = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });

  if (!existingStudent) {
    redirectAdminStudentsWithMessage("error", t("studentNotFound"));
  }

  const relations = await resolveStudentRelations(input, fail);

  await prisma.student.update({
    where: { id: existingStudent.id },
    data: {
      fullName: input.fullName,
      teacherId: relations.teacherId,
      classGroupId: relations.classGroupId,
      academicClassId: relations.academicClassId,
      gender: input.gender,
      joinDate: input.joinDate!,
      isActive: input.isActive,
      notes: input.notes,
    },
  });

  revalidateAdminStudentPaths(existingStudent.id);
  redirectAdminStudentsWithMessage("success", t("adminStudentUpdated"));
}

export async function toggleStudentActive(
  studentId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!student) {
    redirectAdminStudentsWithMessage("error", t("studentNotFound"));
  }

  await prisma.student.update({
    where: { id: student.id },
    data: {
      isActive: nextActiveState,
    },
  });

  revalidateAdminStudentPaths(student.id);
  redirectAdminStudentsWithMessage(
    "success",
    nextActiveState
      ? t("adminStudentActivated", { name: student.fullName })
      : t("adminStudentDeactivated", { name: student.fullName }),
  );
}

export async function deleteStudent(studentId: string) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const student = await tx.student.findUnique({
          where: { id: studentId },
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
    if (isDeleteRaceError(error)) {
      return { ok: false as const, error: t("deleteRaceDetected") };
    }
    throw error;
  }

  if (result.status === "notFound") {
    return { ok: false as const, error: t("studentNotFound") };
  }

  if (result.status === "blocked") {
    return {
      ok: false as const,
      error: t("adminStudentHasRelatedData", {
        name: result.student.fullName,
        items: result.blockerItems.join(", "),
      }),
    };
  }

  revalidateAdminStudentPaths(result.student.id);
  return { ok: true as const, success: t("adminStudentDeleted", { name: result.student.fullName }) };
}
