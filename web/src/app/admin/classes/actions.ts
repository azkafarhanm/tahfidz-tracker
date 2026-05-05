"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createFailFn,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";

type AcademicClassFormInput = {
  grade: string;
  section: string;
  academicYear: string;
  isActive: boolean;
};

function readAcademicClassFormInput(formData: FormData): AcademicClassFormInput {
  return {
    grade: readString(formData, "grade"),
    section: readString(formData, "section"),
    academicYear: readString(formData, "academicYear"),
    isActive: formData.get("isActive") === "on",
  };
}

function getAcademicClassFormExtras(input: AcademicClassFormInput) {
  return {
    grade: input.grade,
    section: input.section,
    academicYear: input.academicYear,
    isActive: input.isActive ? "true" : "false",
  };
}

function validateAcademicClassInput(
  input: AcademicClassFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const extras = getAcademicClassFormExtras(input);
  const grade = Number.parseInt(input.grade, 10);

  if (!Number.isFinite(grade) || grade < 1 || grade > 12) {
    fail("Tingkat kelas harus berupa angka antara 1 dan 12.", extras);
  }

  if (!input.section || input.section.length > 5) {
    fail("Ruang kelas wajib diisi dan maksimal 5 karakter.", extras);
  }

  if (!input.academicYear || !/^\d{4}\/\d{4}$/.test(input.academicYear)) {
    fail("Tahun ajaran harus dalam format YYYY/YYYY.", extras);
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
}

export async function createAcademicClass(formData: FormData) {
  await requireAdminScope();

  const input = readAcademicClassFormInput(formData);
  const fail = createFailFn("/admin/classes/new");

  validateAcademicClassInput(input, fail);

  const grade = Number.parseInt(input.grade, 10);
  const name = `${grade}${input.section}`;

  const existing = await prisma.academicClass.findUnique({
    where: {
      name_academicYear: {
        name,
        academicYear: input.academicYear,
      },
    },
    select: { id: true },
  });

  if (existing) {
    fail(
      `Kelas ${name} untuk tahun ajaran ${input.academicYear} sudah ada.`,
      getAcademicClassFormExtras(input),
    );
  }

  await prisma.academicClass.create({
    data: {
      grade,
      section: input.section,
      name,
      academicYear: input.academicYear,
      isActive: input.isActive,
    },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage("success", "Kelas akademik baru berhasil ditambahkan.");
}

export async function updateAcademicClass(
  academicClassId: string,
  formData: FormData,
) {
  await requireAdminScope();

  const input = readAcademicClassFormInput(formData);
  const fail = createFailFn(`/admin/classes/${academicClassId}/edit`);

  validateAcademicClassInput(input, fail);

  const academicClass = await prisma.academicClass.findUnique({
    where: { id: academicClassId },
    select: { id: true },
  });

  if (!academicClass) {
    redirectAdminClassesWithMessage("error", "Kelas yang ingin diubah tidak ditemukan.");
  }

  const grade = Number.parseInt(input.grade, 10);
  const name = `${grade}${input.section}`;

  const existing = await prisma.academicClass.findUnique({
    where: {
      name_academicYear: {
        name,
        academicYear: input.academicYear,
      },
    },
    select: { id: true },
  });

  if (existing && existing.id !== academicClass.id) {
    fail(
      `Kelas ${name} untuk tahun ajaran ${input.academicYear} sudah ada.`,
      getAcademicClassFormExtras(input),
    );
  }

  await prisma.academicClass.update({
    where: { id: academicClass.id },
    data: {
      grade,
      section: input.section,
      name,
      academicYear: input.academicYear,
      isActive: input.isActive,
    },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage("success", "Data kelas akademik berhasil diperbarui.");
}

export async function toggleAcademicClassActive(
  academicClassId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();

  const academicClass = await prisma.academicClass.findUnique({
    where: { id: academicClassId },
    select: { id: true, name: true, academicYear: true },
  });

  if (!academicClass) {
    redirectAdminClassesWithMessage("error", "Kelas yang ingin diubah tidak ditemukan.");
  }

  await prisma.academicClass.update({
    where: { id: academicClass.id },
    data: { isActive: nextActiveState },
  });

  revalidateAdminClassPaths();
  redirectAdminClassesWithMessage(
    "success",
    nextActiveState
      ? `Kelas ${academicClass.name} (${academicClass.academicYear}) berhasil diaktifkan.`
      : `Kelas ${academicClass.name} (${academicClass.academicYear}) berhasil dinonaktifkan.`,
  );
}
