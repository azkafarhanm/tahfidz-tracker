"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { UserRole } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma-next/client";
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";
import {
  hasLetterAndNumber,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";

type TeacherFormInput = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  isActive: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readTeacherFormInput(formData: FormData): TeacherFormInput {
  const email = normalizeEmail(readString(formData, "email"));
  const username = normalizeUsername(readString(formData, "username") || email.split("@")[0]);
  return {
    fullName: readString(formData, "fullName"),
    username,
    email,
    phoneNumber: readOptionalString(formData, "phoneNumber"),
    password: readString(formData, "password"),
    isActive: formData.get("isActive") === "on",
  };
}

function getTeacherFormExtras(input: TeacherFormInput) {
  return {
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    phoneNumber: input.phoneNumber ?? "",
    isActive: input.isActive ? "true" : "false",
  };
}

async function ensureUniqueTeacherUsername(username: string, userId?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== userId) {
    return false;
  }

  return true;
}

async function ensureUniqueTeacherEmail(email: string, userId?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== userId) {
    return false;
  }

  return true;
}

async function validateTeacherInput(
  input: TeacherFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
  options: {
    passwordRequired: boolean;
    userId?: string;
  },
) {
  const t = await getTranslations("Validation");
  const extras = getTeacherFormExtras(input);

  if (!input.fullName || input.fullName.length > 120) {
    fail(t("teacherNameRequired"), extras);
  }

  if (!input.username || input.username.length < 3 || input.username.length > 50) {
    fail(t("teacherUsernameRequired"), extras);
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(input.username)) {
    fail(t("teacherUsernameFormat"), extras);
  }

  const isUniqueUsername = await ensureUniqueTeacherUsername(input.username, options.userId);
  if (!isUniqueUsername) {
    fail(t("teacherUsernameDuplicate"), extras);
  }

  if (!input.email || input.email.length > 120 || !isValidEmail(input.email)) {
    fail(t("teacherEmailRequired"), extras);
  }

  if (input.phoneNumber && input.phoneNumber.length > 30) {
    fail(t("teacherPhoneTooLong"), extras);
  }

  if (options.passwordRequired && !input.password) {
    fail(t("teacherPasswordRequired"), extras);
  }

  if (
    input.password &&
    (input.password.length < MIN_PASSWORD_LENGTH ||
      input.password.length > MAX_PASSWORD_LENGTH)
  ) {
    fail(
      t("passwordLength", { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH }),
      extras,
    );
  }

  if (input.password && !hasLetterAndNumber(input.password)) {
    fail(t("passwordLetterNumber"), extras);
  }
}

function redirectAdminTeachersWithMessage(
  type: "success" | "error",
  message: string,
  highlight?: string,
  directoryQ?: string,
  directoryPage?: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  if (highlight) params.set("highlight", highlight);
  if (directoryQ) params.set("q", directoryQ);
  if (directoryPage) params.set("page", directoryPage);
  redirect(`/admin/teachers?${params.toString()}`);
}

function revalidateAdminTeacherPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  invalidateCache("admin-dashboard");
  invalidateCache("report-admin");
  invalidateCache("students");
  invalidateCache("quick-log-students");
  invalidateCache("dashboard");
}

export async function createTeacher(formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const directoryQ = readOptionalString(formData, "directoryQ") ?? "";
  const directoryPage = readOptionalString(formData, "directoryPage") ?? "";
  const failParams = new URLSearchParams();
  if (directoryQ) failParams.set("q", directoryQ);
  if (directoryPage) failParams.set("page", directoryPage);
  const fail = createFailFn(`/admin/teachers/new${failParams.size ? `?${failParams.toString()}` : ""}`);

  await validateTeacherInput(input, fail, { passwordRequired: true });

  const isUniqueEmail = await ensureUniqueTeacherEmail(input.email);
  const t = await getTranslations("Validation");

  if (!isUniqueEmail) {
    fail(t("emailDuplicate"), getTeacherFormExtras(input));
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const createdTeacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.fullName,
        username: input.username,
        email: input.email,
        passwordHash,
        role: UserRole.TEACHER,
        locale: "id",
        isActive: input.isActive,
      },
    });

    return tx.teacher.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        isActive: input.isActive,
      },
    });
  });

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage("success", t("teacherCreated"), createdTeacher.id, directoryQ, directoryPage);
}

