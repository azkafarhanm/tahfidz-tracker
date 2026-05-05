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

export async function updateRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const fail = createFailFn(`/students/${studentId}/records/${recordType}/${recordId}/edit`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    fail("Santri tidak ditemukan.");
  }

  if (session.user.role !== "ADMIN" && student!.teacherId !== session.user.teacherId) {
    fail("Anda tidak berhak mengedit catatan ini.");
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
    fail("Nomor ayat terlalu besar.");
  }

  if (!date) {
    fail("Tanggal dan waktu catatan tidak valid.");
  }

  if (!validStatuses.has(statusValue)) {
    fail("Status tidak valid.");
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail("Nilai harus berada di antara 0 sampai 100.");
  }

  const data = {
    surah,
    fromAyah: fromAyah!,
    toAyah: toAyah!,
    date: date!,
    status: statusValue as RecordStatus,
    score,
    notes,
  };

  if (recordType === "murojaah") {
    await prisma.revisionRecord.update({ where: { id: recordId }, data });
  } else {
    await prisma.memorizationRecord.update({ where: { id: recordId }, data });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}?success=Catatan berhasil diperbarui.`);
}

export async function deleteRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { teacherId: true },
  });

  if (!student) {
    redirect(`/students/${studentId}?error=Santri tidak ditemukan.`);
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    redirect(`/students/${studentId}?error=Anda tidak berhak menghapus catatan ini.`);
  }

  if (recordType === "murojaah") {
    await prisma.revisionRecord.delete({ where: { id: recordId } });
  } else {
    await prisma.memorizationRecord.delete({ where: { id: recordId } });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}?success=Catatan berhasil dihapus.`);
}
