"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TargetStatus, TargetType } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  parseDateInput,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";

type TargetFormInput = {
  type: TargetType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  startDate: Date;
  endDate: Date;
  notes: string | null;
};

type ParseTargetResult =
  | { ok: true; data: TargetFormInput }
  | { ok: false; error: string };

function readTargetAyah(formData: FormData, key: string) {
  const value = readString(formData, key);
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function parseTargetForm(formData: FormData): Promise<ParseTargetResult> {
  const t = await getTranslations("Validation");
  const rawType = formData.get("type");
  const surah = readString(formData, "surah");
  const startDate = parseDateInput(readString(formData, "startDate"));
  const endDate = parseDateInput(readString(formData, "endDate"));
  const notes = readOptionalString(formData, "notes");

  if (!rawType || (rawType !== "HAFALAN" && rawType !== "MUROJAAH")) {
    return { ok: false, error: t("targetTypeRequired") };
  }
  if (!surah || surah.length > 80) {
    return { ok: false, error: t("surahRequired") };
  }
  const fromAyah = readTargetAyah(formData, "fromAyah");
  const toAyah = readTargetAyah(formData, "toAyah");
  if (fromAyah === null || fromAyah < 1 || fromAyah > 286) {
    return { ok: false, error: t("targetFromAyahRange") };
  }
  if (toAyah === null || toAyah < 1 || toAyah > 286) {
    return { ok: false, error: t("targetToAyahRange") };
  }
  if (fromAyah > toAyah) {
    return { ok: false, error: t("targetFromGtTo") };
  }
  if (!startDate) {
    return { ok: false, error: t("targetStartDateRequired") };
  }
  if (!endDate) {
    return { ok: false, error: t("targetEndDateRequired") };
  }
  if (endDate <= startDate) {
    return { ok: false, error: t("targetEndBeforeStart") };
  }

  return {
    ok: true,
    data: {
      type: rawType as TargetType,
      surah: surah.trim(),
      fromAyah,
      toAyah,
      startDate,
      endDate,
      notes: notes?.trim() || null,
    },
  };
}

export async function createTarget(studentId: string, formData: FormData) {
  const { teacherId, isAdmin } = await requireSessionScope();
  const programType = readOptionalString(formData, "programType");
  const programTypeParam =
    programType === "ACADEMIC" || programType === "BOARDING"
      ? `?programType=${programType}`
      : "";

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, teacherId: true },
  });

  // Admin can manage any student; teacher can only manage their own students
  if (!student || (!isAdmin && student.teacherId !== teacherId)) {
    redirect("/students");
  }

  const fail = createFailFn(`/students/${studentId}/targets/new${programTypeParam}`);
  const result = await parseTargetForm(formData);

  if (!result.ok) {
    return fail(result.error);
  }

  const { data } = result;

  // Always store the student's actual teacher on the target record
  const target = await prisma.target.create({
    data: {
      studentId,
      teacherId: student.teacherId,
      type: data.type,
      surah: data.surah,
      fromAyah: data.fromAyah,
      toAyah: data.toAyah,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    },
  });

  const t = await getTranslations("Validation");
  revalidatePath(`/students/${studentId}`);
  invalidateStudentRelatedCaches(studentId);
  const redirectParams = new URLSearchParams({
    success: t("targetCreated"),
    highlight: target.id,
  });
  if (programTypeParam) redirectParams.set("programType", programType!);
  redirect(`/students/${studentId}?${redirectParams.toString()}`);
}

export async function updateTarget(targetId: string, formData: FormData) {
  const { teacherId, isAdmin } = await requireSessionScope();

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      studentId: true,
      status: true,
      student: { select: { teacherId: true } },
    },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) {
    redirect("/students");
  }

  // Admin can manage any student; teacher can only manage their own students
  if (!target.student || (!isAdmin && target.student.teacherId !== teacherId)) {
    redirect("/students");
  }

  const fail = createFailFn(`/students/${target.studentId}/targets/${targetId}/edit`);
  const result = await parseTargetForm(formData);

  if (!result.ok) {
    return fail(result.error);
  }

  const { data } = result;

  await prisma.target.update({
    where: { id: targetId },
    data: {
      type: data.type,
      surah: data.surah,
      fromAyah: data.fromAyah,
      toAyah: data.toAyah,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    },
  });

  const t = await getTranslations("Validation");
  revalidatePath(`/students/${target.studentId}`);
  invalidateStudentRelatedCaches(target.studentId);
  redirect(`/students/${target.studentId}?success=${encodeURIComponent(t("targetUpdated"))}`);
}

export async function cancelTarget(
  targetId: string,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const { teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      studentId: true,
      status: true,
      student: { select: { teacherId: true } },
    },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) {
    return { ok: false, error: "Target not found or not active" };
  }

  if (!target.student || (!isAdmin && target.student.teacherId !== teacherId)) {
    return { ok: false, error: "Not authorized" };
  }

  await prisma.target.update({
    where: { id: targetId },
    data: { status: TargetStatus.CANCELLED },
  });

  invalidateStudentRelatedCaches(target.studentId);
  revalidatePath(`/students/${target.studentId}`);
  return { ok: true, message: t("targetCancelled") };
}

export async function completeTarget(targetId: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const { teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      studentId: true,
      status: true,
      student: { select: { teacherId: true } },
    },
  });

  if (!target || target.status !== TargetStatus.ACTIVE) {
    return { ok: false, error: "Target not found or not active" };
  }

  if (!target.student || (!isAdmin && target.student.teacherId !== teacherId)) {
    return { ok: false, error: "Not authorized" };
  }

  await prisma.target.update({
    where: { id: targetId },
    data: { status: TargetStatus.COMPLETED },
  });

  invalidateStudentRelatedCaches(target.studentId);
  revalidatePath(`/students/${target.studentId}`);
  return { ok: true, message: t("targetCompleted") };
}
