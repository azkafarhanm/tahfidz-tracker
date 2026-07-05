"use server";

import { Prisma } from "@/generated/prisma-next/client";
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
import { requireAdminScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { halaqahLevelLabels } from "@/lib/format";

const validGenders = new Set<string>(Object.values(Gender));
const validLevels = new Set<string>(Object.values(HalaqahLevel));

type StudentFormInput = {
  fullName: string;
  teacherId: string;
  academicClassId: string;
  gender: Gender | null;
  joinDate: Date | null;
  joinDateValue: string;
  isActive: boolean;
  notes: string | null;
  programType: string;
  halaqahLevel: string | null;
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
  const halaqahLevel = readOptionalString(formData, "halaqahLevel");

  return {
    fullName: readString(formData, "fullName"),
    teacherId: readString(formData, "teacherId"),
    academicClassId: readString(formData, "academicClassId"),
    gender: genderValue ? (genderValue as Gender) : null,
    joinDate: parseDateInput(joinDateValue),
    joinDateValue,
    isActive: formData.get("isActive") === "on",
    notes: readOptionalString(formData, "notes"),
    programType: readString(formData, "programType"),
    halaqahLevel,
  };
}

function getStudentFormExtras(input: StudentFormInput) {
  return {
    fullName: input.fullName,
    teacherId: input.teacherId,
    academicClassId: input.academicClassId,
    gender: input.gender ?? "",
    joinDate: input.joinDateValue,
    isActive: input.isActive ? "true" : "false",
    notes: input.notes ?? "",
    programType: input.programType,
    halaqahLevel: input.halaqahLevel ?? "",
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
  programType?: string,
  highlight?: string,
  directoryQ?: string,
  directoryPage?: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  if (programType) params.set("programType", programType);
  if (highlight) params.set("highlight", highlight);
  if (directoryQ) params.set("q", directoryQ);
  if (directoryPage) params.set("page", directoryPage);
  redirect(`/admin/students?${params.toString()}`);
}

function revalidateAdminStudentPaths(studentId?: string) {
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/formative");
  revalidatePath("/summative");
  revalidatePath("/quick-log");
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
  const programType = (input.programType as ProgramType) || ProgramType.ACADEMIC;
  const isBoarding = programType === ProgramType.BOARDING;

  const [teacher, academicClass] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: input.teacherId },
      select: { id: true, fullName: true },
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

  // Resolve the halaqah level: Boarding defaults to LOW (never shown in UI);
  // Academic requires a valid level when creating the first student. Mirrors
  // the Teacher flow in students/actions.ts.
  let resolvedLevel = input.halaqahLevel;
  if (isBoarding) {
    if (!resolvedLevel || !validLevels.has(resolvedLevel)) {
      resolvedLevel = HalaqahLevel.LOW;
    }
  } else if (!resolvedLevel || !validLevels.has(resolvedLevel)) {
    fail(t("halaqahLevelRequired"), extras);
  }
  const level = resolvedLevel as HalaqahLevel;

  const existingCg = await prisma.classGroup.findUnique({
    where: {
      teacherId_academicYear_grade_programType: {
        teacherId: teacher!.id,
        academicYear: academicClass!.academicYear,
        grade: academicClass!.grade,
        programType,
      },
    },
    select: { id: true, level: true },
  });

  // Existing halaqah: reuse it. Academic level is locked to the existing level
  // to prevent accidental duplicate creation (mirrors the Teacher flow).
  if (existingCg) {
    if (!isBoarding && existingCg.level !== level) {
      fail(
        t("halaqahLevelLocked", { grade: academicClass!.grade, level: halaqahLevelLabels[existingCg.level] }),
        extras,
      );
    }
    return {
      teacherId: teacher!.id,
      classGroupId: existingCg.id,
      academicClassId: academicClass!.id,
    };
  }

  // No halaqah yet: auto-create one (mirrors createTeacherStudent). Guarded by
  // the @@unique([teacherId, academicYear, grade, programType]) constraint with
  // a P2002 retry so concurrent first-student submissions can't create duplicates.
  try {
    const created = await prisma.classGroup.create({
      data: {
        teacherId: teacher!.id,
        name: teacher!.fullName ?? "Halaqah",
        level,
        grade: academicClass!.grade,
        academicYear: academicClass!.academicYear,
        programType,
        isActive: true,
      },
      select: { id: true },
    });
    return {
      teacherId: teacher!.id,
      classGroupId: created.id,
      academicClassId: academicClass!.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const retryCg = await prisma.classGroup.findUnique({
        where: {
          teacherId_academicYear_grade_programType: {
            teacherId: teacher!.id,
            academicYear: academicClass!.academicYear,
            grade: academicClass!.grade,
            programType,
          },
        },
        select: { id: true },
      });
      if (retryCg) {
        return {
          teacherId: teacher!.id,
          classGroupId: retryCg.id,
          academicClassId: academicClass!.id,
        };
      }
    }
    throw error;
  }
}

export async function createStudent(formData: FormData) {
  await requireAdminScope();

  const input = readStudentFormInput(formData);
  const failPath = input.programType
    ? `/admin/students/new?programType=${input.programType}`
    : "/admin/students/new";
  const fail = createFailFn(failPath);

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
  redirectAdminStudentsWithMessage("success", t("adminStudentCreated"), input.programType);
}

export async function updateStudent(
  studentId: string,
  returnTo: string | undefined,
  formData: FormData,
) {
  await requireAdminScope();

  const input = readStudentFormInput(formData);
  // Directory working-set filters submitted as hidden inputs by the Edit form
  // (mirroring the hidden programType input). The server rebuilds the directory
  // URL from these on Save because a server redirect cannot read client-side
  // Navigation Context. Absent on Create and on Detail-origin edits.
  const directoryQ = readOptionalString(formData, "directoryQ") ?? "";
  const directoryPage = readOptionalString(formData, "directoryPage") ?? "";
  // Preserve the Detail-origin returnTo across validation-failure round-trips
  // so the Back/Cancel destination stays consistent with the Save destination.
  // returnTo is only set when Edit is reached from the Student Detail page.
  const validatedReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined;
  // Carry the directory filters on the fail path too, so a validation-failure
  // round-trip repopulates the hidden inputs and a subsequent Save still
  // returns to the same working set.
  const failParams = new URLSearchParams();
  if (validatedReturnTo) {
    failParams.set("returnTo", validatedReturnTo);
  }
  if (directoryQ) failParams.set("q", directoryQ);
  if (directoryPage) failParams.set("page", directoryPage);
  const failBase =
    `/admin/students/${studentId}/edit${failParams.toString() ? `?${failParams.toString()}` : ""}`;
  const fail = createFailFn(failBase);

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

  // Detail-origin Save returns to the detail page (its scroll position is not
  // restored — admin detail routes are outside the persistence architecture by
  // design). Directory-origin Save returns to the directory and reveals the
  // edited student via the existing highlight machinery, mirroring the Teacher
  // create flow.
  if (validatedReturnTo) {
    const [pathname, existingSearch = ""] = validatedReturnTo.split("?", 2);
    const params = new URLSearchParams(existingSearch);
    params.set("success", t("adminStudentUpdated"));
    redirect(`${pathname}?${params.toString()}`);
  }
  redirectAdminStudentsWithMessage(
    "success",
    t("adminStudentUpdated"),
    input.programType,
    existingStudent.id,
    directoryQ,
    directoryPage,
  );
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
      classGroup: {
        select: {
          programType: true,
        },
      },
    },
  });

  if (!student) {
    redirectAdminStudentsWithMessage("error", t("studentNotFound"));
  }

  const programType = student!.classGroup.programType;

  await prisma.student.update({
    where: { id: student!.id },
    data: {
      isActive: nextActiveState,
    },
  });

  revalidateAdminStudentPaths(student!.id);
  redirectAdminStudentsWithMessage(
    "success",
    nextActiveState
      ? t("adminStudentActivated", { name: student!.fullName })
      : t("adminStudentDeactivated", { name: student!.fullName }),
    programType,
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
