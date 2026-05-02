"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const validStatuses = new Set<string>(Object.values(RecordStatus));

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

function readInt(formData: FormData, key: string) {
  const value = readString(formData, key);
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function fail(studentId: string, message: string): never {
  redirect(
    `/students/${studentId}/hafalan/new?error=${encodeURIComponent(message)}`,
  );
}

function parseRecordDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) {
    return new Date();
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createHafalanRecord(
  studentId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
    },
    select: {
      id: true,
      teacherId: true,
    },
  });

  if (!student) {
    fail(studentId, "Santri tidak ditemukan atau sudah tidak aktif.");
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    fail(student.id, "Anda tidak berhak mencatat untuk santri ini.");
  }

  const surah = readString(formData, "surah");
  const fromAyah = readInt(formData, "fromAyah");
  const toAyah = readInt(formData, "toAyah");
  const date = parseRecordDateTime(
    readString(formData, "date"),
    readString(formData, "time"),
  );
  const statusValue = readString(formData, "status");
  const score = readInt(formData, "score");
  const notes = readOptionalString(formData, "notes");

  if (!surah || surah.length > 80) {
    fail(student.id, "Nama surah wajib diisi dan maksimal 80 karakter.");
  }

  if (!fromAyah || !toAyah || fromAyah < 1 || toAyah < 1) {
    fail(student.id, "Nomor ayat harus berupa angka positif.");
  }

  if (toAyah < fromAyah) {
    fail(student.id, "Ayat akhir tidak boleh lebih kecil dari ayat awal.");
  }

  if (toAyah > 286) {
    fail(student.id, "Nomor ayat terlalu besar. Periksa kembali rentangnya.");
  }

  if (!date) {
    fail(student.id, "Tanggal dan waktu catatan tidak valid.");
  }

  if (!validStatuses.has(statusValue)) {
    fail(student.id, "Status hafalan tidak valid.");
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail(student.id, "Nilai harus berada di antara 0 sampai 100.");
  }

  await prisma.memorizationRecord.create({
    data: {
      studentId: student.id,
      teacherId: student.teacherId,
      surah,
      fromAyah,
      toAyah,
      date,
      status: statusValue as RecordStatus,
      score,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${student.id}`);
  redirect(`/students/${student.id}`);
}
