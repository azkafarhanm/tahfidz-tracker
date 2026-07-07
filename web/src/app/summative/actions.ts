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
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { parseRecordDateTime } from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";

function buildSummativeRedirectPath(
  studentId: string,
  semester: string,
  params: Record<string, string>,
  returnTo?: string,
) {
  const basePath = returnTo && returnTo.startsWith(`/summative/${studentId}`) && !returnTo.startsWith("//")
    ? returnTo
    : `/summative/${studentId}`;
  const [pathname, existingSearch = ""] = basePath.split("?", 2);
  const searchParams = new URLSearchParams(existingSearch);
  searchParams.set("semester", semester);
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }
  return `${pathname}?${searchParams.toString()}`;
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

  const returnTo = readSummativeReturnTo(formData, payload.studentId);
  let record: Awaited<ReturnType<typeof saveSummativeAssessment>>;
  try {
    record = await saveSummativeAssessment(payload);
  } catch (error) {
    if (isUniqueSummativeError(error)) {
      redirect(
        buildSummativeRedirectPath(
          payload.studentId,
          payload.semester,
          { error: t("summativeDuplicate") },
          returnTo,
        ),
      );
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
    buildSummativeRedirectPath(
      payload.studentId,
      payload.semester,
      {
        highlight: record.id,
        success: tSummative("savedSuccess"),
      },
      returnTo,
    ),
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

  const returnTo = readSummativeReturnTo(formData, payload.studentId);
  let record: Awaited<ReturnType<typeof updateSummativeAssessment>>;
  try {
    record = await updateSummativeAssessment(assessmentId, payload);
  } catch (error) {
    if (isUniqueSummativeError(error)) {
      redirect(
        buildSummativeRedirectPath(
          payload.studentId,
          payload.semester,
          { error: t("summativeDuplicate") },
          returnTo,
        ),
      );
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
    buildSummativeRedirectPath(
      payload.studentId,
      payload.semester,
      {
        highlight: record.id,
        success: tSummative("savedSuccess"),
      },
      returnTo,
    ),
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
    revalidatePath(`/summative/${studentId}`);
    revalidatePath("/summative");
    invalidateStudentRelatedCaches(studentId);

    return {
      ok: false,
      error: t("deleteFailed"),
      redirectTo: buildSummativeRedirectPath(studentId, semester, { error: t("deleteFailed") }),
    };
  }

  const deleteResult = await deleteSummativeAssessment(assessmentId, studentId);

  if (!deleteResult.deleted) {
    revalidatePath(`/summative/${studentId}`);
    revalidatePath("/summative");
    invalidateStudentRelatedCaches(studentId);

    return {
      ok: false,
      error: t("deleteFailed"),
      redirectTo: buildSummativeRedirectPath(studentId, semester, { error: t("deleteFailed") }),
    };
  }

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
    String(formData.get("academicYear") ?? "").trim() || await getActiveAcademicYear();
  const scoreValue = String(formData.get("score") ?? "").trim();
  const notesValue = String(formData.get("notes") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  const timeValue = String(formData.get("time") ?? "").trim();
  const timezoneOffsetValue = String(formData.get("timezoneOffset") ?? "").trim();

  if (!studentId || !surahQuery || !semesterValue || !scoreValue || !dateValue || !timeValue) {
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

  const createdAt = parseRecordDateTime(
    dateValue,
    timeValue,
    timezoneOffsetValue,
  );
  if (!createdAt) {
    throw new Error(t("dateInvalid"));
  }

  return {
    studentId,
    surahId: surah.id,
    semester: parseSemester(semesterValue),
    academicYear,
    score,
    notes: notesValue || null,
    createdAt,
  };
}

function isUniqueSummativeError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function readSummativeReturnTo(formData: FormData, studentId: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  return returnTo.startsWith(`/summative/${studentId}`) && !returnTo.startsWith("//")
    ? returnTo
    : undefined;
}
