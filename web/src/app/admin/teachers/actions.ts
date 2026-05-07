"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";

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

function validateTeacherInput(
  input: TeacherFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
  options: {
    passwordRequired: boolean;
  },
) {
  const extras = getTeacherFormExtras(input);

  if (!input.fullName || input.fullName.length > 120) {
    fail("Nama guru wajib diisi dan maksimal 120 karakter.", extras);
  }

  if (!input.email || input.email.length > 120 || !isValidEmail(input.email)) {
    fail("Email guru wajib valid dan maksimal 120 karakter.", extras);
  }

  if (input.phoneNumber && input.phoneNumber.length > 30) {
    fail("Nomor telepon maksimal 30 karakter.", extras);
  }

  if (options.passwordRequired && !input.password) {
    fail("Password awal wajib diisi untuk akun guru baru.", extras);
  }

  if (
    input.password &&
    (input.password.length < MIN_PASSWORD_LENGTH ||
      input.password.length > MAX_PASSWORD_LENGTH)
  ) {
    fail(
      `Password harus ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} karakter.`,
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
}

export async function createTeacher(formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const fail = createFailFn("/admin/teachers/new");

  validateTeacherInput(input, fail, { passwordRequired: true });

  const isUniqueEmail = await ensureUniqueTeacherEmail(input.email);

  if (!isUniqueEmail) {
    fail("Email ini sudah digunakan oleh akun lain.", getTeacherFormExtras(input));
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
  redirectAdminTeachersWithMessage("success", "Akun guru baru berhasil ditambahkan.");
}

export async function updateTeacher(teacherId: string, formData: FormData) {
  await requireAdminScope();

  const input = readTeacherFormInput(formData);
  const fail = createFailFn(`/admin/teachers/${teacherId}/edit`);

  validateTeacherInput(input, fail, { passwordRequired: false });

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", "Guru yang ingin diubah tidak ditemukan.");
  }

  const isUniqueEmail = await ensureUniqueTeacherEmail(input.email, teacher.userId);

  if (!isUniqueEmail) {
    fail("Email ini sudah digunakan oleh akun lain.", getTeacherFormExtras(input));
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
  redirectAdminTeachersWithMessage("success", "Data guru berhasil diperbarui.");
}

export async function toggleTeacherActive(
  teacherId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
      fullName: true,
    },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", "Guru yang ingin diubah tidak ditemukan.");
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
      ? `Akun ${teacher.fullName} berhasil diaktifkan.`
      : `Akun ${teacher.fullName} berhasil dinonaktifkan.`,
  );
}

export async function deleteTeacher(teacherId: string) {
  await requireAdminScope();

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true, fullName: true },
  });

  if (!teacher) {
    redirectAdminTeachersWithMessage("error", "Guru tidak ditemukan.");
  }

  const studentCount = await prisma.student.count({
    where: { teacherId: teacher.id },
  });

  if (studentCount > 0) {
    redirectAdminTeachersWithMessage("error", `Tidak bisa menghapus ${teacher.fullName} — masih ada ${studentCount} santri terdaftar. Nonaktifkan akun sebagai gantinya.`);
  }

  await prisma.$transaction([
    prisma.teacher.delete({ where: { id: teacher.id } }),
    prisma.user.delete({ where: { id: teacher.userId } }),
  ]);

  revalidateAdminTeacherPaths();
  redirectAdminTeachersWithMessage("success", `Akun ${teacher.fullName} berhasil dihapus.`);
}
