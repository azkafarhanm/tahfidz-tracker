"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { validateRecordFields } from "@/lib/validate-record";
import { requireSessionScope } from "@/lib/session";
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
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const fail = createFailFn(`/students/${studentId}/hafalan/new`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    return fail(t("studentInactive"));
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return fail(t("noPermissionStudent"));
  }

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

  await validateRecordFields({
    surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail, t,
  });

  const record = await prisma.memorizationRecord.create({ data: {
      studentId: student.id,
      teacherId: student.teacherId,
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
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/formative");
  revalidatePath(`/formative/${student.id}`);
  invalidateStudentRelatedCaches(student.id);
  redirect(`/students/${student.id}?success=${encodeURIComponent(t("hafalanCreated"))}&highlight=${record.id}`);
}