export async function updateTeacher(teacherId: string, formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const directoryQ = readOptionalString(formData, "directoryQ") ?? "";
  const directoryPage = readOptionalString(formData, "directoryPage") ?? "";
  const failParams = new URLSearchParams();
  if (directoryQ) failParams.set("q", directoryQ);
  if (directoryPage) failParams.set("page", directoryPage);
  const failBase =
    `/admin/teachers/${teacherId}/edit${failParams.toString() ? `?${failParams.toString()}` : ""}`;
  const fail = createFailFn(failBase);

  const t = await getTranslations("Validation");

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", t("teacherNotFound"));
  }

  await validateTeacherInput(input, fail, { passwordRequired: false, userId: teacher.userId });

  const isUniqueEmail = await ensureUniqueTeacherEmail(input.email, teacher.userId);

  if (!isUniqueEmail) {
    fail(t("emailDuplicate"), getTeacherFormExtras(input));
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 10)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacher.userId },
      data: {
        name: input.fullName,
        username: input.username,
        email: input.email,
        isActive: input.isActive,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    await tx.teacher.update({
      where: { id: teacher.id },
      data: {
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        isActive: input.isActive,
      },
    });
  });

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage(
    "success",
    t("teacherUpdated"),
    teacher.id,
    directoryQ,
    directoryPage,
  );
}

export async function toggleTeacherActive(
  teacherId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
      fullName: true,
    },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", t("teacherNotFound"));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: nextActiveState },
    }),
    prisma.teacher.update({
      where: { id: teacher.id },
      data: { isActive: nextActiveState },
    }),
  ]);

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage(
    "success",
    nextActiveState
      ? t("teacherActivated", { name: teacher.fullName })
      : t("teacherDeactivated", { name: teacher.fullName }),
  );
}

export async function deleteTeacher(teacherId: string) {
  await requireAdminScope();
  const t = await getTranslations("Validation");

  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const teacher = await tx.teacher.findUnique({
          where: { id: teacherId },
          select: { id: true, userId: true, fullName: true },
        });

        if (!teacher) {
          return { status: "notFound" as const };
        }

        const studentCount = await tx.student.count({
          where: { teacherId: teacher.id },
        });

        if (studentCount > 0) {
          return { status: "hasStudents" as const, teacher, studentCount };
        }

        const classGroupCount = await tx.classGroup.count({
          where: { teacherId: teacher.id },
        });

        if (classGroupCount > 0) {
          return { status: "hasClassGroups" as const, teacher, classGroupCount };
        }

        await tx.teacher.delete({ where: { id: teacher.id } });
        await tx.user.delete({ where: { id: teacher.userId } });

        return { status: "deleted" as const, teacher };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record not found
      // P2014: Required relation violation
      if (error.code === "P2025" || error.code === "P2014") {
        return { ok: false as const, error: t("teacherNotFound") };
      }
      // P2003: Foreign key constraint violation
      if (error.code === "P2003") {
        return {
          ok: false as const,
          error: t("teacherDeleteFailedRelatedData"),
        };
      }
    }
    throw error;
  }

  if (result.status === "notFound") {
    return { ok: false as const, error: t("teacherNotFound") };
  }

  if (result.status === "hasStudents") {
    return {
      ok: false as const,
      error: t("teacherHasStudents", { name: result.teacher.fullName, count: result.studentCount }),
    };
  }

  if (result.status === "hasClassGroups") {
    return {
      ok: false as const,
      error: t("teacherHasClassGroups", { name: result.teacher.fullName, count: result.classGroupCount }),
    };
  }

  revalidateAdminTeacherPaths();
  return { ok: true as const, success: t("teacherDeleted", { name: result.teacher.fullName }) };
}
