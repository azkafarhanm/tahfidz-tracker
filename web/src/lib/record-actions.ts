"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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

export async function updateRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("Validation");
  const fail = createFailFn(`/students/${studentId}/records/${recordType}/${recordId}/edit`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    fail(t("studentNotFound"));
  }

  if (session.user.role !== "ADMIN" && student!.teacherId !== session.user.teacherId) {
    fail(t("noPermissionEdit"));
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
    const existing = await prisma.revisionRecord.findFirst({
      where: { id: recordId, studentId: student!.id },
      select: { id: true },
    });
    if (!existing) fail(t("recordNotFound"));
    await prisma.revisionRecord.update({ where: { id: recordId }, data });
  } else {
    const existing = await prisma.memorizationRecord.findFirst({
      where: { id: recordId, studentId: student!.id },
      select: { id: true },
    });
    if (!existing) fail(t("recordNotFound"));
    await prisma.memorizationRecord.update({ where: { id: recordId }, data });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  invalidateCache("report-student");
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("recordUpdated"))}`);
}

export async function deleteRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("Validation");

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { teacherId: true },
  });

  if (!student) {
    redirect(`/students/${studentId}?error=${encodeURIComponent(t("studentNotFound"))}`);
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    redirect(`/students/${studentId}?error=${encodeURIComponent(t("noPermissionDelete"))}`);
  }

  if (recordType === "murojaah") {
    const existing = await prisma.revisionRecord.findFirst({
      where: { id: recordId, studentId },
      select: { id: true },
    });
    if (!existing) {
      redirect(`/students/${studentId}?error=${encodeURIComponent(t("recordNotFound"))}`);
    }
    await prisma.revisionRecord.delete({ where: { id: recordId } });
  } else {
    const existing = await prisma.memorizationRecord.findFirst({
      where: { id: recordId, studentId },
      select: { id: true },
    });
    if (!existing) {
      redirect(`/students/${studentId}?error=${encodeURIComponent(t("recordNotFound"))}`);
    }
    await prisma.memorizationRecord.delete({ where: { id: recordId } });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("report-teacher");
  invalidateCache("report-student");
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("recordDeleted"))}`);
}
