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
import { prisma } from "@/lib/prisma";

export async function createSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

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

  revalidatePath(`/summative/${payload.studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${payload.studentId}`);
  revalidatePath("/formative");
  redirect(
    `/summative/${payload.studentId}?semester=${payload.semester}&saved=1`,
  );
}

export async function updateSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

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

  revalidatePath(`/summative/${payload.studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${payload.studentId}`);
  revalidatePath("/formative");
  redirect(
    `/summative/${payload.studentId}?semester=${payload.semester}&saved=1`,
  );
}

export async function deleteSummativeAssessmentAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();

  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const semester = String(formData.get("semester") ?? getSemesterForDate(new Date()));

  if (!assessmentId || !studentId) {
    redirect("/summative");
  }

  const current = await getStudentSummativeAssessmentForEdit(
    studentId,
    assessmentId,
    teacherId,
  );

  if (!current) {
    redirect(`/summative/${studentId}`);
  }

  await deleteSummativeAssessment(assessmentId);

  revalidatePath(`/summative/${studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${studentId}`);
  revalidatePath("/formative");
  redirect(`/summative/${studentId}?semester=${semester}&deleted=1`);
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
