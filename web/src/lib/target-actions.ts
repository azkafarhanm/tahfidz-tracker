"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TargetStatus, TargetType } from "@/generated/prisma-next/enums";
import { createFailFn, readOptionalString, readString } from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

type TargetFormInput = {
  type: TargetType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  startDate: Date;
  endDate: Date;
  notes: string | null;
};

function parseTargetForm(formData: FormData): { data: TargetFormInput; error: string | null } {
  const rawType = formData.get("type");
  const surah = readString(formData, "surah");
  const rawFromAyah = formData.get("fromAyah");
  const rawToAyah = formData.get("toAyah");
  const rawStartDate = formData.get("startDate");
  const rawEndDate = formData.get("endDate");
  const notes = readOptionalString(formData, "notes");

  if (!rawType || (rawType !== "HAFALAN" && rawType !== "MUROJAAH")) {
    return { data: null as unknown as TargetFormInput, error: "Jenis target wajib dipilih." };
  }
  if (!surah || surah.length > 80) {
    return { data: null as unknown as TargetFormInput, error: "Nama surah wajib diisi dan maksimal 80 karakter." };
  }
  const fromAyah = Number(rawFromAyah);
  const toAyah = Number(rawToAyah);
  if (!fromAyah || fromAyah < 1 || fromAyah > 286) {
    return { data: null as unknown as TargetFormInput, error: "Ayat awal harus antara 1-286." };
  }
  if (!toAyah || toAyah < 1 || toAyah > 286) {
    return { data: null as unknown as TargetFormInput, error: "Ayat akhir harus antara 1-286." };
  }
  if (fromAyah > toAyah) {
    return { data: null as unknown as TargetFormInput, error: "Ayat awal tidak boleh lebih besar dari ayat akhir." };
  }
  if (!rawStartDate) {
    return { data: null as unknown as TargetFormInput, error: "Tanggal mulai wajib diisi." };
  }
  if (!rawEndDate) {
    return { data: null as unknown as TargetFormInput, error: "Tanggal target selesai wajib diisi." };
  }
  const startDate = new Date(rawStartDate as string);
  const endDate = new Date(rawEndDate as string);
  if (endDate <= startDate) {
    return { data: null as unknown as TargetFormInput, error: "Tanggal target selesai harus setelah tanggal mulai." };
  }

  return {
    data: {
      type: rawType as TargetType,
      surah: surah.trim(),
      fromAyah,
      toAyah,
      startDate,
      endDate,
      notes: notes?.trim() || null,
    },
    error: null,
  };
}

export async function createTarget(studentId: string, formData: FormData) {
  const { teacherId } = await requireSessionScope();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, teacherId: true },
  });

  if (!student || student.teacherId !== teacherId) {
    redirect("/students");
  }

  const fail = createFailFn(`/students/${studentId}/targets/new`);
  const { data, error } = parseTargetForm(formData);

  if (error) {
    fail(error);
  }

  await prisma.target.create({
    data: {
      studentId,
      teacherId,
      type: data.type,
      surah: data.surah,
      fromAyah: data.fromAyah,
      toAyah: data.toAyah,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    },
  });

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}?success=Target berhasil ditambahkan.`);
}

export async function updateTarget(targetId: string, formData: FormData) {
  const { teacherId } = await requireSessionScope();

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true, studentId: true, status: true },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) {
    redirect("/students");
  }

  const student = await prisma.student.findUnique({
    where: { id: target.studentId },
    select: { teacherId: true },
  });

  if (!student || student.teacherId !== teacherId) {
    redirect("/students");
  }

  const fail = createFailFn(`/students/${target.studentId}/targets/${targetId}/edit`);
  const { data, error } = parseTargetForm(formData);

  if (error) {
    fail(error);
  }

  await prisma.target.update({
    where: { id: targetId },
    data: {
      type: data.type,
      surah: data.surah,
      fromAyah: data.fromAyah,
      toAyah: data.toAyah,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    },
  });

  revalidatePath(`/students/${target.studentId}`);
  redirect(`/students/${target.studentId}?success=Target berhasil diperbarui.`);
}

export async function cancelTarget(targetId: string) {
  const { teacherId } = await requireSessionScope();

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true, studentId: true, status: true },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) return;

  const student = await prisma.student.findUnique({
    where: { id: target.studentId },
    select: { teacherId: true },
  });

  if (!student || student.teacherId !== teacherId) return;

  await prisma.target.update({
    where: { id: targetId },
    data: { status: TargetStatus.CANCELLED },
  });

  revalidatePath(`/students/${target.studentId}`);
}

export async function completeTarget(targetId: string) {
  const { teacherId } = await requireSessionScope();

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true, studentId: true, status: true },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) return;

  const student = await prisma.student.findUnique({
    where: { id: target.studentId },
    select: { teacherId: true },
  });

  if (!student || student.teacherId !== teacherId) return;

  await prisma.target.update({
    where: { id: targetId },
    data: { status: TargetStatus.COMPLETED },
  });

  revalidatePath(`/students/${target.studentId}`);
}
