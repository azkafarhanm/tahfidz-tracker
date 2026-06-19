"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { TasmiGrade, TasmiStatus, AuditAction } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { invalidateTasmiCache, createTasmiRecord, updateTasmiRecord, deleteTasmiRecord } from "@/lib/tasmi";
import { requireSessionScope } from "@/lib/session";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import {
  readString,
  readOptionalString,
  readInt,
  createFailFn,
  parseDateInput,
} from "@/lib/form-helpers";

const validGrades = new Set<string>(Object.values(TasmiGrade));
const validStatuses = new Set<string>(Object.values(TasmiStatus));

async function logTasmiAudit(
  userId: string,
  action: AuditAction,
  tasmiId: string,
  studentId: string,
  metadata?: Record<string, unknown>,
) {
  const academicYear = await getActiveAcademicYear();
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      academicYear,
      targetType: "tasmi",
      targetId: tasmiId,
      metadata: { studentId, ...metadata },
    },
  });
}

function revalidateTasmiPaths(studentId: string) {
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/admin/students");
  revalidatePath("/formative");
  revalidatePath("/summative");
  invalidateStudentRelatedCaches(studentId);
  invalidateTasmiCache(studentId);
}

export async function createTasmiAction(studentId: string, formData: FormData) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("Validation");
  const fail = createFailFn(`/students/${studentId}/tasmi/new`);

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

  const juz = readInt(formData, "juz");
  const gradeValue = readString(formData, "grade");
  const statusValue = readString(formData, "status");
  const examinerName = readString(formData, "examinerName");
  const dateValue = readString(formData, "date");
  const notes = readOptionalString(formData, "notes");

  if (juz === null || juz < 1 || juz > 30) {
    return fail(t("tasmiJuzRange"));
  }

  if (!validGrades.has(gradeValue)) {
    return fail(t("tasmiGradeInvalid"));
  }

  if (!validStatuses.has(statusValue)) {
    return fail(t("tasmiStatusInvalid"));
  }

  if (!examinerName || examinerName.length > 120) {
    return fail(t("tasmiExaminerRequired"));
  }

  const date = parseDateInput(dateValue);
  if (!date) {
    return fail(t("dateInvalid"));
  }

  if (notes && notes.length > 1500) {
    return fail(t("notesTooLong"));
  }

  const record = await createTasmiRecord({
    studentId: student.id,
    teacherId: student.teacherId,
    juz,
    grade: gradeValue as TasmiGrade,
    status: statusValue as TasmiStatus,
    examinerName,
    date,
    notes,
  });

  await logTasmiAudit(session.user.id, AuditAction.CREATE_TASMI, record.id, student.id, {
    juz,
    grade: gradeValue,
    status: statusValue,
  });

  revalidateTasmiPaths(student.id);
  redirect(`/students/${student.id}?success=${encodeURIComponent(t("tasmiCreated"))}&highlight=${record.id}`);
}

export async function updateTasmiAction(tasmiId: string, studentId: string, formData: FormData) {
  const { session, teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");
  const fail = createFailFn(`/students/${studentId}/tasmi/${tasmiId}/edit`);

  const existing = await prisma.tasmiRecord.findFirst({
    where: {
      id: tasmiId,
      studentId,
      ...(teacherId ? { teacherId } : {}),
    },
    select: { id: true },
  });

  if (!existing) {
    return fail(t("tasmiNotFound"));
  }

  const juz = readInt(formData, "juz");
  const gradeValue = readString(formData, "grade");
  const statusValue = readString(formData, "status");
  const examinerName = readString(formData, "examinerName");
  const dateValue = readString(formData, "date");
  const notes = readOptionalString(formData, "notes");

  if (juz === null || juz < 1 || juz > 30) {
    return fail(t("tasmiJuzRange"));
  }

  if (!validGrades.has(gradeValue)) {
    return fail(t("tasmiGradeInvalid"));
  }

  if (!validStatuses.has(statusValue)) {
    return fail(t("tasmiStatusInvalid"));
  }

  if (!examinerName || examinerName.length > 120) {
    return fail(t("tasmiExaminerRequired"));
  }

  const date = parseDateInput(dateValue);
  if (!date) {
    return fail(t("dateInvalid"));
  }

  if (notes && notes.length > 1500) {
    return fail(t("notesTooLong"));
  }

  await updateTasmiRecord(tasmiId, {
    juz,
    grade: gradeValue as TasmiGrade,
    status: statusValue as TasmiStatus,
    examinerName,
    date,
    notes,
  });

  await logTasmiAudit(session.user.id, AuditAction.UPDATE_TASMI, tasmiId, studentId, {
    juz,
    grade: gradeValue,
    status: statusValue,
  });

  revalidateTasmiPaths(studentId);
  redirect(`/students/${studentId}?success=${encodeURIComponent(t("tasmiUpdated"))}`);
}

export async function deleteTasmiAction(tasmiId: string, studentId: string) {
  const { session, teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const existing = await prisma.tasmiRecord.findFirst({
    where: {
      id: tasmiId,
      studentId,
      ...(teacherId ? { teacherId } : {}),
    },
    select: { id: true, juz: true, grade: true },
  });

  if (!existing) {
    return { ok: false as const, error: t("tasmiNotFound") };
  }

  await deleteTasmiRecord(tasmiId, studentId);

  await logTasmiAudit(session.user.id, AuditAction.DELETE_TASMI, tasmiId, studentId, {
    juz: existing.juz,
    grade: existing.grade,
  });

  revalidateTasmiPaths(studentId);
  return { ok: true as const, message: t("tasmiDeleted") };
}
