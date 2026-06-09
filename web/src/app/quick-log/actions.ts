"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  QuickLogRecordType,
  quickLogTypeLabels,
} from "@/lib/quick-log";
import { prisma } from "@/lib/prisma";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { requireSessionScope } from "@/lib/session";
import { validateRecordFields } from "@/lib/validate-record";
import {
  readString,
  readOptionalString,
  readInt,
  parseRecordDateTime,
} from "@/lib/form-helpers";

const validStatuses = new Set<string>(Object.values(RecordStatus));
const validTypes = new Set<string>(Object.keys(quickLogTypeLabels));

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function createGuidedRecord(formData: FormData) {
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const studentId = readString(formData, "studentId");
  const typeValue = readString(formData, "type");
  const surah = readString(formData, "surah");
  const fromAyah = readInt(formData, "fromAyah");
  const toAyah = readInt(formData, "toAyah");
  const date = parseRecordDateTime(
    readString(formData, "date"),
    readString(formData, "time"),
    readString(formData, "timezoneOffset"),
  );
  const statusValue = readString(formData, "status");
  const score = readInt(formData, "score");
  const notes = readOptionalString(formData, "notes");

  if (!studentId) {
    return { ok: false as const, error: t("selectStudent") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    return { ok: false as const, error: t("studentInactive") };
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return { ok: false as const, error: t("noPermissionStudent") };
  }

  if (!validTypes.has(typeValue)) {
    return { ok: false as const, error: t("recordTypeInvalid") };
  }

  try {
    await validateRecordFields({
      surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses,
      fail: (message: string) => { throw new ValidationError(message); },
      t,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return { ok: false as const, error: e.message };
    }
    throw e;
  }

  const data = {
    studentId: student.id,
    teacherId: student.teacherId,
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
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/quick-log");
  revalidatePath("/formative");
  revalidatePath(`/formative/${student.id}`);
  invalidateStudentRelatedCaches(student.id);
  return { ok: true as const, success: t("recordSaved") };
}
