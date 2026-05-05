"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HalaqahLevel } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";

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

function validateClassGroupInput(
  input: ClassGroupFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const extras = getClassGroupFormExtras(input);

  if (!input.name || input.name.length > 120) {
    fail("Nama halaqah wajib diisi dan maksimal 120 karakter.", extras);
  }

  if (input.description && input.description.length > 500) {
    fail("Deskripsi maksimal 500 karakter.", extras);
  }

  if (!validLevels.has(input.level)) {
    fail("Level halaqah tidak valid.", extras);
  }

  if (!input.teacherId) {
    fail("Guru pembimbing wajib dipilih.", extras);
  }

  if (!/^\d{4}\/\d{4}$/.test(input.academicYear)) {
    fail("Tahun ajaran tidak valid.", extras);
  }

  if (!["7", "8", "9"].includes(input.grade)) {
    fail("Kelas halaqah wajib dipilih.", extras);
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
}

async function resolveClassGroupRelations(
  input: ClassGroupFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
  currentClassGroupId?: string,
) {
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
    fail("Guru pembimbing tidak ditemukan.", extras);
  }

  if (
    conflictingClassGroup &&
    conflictingClassGroup.id !== currentClassGroupId
  ) {
    fail(
      `Guru ini sudah memiliki halaqah ${input.academicYear} untuk Kelas ${grade}: "${conflictingClassGroup.name}".`,
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

  validateClassGroupInput(input, fail);
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

  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage("success", "Halaqah baru berhasil ditambahkan.");
}

export async function updateClassGroup(
  classGroupId: string,
  formData: FormData,
) {
  await requireAdminScope();

  const input = readClassGroupFormInput(formData);
  const fail = createFailFn(`/admin/halaqah/${classGroupId}/edit`);

  validateClassGroupInput(input, fail);

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: { id: true },
  });

  if (!classGroup) {
    redirectAdminHalaqahWithMessage("error", "Halaqah yang ingin diubah tidak ditemukan.");
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
      `Santri ${mismatchedStudent.fullName} sudah terhubung ke halaqah ini tetapi kelas akademiknya tidak cocok dengan Kelas ${relations.grade} ${relations.academicYear}.`,
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
  redirectAdminHalaqahWithMessage("success", "Data halaqah berhasil diperbarui.");
}

export async function toggleClassGroupActive(
  classGroupId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classGroupId },
    select: { id: true, name: true },
  });

  if (!classGroup) {
    redirectAdminHalaqahWithMessage("error", "Halaqah yang ingin diubah tidak ditemukan.");
  }

  await prisma.classGroup.update({
    where: { id: classGroup.id },
    data: { isActive: nextActiveState },
  });

  revalidateAdminHalaqahPaths();
  redirectAdminHalaqahWithMessage(
    "success",
    nextActiveState
      ? `Halaqah "${classGroup.name}" berhasil diaktifkan.`
      : `Halaqah "${classGroup.name}" berhasil dinonaktifkan.`,
  );
}
