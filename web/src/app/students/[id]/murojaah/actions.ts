"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { deriveRecordStatusFromScore } from "@/lib/record-status";
import { validateRecordFields } from "@/lib/validate-record";
import { requireSessionScope } from "@/lib/session";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import {
  readString,
  readOptionalString,
  readInt,
  createFailFn,
  parseRecordDateTime,
} from "@/lib/form-helpers";

const validStatuses = new Set<string>(Object.values(RecordStatus));

export async function createMurojaahRecord(
  studentId: string,
  formData: FormData,
) {
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const programType = readOptionalString(formData, "programType");
  const programTypeParam =
    programType === "ACADEMIC" || programType === "BOARDING"
      ? `?programType=${programType}`
      : "";
  const fail = createFailFn(`/students/${studentId}/murojaah/new${programTypeParam}`);

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
  const score = readInt(formData, "score");
  const statusValue = deriveRecordStatusFromScore(score);
  const notes = readOptionalString(formData, "notes");

  await validateRecordFields({
    surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail, t,
  });

  const [academicYear, semester] = await Promise.all([
    getActiveAcademicYear(),
    getSemesterForDate(date!),
  ]);

  const record = await prisma.revisionRecord.create({ data: {
      studentId: student.id,
      teacherId: student.teacherId,
      surah,
      fromAyah: fromAyah!,
      toAyah: toAyah!,
      date: date!,
      status: statusValue as RecordStatus,
      score,
      notes,
      academicYear,
      semester,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/formative");
  revalidatePath(`/formative/${student.id}`);
  invalidateStudentRelatedCaches(student.id);
  const redirectParams = new URLSearchParams({
    success: t("murojaahCreated"),
    highlight: record.id,
  });
  if (programTypeParam) redirectParams.set("programType", programType!);
  redirect(`/students/${student.id}?${redirectParams.toString()}`);
}
