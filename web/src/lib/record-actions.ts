"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { requireSessionScope } from "@/lib/session";
import { validateRecordFields } from "@/lib/validate-record";
import {
  readString,
  readOptionalString,
  readInt,
  createFailFn,
  parseRecordDateTime,
} from "@/lib/form-helpers";

const validStatuses = new Set<string>(Object.values(RecordStatus));

function resolveReturnPath(
  returnTo: string | undefined,
  fallbackPath: string,
  params: { error?: string; success?: string } = {},
) {
  const basePath =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : fallbackPath;
  const [pathname, existingSearch = ""] = basePath.split("?", 2);
  const searchParams = new URLSearchParams(existingSearch);

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function revalidateRecordPaths(studentId: string) {
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/formative");
  revalidatePath(`/formative/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
}

async function deleteRecordByType(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
) {
  return prisma.$transaction(async (tx) => {
    if (recordType === "murojaah") {
      return tx.revisionRecord.deleteMany({
        where: {
          id: recordId,
          studentId,
        },
      });
    }

    return tx.memorizationRecord.deleteMany({
      where: {
        id: recordId,
        studentId,
      },
    });
  });
}

export async function updateRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
  returnTo: string | undefined,
  formData: FormData,
) {
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const editPath = `/students/${studentId}/records/${recordType}/${recordId}/edit`;
  const editReturnPath = returnTo
    ? `${editPath}?returnTo=${encodeURIComponent(returnTo)}`
    : editPath;
  const successPath = resolveReturnPath(returnTo, `/students/${studentId}`);
  const fail = createFailFn(editReturnPath);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    return fail(t("studentNotFound"));
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return fail(t("noPermissionEdit"));
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
      where: { id: recordId, studentId: student.id },
      select: { id: true },
    });
    if (!existing) return fail(t("recordNotFound"));
    await prisma.revisionRecord.update({ where: { id: recordId }, data });
  } else {
    const existing = await prisma.memorizationRecord.findFirst({
      where: { id: recordId, studentId: student.id },
      select: { id: true },
    });
    if (!existing) return fail(t("recordNotFound"));
    await prisma.memorizationRecord.update({ where: { id: recordId }, data });
  }

  revalidateRecordPaths(studentId);
  redirect(resolveReturnPath(successPath, `/students/${studentId}`, { success: t("recordUpdated") }));
}

export async function deleteRecord(
  studentId: string,
  recordType: "hafalan" | "murojaah",
  recordId: string,
  returnTo?: string,
) {
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const fallbackPath = `/students/${studentId}`;
  const redirectPath = resolveReturnPath(returnTo, fallbackPath);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: { teacherId: true },
  });

  if (!student) {
    return {
      ok: false,
      error: t("studentNotFound"),
      redirectTo: resolveReturnPath(redirectPath, fallbackPath, { error: t("studentNotFound") }),
    };
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return {
      ok: false,
      error: t("noPermissionDelete"),
      redirectTo: resolveReturnPath(redirectPath, fallbackPath, { error: t("noPermissionDelete") }),
    };
  }

  const result = await deleteRecordByType(studentId, recordType, recordId);

  if (result.count !== 1) {
    revalidateRecordPaths(studentId);
    return {
      ok: false,
      error: t("recordNotFound"),
      redirectTo: resolveReturnPath(redirectPath, fallbackPath, { error: t("recordNotFound") }),
    };
  }

  revalidateRecordPaths(studentId);
  return {
    ok: true,
    success: t("recordDeleted"),
    redirectTo: resolveReturnPath(redirectPath, fallbackPath, { success: t("recordDeleted") }),
  };
}
