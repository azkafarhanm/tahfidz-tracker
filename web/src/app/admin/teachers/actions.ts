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
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";

const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 72;

type TeacherFormInput = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  isActive: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readTeacherFormInput(formData: FormData): TeacherFormInput {
  return {
    fullName: readString(formData, "fullName"),
    email: normalizeEmail(readString(formData, "email")),
    phoneNumber: readOptionalString(formData, "phoneNumber"),
    password: readString(formData, "password"),
    isActive: formData.get("isActive") === "on",
  };
}

function getTeacherFormExtras(input: TeacherFormInput) {
  return {
    fullName: input.fullName,
    email: input.email,
    phoneNumber: input.phoneNumber ?? "",
    isActive: input.isActive ? "true" : "false",
  };
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
  },
) {
  const t = await getTranslations("Validation");
  const extras = getTeacherFormExtras(input);

  if (!input.fullName || input.fullName.length > 120) {
    fail(t("teacherNameRequired"), extras);
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
}

function redirectAdminTeachersWithMessage(
  type: "success" | "error",
  message: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/teachers?${params.toString()}`);
}

function revalidateAdminTeacherPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  invalidateCache("admin-dashboard");
  invalidateCache("report-admin");
  invalidateCache("students");
  invalidateCache("dashboard");
}

export async function createTeacher(formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const fail = createFailFn("/admin/teachers/new");

  await validateTeacherInput(input, fail, { passwordRequired: true });

  const isUniqueEmail = await ensureUniqueTeacherEmail(input.email);
  const t = await getTranslations("Validation");

  if (!isUniqueEmail) {
    fail(t("emailDuplicate"), getTeacherFormExtras(input));
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.fullName,
        email: input.email,
        passwordHash,
        role: UserRole.TEACHER,
        locale: "id",
        isActive: input.isActive,
      },
    });

    await tx.teacher.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        isActive: input.isActive,
      },
    });
  });

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage("success", t("teacherCreated"));
}

export async function updateTeacher(teacherId: string, formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const fail = createFailFn(`/admin/teachers/${teacherId}/edit`);

  await validateTeacherInput(input, fail, { passwordRequired: false });

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
  redirectAdminTeachersWithMessage("success", t("teacherUpdated"));
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

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true, fullName: true },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", t("teacherNotFound"));
  }

  const studentCount = await prisma.student.count({
    where: { teacherId: teacher.id },
  });

  if (studentCount > 0) {
    redirectAdminTeachersWithMessage("error", t("teacherHasStudents", { name: teacher.fullName, count: studentCount }));
  }

  const classGroupCount = await prisma.classGroup.count({
    where: { teacherId: teacher.id },
  });

  if (classGroupCount > 0) {
    redirectAdminTeachersWithMessage("error", t("teacherHasClassGroups", { name: teacher.fullName, count: classGroupCount }));
  }

  await prisma.$transaction([
    prisma.teacher.delete({ where: { id: teacher.id } }),
    prisma.user.delete({ where: { id: teacher.userId } }),
  ]);

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage("success", t("teacherDeleted", { name: teacher.fullName }));
}
