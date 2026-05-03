"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  readString,
  readOptionalString,
  readInt,
  createFailFn,
  parseRecordDateTime,
} from "@/lib/form-helpers";

const validStatuses = new Set<string>(Object.values(RecordStatus));

export async function createHafalanRecord(
  studentId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const fail = createFailFn(`/students/${studentId}/hafalan/new`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    fail("Santri tidak ditemukan atau sudah tidak aktif.");
  }

  if (session.user.role !== "ADMIN" && student!.teacherId !== session.user.teacherId) {
    fail("Anda tidak berhak mencatat untuk santri ini.");
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
    fail("Nama surah wajib diisi dan maksimal 80 karakter.");
  }

  if (fromAyah === null || toAyah === null || fromAyah < 1 || toAyah < 1) {
    fail("Nomor ayat harus berupa angka positif.");
  }

  if (toAyah! < fromAyah!) {
    fail("Ayat akhir tidak boleh lebih kecil dari ayat awal.");
  }

  if (toAyah! > 286) {
    fail("Nomor ayat terlalu besar. Periksa kembali rentangnya.");
  }

  if (!date) {
    fail("Tanggal dan waktu catatan tidak valid.");
  }

  if (!validStatuses.has(statusValue)) {
    fail("Status hafalan tidak valid.");
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail("Nilai harus berada di antara 0 sampai 100.");
  }

  await prisma.memorizationRecord.create({
    data: {
      studentId: student!.id,
      teacherId: student!.teacherId,
      surah,
      fromAyah: fromAyah!,
      toAyah: toAyah!,
      date: date!,
      status: statusValue as RecordStatus,
      score,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${student!.id}`);
  redirect(`/students/${student!.id}`);
}
