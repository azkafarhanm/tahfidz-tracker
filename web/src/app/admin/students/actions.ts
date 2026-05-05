"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  parseDateInput,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";

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

function validateStudentInput(
  input: StudentFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const extras = getStudentFormExtras(input);

  if (!input.fullName || input.fullName.length > 120) {
    fail("Nama santri wajib diisi dan maksimal 120 karakter.", extras);
  }

  if (!input.teacherId) {
    fail("Guru wajib dipilih.", extras);
  }

  if (!input.academicClassId) {
    fail("Kelas akademik wajib dipilih.", extras);
  }

  if (
    input.academicYear &&
    !/^\d{4}\/\d{4}$/.test(input.academicYear)
  ) {
    fail("Tahun ajaran tidak valid.", extras);
  }

  if (!input.joinDate) {
    fail("Tanggal bergabung tidak valid.", extras);
  }

  if (input.notes && input.notes.length > 1500) {
    fail("Catatan maksimal 1500 karakter.", extras);
  }

  const rawGender = extras.gender;
  if (rawGender && !validGenders.has(rawGender)) {
    fail("Jenis kelamin tidak valid.", extras);
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
  revalidatePath("/admin");
  revalidatePath("/admin/students");

  if (studentId) {
    revalidatePath(`/students/${studentId}`);
  }
}

async function resolveStudentRelations(
  input: StudentFormInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
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
    fail("Guru yang dipilih tidak ditemukan.", extras);
  }

  if (!academicClass) {
    fail("Kelas akademik yang dipilih tidak ditemukan.", extras);
  }

  if (input.academicYear && academicClass!.academicYear !== input.academicYear) {
    fail("Kelas akademik harus sesuai dengan tahun ajaran yang dipilih.", extras);
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
      `Guru ini belum memiliki halaqah ${academicClass!.academicYear} untuk Kelas ${academicClass!.grade}.`,
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

  validateStudentInput(input, fail);
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

  revalidateAdminStudentPaths(student.id);
  redirectAdminStudentsWithMessage("success", "Data santri baru berhasil ditambahkan.");
}

export async function updateStudent(studentId: string, formData: FormData) {
  await requireAdminScope();

  const input = readStudentFormInput(formData);
  const fail = createFailFn(`/admin/students/${studentId}/edit`);

  validateStudentInput(input, fail);

  const existingStudent = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });

  if (!existingStudent) {
    redirectAdminStudentsWithMessage("error", "Santri yang ingin diubah tidak ditemukan.");
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
  redirectAdminStudentsWithMessage("success", "Data santri berhasil diperbarui.");
}

export async function toggleStudentActive(
  studentId: string,
  nextActiveState: boolean,
) {
  await requireAdminScope();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!student) {
    redirectAdminStudentsWithMessage("error", "Santri yang ingin diubah tidak ditemukan.");
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
      ? `Santri ${student.fullName} berhasil diaktifkan.`
      : `Santri ${student.fullName} berhasil dinonaktifkan.`,
  );
}
