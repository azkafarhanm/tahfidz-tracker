"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { invalidateCache } from "@/lib/cache";
import { validateRecordFields } from "@/lib/validate-record";
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

  await validateRecordFields({
    surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail,
  });

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
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  invalidateCache("report-student");
  redirect(`/students/${student!.id}?success=Hafalan berhasil dicatat.`);
}
