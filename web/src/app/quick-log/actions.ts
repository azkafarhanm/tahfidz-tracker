"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  QuickLogRecordType,
  quickLogTypeLabels,
} from "@/lib/quick-log";
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
const validTypes = new Set<string>(Object.keys(quickLogTypeLabels));
const fail = createFailFn("/quick-log");

export async function createGuidedRecord(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("Validation");
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

  if (!studentId) {
    fail(t("selectStudent"));
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId!, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    fail(t("studentInactive"));
  }

  if (session.user.role !== "ADMIN" && student!.teacherId !== session.user.teacherId) {
    fail(t("noPermissionStudent"));
  }

  if (!validTypes.has(typeValue)) {
    fail(t("recordTypeInvalid"));
  }

  await validateRecordFields({
    surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail,
  });

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
  revalidatePath("/formative");
  revalidatePath(`/formative/${student!.id}`);
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("formative-");
  invalidateCache("report-teacher");
  invalidateCache("report-student");
  redirect(`/students/${student!.id}?success=${encodeURIComponent(t("recordSaved"))}`);
}
