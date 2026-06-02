"use server";

import { Prisma } from "@/generated/prisma-next/client";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireSessionScope } from "@/lib/session";
import {
  deleteSummativeAssessment,
  getStudentSummativeAssessmentForEdit,
  isSemesterValue,
  parseSemester,
  resolveSurahByInput,
  saveSummativeAssessment,
  updateSummativeAssessment,
} from "@/lib/summative";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

function buildSummativeRedirectPath(
  studentId: string,
  semester: string,
  params: Record<string, string>,
) {
  const searchParams = new URLSearchParams({
    semester,
    ...params,
  });
  return `/summative/${studentId}?${searchParams.toString()}`;
}

export async function createSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");
  const tSummative = await getTranslations("Summative");

  const payload = await parseSummativePayload(formData);
  const student = await prisma.student.findFirst({
    where: {
      id: payload.studentId,
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    redirect("/summative");
  }

  try {
    await saveSummativeAssessment(payload);
  } catch (error) {
    if (isUniqueSummativeError(error)) {
      redirect(`/summative/${payload.studentId}?error=${encodeURIComponent(t("summativeDuplicate"))}`);
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/admin/students");
  revalidatePath(`/summative/${payload.studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${payload.studentId}`);
  revalidatePath("/formative");
  invalidateStudentRelatedCaches(payload.studentId);
  redirect(
    `/summative/${payload.studentId}?semester=${payload.semester}&success=${encodeURIComponent(
      tSummative("savedSuccess"),
    )}`,
  );
}

export async function updateSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");
  const tSummative = await getTranslations("Summative");

  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  if (!assessmentId) {
    redirect("/summative");
  }

  const payload = await parseSummativePayload(formData);
  const current = await getStudentSummativeAssessmentForEdit(
    payload.studentId,
    assessmentId,
    teacherId,
  );

  if (!current) {
    redirect(`/summative/${payload.studentId}`);
  }

  try {
    await updateSummativeAssessment(assessmentId, payload);
  } catch (error) {
    if (isUniqueSummativeError(error)) {
      redirect(`/summative/${payload.studentId}?error=${encodeURIComponent(t("summativeDuplicate"))}`);
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/admin/students");
  revalidatePath(`/summative/${payload.studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${payload.studentId}`);
  revalidatePath("/formative");
  invalidateStudentRelatedCaches(payload.studentId);
  redirect(
    `/summative/${payload.studentId}?semester=${payload.semester}&success=${encodeURIComponent(
      tSummative("savedSuccess"),
    )}`,
  );
}

export async function deleteSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Summative");

  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const semester = String(formData.get("semester") ?? getSemesterForDate(new Date()));

  if (!assessmentId || !studentId) {
    return {
      ok: false,
      error: t("deleteFailed"),
      redirectTo: "/summative",
    };
  }

  const current = await getStudentSummativeAssessmentForEdit(
    studentId,
    assessmentId,
    teacherId,
  );

  if (!current) {
    return {
      ok: false,
      error: t("deleteFailed"),
      redirectTo: buildSummativeRedirectPath(studentId, semester, { error: t("deleteFailed") }),
    };
  }

  await deleteSummativeAssessment(assessmentId);

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/admin/students");
  revalidatePath(`/summative/${studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${studentId}`);
  revalidatePath("/formative");
  invalidateStudentRelatedCaches(studentId);
  return {
    ok: true,
    success: t("deletedSuccess"),
    redirectTo: buildSummativeRedirectPath(studentId, semester, {
      success: t("deletedSuccess"),
    }),
  };
}

async function parseSummativePayload(formData: FormData) {
  const t = await getTranslations("Validation");

  const studentId = String(formData.get("studentId") ?? "").trim();
  const surahQuery = String(formData.get("surah") ?? "").trim();
  const semesterValue = String(formData.get("semester") ?? "").trim();
  const academicYear =
    String(formData.get("academicYear") ?? "").trim() || getCurrentAcademicYear();
  const scoreValue = String(formData.get("score") ?? "").trim();
  const notesValue = String(formData.get("notes") ?? "").trim();

  if (!studentId || !surahQuery || !semesterValue || !scoreValue) {
    throw new Error(t("allFieldsRequired"));
  }

  if (!isSemesterValue(semesterValue)) {
    throw new Error(t("summativeSemesterInvalid"));
  }

  const surah = await resolveSurahByInput(surahQuery);
  if (!surah) {
    throw new Error(t("summativeSurahNotFound"));
  }

  const score = Number.parseInt(scoreValue, 10);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(t("scoreRange"));
  }

  if (notesValue.length > 1500) {
    throw new Error(t("notesTooLong"));
  }

  return {
    studentId,
    surahId: surah.id,
    semester: parseSemester(semesterValue),
    academicYear,
    score,
    notes: notesValue || null,
  };
}

function isUniqueSummativeError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
