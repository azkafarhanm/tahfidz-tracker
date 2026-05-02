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

const validStatuses = new Set<string>(Object.values(RecordStatus));
const validTypes = new Set<string>(Object.keys(quickLogTypeLabels));

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

function fail(sourceText: string, message: string): never {
  const params = new URLSearchParams();

  if (sourceText) {
    params.set("text", sourceText);
  }

  params.set("error", message);
  redirect(`/quick-log?${params.toString()}`);
}

function parseRecordDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) {
    return new Date();
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
    fail(sourceText, "Santri tidak ditemukan atau sudah tidak aktif.");
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    fail(sourceText, "Anda tidak berhak mencatat untuk santri ini.");
  }

  if (!validTypes.has(typeValue)) {
    fail(sourceText, "Jenis catatan tidak valid.");
  }

  if (!surah || surah.length > 80) {
    fail(sourceText, "Nama surah wajib diisi dan maksimal 80 karakter.");
  }

  if (!fromAyah || !toAyah || fromAyah < 1 || toAyah < 1) {
    fail(sourceText, "Nomor ayat harus berupa angka positif.");
  }

  if (toAyah < fromAyah) {
    fail(sourceText, "Ayat akhir tidak boleh lebih kecil dari ayat awal.");
  }

  if (toAyah > 286) {
    fail(sourceText, "Nomor ayat terlalu besar. Periksa kembali rentangnya.");
  }

  if (!date) {
    fail(sourceText, "Tanggal dan waktu catatan tidak valid.");
  }

  if (!validStatuses.has(statusValue)) {
    fail(sourceText, "Status catatan tidak valid.");
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail(sourceText, "Nilai harus berada di antara 0 sampai 100.");
  }

  const data = {
    studentId: student.id,
    teacherId: student.teacherId,
    surah,
    fromAyah,
    toAyah,
    date,
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
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/quick-log");
  redirect(`/students/${student.id}`);
}
