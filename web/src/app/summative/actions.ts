"use server";

import { Prisma } from "@/generated/prisma-next/client";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireSessionScope } from "@/lib/session";
import {
  deleteSummativeAssessment,
  getAcademicSummativeInputTargets,
  getBoardingSummativeInputTargets,
  getStudentSummativeAssessmentForEdit,
  isSemesterValue,
  parseSemester,
  resolveSurahByInput,
  saveSummativeAssessment,
  saveSummativeAssessments,
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

export async function saveSummativeAssessmentsAction(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  const tSummative = await getTranslations("Summative");

  const payload = await parseBulkSummativePayload(formData);
  const student = await prisma.student.findFirst({
    where: {
      id: payload.studentId,
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      classGroup: {
        select: {
          grade: true,
          programType: true,
        },
      },
    },
  });

  if (!student) {
    redirect("/summative");
  }

  const returnTo = readSummativeReturnTo(formData, payload.studentId);
  const targetGroups =
    student.classGroup.programType === "ACADEMIC"
      ? await getAcademicSummativeInputTargets(student.classGroup.grade)
      : await getBoardingSummativeInputTargets(
          student.classGroup.grade,
          parseSemester(payload.semester),
          payload.academicYear,
        );
  const allowedSurahIds = new Set(
    targetGroups.flatMap((group) => [
      ...group.targets.map((target) => target.surahId),
      ...(group.choices?.flatMap((choice) =>
        choice.options.map((option) => option.surahId),
      ) ?? []),
    ]),
  );
  const targetScores = payload.targetScores.filter((score) =>
    allowedSurahIds.has(score.surahId),
  );
  const additionalScores = payload.additionalScores.filter(
    (score) => !allowedSurahIds.has(score.surahId),
  );
  const scores =
    student.classGroup.programType === "ACADEMIC"
      ? [...targetScores, ...additionalScores]
      : targetScores;
  const records = await saveSummativeAssessments(scores);

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${payload.studentId}`);
  revalidatePath("/admin/students");
  revalidatePath(`/summative/${payload.studentId}`);
  revalidatePath("/summative");
  revalidatePath(`/formative/${payload.studentId}`);
  revalidatePath("/formative");
  invalidateStudentRelatedCaches(payload.studentId);

  const params: Record<string, string> = {};
  const lastRecord = records.at(-1);
  if (lastRecord) {
    params.success = tSummative("savedSuccess");
    params.highlight = lastRecord.id;
  }

  redirect(
    buildSummativeRedirectPath(
      payload.studentId,
      payload.semester,
      params,
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

async function parseBulkSummativePayload(formData: FormData) {
  const t = await getTranslations("Validation");

  const studentId = String(formData.get("studentId") ?? "").trim();
  const semesterValue = String(formData.get("semester") ?? "").trim();
  const academicYear =
    String(formData.get("academicYear") ?? "").trim() || await getActiveAcademicYear();
  const dateValue = String(formData.get("date") ?? "").trim();
  const timeValue = String(formData.get("time") ?? "").trim();
  const timezoneOffsetValue = String(formData.get("timezoneOffset") ?? "").trim();

  if (!studentId || !semesterValue || !dateValue || !timeValue) {
    throw new Error(t("allFieldsRequired"));
  }

  if (!isSemesterValue(semesterValue)) {
    throw new Error(t("summativeSemesterInvalid"));
  }

  const createdAt = parseRecordDateTime(
    dateValue,
    timeValue,
    timezoneOffsetValue,
  );
  if (!createdAt) {
    throw new Error(t("dateInvalid"));
  }

  const targetScores = [...formData.entries()]
    .filter(([key]) => key.startsWith("score:"))
    .map(([key, value]) => {
      const surahId = key.slice("score:".length);
      return {
        surahId: surahId.trim(),
        scoreValue: String(value).trim(),
      };
    })
    .filter((entry) => entry.surahId && entry.scoreValue)
    .map((entry) => {
      const score = Number.parseInt(entry.scoreValue, 10);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error(t("scoreRange"));
      }

      return {
        studentId,
        surahId: entry.surahId,
        semester: parseSemester(semesterValue),
        academicYear,
        score,
        createdAt,
      };
    });
  const choiceScores = [...formData.entries()]
    .filter(([key]) => key.startsWith("choiceScore:"))
    .map(([key, value]) => {
      const choiceId = key.slice("choiceScore:".length);
      const surahId = String(formData.get(`choice:${choiceId}`) ?? "").trim();
      return {
        surahId,
        scoreValue: String(value).trim(),
      };
    })
    .filter((entry) => entry.surahId && entry.scoreValue)
    .map((entry) => {
      const score = Number.parseInt(entry.scoreValue, 10);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error(t("scoreRange"));
      }

      return {
        studentId,
        surahId: entry.surahId,
        semester: parseSemester(semesterValue),
        academicYear,
        score,
        createdAt,
      };
    });
  const additionalScores: Array<{
    studentId: string;
    surahId: string;
    semester: ReturnType<typeof parseSemester>;
    academicYear: string;
    score: number;
    createdAt: Date;
  }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("additionalScore:")) {
      continue;
    }

    const rowId = key.slice("additionalScore:".length);
    const scoreValue = String(value).trim();
    const surahQuery = String(formData.get(`additionalSurah:${rowId}`) ?? "").trim();

    if (!scoreValue && !surahQuery) {
      continue;
    }

    if (!scoreValue || !surahQuery) {
      throw new Error(t("allFieldsRequired"));
    }

    const surah = await resolveSurahByInput(surahQuery);
    if (!surah) {
      throw new Error(t("summativeSurahNotFound"));
    }

    const score = Number.parseInt(scoreValue, 10);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error(t("scoreRange"));
    }

    additionalScores.push({
      studentId,
      surahId: surah.id,
      semester: parseSemester(semesterValue),
      academicYear,
      score,
      createdAt,
    });
  }

  return {
    studentId,
    semester: semesterValue,
    academicYear,
    targetScores: [...targetScores, ...choiceScores],
    additionalScores,
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
