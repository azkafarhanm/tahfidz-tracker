"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  QuickLogRecordType,
  quickLogTypeLabels,
} from "@/lib/quick-log";
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
const validTypes = new Set<string>(Object.keys(quickLogTypeLabels));
const fail = createFailFn("/quick-log");

export async function createQuickLogRecord(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sourceText = readString(formData, "sourceText");
  const studentId = readString(formData, "studentId");
  const typeValue = readString(formData, "type");
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

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    fail("Santri tidak ditemukan atau sudah tidak aktif.", sourceText ? { text: sourceText } : undefined);
  }

  if (session.user.role !== "ADMIN" && student!.teacherId !== session.user.teacherId) {
    fail("Anda tidak berhak mencatat untuk santri ini.", sourceText ? { text: sourceText } : undefined);
  }

  if (!validTypes.has(typeValue)) {
    fail("Jenis catatan tidak valid.", sourceText ? { text: sourceText } : undefined);
  }

  if (!surah || surah.length > 80) {
    fail("Nama surah wajib diisi dan maksimal 80 karakter.", sourceText ? { text: sourceText } : undefined);
  }

  if (fromAyah === null || toAyah === null || fromAyah < 1 || toAyah < 1) {
    fail("Nomor ayat harus berupa angka positif.", sourceText ? { text: sourceText } : undefined);
  }

  if (toAyah! < fromAyah!) {
    fail("Ayat akhir tidak boleh lebih kecil dari ayat awal.", sourceText ? { text: sourceText } : undefined);
  }

  if (toAyah! > 286) {
    fail("Nomor ayat terlalu besar. Periksa kembali rentangnya.", sourceText ? { text: sourceText } : undefined);
  }

  if (!date) {
    fail("Tanggal dan waktu catatan tidak valid.", sourceText ? { text: sourceText } : undefined);
  }

  if (!validStatuses.has(statusValue)) {
    fail("Status catatan tidak valid.", sourceText ? { text: sourceText } : undefined);
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail("Nilai harus berada di antara 0 sampai 100.", sourceText ? { text: sourceText } : undefined);
  }

  const data = {
    studentId: student!.id,
    teacherId: student!.teacherId,
    surah,
    fromAyah: fromAyah!,
    toAyah: toAyah!,
    date: date!,
    status: statusValue as RecordStatus,
    score,
    notes,
  };

  if ((typeValue as QuickLogRecordType) === "MUROJAAH") {
    await prisma.revisionRecord.create({ data });
  } else {
    await prisma.memorizationRecord.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${student!.id}`);
  revalidatePath("/quick-log");
  redirect(`/students/${student!.id}`);
}
